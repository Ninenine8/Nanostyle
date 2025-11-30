import React, { useState, useEffect } from 'react';
import { AppStep, ImageAsset, GenerationHistoryItem, LoadingState } from './types';
import { PRESET_PERSONS, PRESET_GARMENTS } from './constants';
import Step3DView from './components/Step3DView';
import AssetSelector from './components/AssetSelector';
import Gallery from './components/Gallery';
import { generateTryOn, urlToBase64 } from './services/geminiService';
import { getCustomModels, saveCustomModel, deleteCustomModel } from './services/storageService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.SELECT_PERSON);
  const [person, setPerson] = useState<ImageAsset | null>(null);
  const [garment, setGarment] = useState<ImageAsset | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>(''); // New state for detailed error
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [customModels, setCustomModels] = useState<ImageAsset[]>([]);

  // Load custom models on mount
  useEffect(() => {
    const loadModels = async () => {
      const models = await getCustomModels();
      setCustomModels(models);
    };
    loadModels();
  }, []);

  // Scroll to top on step change for mobile friendliness
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handlePersonSelect = (asset: ImageAsset) => {
    setPerson(asset);
    // Add small delay for UX to show selection before moving
    // Only auto-advance if it's from the library (id check for preset or custom)
    // Uploads might want to review first.
    if (asset.id.startsWith('p') || asset.id.startsWith('custom-')) {
       setTimeout(() => setStep(AppStep.SELECT_GARMENT), 500);
    }
  };

  const handleGarmentSelect = (asset: ImageAsset) => {
    setGarment(asset);
  };

  const handleSaveCustomModel = async (asset: ImageAsset) => {
    await saveCustomModel(asset);
    // Refresh list
    const models = await getCustomModels();
    setCustomModels(models);
  };

  const handleDeleteCustomModel = async (id: string) => {
    await deleteCustomModel(id);
    // Refresh list
    const models = await getCustomModels();
    setCustomModels(models);
    // If deleted person was selected, clear selection
    if (person?.id === id) {
      setPerson(null);
    }
  };

  const startTryOn = async () => {
    if (!person || !garment) return;

    setStep(AppStep.RESULT);
    setLoadingState('merging');
    setErrorMessage('');

    try {
      // If URLs are remote, convert to base64 first
      const personB64 = person.url.startsWith('data:') ? person.url : await urlToBase64(person.url);
      const garmentB64 = garment.url.startsWith('data:') ? garment.url : await urlToBase64(garment.url);

      const generatedImage = await generateTryOn(personB64, garmentB64);
      
      setResult(generatedImage);
      
      // Add to history
      const newHistoryItem: GenerationHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        personImage: person.url,
        garmentImage: garment.url,
        resultImage: generatedImage
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      
      setLoadingState('idle');
    } catch (error: any) {
      console.error("Try-on failed:", error);
      setLoadingState('error');
      // Set a more user-friendly error message based on common issues
      if (error.message?.includes('API Key')) {
        setErrorMessage('API Configuration Error: API Key is missing.');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        setErrorMessage('Network Error: Could not load the image assets. This might be due to security restrictions (CORS) on the image host.');
      } else if (error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        setErrorMessage('High Traffic: The AI is currently busy (Quota Exceeded). We retried several times but the servers are still full. Please wait a minute and try again.');
      } else {
        setErrorMessage(error.message || 'An unexpected error occurred during generation.');
      }
    }
  };

  const resetProcess = () => {
    // Keep person if desired? For now, full reset but maybe optional in future.
    // The UX usually suggests trying a new outfit on SAME model or NEW model.
    // Let's go back to garment selection by default to try more clothes on same model.
    setGarment(null);
    setResult(null);
    setStep(AppStep.SELECT_GARMENT);
    setLoadingState('idle');
    setErrorMessage('');
  };

  const fullReset = () => {
    setPerson(null);
    setGarment(null);
    setResult(null);
    setStep(AppStep.SELECT_PERSON);
    setLoadingState('idle');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-secondary selection:text-white flex flex-col font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col flex-1">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={fullReset}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
               <span className="font-bold text-lg">N</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">NanoStyle <span className="text-primary font-light">AI</span></h1>
          </div>
          <div className="hidden md:block text-xs uppercase tracking-widest text-gray-500 font-semibold">Virtual Try-On Experience</div>
        </header>

        {/* TOP SECTION: 3D Visualization */}
        <section className="mb-10">
          <Step3DView 
            currentStep={step} 
            person={person} 
            garment={garment} 
            result={result} 
          />
        </section>

        {/* BOTTOM SECTION: Operations */}
        <main className="flex-1 flex flex-col items-center w-full">
          
          {step === AppStep.SELECT_PERSON && (
            <div className="w-full animate-in slide-in-from-bottom-10 fade-in duration-500">
              <AssetSelector 
                title="1. Select Your Model" 
                assets={[...customModels, ...PRESET_PERSONS]} 
                onSelect={handlePersonSelect} 
                selectedId={person?.id}
                onSaveCustom={handleSaveCustomModel}
                onDeleteCustom={handleDeleteCustomModel}
              />
            </div>
          )}

          {step === AppStep.SELECT_GARMENT && (
            <div className="w-full flex flex-col items-center gap-8 animate-in slide-in-from-bottom-10 fade-in duration-500">
               <AssetSelector 
                title="2. Select or Create Outfit" 
                assets={PRESET_GARMENTS} 
                onSelect={handleGarmentSelect} 
                selectedId={garment?.id}
                allowGeneration={true}
                contextImage={person?.url}
              />
              
              <div className="flex gap-4">
                 <button 
                  onClick={() => setStep(AppStep.SELECT_PERSON)}
                  className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-colors"
                 >
                   Back to Model
                 </button>
                 <button 
                  onClick={startTryOn}
                  disabled={!garment}
                  className={`
                    px-10 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform 
                    ${garment 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-primary/50 hover:scale-105 hover:-translate-y-1' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                  `}
                 >
                   Generate Try-On
                 </button>
              </div>
            </div>
          )}

          {step === AppStep.RESULT && (
            <div className="w-full flex flex-col items-center justify-center animate-in slide-in-from-bottom-10 fade-in duration-500">
              
              {loadingState === 'merging' && (
                <div className="flex flex-col items-center p-12">
                   <div className="relative w-24 h-24 mb-8">
                     <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                   </div>
                   <h2 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse">Combining Model & Outfit...</h2>
                   <p className="text-gray-400 text-center max-w-md">Applying the selected clothes to the model's body while preserving identity.</p>
                </div>
              )}

              {loadingState === 'error' && (
                <div className="flex flex-col items-center p-12 bg-red-900/10 border border-red-500/30 rounded-3xl max-w-lg text-center">
                   <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </div>
                   <h2 className="text-xl font-bold text-white mb-2">Generation Failed</h2>
                   <p className="text-gray-300 mb-6">{errorMessage || "We couldn't generate the image. Please try different assets."}</p>
                   <button onClick={() => setStep(AppStep.SELECT_GARMENT)} className="px-6 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 text-white transition-colors">Try Again</button>
                </div>
              )}

              {loadingState === 'idle' && result && (
                <div className="flex flex-col items-center w-full max-w-4xl">
                  
                  {/* Large Result Preview Card - 9:16 aspect ratio */}
                  <div 
                    className="relative w-full max-w-sm md:max-w-md aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 border border-gray-700 mb-8 group cursor-zoom-in bg-black/50"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                     <img src={result} alt="Final Look" className="w-full h-full object-contain" />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                        <span className="bg-black/60 text-white px-5 py-2.5 rounded-full backdrop-blur-md text-sm font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                          View Full Resolution
                        </span>
                     </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={resetProcess}
                      className="px-8 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition-colors font-medium border border-gray-700"
                    >
                      New Outfit
                    </button>
                    <button 
                      onClick={fullReset}
                      className="px-8 py-3 rounded-xl border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-colors"
                    >
                      Change Model
                    </button>
                    <a 
                      href={result} 
                      download="nanostyle-look.png"
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity font-bold shadow-lg shadow-primary/25 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Save
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <Gallery history={history} />
        
        {/* Lightbox Modal */}
        {isLightboxOpen && result && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button 
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors z-50"
              onClick={() => setIsLightboxOpen(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center w-full h-full" onClick={(e) => e.stopPropagation()}>
               <img src={result} alt="Full Body Zoom" className="max-h-[95vh] w-auto object-contain rounded-lg shadow-2xl" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;