import React, { useState, useRef } from 'react';
import { XIcon, PhotoIcon } from '../../components/Icons.tsx';
import { createStory } from '../../services/firebaseService.ts';

interface StoryCreatorProps {
  onClose: () => void;
}

const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostStory = async () => {
    if (!imageFile) return;
    setIsPosting(true);
    try {
      await createStory('user_1', imageFile);
      alert('Story posted successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to post story:', error);
      alert('Could not post story. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col p-4 text-white">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold">Create Story</h2>
        <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
      </div>

      <div className="relative flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Story preview" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-center">
            <PhotoIcon className="w-24 h-24 mx-auto text-dark-text-secondary" />
            <p className="mt-4 text-dark-text-secondary">Select a photo to share</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center flex-shrink-0">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-dark-surface font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Choose Photo
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <button 
          onClick={handlePostStory}
          disabled={!imageFile || isPosting}
          className="bg-brand-primary font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {isPosting ? 'Sharing...' : 'Share to Story'}
        </button>
      </div>
    </div>
  );
};

export default StoryCreator;