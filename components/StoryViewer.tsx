import React, { useState, useEffect, useCallback } from 'react';
import { Story } from '../types.ts';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons.tsx';

interface StoryViewerProps {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentStory = stories[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, stories.length - 1));
  }, [stories.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        else if (e.key === 'ArrowLeft') handlePrev();
        else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);


  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 flex items-center space-x-3 z-10">
        <img src={currentStory.user.profilePictureUrl} alt={currentStory.user.name} onError={(e) => e.currentTarget.src = 'https://placehold.co/150x150/1e1e1e/ffffff?text=User'} className="w-10 h-10 rounded-full" />
        <span className="font-bold text-white">{currentStory.user.name}</span>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {currentIndex > 0 && (
          <button onClick={handlePrev} className="absolute left-2 md:left-8 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 z-10">
            <ChevronLeftIcon className="w-8 h-8" />
          </button>
        )}

        <img src={currentStory.imageUrl} alt={`Story by ${currentStory.user.name}`} onError={(e) => e.currentTarget.src = 'https://placehold.co/300x500/1e1e1e/ffffff?text=Image+Error'} className="max-h-full max-w-full object-contain rounded-lg" />

        {currentIndex < stories.length - 1 && (
          <button onClick={handleNext} className="absolute right-2 md:right-8 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 z-10">
            <ChevronRightIcon className="w-8 h-8" />
          </button>
        )}
      </div>
      
       <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 z-10">
        <XIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default StoryViewer;