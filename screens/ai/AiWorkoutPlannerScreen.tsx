import React, { useState, useEffect, useRef } from 'react';
import { User, GeneratedWorkoutPlan, GeneratedExercise, WorkoutPlan } from '../../types.ts';
import { getUserProfile, saveWorkoutSession } from '../../services/firebaseService.ts';
import { generateWorkoutPlan, generateExerciseImage, getDetailedExerciseInstructions, getWorkoutSummaryFeedback } from '../../services/geminiService.ts';
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, AiCoachIcon, EyeIcon, XIcon, ChevronRightIcon, CheckCircleIcon, SpeakerWaveIcon, SparklesIcon } from '../../components/Icons.tsx';
import {
    BackIcon, ShoulderIcon, ChestIcon, ArmIcon, AbsIcon, ButtIcon, LegIcon,
    LoseWeightIcon, BuildMuscleIcon, KeepFitIcon
} from './assets.ts';
import ActiveWorkoutScreen from '../workout/ActiveWorkoutScreen.tsx';

// --- SUB-COMPONENTS (Moved to top-level) ---

interface GeneratingState {
    active: boolean;
    progress: number;
    status: string;
}

const GeneratingScreen: React.FC<{ progress: number; status: string }> = ({ progress, status }) => {
    return (
        <div className="absolute inset-0 bg-dark-bg flex flex-col items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/70"></div>
            <div className="relative z-10 flex flex-col items-center">
                <AiCoachIcon className="w-40 h-40" />
                <div className="text-center text-white mt-8">
                    <p className="text-lg">{status}</p>
                </div>
                <div className="w-64 bg-gray-700 rounded-full h-4 mt-6">
                    <div className="bg-yellow-400 h-4 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
                <p className="text-white font-bold text-xl mt-2">{Math.round(progress)}%</p>
            </div>
        </div>
    );
};

const ExerciseDetailModal: React.FC<{ exercise: GeneratedExercise, instructions: string, onClose: () => void }> = ({ exercise, instructions, onClose }) => {
    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };
    useEffect(() => { return () => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); } }; }, []);
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-dark-surface rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-3 border-b border-gray-700">
                    <h3 className="text-lg font-bold">{exercise.name}</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleSpeak(instructions)} className="p-1 rounded-full hover:bg-dark-card"><SpeakerWaveIcon className="w-5 h-5" /></button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-dark-card"><XIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="overflow-y-auto p-4">
                    <img src={exercise.imageUrl} alt={exercise.name} className="w-full rounded-lg mb-4 bg-white" />
                    <h4 className="font-bold mb-2">Instructions:</h4>
                    <div className="text-dark-text-secondary whitespace-pre-line text-sm space-y-2">
                        {instructions.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorkoutDisplayScreen: React.FC<{ plan: GeneratedWorkoutPlan, user: User, onBack: () => void, onStartWorkout: (plan: GeneratedWorkoutPlan) => void }> = ({ plan, user, onBack, onStartWorkout }) => {
    const [modalData, setModalData] = useState<{ exercise: GeneratedExercise, instructions: string } | null>(null);
    const handleSpeak = (text: string) => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(utterance); } else { alert("Text-to-speech is not supported."); } };
    const handleViewDetails = async (exercise: GeneratedExercise) => {
        setModalData({ exercise, instructions: "Loading detailed instructions..." });
        try { const instructions = await getDetailedExerciseInstructions(exercise.name); setModalData({ exercise, instructions }); } catch (error) { console.error(error); setModalData({ exercise, instructions: "Could not load instructions." }); }
    };
    const renderExercise = (ex: GeneratedExercise, index: number) => (
        <div key={`${ex.name}-${index}`} className="flex items-center space-x-4 bg-dark-card p-2 rounded-lg">
            <img src={ex.imageUrl} alt={ex.name} className="w-20 h-20 object-cover bg-white rounded-md" />
            <div className="flex-1"><h4 className="font-bold text-lg">{ex.name}</h4><p className="text-dark-text-secondary">{ex.sets} sets • {ex.reps}</p></div>
            <button onClick={() => handleSpeak(`${ex.name}. ${ex.sets} sets of ${ex.reps}.`)} className="p-2 rounded-full hover:bg-white/20"><SpeakerWaveIcon className="w-6 h-6" /></button>
            <button onClick={() => handleViewDetails(ex)} className="p-2 rounded-full hover:bg-white/20"><EyeIcon className="w-6 h-6" /></button>
        </div>
    );
    let exerciseCounter = 0;
    return (
        <div className="h-full flex flex-col bg-dark-bg text-white">
            {modalData && <ExerciseDetailModal exercise={modalData.exercise} instructions={modalData.instructions} onClose={() => setModalData(null)} />}
            <header className="p-4 flex items-center space-x-4 bg-black"><button onClick={onBack} className="mr-4"><ArrowLeftIcon className="w-6 h-6" /></button><div><p className="font-bold text-lg">Your Workout Plan</p><p className="text-xs text-dark-text-secondary">Generated by AI Coach</p></div></header>
            <div className="flex-1 overflow-y-auto px-4 pb-28">
                <div className="bg-dark-surface rounded-lg p-4 flex justify-around text-center my-6">
                    <div><p className="text-2xl font-bold">{plan.estimatedTime}</p><p className="text-sm text-dark-text-secondary">Mins</p></div>
                    <div className="border-l border-white/20"></div>
                    <div><p className="text-2xl font-bold">{plan.estimatedCalories}</p><p className="text-sm text-dark-text-secondary">Kcal</p></div>
                    <div className="border-l border-white/20"></div>
                    <div><p className="text-2xl font-bold">{plan.totalExercises}</p><p className="text-sm text-dark-text-secondary">Exercises</p></div>
                </div>
                <div className="space-y-6">
                    {plan.warmUp && plan.warmUp.length > 0 && (<section className="space-y-3"><h3 className="text-xl font-bold mb-3">Warm Up</h3>{plan.warmUp.map(ex => renderExercise(ex, exerciseCounter++))}</section>)}
                    {plan.training && plan.training.length > 0 && (<section className="space-y-3"><h3 className="text-xl font-bold my-3">Training</h3>{plan.training.map(ex => renderExercise(ex, exerciseCounter++))}</section>)}
                    {plan.stretching && plan.stretching.length > 0 && (<section className="space-y-3"><h3 className="text-xl font-bold my-3">Stretching</h3>{plan.stretching.map(ex => renderExercise(ex, exerciseCounter++))}</section>)}
                </div>
            </div>
            <footer className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-dark-bg"><button onClick={() => onStartWorkout(plan)} className="w-full bg-yellow-400 text-black font-bold py-4 px-6 rounded-lg text-xl flex items-center justify-center">Start Workout</button></footer>
        </div>
    );
};

const EquipmentModal: React.FC<{ isOpen: boolean; onClose: () => void; options: string[]; onSelect: (value: string) => void; }> = ({ isOpen, onClose, options, onSelect }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#2a2a2a] rounded-xl w-full max-w-sm text-white shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4"><h2 className="text-lg font-bold">Select Equipment</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><XIcon className="w-5 h-5" /></button></div>
                <div className="p-4 pt-0 space-y-2">{options.map(option => (<button key={option} onClick={() => onSelect(option)} className="w-full text-left bg-[#3a3a3a] p-3 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors">{option}</button>))}</div>
            </div>
        </div>
    );
};


// --- MAIN PLANNER SCREEN COMPONENT ---

interface AiWorkoutPlannerScreenProps { currentUserId: string; onBack: () => void; initialPrompt?: string; onSetFooterVisibility: (isVisible: boolean) => void; }
type TrainingSite = 'Home' | 'Gym';
type BodyPart = 'Back' | 'Shoulder' | 'Chest' | 'Arm' | 'Abs' | 'Butt' | 'Leg';
type Goal = 'Lose Weight' | 'Build Muscle' | 'Keep Fit';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

const bodyParts: BodyPart[] = ['Back', 'Shoulder', 'Chest', 'Arm', 'Abs', 'Butt', 'Leg'];
const goals: Goal[] = ['Lose Weight', 'Build Muscle', 'Keep Fit'];
const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
const equipmentOptions = ['Bodyweight', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Full Gym'];
const bodyPartIcons: { [key in BodyPart]: React.FC<any> } = { Back: BackIcon, Shoulder: ShoulderIcon, Chest: ChestIcon, Arm: ArmIcon, Abs: AbsIcon, Butt: ButtIcon, Leg: LegIcon };
const goalIcons: { [key in Goal]: React.FC<any> } = { 'Lose Weight': LoseWeightIcon, 'Build Muscle': BuildMuscleIcon, 'Keep Fit': KeepFitIcon };

const AiWorkoutPlannerScreen: React.FC<AiWorkoutPlannerScreenProps> = ({ currentUserId, onBack, initialPrompt, onSetFooterVisibility }) => {
    const [view, setView] = useState<'planner' | 'generating' | 'display' | 'active'>('planner');
    const [user, setUser] = useState<User | null>(null);
    const [trainingSite, setTrainingSite] = useState<TrainingSite>('Home');
    const [selectedEquipment, setSelectedEquipment] = useState<string>('Bodyweight');
    const [selectedBodyParts, setSelectedBodyParts] = useState<BodyPart[]>(['Back']);
    const [isWholeBody, setIsWholeBody] = useState(false);
    const [goal, setGoal] = useState<Goal>('Build Muscle');
    const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
    const [warmUp, setWarmUp] = useState(true);
    const [stretching, setStretching] = useState(true);
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [generatingState, setGeneratingState] = useState<GeneratingState>({ active: false, progress: 0, status: '' });
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null);
    const hasTriggeredInitialPrompt = useRef(false);

    useEffect(() => { getUserProfile(currentUserId).then(setUser); }, [currentUserId]);
    useEffect(() => { if (isWholeBody) { setSelectedBodyParts(['Back']); } }, [isWholeBody]);

    const handleSelectEquipment = (equipment: string) => { setSelectedEquipment(equipment); setIsEquipmentModalOpen(false); };
    const handleBodyPartToggle = (part: BodyPart) => { setSelectedBodyParts(prev => prev.includes(part) ? (prev.length > 1 ? prev.filter(p => p !== part) : prev) : [...prev, part]); };

    const handleCreateWorkout = async (promptOverride?: string) => {
        if (!user) return;
        setView('generating');
        setGeneratingState({ active: true, progress: 0, status: 'Generating workout text...' });
        let prompt = promptOverride || `You are an expert AI fitness coach. Create a personalized workout plan... User Data: Gender: ${user.gender}, Goal: ${goal}, Difficulty: ${difficulty}, Location: ${trainingSite}, Equipment: ${selectedEquipment}, Target: ${isWholeBody ? 'Whole Body' : selectedBodyParts.join(', ')}, Warm-up: ${warmUp}, Stretching: ${stretching}. Instructions: Generate JSON with estimated time/calories, 2-3 warm-ups if requested, 4-8 main exercises with rest and equipment, and 2-3 stretches if requested. All 'imageUrl' fields must be an empty string "".`;
        try {
            const textPlan = await generateWorkoutPlan(prompt);
            setGeneratingState(prev => ({ ...prev, progress: 10, status: 'Workout structure created.' }));
            const allExercises = [...(textPlan.warmUp || []), ...textPlan.training, ...(textPlan.stretching || [])];
            const exercisesWithImages: GeneratedExercise[] = [];
            for (let i = 0; i < allExercises.length; i++) {
                const exercise = allExercises[i];
                setGeneratingState(prev => ({ ...prev, progress: 10 + Math.round(((i + 1) / allExercises.length) * 80), status: `Generating image for ${exercise.name}... (${i + 1}/${allExercises.length})` }));
                try { const imageUrl = await generateExerciseImage(exercise.name, user.gender); exercisesWithImages.push({ ...exercise, imageUrl }); } catch (imageError) { console.error(`Failed to generate image for ${exercise.name}:`, imageError); exercisesWithImages.push({ ...exercise, imageUrl: 'https://via.placeholder.com/150' }); }
            }
            const finalPlan = { ...textPlan };
            let currentIndex = 0;
            if (finalPlan.warmUp) { finalPlan.warmUp = exercisesWithImages.slice(currentIndex, currentIndex + finalPlan.warmUp.length); currentIndex += finalPlan.warmUp.length; }
            finalPlan.training = exercisesWithImages.slice(currentIndex, currentIndex + finalPlan.training.length); currentIndex += finalPlan.training.length;
            if (finalPlan.stretching) { finalPlan.stretching = exercisesWithImages.slice(currentIndex, currentIndex + finalPlan.stretching.length); }
            setGeneratingState(prev => ({ ...prev, progress: 100, status: 'Finalizing...' }));
            setTimeout(() => { setGeneratedPlan(finalPlan); setView('display'); setGeneratingState({ active: false, progress: 0, status: '' }); }, 1000);
        } catch (error) { console.error("Failed to generate plan:", error); alert(`Sorry, could not create a workout plan. ${error instanceof Error ? error.message : "Please try again later."}`); setView('planner'); setGeneratingState({ active: false, progress: 0, status: '' }); }
    };

    useEffect(() => { if (initialPrompt && user && !hasTriggeredInitialPrompt.current) { hasTriggeredInitialPrompt.current = true; handleCreateWorkout(initialPrompt); } }, [initialPrompt, user]);

    if (!user) return <div className="p-4 text-center">Loading user data...</div>

    if (view === 'active' && generatedPlan && user) {
        const adaptedPlanForPlayer: WorkoutPlan = {
            id: `ai_${Date.now()}`, name: "AI Generated Workout", schedule: { day: '', session: '', startTime: '' }, notes: 'AI Generated Plan', media: [], category: 'Mixed', difficulty: difficulty, duration: generatedPlan.estimatedTime, caloriesBurned: generatedPlan.estimatedCalories, coach: user,
            exercises: [...(generatedPlan.warmUp || []), ...generatedPlan.training, ...(generatedPlan.stretching || [])].map(ex => ({ id: ex.name, name: ex.name, sets: ex.sets, reps: ex.reps, estimatedTime: 60, restTime: ex.restAfter || 30, notes: ex.instructions, media: [{ id: 'ai_img', type: 'image', url: ex.imageUrl }], equipment: ex.equipment }))
        };
        return <ActiveWorkoutScreen plan={adaptedPlanForPlayer} currentUser={user} onFinish={() => setView('display')} onSetFooterVisibility={onSetFooterVisibility} />
    }

    if (view === 'display' && generatedPlan && user) {
        return <WorkoutDisplayScreen plan={generatedPlan} user={user} onBack={() => { setGeneratedPlan(null); setView('planner'); onBack(); }} onStartWorkout={() => setView('active')} />;
    }

    if (view === 'planner') {
        return (
            <div className="h-full flex flex-col bg-[#121212] text-white font-sans">
                <EquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)} options={equipmentOptions} onSelect={handleSelectEquipment} />
                <div className="flex-shrink-0 p-4 bg-black"><div className="w-full flex items-center"><div className="w-12 flex-shrink-0"><button onClick={onBack} className="p-2"><ArrowLeftIcon className="w-6 h-6 text-white" /></button></div><div className="text-center flex-1"><h1 className="text-xl font-bold text-white">AI COACH</h1><p className="text-xs text-white/70">powered by Muscle Monster AI-Engine</p></div><div className="w-12 flex-shrink-0"></div></div></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
                    <section><h3 className="text-base font-bold mb-2">Training Site</h3><div className="flex space-x-2 bg-[#2a2a2a] p-1 rounded-[10px]">{(['Home', 'Gym'] as TrainingSite[]).map(site => (<button key={site} onClick={() => setTrainingSite(site)} className={`w-1/2 py-2 rounded-[7px] text-sm font-semibold transition-colors ${trainingSite === site ? 'bg-[#fde047] text-black' : 'bg-transparent text-white'}`}>{site}</button>))}</div></section>
                    <section><h3 className="text-base font-bold mb-2">Equipment</h3><button onClick={() => setIsEquipmentModalOpen(true)} className="w-full bg-[#2a2a2a] p-3 rounded-lg flex justify-between items-center"><span className="font-semibold text-sm text-white">{selectedEquipment}</span><ChevronRightIcon className="w-5 h-5 text-gray-500" /></button></section>
                    <section><div className="flex justify-between items-center mb-2"><h3 className="text-base font-bold">Body Part</h3><div className="flex items-center space-x-2"><span className="text-sm">Whole Body</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={isWholeBody} onChange={() => setIsWholeBody(p => !p)} className="sr-only peer" /><div className="w-11 h-6 bg-[#2a2a2a] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div></label></div></div><div className="grid grid-cols-2 gap-3">{bodyParts.map(part => { const Icon = bodyPartIcons[part]; const isSelected = selectedBodyParts.includes(part) && !isWholeBody; return (<button key={part} onClick={() => handleBodyPartToggle(part)} disabled={isWholeBody} className={`p-3 rounded-xl font-semibold text-sm transition-all flex items-center space-x-3 h-16 disabled:opacity-40 ${isSelected ? 'bg-[#fde047] text-black' : 'bg-[#2a2a2a] text-white'}`}><Icon className={`w-8 h-8 ${isSelected ? 'text-black' : 'text-white'}`} /><span>{part}</span></button>); })}</div></section>
                    <section><h3 className="text-base font-bold mb-2">Goal</h3><div className="grid grid-cols-3 gap-3">{goals.map(g => { const Icon = goalIcons[g]; const isSelected = goal === g; return (<button key={g} onClick={() => setGoal(g)} className={`py-3 px-2 rounded-xl text-sm font-semibold transition-colors flex flex-col items-center justify-center space-y-2 h-24 ${isSelected ? 'bg-[#fde047] text-black' : 'bg-[#2a2a2a] text-white'}`}><Icon className={`w-8 h-8 ${isSelected ? 'text-black' : 'text-white'}`} /><span>{g}</span></button>); })}</div></section>
                    <section><h3 className="text-base font-bold mb-2">Difficulty</h3><div className="flex space-x-2 bg-[#2a2a2a] p-1 rounded-[10px]">{difficulties.map(d => (<button key={d} onClick={() => setDifficulty(d)} className={`w-1/3 py-2 rounded-[7px] text-sm font-semibold transition-colors ${difficulty === d ? 'bg-[#fde047] text-black' : 'bg-transparent text-white'}`}>{d}</button>))}</div></section>
                    <div className="space-y-3">
                        <section className="flex justify-between items-center bg-[#2a2a2a] p-3 rounded-lg"><h3 className="text-sm font-semibold">Warm up</h3><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={warmUp} onChange={() => setWarmUp(p => !p)} className="sr-only peer" /><div className="w-11 h-6 bg-[#121212] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div></label></section>
                        <section className="flex justify-between items-center bg-[#2a2a2a] p-3 rounded-lg"><h3 className="text-sm font-semibold">Stretching</h3><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={stretching} onChange={() => setStretching(p => !p)} className="sr-only peer" /><div className="w-11 h-6 bg-[#121212] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div></label></section>
                    </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 p-4 flex-shrink-0 bg-[#121212] z-20 border-t border-gray-800"><button onClick={() => handleCreateWorkout()} disabled={generatingState.active} className="w-full bg-[#fde047] text-black font-bold py-4 px-6 rounded-lg text-base flex items-center justify-center disabled:opacity-50">Create Workout <ArrowRightIcon className="w-5 h-5 ml-2" /></button></div>
            </div>
        );
    }

    return (<div className="h-full flex flex-col bg-dark-bg text-white">{generatingState.active && <GeneratingScreen progress={generatingState.progress} status={generatingState.status} />}</div>);
};
export default AiWorkoutPlannerScreen;