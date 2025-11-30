import React, { useState, useEffect, useCallback } from 'react';
import { getNutritionPlans, deleteNutritionPlan } from '../services/firebaseService.ts';
import { NutritionPlan } from '../types.ts';
import NutritionPlanEditor from './nutrition/NutritionPlanEditor.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---
const NutritionCard: React.FC<{ plan: NutritionPlan; onEdit: (plan: NutritionPlan) => void; onDelete: (id: string) => void; }> = ({ plan, onEdit, onDelete }) => (
    <div className="bg-dark-card rounded-lg overflow-hidden shadow-lg mb-4 flex">
        <img className="w-1/3 h-auto object-cover" src={plan.media.length > 0 ? plan.media[0].url : 'https://picsum.photos/200/300'} alt={plan.name} />
        <div className="p-4 flex flex-col justify-between w-2/3">
            <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-dark-text-secondary">{plan.schedule.day} - {plan.schedule.session}</p>
                <p className="text-sm text-dark-text mt-2">{plan.meals.length} meals/items</p>
            </div>
            <div className="flex space-x-2 mt-4">
                <button onClick={() => onEdit(plan)} className="text-sm text-dark-text-secondary hover:text-white">Edit</button>
                <button onClick={() => onDelete(plan.id)} className="text-sm text-red-500 hover:text-red-400">Delete</button>
            </div>
        </div>
    </div>
);


// --- MAIN NUTRITION SCREEN COMPONENT ---
const NutritionScreen: React.FC = () => {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
        const fetchedPlans = await getNutritionPlans();
        setPlans(fetchedPlans);
    } catch (error) {
        console.error("Failed to fetch nutrition plans:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEditing) {
        fetchPlans();
    }
  }, [isEditing, fetchPlans]);

  const handleCreateNew = () => {
    setSelectedPlan(null);
    setIsEditing(true);
  };

  const handleEdit = (plan: NutritionPlan) => {
    setSelectedPlan(plan);
    setIsEditing(true);
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
        await deleteNutritionPlan(planId);
        fetchPlans();
    }
  };

  const handleEditorClose = () => {
    setIsEditing(false);
    setSelectedPlan(null);
  };
  
  if (isEditing) {
    return <NutritionPlanEditor plan={selectedPlan} onClose={handleEditorClose} />;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Nutrition Plans</h1>
        <button onClick={handleCreateNew} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 transition-colors">+ New Plan</button>
      </div>
      {loading ? (
        <p>Loading plans...</p>
      ) : plans.length > 0 ? (
        plans.map(plan => <NutritionCard key={plan.id} plan={plan} onEdit={handleEdit} onDelete={handleDelete} />)
      ) : (
        <p>No nutrition plans found. Create one to get started!</p>
      )}
    </div>
  );
};

export default NutritionScreen;