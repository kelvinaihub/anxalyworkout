import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '../components/Icons.tsx';
import AiWorkoutPlannerScreen from './ai/AiWorkoutPlannerScreen.tsx';

interface AiHubScreenProps {
  currentUserId: string;
  initialPrompt?: string;
  onSetFooterVisibility: (isVisible: boolean) => void;
}

const AiHubScreen: React.FC<AiHubScreenProps> = ({ currentUserId, initialPrompt, onSetFooterVisibility }) => {
  const [activeTool, setActiveTool] = useState<string | null>(initialPrompt ? 'workout' : null);

  const tools = [
    { id: 'workout', title: 'AI Workout Planner', description: 'Get a personalized workout plan in seconds.' },
    { id: 'nutrition', title: 'AI Nutritionist', description: 'Plan your meals and analyze nutrition.' },
    { id: 'content', title: 'AI Content Assistant', description: 'Create engaging social media posts.' },
    { id: 'ask', title: 'Ask Kelvin AI', description: 'Your general fitness Q&A assistant.' },
  ];

  const handleToolSelect = (toolId: string) => {
    if (toolId === 'workout') {
      setActiveTool(toolId);
    } else {
      alert(`${tools.find(t => t.id === toolId)?.title} is coming soon!`);
    }
  };

  if (activeTool === 'workout') {
    return <AiWorkoutPlannerScreen currentUserId={currentUserId} onBack={() => setActiveTool(null)} initialPrompt={initialPrompt} onSetFooterVisibility={onSetFooterVisibility} />;
  }

  return (
    <div className="h-full md:pt-4 pb-16 md:pb-0">
      <div className="max-w-screen-md mx-auto px-4">
        <div className='mb-4'>
          <h1 className="text-2xl font-bold">My AI</h1>
          <p className="text-xs text-dark-text-secondary -mt-1">Powered by Gemini</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map(tool => (
            <button 
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className="bg-dark-card p-6 rounded-lg text-left hover:bg-dark-surface transition-colors"
            >
              <SparklesIcon className="w-8 h-8 mb-3 text-brand-primary" />
              <h2 className="text-lg font-bold">{tool.title}</h2>
              <p className="text-sm text-dark-text-secondary">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiHubScreen;