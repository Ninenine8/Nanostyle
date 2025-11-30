import React from 'react';
import { AppStep, ImageAsset } from '../types';

interface Step3DViewProps {
  currentStep: AppStep;
  person: ImageAsset | null;
  garment: ImageAsset | null;
  result: string | null;
}

const Card: React.FC<{ 
  title: string; 
  image: string | null; 
  isActive: boolean; 
  customStyle: React.CSSProperties;
  label: string;
  stepNumber: number;
}> = ({ title, image, isActive, customStyle, label, stepNumber }) => {
  return (
    <div 
      className={`
        relative w-36 h-64 md:w-52 md:h-96 rounded-2xl shadow-2xl transition-all duration-700 ease-in-out border-[3px]
        ${isActive ? 'border-secondary shadow-[0_0_30px_rgba(168,85,247,0.4)] z-30 scale-105' : 'border-gray-700 opacity-70 z-10 hover:opacity-100 hover:z-20'}
        bg-card overflow-hidden flex flex-col backdrop-blur-md
      `}
      style={{
        ...customStyle,
        transformStyle: 'preserve-3d',
      }}
    >
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-600 bg-gradient-to-b from-gray-800 to-gray-900">
           <span className="text-6xl font-thin opacity-20">{stepNumber}</span>
           <span className="text-sm mt-2 font-medium">Empty</span>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-3 px-3 text-center">
        <p className="text-sm font-bold text-white uppercase tracking-wider">{label}</p>
      </div>

      {isActive && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_#a855f7]"></div>
      )}
    </div>
  );
};

const Step3DView: React.FC<Step3DViewProps> = ({ currentStep, person, garment, result }) => {
  // Base tilt for the container
  const containerStyle = {
    transform: 'perspective(1000px) rotateX(5deg)',
    transformStyle: 'preserve-3d' as const,
  };

  return (
    <div className="w-full py-8 flex items-center justify-center overflow-visible select-none">
      <div className="relative flex items-center justify-center -space-x-12 md:-space-x-16" style={containerStyle}>
        
        {/* Step 1: Person */}
        <Card 
          title="Person" 
          label="1. The Model"
          stepNumber={1}
          image={person?.url || null} 
          isActive={currentStep === AppStep.SELECT_PERSON} 
          customStyle={{
            transform: `rotateY(15deg) translateY(${currentStep === AppStep.SELECT_PERSON ? '-20px' : '0'}) translateZ(${currentStep === AppStep.SELECT_PERSON ? '50px' : '0'})`,
          }}
        />

        {/* Step 2: Garment */}
        <Card 
          title="Garment" 
          label="2. The Outfit"
          stepNumber={2}
          image={garment?.url || null} 
          isActive={currentStep === AppStep.SELECT_GARMENT} 
          customStyle={{
            transform: `translateY(${currentStep === AppStep.SELECT_GARMENT ? '-20px' : '0'}) translateZ(${currentStep === AppStep.SELECT_GARMENT ? '100px' : '20px'})`,
          }}
        />

        {/* Step 3: Result */}
        <Card 
          title="Result" 
          label="3. The Look"
          stepNumber={3}
          image={result} 
          isActive={currentStep === AppStep.RESULT} 
          customStyle={{
            transform: `rotateY(-15deg) translateY(${currentStep === AppStep.RESULT ? '-20px' : '0'}) translateZ(${currentStep === AppStep.RESULT ? '50px' : '0'})`,
          }}
        />
      </div>
    </div>
  );
};

export default Step3DView;