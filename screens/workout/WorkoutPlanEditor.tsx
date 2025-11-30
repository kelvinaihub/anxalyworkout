import React, { useState } from 'react';
import { WorkoutPlan, Exercise, Media, Schedule } from '../../types.ts';
import { saveWorkoutPlan, uploadFile } from '../../services/firebaseService.ts';
import { suggestExercises } from '../../services/geminiService.ts';
import { XIcon, SparklesIcon } from '../../components/Icons.tsx';

interface WorkoutPlanEditorProps {
  plan: WorkoutPlan | null;
  onClose: () => void;
}

const WorkoutPlanEditor: React.FC<WorkoutPlanEditorProps> = ({ plan, onClose }) => {
  const [formData, setFormData] = useState<Omit<WorkoutPlan, 'id'>>(
    plan || {
      name: '',
      schedule: { day: 'Monday', session: 'Morning', startTime: '08:00' },
      notes: '',
      media: [],
      exercises: [],
      category: 'Strength',
      difficulty: 'Intermediate',
      duration: 45,
      caloriesBurned: 300,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleInputChange = <K extends keyof Omit<WorkoutPlan, 'id'>>(key: K, value: Omit<WorkoutPlan, 'id'>[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleScheduleChange = (key: keyof Schedule, value: string) => {
    setFormData(prev => ({...prev, schedule: {...prev.schedule, [key]: value}}));
  };
  
  const handleExerciseChange = (index: number, key: keyof Exercise, value: any) => {
    const newExercises = [...formData.exercises];
    (newExercises[index] as any)[key] = value;
    handleInputChange('exercises', newExercises);
  };
  
  const addExercise = () => {
    const newExercise: Exercise = {
        id: `ex_${Date.now()}`, name: '', sets: 3, reps: '10', estimatedTime: 10, restTime: 60, notes: '', media: []
    };
    handleInputChange('exercises', [...formData.exercises, newExercise]);
  };
  
  const removeExercise = (index: number) => {
    handleInputChange('exercises', formData.exercises.filter((_, i) => i !== index));
  };

  const handleGeminiSuggest = async () => {
    if (!formData.name) {
      alert("Please enter a plan name first to get suggestions.");
      return;
    }
    setIsSuggesting(true);
    try {
        const suggestions = await suggestExercises(formData.name);
        const newExercises = suggestions.map(s => ({
            ...s,
            id: `ex_${Date.now()}_${Math.random()}`,
            media: [],
        } as Exercise));
        handleInputChange('exercises', [...formData.exercises, ...newExercises]);
    } catch (error) {
        console.error("Failed to get Gemini suggestions:", error);
        alert("Could not get suggestions. Please try again.");
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await saveWorkoutPlan({ ...formData, id: plan?.id });
        onClose();
    } catch (error) {
        console.error("Failed to save plan:", error);
        alert("Error saving plan. Please check the console.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-dark-surface min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{plan ? 'Edit Plan' : 'Create Plan'}</h2>
        <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary">Plan Name</label>
          <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-dark-card p-2 rounded mt-1" />
        </div>

        <div className="grid grid-cols-3 gap-2">
            <div>
                <label className="text-xs text-dark-text-secondary">Day</label>
                <select value={formData.schedule.day} onChange={e => handleScheduleChange('day', e.target.value)} className="w-full bg-dark-card p-2 rounded mt-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Everyday'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
             <div>
                <label className="text-xs text-dark-text-secondary">Session</label>
                <select value={formData.schedule.session} onChange={e => handleScheduleChange('session', e.target.value)} className="w-full bg-dark-card p-2 rounded mt-1">
                    {['Morning', 'Afternoon', 'Evening', 'Anytime'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
             <div>
                <label className="text-xs text-dark-text-secondary">Time</label>
                <input type="time" value={formData.schedule.startTime} onChange={e => handleScheduleChange('startTime', e.target.value)} className="w-full bg-dark-card p-2 rounded mt-1"/>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-text-secondary">Notes</label>
          <textarea value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} className="w-full bg-dark-card p-2 rounded mt-1 h-24"></textarea>
        </div>

        <h3 className="text-xl font-bold pt-4">Exercises</h3>
        
        {formData.exercises.map((ex, index) => (
            <div key={index} className="bg-dark-card p-3 rounded-lg space-y-2">
                 <div className="flex justify-between items-center">
                    <input type="text" placeholder="Exercise Name" value={ex.name} onChange={e => handleExerciseChange(index, 'name', e.target.value)} className="w-full bg-dark-surface p-2 rounded font-semibold"/>
                    <button onClick={() => removeExercise(index)} className="ml-2 text-red-500"><XIcon className="w-5 h-5"/></button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input type="text" placeholder="Sets x Reps" value={ex.reps} onChange={e => handleExerciseChange(index, 'reps', e.target.value)} className="bg-dark-surface p-2 rounded text-sm"/>
                    <input type="number" placeholder="Sets" value={ex.sets} onChange={e => handleExerciseChange(index, 'sets', parseInt(e.target.value))} className="bg-dark-surface p-2 rounded text-sm"/>
                    <input type="number" placeholder="Rest (s)" value={ex.restTime} onChange={e => handleExerciseChange(index, 'restTime', parseInt(e.target.value))} className="bg-dark-surface p-2 rounded text-sm"/>
                 </div>
            </div>
        ))}

        <div className="flex space-x-2">
            <button onClick={addExercise} className="flex-1 bg-dark-card py-2 px-4 rounded hover:bg-gray-600">Add Exercise</button>
            <button onClick={handleGeminiSuggest} disabled={isSuggesting} className="flex-1 bg-purple-600 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-purple-700 disabled:bg-purple-900">
                <SparklesIcon className="w-5 h-5 mr-2"/>
                {isSuggesting ? 'Thinking...' : 'Suggest'}
            </button>
        </div>

        <div className="pt-6">
            <button onClick={handleSave} disabled={isSaving} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-800">
                {isSaving ? 'Saving...' : 'Save Plan'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlanEditor;