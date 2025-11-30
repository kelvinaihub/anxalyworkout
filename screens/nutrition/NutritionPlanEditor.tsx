

import React, { useState } from 'react';
import { NutritionPlan, Meal, NutritionSchedule } from '../../types.ts';
import { saveNutritionPlan } from '../../services/firebaseService.ts';
import { suggestMeals } from '../../services/geminiService.ts';
import { XIcon, SparklesIcon } from '../../components/Icons.tsx';

interface NutritionPlanEditorProps {
  plan: NutritionPlan | null;
  onClose: () => void;
}

const NutritionPlanEditor: React.FC<NutritionPlanEditorProps> = ({ plan, onClose }) => {
  const [formData, setFormData] = useState<Omit<NutritionPlan, 'id'>>(
    plan || {
      name: '',
      schedule: { day: 'Everyday', session: 'Breakfast', startTime: '07:00' },
      notes: '',
      media: [],
      meals: [],
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleInputChange = <K extends keyof Omit<NutritionPlan, 'id'>>(key: K, value: Omit<NutritionPlan, 'id'>[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleScheduleChange = (key: keyof NutritionSchedule, value: string) => {
    setFormData(prev => ({...prev, schedule: {...prev.schedule, [key]: value}}));
  };
  
  const handleMealChange = (index: number, key: keyof Meal, value: any) => {
    const newMeals = [...formData.meals];
    (newMeals[index] as any)[key] = value;
    handleInputChange('meals', newMeals);
  };
  
  const addMeal = () => {
    const newMeal: Meal = { id: `ml_${Date.now()}`, name: '', notes: '', media: [] };
    handleInputChange('meals', [...formData.meals, newMeal]);
  };
  
  const removeMeal = (index: number) => {
    handleInputChange('meals', formData.meals.filter((_, i) => i !== index));
  };

  const handleGeminiSuggest = async () => {
    if (!formData.name) {
      alert("Please enter a plan name first to get suggestions.");
      return;
    }
    setIsSuggesting(true);
    try {
        const suggestions = await suggestMeals(formData.name);
        const newMeals = suggestions.map(s => ({
            ...s,
            id: `ml_${Date.now()}_${Math.random()}`,
            media: [],
        } as Meal));
        handleInputChange('meals', [...formData.meals, ...newMeals]);
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
        await saveNutritionPlan({ ...formData, id: plan?.id });
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
        <h2 className="text-2xl font-bold">{plan ? 'Edit Nutrition Plan' : 'Create Nutrition Plan'}</h2>
        <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary">Plan Name</label>
          <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-dark-card p-2 rounded mt-1" />
        </div>
        
        {/* Schedule fields would go here, similar to workout editor */}
        
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary">Notes</label>
          <textarea value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} className="w-full bg-dark-card p-2 rounded mt-1 h-24"></textarea>
        </div>

        <h3 className="text-xl font-bold pt-4">Meals / Food Items</h3>
        
        {formData.meals.map((meal, index) => (
            <div key={index} className="bg-dark-card p-3 rounded-lg space-y-2">
                 <div className="flex justify-between items-center">
                    <input type="text" placeholder="Meal Name" value={meal.name} onChange={e => handleMealChange(index, 'name', e.target.value)} className="w-full bg-dark-surface p-2 rounded font-semibold"/>
                    <button onClick={() => removeMeal(index)} className="ml-2 text-red-500"><XIcon className="w-5 h-5"/></button>
                 </div>
                 <textarea placeholder="Notes (e.g., recipe, ingredients)" value={meal.notes} onChange={e => handleMealChange(index, 'notes', e.target.value)} className="w-full bg-dark-surface p-2 rounded text-sm h-16"></textarea>
            </div>
        ))}

        <div className="flex space-x-2">
            <button onClick={addMeal} className="flex-1 bg-dark-card py-2 px-4 rounded hover:bg-gray-600">Add Meal</button>
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

export default NutritionPlanEditor;