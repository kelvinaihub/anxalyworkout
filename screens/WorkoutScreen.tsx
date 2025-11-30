import React, { useState, useEffect } from 'react';
import { getWorkoutHistory, getUserProfile } from '../services/firebaseService.ts';
import { WorkoutSession, User, GeneratedWorkoutPlan } from '../types.ts';
import WorkoutPlanDetailScreen from './workout/WorkoutPlanDetailScreen.tsx';
import WorkoutSummaryScreen from './workout/WorkoutSummaryScreen.tsx';
import { CheckCircleIcon, ChevronRightIcon, EyeIcon, BarbellIcon, YogaIcon, MindfulnessIcon, InformationCircleIcon, DumbbellIcon } from '../components/Icons.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix Hook errors) ---

const ActiveMinutesChart: React.FC = () => {
    const data = [ { day: 'Mon', minutes: 25 }, { day: 'Tue', minutes: 45 }, { day: 'Wed', minutes: 60 }, { day: 'Thu', minutes: 20 }, { day: 'Fri', minutes: 75 }, { day: 'Sat', minutes: 30 }, { day: 'Sun', minutes: 90 } ];
    const maxMinutes = Math.max(...data.map(d => d.minutes), 1);
    
    return (
        <div className="bg-dark-card p-4 rounded-2xl">
            <h3 className="font-bold">Active Minutes</h3>
            <div className="flex justify-between items-end h-48 mt-4 space-x-2">
                {data.map(d => (
                    <div key={d.day} className="flex flex-col items-center flex-1 h-full justify-end">
                        <div 
                            className="w-full bg-orange-400 rounded-t-md relative"
                            style={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
                        >
                            <span className="absolute -top-5 left-0 right-0 text-center text-xs font-semibold text-dark-text">
                                {d.minutes}
                            </span>
                        </div>
                        <p className="text-xs text-dark-text-secondary mt-1">{d.day}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- MAIN WORKOUT SCREEN COMPONENT ---

interface WorkoutScreenProps {
  currentUserId: string;
  onNavigateToAiPlanner: (initialPrompt: string) => void;
  dailyAiPlan: GeneratedWorkoutPlan | null;
  isGenerating: boolean;
  generationStatus: string;
  onSetFooterVisibility: (isVisible: boolean) => void;
}

const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ currentUserId, onNavigateToAiPlanner, dailyAiPlan, isGenerating, generationStatus, onSetFooterVisibility }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [view, setView] = useState<'dashboard' | 'plan_detail' | 'summary_modal'>('dashboard');
  const [greeting, setGreeting] = useState('Evening');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Morning');
    else if (hour < 18) setGreeting('Afternoon');
    else setGreeting('Evening');
    
    const fetchData = async () => {
      try {
        const [fetchedUser, fetchedHistory] = await Promise.all([ 
            getUserProfile(currentUserId),
            getWorkoutHistory()
        ]);
        setUser(fetchedUser);
        setWorkoutHistory(fetchedHistory);
      } catch (error) {
        console.error("Failed to fetch workout screen data:", error);
      }
    };

    fetchData();
  }, [currentUserId]);

  if (!user) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  if (view === 'plan_detail' && dailyAiPlan) {
      return <WorkoutPlanDetailScreen generatedPlan={dailyAiPlan} user={user} onBack={() => setView('dashboard')} onSetFooterVisibility={onSetFooterVisibility} />;
  }
  
  if (view === 'summary_modal' && workoutHistory.length > 0) {
      return <WorkoutSummaryScreen user={user} workoutHistory={workoutHistory} initialSession={workoutHistory[0]} onDone={() => setView('dashboard')} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-24 space-y-6 bg-dark-bg">
        <header className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">{greeting}, {user.name.split(' ')[0]}</h1>
            </div>
            <img src={user.profilePictureUrl} alt={user.name} className="w-10 h-10 rounded-full" />
        </header>
        
        <section>
             <h2 className="text-lg font-bold text-dark-text mb-3">Today</h2>
             <div className="bg-dark-card rounded-2xl p-4 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
                {isGenerating ? (
                    <div className="text-center">
                        <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-brand-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-dark-text-secondary">{generationStatus}</p>
                    </div>
                ) : dailyAiPlan ? (
                    <>
                        <img src="https://picsum.photos/seed/todaybg/600/200" alt="Workout background" className="absolute inset-0 w-full h-full object-cover opacity-20"/>
                        <svg viewBox="0 0 100 20" className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-auto opacity-40 pointer-events-none">
                            <path d="M0 10 Q 5 2, 10 10 T 20 10 Q 25 18, 30 10 T 40 10 Q 45 5, 50 10 T 60 10 Q 65 15, 70 10 T 80 10 Q 85 12, 90 10 T 100 10" stroke="#34D399" fill="none" strokeWidth="0.5"/>
                        </svg>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2">
                                    <CheckCircleIcon className="w-5 h-5 text-green-400"/>
                                    <p className="font-semibold">AI Daily Workout</p>
                                </div>
                                <button onClick={() => setView('plan_detail')} className="p-2 -mr-2 -mt-2 rounded-full hover:bg-dark-surface">
                                    <EyeIcon className="w-6 h-6 text-dark-text-secondary"/>
                                </button>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <div>
                                    <p className="text-5xl font-bold">{dailyAiPlan.estimatedCalories}</p>
                                    <p className="text-sm text-dark-text-secondary -mt-1">Calories Burned</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-semibold">{dailyAiPlan.estimatedTime}:00</p>
                                    <p className="text-sm text-dark-text-secondary">Duration</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-dark-text-secondary">
                        <p>Could not generate a workout for today. Please try again later.</p>
                    </div>
                )}
             </div>
        </section>

        <section>
            <h2 className="text-lg font-bold text-dark-text mb-3">More Workouts</h2>
            <div className="flex justify-around items-center bg-dark-card rounded-2xl p-3">
                {[
                    { icon: BarbellIcon, prompt: 'a strength workout with a barbell' },
                    { icon: YogaIcon, prompt: 'a beginner yoga routine for flexibility' },
                    { icon: MindfulnessIcon, prompt: 'a guided meditation for stress relief' },
                    { icon: InformationCircleIcon, prompt: 'what are the benefits of HIIT?' },
                    { icon: DumbbellIcon, prompt: 'a full body workout using dumbbells' }
                ].map(({ icon: Icon, prompt }, index) => (
                    <button key={index} onClick={() => onNavigateToAiPlanner(prompt)} className="flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-dark-surface">
                        <Icon className="w-7 h-7 text-dark-text-secondary"/>
                    </button>
                ))}
            </div>
        </section>

        <section>
            <h2 className="text-lg font-bold text-dark-text mb-3">Weekly Summary</h2>
            <div className="bg-dark-card p-4 rounded-2xl space-y-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mr-3">
                        <CheckCircleIcon className="w-6 h-6"/>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">Workouts Completed</p>
                        <p className="text-xs text-dark-text-secondary">1 / 5</p>
                    </div>
                    <button onClick={() => setView('summary_modal')}><ChevronRightIcon className="w-6 h-6 text-dark-text-secondary"/></button>
                </div>
                 <div className="w-full bg-dark-surface rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '20%'}}></div>
                </div>
            </div>
        </section>
        
        <section>
            <ActiveMinutesChart />
        </section>

    </div>
  );
};

export default WorkoutScreen;