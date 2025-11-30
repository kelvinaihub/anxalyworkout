import React, { useState, useEffect, useMemo } from 'react';
import { User, WorkoutSession, Exercise } from '../../types.ts';
import { getWorkoutSummaryFeedback } from '../../services/geminiService.ts';
import { PencilIcon, XIcon, StarIcon } from '../../components/Icons.tsx';

interface WorkoutSummaryScreenProps {
  user: User;
  workoutHistory: WorkoutSession[];
  initialSession: WorkoutSession;
  onDone: () => void;
}

type TimeFilter = 'today' | 'week' | 'last_week';

const WorkoutSummaryScreen: React.FC<WorkoutSummaryScreenProps> = ({ user, workoutHistory, initialSession, onDone }) => {
  const [activeTab, setActiveTab] = useState('Summary');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(initialSession);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const date = activeSession ? new Date(activeSession.date) : new Date();

  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Sunday as the first day of the week (0)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    let sessionToFind: WorkoutSession | undefined;

    if (timeFilter === 'today') {
      sessionToFind = workoutHistory.find(s => new Date(s.date) >= startOfToday);
    } else if (timeFilter === 'week') {
      sessionToFind = workoutHistory.find(s => {
        const sDate = new Date(s.date);
        return sDate >= startOfWeek && sDate < startOfToday;
      });
    } else { // 'last_week'
      sessionToFind = workoutHistory.find(s => {
        const sDate = new Date(s.date);
        return sDate >= startOfLastWeek && sDate < startOfWeek;
      });
    }
    setActiveSession(sessionToFind || null);
  }, [timeFilter, workoutHistory]);
  
  // Reset activeSession to initialSession when the component mounts with a new initialSession
  useEffect(() => {
    setActiveSession(initialSession);
    setTimeFilter('today');
  }, [initialSession]);


  useEffect(() => {
    if (activeTab === 'Feedback' && activeSession) {
      setFeedback(null);
      setIsFeedbackLoading(true);
      getWorkoutSummaryFeedback(
        activeSession.completedExercises.length,
        activeSession.completedExercises.length, // Assuming all exercises in session were in plan
        activeSession.duration
      ).then(setFeedback).finally(() => setIsFeedbackLoading(false));
    }
  }, [activeTab, activeSession]);
  
  const handleShare = async () => {
    if (!activeSession) return;
      const shareData = {
          title: 'KelvinFit Workout Complete!',
          text: `I just finished the '${activeSession.planName}' workout in ${activeSession.duration} minutes and burned ${activeSession.caloriesBurned} calories! Feeling strong! 💪 #KelvinFit`,
      };
      try {
          if (navigator.share) {
              await navigator.share(shareData);
              console.log('Workout shared successfully');
          } else {
              alert('Web Share API not supported in your browser. You can manually copy the text:\n\n' + shareData.text);
          }
      } catch (err) {
          console.error('Error sharing workout:', err);
      }
  };

  const renderTabContent = () => {
    if (!activeSession) {
        return <div className="text-center p-8 text-gray-500">No workout data for this period.</div>
    }
    switch (activeTab) {
        case 'Feedback':
            return (
                <div className="p-4 space-y-3">
                    <h3 className="font-bold text-lg text-gray-800">AI Coach Feedback</h3>
                    {isFeedbackLoading && <p>Generating feedback...</p>}
                    {feedback && <p className="text-gray-600 whitespace-pre-line">{feedback}</p>}
                </div>
            );
        case 'Exercises':
             return (
                <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg mb-2 text-gray-800">Exercises Completed</h3>
                    {activeSession.completedExercises.map(ex => (
                         <div key={ex.exerciseId} className="bg-gray-200 p-2 rounded-md text-sm">
                            <p className="font-semibold text-gray-800">{ex.name}</p>
                            <p className="text-xs text-gray-500">{ex.sets.length} sets</p>
                         </div>
                    ))}
                </div>
            );
        case 'Heart Rate':
            return <div className="p-4 text-center text-gray-500">Heart rate data coming soon.</div>;
        default: // Summary
            const summaryDate = new Date(activeSession.date);
            return (
                 <div className="relative bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 rounded-3xl p-6 shadow-2xl w-full flex-1 flex flex-col text-white text-left overflow-hidden">
                    {/* Rotated Text */}
                    <p className="absolute top-16 right-0 text-xs font-bold tracking-widest origin-bottom-right -rotate-90">FUTURE</p>
                    <p className="absolute bottom-16 right-0 text-xs font-bold tracking-widest origin-bottom-right -rotate-90">
                        {summaryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </p>

                    <svg viewBox="0 0 100 50" className="absolute inset-x-0 top-1/4 w-full h-auto opacity-30 pointer-events-none">
                        <path d="M0 25 Q 5 10, 10 25 T 20 25 Q 25 5, 30 25 T 40 25 Q 45 40, 50 25 T 60 25 Q 65 15, 70 25 T 80 25 Q 85 30, 90 25 T 100 25" stroke="#FBBF24" fill="none" strokeWidth="0.7"/>
                    </svg>
                    
                    <div className="relative flex items-center space-x-2">
                        <img src={user.profilePictureUrl} alt={user.name} className="w-6 h-6 rounded-full"/>
                        <p className="text-xs font-bold tracking-widest">COACH {user.name.toUpperCase()}</p>
                    </div>
                    
                    <div className="relative flex flex-col items-start justify-center space-y-4 my-auto">
                        <div>
                            <p className="text-6xl font-bold leading-none">115</p>
                            <p className="text-xs font-semibold opacity-70 tracking-widest mt-1">BPM AVERAGE</p>
                        </div>
                        <div>
                            <p className="text-6xl font-bold leading-none">{activeSession.caloriesBurned}</p>
                            <p className="text-xs font-semibold opacity-70 tracking-widest mt-1">CALORIES</p>
                        </div>
                        <div>
                            <p className="text-6xl font-bold leading-none">{activeSession.duration}<span className="text-5xl">:09</span></p>
                            <p className="text-xs font-semibold opacity-70 tracking-widest mt-1">MINUTES</p>
                        </div>
                    </div>

                    <div className="relative text-left">
                        <p className="font-semibold text-lg">{activeSession.planName} 🎪</p>
                    </div>
                </div>
            );
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex flex-col p-4 font-sans" onClick={onDone}>
        <div className="w-full max-w-md mx-auto my-auto bg-white text-gray-800 rounded-3xl flex flex-col h-full max-h-[95vh] shadow-2xl" onClick={e => e.stopPropagation()}>
            <header className="p-4 flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'long' })} · {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                <div className="flex space-x-2">
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><StarIcon className="w-6 h-6"/></button>
                    <button onClick={onDone} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><XIcon className="w-6 h-6"/></button>
                </div>
            </header>
            <div className="px-4"><h2 className="text-2xl font-bold flex items-center">{activeSession?.planName || 'Workout Summary'} <span className="ml-2 text-lg">🎪</span></h2></div>
            <nav className="px-4 mt-4 flex space-x-4 border-b border-gray-200">
                {['Summary', 'Feedback', 'Heart Rate', 'Exercises'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>{tab}</button>))}
            </nav>
            <div className="flex-1 overflow-y-auto pt-4 flex flex-col">
                 <div className="flex-1 flex flex-col px-4 pb-4">
                    {renderTabContent()}
                 </div>
            </div>

            <footer className="p-4 border-t border-gray-200">
                <div className="flex justify-center">
                     <button onClick={handleShare} className="bg-black text-white font-bold rounded-full flex items-center justify-center py-2 pl-2 pr-6 hover:bg-gray-800 transition-colors shadow-lg">
                        <div className="bg-gray-800 rounded-full p-2 mr-3">
                            <PencilIcon className="w-5 h-5"/>
                        </div>
                        <span className="text-lg">Share</span>
                    </button>
                </div>
            </footer>
        </div>
    </div>
  );
};

export default WorkoutSummaryScreen;