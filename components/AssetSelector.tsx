import React, { useState, useRef } from 'react';
import { ImageAsset } from '../types';
import { generateGarment } from '../services/geminiService';

interface AssetSelectorProps {
  title: string;
  assets: ImageAsset[];
  onSelect: (asset: ImageAsset) => void;
  selectedId: string | undefined;
  allowGeneration?: boolean;
  contextImage?: string; // e.g. Show selected person when selecting garment
  onSaveCustom?: (asset: ImageAsset) => Promise<void>;
  onDeleteCustom?: (id: string) => Promise<void>;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({ 
  title, 
  assets, 
  onSelect, 
  selectedId, 
  allowGeneration = false,
  contextImage,
  onSaveCustom,
  onDeleteCustom
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'generate'>('library');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<ImageAsset[]>([]);
  
  // State for the currently uploaded file in the "Upload" tab
  const [tempUploadedAsset, setTempUploadedAsset] = useState<ImageAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const newAsset: ImageAsset = {
          id: `upload-${Date.now()}`,
          url: reader.result as string,
          type: allowGeneration ? 'garment' : 'person' // Inference based on props
        };
        setTempUploadedAsset(newAsset);
        onSelect(newAsset);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveToLibrary = async () => {
    if (tempUploadedAsset && onSaveCustom) {
      setIsSaving(true);
      try {
        // Create a definitive ID for storage
        const assetToSave = { ...tempUploadedAsset, id: `custom-${Date.now()}` };
        await onSaveCustom(assetToSave);
        // Switch to library view and select the newly saved item
        setActiveTab('library');
        onSelect(assetToSave);
        setTempUploadedAsset(null);
      } catch (error) {
        alert("Failed to save to library.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const base64Image = await generateGarment(prompt);
      const newAsset: ImageAsset = {
        id: `gen-${Date.now()}`,
        url: base64Image,
        type: 'garment',
        isGenerated: true
      };
      setGeneratedAssets(prev => [newAsset, ...prev]);
      onSelect(newAsset); // Auto-select generated item
    } catch (err) {
      alert("Failed to generate garment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteCustom && confirm('Remove this image from your library?')) {
      await onDeleteCustom(id);
      // If deleted item was selected, deselect it? 
      // Handled by parent if needed, but for now we just remove it from list.
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-card/50 rounded-3xl p-6 backdrop-blur-md border border-gray-700">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          {contextImage && (
             <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
               <img src={contextImage} alt="Context" className="w-full h-full object-cover" />
             </div>
          )}
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>

        <div className="flex space-x-2 bg-gray-800 p-1 rounded-full">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              activeTab === 'library'
                ? 'bg-primary text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              activeTab === 'upload'
                ? 'bg-primary text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Upload
          </button>
          {allowGeneration && (
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                activeTab === 'generate'
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Generate
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {activeTab === 'library' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Show generated assets here too if any */}
            {[...generatedAssets, ...assets].map((asset) => (
              <div 
                key={asset.id}
                onClick={() => onSelect(asset)}
                className={`
                  group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all
                  ${selectedId === asset.id ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-gray-500'}
                `}
              >
                <img src={asset.url} alt="Asset" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {asset.isGenerated && (
                    <span className="bg-secondary text-white text-[10px] px-2 py-1 rounded-full shadow-sm">AI</span>
                  )}
                  {asset.isCustom && (
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full shadow-sm">My Model</span>
                  )}
                </div>

                {/* Delete Button for Custom Assets */}
                {asset.isCustom && onDeleteCustom && (
                  <button
                    onClick={(e) => handleDelete(e, asset.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                    title="Remove from library"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
              </div>
            ))}
            {assets.length === 0 && generatedAssets.length === 0 && (
               <div className="col-span-full flex flex-col items-center justify-center h-48 text-gray-500">
                  <p>Your library is empty.</p>
                  <button onClick={() => setActiveTab('upload')} className="mt-2 text-primary hover:underline">Upload an image</button>
               </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="flex flex-col h-full">
            {!tempUploadedAsset ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-600 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg text-white font-medium flex items-center gap-2 transition-transform active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Choose Image File
                </button>
                <p className="mt-2 text-gray-400 text-sm">Supports JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in fade-in duration-300">
                <div className="relative w-full max-w-xs aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-gray-600 mb-6">
                  <img src={tempUploadedAsset.url} alt="Uploaded Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {
                      setTempUploadedAsset(null); 
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex gap-4">
                   {onSaveCustom && (
                     <button
                       onClick={handleSaveToLibrary}
                       disabled={isSaving}
                       className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                     >
                       {isSaving ? (
                         <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                       ) : (
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                       )}
                       Save to My Models
                     </button>
                   )}
                   <button
                     onClick={() => fileInputRef.current?.click()}
                     className="px-6 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-white rounded-lg transition-colors"
                   >
                     Change Photo
                   </button>
                </div>
                <p className="mt-4 text-sm text-gray-400">This image is currently selected for the try-on.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generate' && allowGeneration && (
          <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g. A vintage floral summer dress, red silk..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${
                  isGenerating ? 'bg-gray-600 cursor-not-allowed' : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Generate
                  </>
                )}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-800/30 rounded-xl p-8 text-center">
               <p>Describe the clothes you want Nano Banana to create.</p>
               <p className="text-sm mt-2 opacity-60">Generated items will be added to your selection.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetSelector;