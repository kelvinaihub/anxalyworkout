import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutPlan, Exercise, User, GeneratedWorkoutPlan, GeneratedExercise } from '../../types.ts';
import ActiveWorkoutScreen from './ActiveWorkoutScreen.tsx';
import AiActiveWorkoutScreen from './AiActiveWorkoutScreen.tsx'; // Import the new separate screen
import { XIcon, StarIcon, ArrowLeftIcon, SpeakerWaveIcon, EyeIcon } from '../../components/Icons.tsx';
import { getDetailedExerciseInstructions } from '../../services/geminiService.ts';

type UnifiedExercise = Exercise | GeneratedExercise;

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---

const ExerciseDetailModal: React.FC<{ exercise: UnifiedExercise, instructions: string, onClose: () => void }> = ({ exercise, instructions, onClose }) => {
    
    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };
    
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const imageUrl = 'imageUrl' in exercise ? exercise.imageUrl : (exercise.media[0]?.url || '');

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-dark-surface rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-3 border-b border-gray-700">
                    <h3 className="text-lg font-bold">{exercise.name}</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleSpeak(instructions)} className="p-1 rounded-full hover:bg-dark-card"><SpeakerWaveIcon className="w-5 h-5"/></button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-dark-card"><XIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="overflow-y-auto p-4">
                    {imageUrl && <img src={imageUrl} alt={exercise.name} className="w-full rounded-lg mb-4 bg-white"/>}
                    <h4 className="font-bold mb-2">Instructions:</h4>
                    <div className="text-dark-text-secondary whitespace-pre-line text-sm space-y-2">
                        {instructions.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN WORKOUT PLAN DETAIL SCREEN COMPONENT ---

interface WorkoutPlanDetailScreenProps {
  plan?: WorkoutPlan;
  generatedPlan?: GeneratedWorkoutPlan;
  user: User;
  onBack: () => void;
  onSetFooterVisibility: (isVisible: boolean) => void;
}

const WorkoutPlanDetailScreen: React.FC<WorkoutPlanDetailScreenProps> = ({ plan, generatedPlan, user, onBack, onSetFooterVisibility }) => {
  // --- HOOKS DECLARATION (MUST BE AT THE TOP) ---
  const [activeWorkoutType, setActiveWorkoutType] = useState<'user' | 'ai' | null>(null);
  const [modalData, setModalData] = useState<{ exercise: UnifiedExercise, instructions: string } | null>(null);
  
  const isGenerated = !!generatedPlan;
  const activePlan = isGenerated ? generatedPlan : plan;
  
  const { warmUp, training, stretching } = useMemo(() => {
    if (isGenerated && generatedPlan) {
      return {
        warmUp: generatedPlan.warmUp || [],
        training: generatedPlan.training || [],
        stretching: generatedPlan.stretching || [],
      };
    }
    if (plan) {
      // Logic for user-created plans
      return {
        warmUp: plan.exercises.filter(e => e.notes.toLowerCase().includes('warm up')),
        training: plan.exercises.filter(e => !e.notes.toLowerCase().includes('warm up') && !e.notes.toLowerCase().includes('stretch')),
        stretching: plan.exercises.filter(e => e.notes.toLowerCase().includes('stretch')),
      };
    }
    return { warmUp: [], training: [], stretching: [] };
  }, [plan, generatedPlan, isGenerated]);

  // --- SAFETY CHECK (Must be AFTER hooks) ---
  if (!activePlan) {
      return (
          <div className="bg-dark-bg min-h-screen text-white flex flex-col items-center justify-center">
              <p>No workout plan selected.</p>
              <button onClick={onBack} className="mt-4 bg-brand-primary p-2 rounded">Go Back</button>
          </div>
      );
  }

  // --- START OF SEPARATE WORKOUT FLOWS ---
  if (activeWorkoutType === 'ai' && generatedPlan && user) {
      return <AiActiveWorkoutScreen 
                  plan={generatedPlan} 
                  currentUser={user} 
                  onFinish={() => { setActiveWorkoutType(null); onBack(); }} 
                  onSetFooterVisibility={onSetFooterVisibility}
              />;
  }
  
  if (activeWorkoutType === 'user' && plan && user) {
       return <ActiveWorkoutScreen 
                  plan={plan} 
                  currentUser={user} 
                  onFinish={() => { setActiveWorkoutType(null); onBack(); }} 
                  onSetFooterVisibility={onSetFooterVisibility}
              />;
  }
  // --- END OF SEPARATE WORKOUT FLOWS ---
  
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Text-to-speech is not supported on your browser.");
    }
  };

  const handleViewDetails = async (exercise: UnifiedExercise) => {
    setModalData({ exercise, instructions: "Loading detailed instructions..." });
    try {
        const instructions = 'instructions' in exercise ? exercise.instructions : await getDetailedExerciseInstructions(exercise.name);
        setModalData({ exercise, instructions });
    } catch (error) {
        console.error(error);
        setModalData({ exercise, instructions: "Could not load instructions. Please try again." });
    }
  };
  
  const totalExercises = warmUp.length + training.length + stretching.length;
  const estimatedTime = isGenerated ? generatedPlan.estimatedTime : (plan?.duration || 0);
  const estimatedCalories = isGenerated ? (generatedPlan.estimatedCalories) : (plan?.caloriesBurned || 0);

  const renderExerciseRow = (exercise: UnifiedExercise, index: number) => {
    const imageUrl = 'imageUrl' in exercise ? exercise.imageUrl : (exercise.media && exercise.media.length > 0 ? exercise.media[0].url : '');
    const details = `${exercise.sets} x ${exercise.reps}`;

    return (
        <div key={`${exercise.name}-${index}`} className="flex items-center space-x-4 bg-dark-card p-2 rounded-lg">
            <img src={imageUrl} alt={exercise.name} onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100/1e1e1e/ffffff?text=Exercise'} className="w-20 h-20 object-cover bg-white rounded-md"/>
            <div className="flex-1">
                <h4 className="font-bold text-lg">{exercise.name}</h4>
                <p className="text-dark-text-secondary">{details}</p>
            </div>
            <button onClick={() => handleSpeak(`${exercise.name}. ${details}.`)} className="p-2 rounded-full hover:bg-white/20">
                <SpeakerWaveIcon className="w-6 h-6"/>
            </button>
            <button onClick={() => handleViewDetails(exercise)} className="p-2 rounded-full hover:bg-white/20">
                <EyeIcon className="w-6 h-6"/>
            </button>
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg text-white">
        {modalData && <ExerciseDetailModal exercise={modalData.exercise} instructions={modalData.instructions} onClose={() => setModalData(null)} />}
        <header className="p-4 flex items-center space-x-4 bg-black">
            <button onClick={onBack} className="mr-4"><ArrowLeftIcon className="w-6 h-6"/></button>
            <div>
                <p className="font-bold text-lg">{plan?.name || "AI Daily Workout"}</p>
                <p className="text-xs text-dark-text-secondary">Generated by AI Coach</p>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-28">
            <div className="bg-dark-surface rounded-lg p-4 flex justify-around text-center my-6">
                <div><p className="text-2xl font-bold">{estimatedTime}</p><p className="text-sm text-dark-text-secondary">Mins</p></div>
                <div className="border-l border-white/20"></div>
                <div><p className="text-2xl font-bold">{estimatedCalories}</p><p className="text-sm text-dark-text-secondary">Kcal</p></div>
                <div className="border-l border-white/20"></div>
                <div><p className="text-2xl font-bold">{totalExercises}</p><p className="text-sm text-dark-text-secondary">Exercises</p></div>
            </div>

            <div className="space-y-6">
                {warmUp.length > 0 && (<section className="space-y-3"><h3 className="text-xl font-bold mb-3">Warm Up</h3>{warmUp.map(renderExerciseRow)}</section>)}
                {training.length > 0 && (<section className="space-y-3"><h3 className="text-xl font-bold my-3">Training</h3>{training.map(renderExerciseRow)}</section>)}
                {stretching.length > 0 && (<section className="space-y-3"><h3 className="text-xl font-bold my-3">Stretching</h3>{stretching.map(renderExerciseRow)}</section>)}
                
                 <div className="pt-8 pb-4">
                    <button onClick={() => setActiveWorkoutType(isGenerated ? 'ai' : 'user')} className="w-full bg-yellow-400 text-black font-bold py-4 px-6 rounded-lg text-xl flex items-center justify-center">Start Workout</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default WorkoutPlanDetailScreen;