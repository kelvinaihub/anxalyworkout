import React from 'react';

const emojis = ['😀', '😂', '❤️', '👍', '🙏', '😍', '😭', '🤔', '🎉', '🔥', '💯', '🚀', '💪', '✅', '✨', '😊'];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
    const pickerRef = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div ref={pickerRef} className="absolute bottom-14 left-2 bg-dark-card p-2 rounded-lg shadow-lg grid grid-cols-4 gap-2 z-10">
            {emojis.map(emoji => (
                <button 
                    key={emoji} 
                    onClick={() => onEmojiSelect(emoji)} 
                    className="text-2xl p-1 hover:bg-dark-surface rounded-md transition-colors"
                    aria-label={`Select emoji ${emoji}`}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default EmojiPicker;
