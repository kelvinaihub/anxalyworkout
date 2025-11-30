import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, GeneratedWorkoutPlan, GeneratedExercise, WorkoutSession } from '../../types.ts';
import { PauseIcon, PlayIcon, ChevronRightIcon, Bars3Icon, HeartIcon, XIcon, SpeakerWaveIcon, ArrowLeftIcon, RepeatIcon } from '../../components/Icons.tsx';
import WorkoutSummaryScreen from './WorkoutSummaryScreen.tsx';
import { saveWorkoutSession } from '../../services/firebaseService.ts';

type WorkoutPhase = 'ready' | 'countdown' | 'working' | 'resting' | 'exercise_complete' | 'workout_finished';

// --- SUB-COMPONENTS (Moved to top-level) ---

const InstructionModal: React.FC<{ exercise: GeneratedExercise, onClose: () => void }> = ({ exercise, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-dark-surface rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-3 border-b border-gray-700">
                    <h3 className="text-lg font-bold">{exercise.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-dark-card"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="overflow-y-auto p-4">
                    {exercise.imageUrl && <img src={exercise.imageUrl} alt={exercise.name} className="w-full rounded-lg mb-4 bg-white"/>}
                    <h4 className="font-bold mb-2">Instructions:</h4>
                    <div className="text-dark-text-secondary whitespace-pre-line text-sm space-y-2">
                        {exercise.instructions.split('\n').map((line, index) => <p key={index}>{line.replace(/^\d+\.\s*/, '')}</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SetSelectorModal: React.FC<{
  totalSets: number;
  onSelect: (set: number) => void;
  onClose: () => void;
}> = ({ totalSets, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-surface rounded-lg max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-bold text-center">Select Set</h3>
        </div>
        <div className="p-4 grid grid-cols-4 gap-2">
          {Array.from({ length: totalSets }, (_, i) => i + 1).map(setNum => (
            <button
              key={setNum}
              onClick={() => onSelect(setNum)}
              className="bg-dark-card aspect-square flex items-center justify-center rounded-lg font-bold text-lg hover:bg-brand-primary"
            >
              {setNum}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const RepPacer: React.FC<{ currentRep: number, totalReps: number, phase: 'lift' | 'lower', progress: number }> = ({ currentRep, totalReps, phase, progress }) => (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-gray-700" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-white" strokeWidth="2" fill="none" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold">{phase.toUpperCase()}</p>
                <p className="text-lg">{currentRep} / {totalReps}</p>
            </div>
        </div>
    </div>
);


// --- MAIN AI ACTIVE WORKOUT SCREEN COMPONENT ---

const AiActiveWorkoutScreen: React.FC<{ plan: GeneratedWorkoutPlan; currentUser: User; onFinish: () => void; onSetFooterVisibility: (isVisible: boolean) => void; }> = ({ plan, currentUser, onFinish, onSetFooterVisibility }) => {
  // --- HOOKS DECLARATION (MUST BE AT THE TOP) ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [workoutPhase, setWorkoutPhase] = useState<WorkoutPhase>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mockHeartRate, setMockHeartRate] = useState(101);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [isSetSelectorOpen, setIsSetSelectorOpen] = useState(false);
  const [repPacer, setRepPacer] = useState<{ rep: number, phase: 'lift' | 'lower', progress: number } | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<WorkoutSession | null>(null);

  const mainTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const allExercises = useMemo(() => {
    // Definitive fix: Ensure all exercise arrays are valid before spreading to prevent crashes from malformed AI data.
    const warmUp = Array.isArray(plan?.warmUp) ? plan.warmUp : [];
    const training = Array.isArray(plan?.training) ? plan.training : [];
    const stretching = Array.isArray(plan?.stretching) ? plan.stretching : [];
    return [...warmUp, ...training, ...stretching];
  }, [plan]);

  const currentExercise = useMemo(() => allExercises[currentIndex], [allExercises, currentIndex]);

  const totalSets = useMemo(() => currentExercise?.sets || 1, [currentExercise]);
  const isRepBased = useMemo(() => currentExercise?.reps.toLowerCase().includes('rep') || false, [currentExercise]);
  const totalReps = useMemo(() => (currentExercise && isRepBased ? parseInt(currentExercise.reps.match(/\d+/)?.[0] || '0', 10) : 0), [currentExercise, isRepBased]);
  const restTime = useMemo(() => currentExercise?.restAfter || 30, [currentExercise]);
  const timeBasedDuration = useMemo(() => (currentExercise && !isRepBased ? parseInt(currentExercise.reps.match(/\d+/)?.[0] || '0', 10) : 0), [currentExercise, isRepBased]);

  useEffect(() => {
    onSetFooterVisibility(false);
    return () => {
      onSetFooterVisibility(true);
    };
  }, [onSetFooterVisibility]);

  // --- SAFETY CHECK (Must be AFTER hooks) ---
  if (!allExercises || allExercises.length === 0 || !currentExercise) {
    return (
      <div className="fixed inset-0 bg-dark-bg text-white flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-red-500">Workout Error</h2>
        <p className="mt-2 text-dark-text-secondary">This AI workout plan contains no exercises and cannot be started.</p>
        <button onClick={onFinish} className="mt-6 bg-brand-primary text-white font-bold py-2 px-6 rounded-lg">
          Go Back
        </button>
      </div>
    );
  }
  
  const playBeep = (freq = 880, duration = 0.1, type: 'sine' | 'square' = 'sine') => {
      if (!audioCtxRef.current) { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); }
      const audioCtx = audioCtxRef.current;
      if (!audioCtx || audioCtx.state === 'suspended') { audioCtx.resume(); }
      if (!audioCtx) return;

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 0.01);
      oscillator.type = type; oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      oscillator.start(audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
      oscillator.stop(audioCtx.currentTime + duration);
  };

  useEffect(() => {
    if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    mainTimerRef.current = window.setInterval(() => {
      if (isPaused) return;
      setTimeElapsed(prev => prev + 1);
      switch(workoutPhase) {
        case 'countdown': setCountdown(prev => { if (prev <= 1) { playBeep(1200, 0.2, 'square'); setWorkoutPhase('working'); return 0; } playBeep(880, 0.1); return prev - 1; }); break;
        case 'working':
          if(isRepBased) { setRepPacer(prev => { if (!prev) return { rep: 1, phase: 'lift', progress: 0 }; const newProgress = prev.progress + (100 / 2); if (newProgress >= 100) { if (prev.phase === 'lift') { playBeep(660, 0.1); return { ...prev, phase: 'lower', progress: 0 }; } if (prev.rep >= totalReps) { playBeep(1200, 0.2, 'square'); setWorkoutPhase('resting'); setTimeLeft(restTime); return null; } playBeep(880, 0.1, 'square'); return { rep: prev.rep + 1, phase: 'lift', progress: 0 }; } return { ...prev, progress: newProgress }; });
          } else { setTimeLeft(prev => { const newTimeLeft = prev - 1; if (newTimeLeft <= 0) { playBeep(1200, 0.2, 'square'); setWorkoutPhase('resting'); return restTime; } if (newTimeLeft <= 3) { playBeep(1000, 0.1, 'sine'); } return newTimeLeft; }); }
          break;
        case 'resting': setTimeLeft(prev => { const newTimeLeft = prev - 1; if (newTimeLeft <= 0) { playBeep(1200, 0.2, 'square'); if (currentSet < totalSets) { setCurrentSet(s => s + 1); setWorkoutPhase('ready'); } else { setWorkoutPhase('exercise_complete'); } return 0; } if (newTimeLeft <= 3) { playBeep(880, 0.1, 'sine'); } return newTimeLeft; }); break;
      }
    }, 1000);
    return () => { if (mainTimerRef.current) clearInterval(mainTimerRef.current); };
  }, [workoutPhase, currentSet, totalSets, restTime, isRepBased, totalReps, isPaused]);

  const handleFinishWorkout = async () => {
    const sessionData: Omit<WorkoutSession, 'id'> = {
        planId: `ai_${Date.now()}`, planName: "AI Daily Workout", date: new Date().toISOString(),
        duration: Math.round(timeElapsed / 60) || 1, planNotes: 'AI Generated Daily Workout',
        caloriesBurned: plan.estimatedCalories,
        completedExercises: allExercises.slice(0, currentIndex + 1).map(ex => ({
            exerciseId: ex.name, name: ex.name, notes: ex.instructions,
            sets: Array.from({ length: ex.sets }, () => ({ reps: 10, weight: 0 }))
        })),
        progressMedia: [],
    };
    try {
        const savedSession = await saveWorkoutSession(sessionData); setCompletedWorkout(savedSession);
    } catch (error) {
        console.error("Failed to save AI workout session:", error); setCompletedWorkout({ ...sessionData, id: 'temp-id' });
    }
    setWorkoutPhase('workout_finished');
  };

  useEffect(() => {
    const hrInterval = setInterval(() => {
        if(!isPaused && workoutPhase === 'working') setMockHeartRate(hr => Math.min(160, hr + (Math.random() * 2)));
        else setMockHeartRate(hr => Math.max(90, hr - (Math.random() * 2)));
    }, 2000);
    return () => clearInterval(hrInterval);
  }, [workoutPhase, isPaused]);

  const startSet = () => {
    if (workoutPhase === 'ready') {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') { audioCtxRef.current.resume(); }
      if (!isRepBased) { setTimeLeft(timeBasedDuration); } else { setRepPacer({ rep: 1, phase: 'lift', progress: 0 }); }
      setCountdown(3); setWorkoutPhase('countdown');
    }
  };
  
  const handleNextExercise = () => {
    if (currentIndex < allExercises.length - 1) { setCurrentIndex(prev => prev + 1); setCurrentSet(1); setWorkoutPhase('ready'); } else { handleFinishWorkout(); }
  };

  const handleSpeak = () => { if ('speechSynthesis' in window) { const text = `${currentExercise.name}. ${isRepBased ? `${currentSet} sets of ${currentExercise.reps}` : `Hold for ${currentExercise.reps}`}.`; const utterance = new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(utterance); } else { alert("Text-to-speech is not supported on your browser."); } };
  const handleTogglePause = () => setIsPaused(prev => !prev);
  const handleRepeatSet = () => { if (!isRepBased && (workoutPhase === 'working' || workoutPhase === 'resting')) { setTimeLeft(timeBasedDuration); if (workoutPhase !== 'working') { setWorkoutPhase('working'); } } };
  const handleBackPress = () => { if (window.confirm('Are you sure you want to end this workout? Your progress will not be saved.')) { onFinish(); } };
  const handleSelectSet = (setNumber: number) => { setCurrentSet(setNumber); setWorkoutPhase('ready'); setTimeLeft(0); setRepPacer(null); setCountdown(3); setIsSetSelectorOpen(false); };

  if (workoutPhase === 'workout_finished' && completedWorkout && currentUser) { return <WorkoutSummaryScreen user={currentUser} workoutHistory={[completedWorkout]} initialSession={completedWorkout} onDone={onFinish} />; }

  const totalDurationSeconds = plan.estimatedTime * 60;
  const progressOverall = totalDurationSeconds > 0 ? (timeElapsed / totalDurationSeconds) * 100 : 0;
  const imageUrl = currentExercise.imageUrl;

  const renderWorkoutContent = () => {
      switch (workoutPhase) {
          case 'ready': return <div className="text-center"><button onClick={startSet} className="bg-white text-black font-bold py-4 px-12 rounded-full text-2xl">Start Set {currentSet}</button></div>;
          case 'countdown': return <p className="text-8xl font-bold">{countdown}</p>;
          case 'working': return (<div className="flex flex-col items-center">{isRepBased && repPacer ? <RepPacer currentRep={repPacer.rep} totalReps={totalReps} phase={repPacer.phase} progress={repPacer.progress} /> : <p className="text-8xl font-bold font-mono tracking-tighter">{timeLeft.toString().padStart(2, '0')}</p>}</div>);
          case 'resting': return (<div className="text-center"><p className="text-4xl font-bold">REST</p><p className="text-6xl font-mono tracking-tighter">{timeLeft.toString().padStart(2, '0')}</p></div>);
          case 'exercise_complete': return <div className="text-center"><button onClick={handleNextExercise} className="bg-white text-black font-bold py-4 px-12 rounded-full text-2xl flex items-center">Next Exercise <ChevronRightIcon className="w-6 h-6 ml-2"/></button></div>;
          default: return null;
      }
  };
  
  const renderFooterControls = () => {
    const isTimerActive = workoutPhase === 'countdown' || workoutPhase === 'working' || workoutPhase === 'resting';
    return (
      <div className="flex items-center space-x-2"><button onClick={handleRepeatSet} disabled={isRepBased || !isTimerActive} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50"><RepeatIcon className="w-6 h-6 text-gray-300"/></button><button onClick={handleTogglePause} disabled={!isTimerActive} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50">{isPaused ? <PlayIcon className="w-8 h-8"/> : <PauseIcon className="w-8 h-8"/>}</button></div>
    );
  };
  
  const renderFooterTimer = () => {
    let displayTime = 0, progress = 0, totalDuration = 0;
    switch (workoutPhase) {
      case 'countdown': displayTime = countdown; totalDuration = 3; progress = totalDuration > 0 ? ((totalDuration - displayTime) / totalDuration) * 100 : 0; break;
      case 'working': if (!isRepBased) { displayTime = timeLeft; totalDuration = timeBasedDuration; progress = totalDuration > 0 ? ((totalDuration - displayTime) / totalDuration) * 100 : 0; } else { return <div className="flex-1 px-2" />; } break;
      case 'resting': displayTime = timeLeft; totalDuration = restTime; progress = totalDuration > 0 ? ((totalDuration - displayTime) / totalDuration) * 100 : 0; break;
      case 'ready': if (!isRepBased) { displayTime = timeBasedDuration; } else { return <div className="flex-1 px-2" />; } progress = 0; break;
      case 'exercise_complete': displayTime = 0; progress = 100; break;
      default: return <div className="flex-1 px-2" />;
    }
    return (
      <div className="flex-1 px-2 flex flex-col justify-center items-center"><span className="font-mono text-lg font-bold text-white tracking-wider" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{displayTime.toString().padStart(2, '0')}</span><div className="w-full bg-white/20 rounded-full h-3 -mt-2 overflow-hidden"><div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3" style={{ width: `${progress}%`, transition: isPaused ? 'none' : 'width 0.1s linear' }}></div></div></div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans">
      {isInstructionModalOpen && <InstructionModal exercise={currentExercise} onClose={() => setIsInstructionModalOpen(false)} />}
      {isSetSelectorOpen && <SetSelectorModal totalSets={totalSets} onSelect={handleSelectSet} onClose={() => setIsSetSelectorOpen(false)} />}
      <img src={imageUrl} alt={currentExercise.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      
      <header className="relative z-10 p-4 pt-8 md:pt-4 space-y-4">
        <button onClick={handleBackPress} className="p-2 bg-black/30 rounded-full"><ArrowLeftIcon className="w-6 h-6"/></button>
        <div className="flex items-center space-x-4"><div className="w-24 text-left text-sm font-mono">{Math.floor(timeElapsed/60).toString().padStart(2, '0')}:{(timeElapsed % 60).toString().padStart(2, '0')}</div><div className="flex-1 bg-white/20 h-1.5 rounded-full"><div className="bg-white h-1.5 rounded-full" style={{ width: `${progressOverall}%` }}></div></div><div className="w-24 text-right text-sm font-semibold">{Math.ceil((totalDurationSeconds - timeElapsed)/60)} MIN LEFT</div></div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">{renderWorkoutContent()}</main>

      <footer className="relative z-10 w-full p-4 space-y-3">
          <div className="flex items-center space-x-3"><p className="flex items-center font-semibold"><HeartIcon className="w-5 h-5 mr-1 text-red-500" /> {Math.round(mockHeartRate)}</p><div className="flex-1 h-2 rounded-full overflow-hidden bg-gradient-to-r from-cyan-500 via-green-500 to-red-500"></div>{currentUser && <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-8 h-8 rounded-full" />}</div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-left">
              <div><div><p className="text-xs font-semibold text-gray-300">{currentExercise.equipment || 'Bodyweight'}</p><p className="text-2xl font-bold">{currentExercise.name}</p></div></div>
              <div className="flex items-center space-x-2 mt-2">
                  <button onClick={() => setIsInstructionModalOpen(true)}><Bars3Icon className="w-7 h-7 text-gray-300"/></button>
                  <button onClick={handleSpeak}><SpeakerWaveIcon className="w-7 h-7 text-gray-300"/></button>
                  <button onClick={() => setIsSetSelectorOpen(true)} className="text-center leading-tight p-2 rounded-md hover:bg-white/10 transition-colors"><p className="font-semibold text-xs text-gray-400">SET</p><p className="font-bold text-lg">{currentSet}/{totalSets}</p></button>
                  {renderFooterTimer()}
                  {renderFooterControls()}
                  <button onClick={handleNextExercise}><ChevronRightIcon className="w-8 h-8"/></button>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default AiActiveWorkoutScreen;