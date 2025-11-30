import React, { useState, useEffect } from 'react';
import { getWorkoutHistory } from '../services/firebaseService.ts';
import { WorkoutSession, CompletedExercise } from '../types.ts';
import { ArrowLeftIcon } from '../components/Icons.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---

const ExerciseDetail: React.FC<{ exercise: CompletedExercise }> = ({ exercise }) => (
    <div className="bg-dark-surface p-3 rounded-lg">
        <p className="font-bold">{exercise.name}</p>
        <div className="text-sm text-dark-text-secondary mt-1">
            {exercise.sets.map((set, i) => (
                <span key={i} className="mr-3">{`Set ${i+1}: ${set.reps} reps @ ${set.weight}kg`}</span>
            ))}
        </div>
    </div>
);

const SessionCard: React.FC<{ session: WorkoutSession }> = ({ session }) => (
    <div className="bg-dark-card rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start">
            <div>
                 <h3 className="text-lg font-bold text-brand-primary">{session.planName}</h3>
                 <p className="text-sm text-dark-text-secondary mb-3">{new Date(session.date).toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-semibold">{session.duration} mins</p>
                <p className="text-xs text-dark-text-secondary">{session.caloriesBurned} kcal</p>
            </div>
        </div>
        
        <div className="space-y-2">
            {session.completedExercises.map(ex => <ExerciseDetail key={ex.exerciseId} exercise={ex} />)}
        </div>
    </div>
);

// --- MAIN HISTORY SCREEN COMPONENT ---

interface HistoryScreenProps {
    onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
        setLoading(true);
        try {
            const fetchedHistory = await getWorkoutHistory();
            setHistory(fetchedHistory);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    };
    loadHistory();
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 pt-4">
        <div className="flex items-center mb-4">
            <button onClick={onBack} className="p-2 -ml-2 mr-2"><ArrowLeftIcon className="w-6 h-6"/></button>
            <h1 className="text-2xl font-bold">Workout History</h1>
        </div>
      {loading ? (
        <p>Loading history...</p>
      ) : history.length > 0 ? (
        history.map(session => <SessionCard key={session.id} session={session} />)
      ) : (
        <p>No completed workouts yet. Go smash one!</p>
      )}
    </div>
  );
};

export default HistoryScreen;