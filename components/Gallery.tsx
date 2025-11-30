import React from 'react';
import { GenerationHistoryItem } from '../types';

interface GalleryProps {
  history: GenerationHistoryItem[];
}

const Gallery: React.FC<GalleryProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-6xl mx-auto px-4 pb-12">
      <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Your Collection</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {history.map((item) => (
          <div key={item.id} className="relative group aspect-[9/16] rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
             <img src={item.resultImage} alt="Generated" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
             <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
               <p className="text-xs text-gray-300">{new Date(item.timestamp).toLocaleTimeString()}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;