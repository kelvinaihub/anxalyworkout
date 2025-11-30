import React, { useState, useEffect, useRef } from 'react';
import Footer from './components/Footer.tsx';
import FeedScreen from './screens/FeedScreen.tsx';
import WorkoutScreen from './screens/WorkoutScreen.tsx';
import CreateScreen from './screens/CreateScreen.tsx';
import MessagesScreen from './screens/MessagesScreen.tsx';
import ProfileScreen from './screens/ProfileScreen.tsx';
import ChatPopup from './components/ChatPopup.tsx';
import VideoCall from './components/VideoCall.tsx';
import StoryViewer from './components/StoryViewer.tsx';
import { Tab, User, CreateView, Story, GeneratedWorkoutPlan, GeneratedExercise } from './types.ts';
import AiHubScreen from './screens/AiHubScreen.tsx';
import { PlusIcon } from './components/Icons.tsx';
import DesktopHeader from './components/DesktopHeader.tsx';
import VideosScreen from './screens/VideosScreen.tsx';
import FriendsScreen from './screens/FriendsScreen.tsx';
import MarketplaceScreen from './screens/MarketplaceScreen.tsx';
import NotificationsScreen from './screens/NotificationsScreen.tsx';
import { generateWorkoutPlan, generateExerciseImage } from './services/geminiService.ts';
import { getUserProfile } from './services/firebaseService.ts';


type View = 
  | { name: Tab.Feed }
  | { name: Tab.Workout }
  | { name: Tab.AI, params?: { initialPrompt?: string } }
  | { name: Tab.Messages }
  | { name: Tab.Videos }
  | { name: Tab.Notifications }
  | { name: Tab.Friends }
  | { name: Tab.Marketplace }
  | { name: Tab.Profile, params: { userId: string } };

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Feed);
  const [currentView, setCurrentView] = useState<View>({ name: Tab.Feed });
  const [createModalView, setCreateModalView] = useState<CreateView | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [openChats, setOpenChats] = useState<User[]>([]);
  const [activeCall, setActiveCall] = useState<{ user: User, type: 'video' | 'voice' } | null>(null);
  const [activeStory, setActiveStory] = useState<{ stories: Story[], startIndex: number } | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(true);

  // State for the daily AI workout, managed at the top level
  const [dailyAiPlan, setDailyAiPlan] = useState<GeneratedWorkoutPlan | null>(null);
  const [isGeneratingAiWorkout, setIsGeneratingAiWorkout] = useState(false);
  const [aiWorkoutGenerationStatus, setAiWorkoutGenerationStatus] = useState<string>('');
  const hasGeneratedDailyPlan = useRef(false);


  useEffect(() => {
    // Simulate authentication by directly setting the user ID
    setUserId('user_1'); 
  }, []);
  
  useEffect(() => {
    // This effect runs only once to generate the daily workout in the background.
    const generateAndSetDailyWorkout = async () => {
        if (hasGeneratedDailyPlan.current || !userId) return;
        hasGeneratedDailyPlan.current = true;
        setIsGeneratingAiWorkout(true);

        try {
            const currentUser = await getUserProfile(userId);
            if (!currentUser) {
                setAiWorkoutGenerationStatus("Could not load user data.");
                setIsGeneratingAiWorkout(false);
                return;
            }

            setAiWorkoutGenerationStatus("Creating workout structure...");
            const prompt = `Create a random, full-body workout plan suitable for a ${currentUser.age}-year-old ${currentUser.gender}. Goal is general fitness. Include a 2-exercise warm-up and a 2-exercise cool-down stretch. Main training should have 4-5 exercises. Generate JSON with estimated time/calories, warm-ups, main exercises, and stretches. All 'imageUrl' fields must be an empty string "".`;
            
            const textPlan = await generateWorkoutPlan(prompt);

            const allExercises = [ ...(textPlan.warmUp || []), ...textPlan.training, ...(textPlan.stretching || []) ];
            const exercisesWithImages: GeneratedExercise[] = [];

            for (let i = 0; i < allExercises.length; i++) {
                const exercise = allExercises[i];
                setAiWorkoutGenerationStatus(`Generating image for ${exercise.name}... (${i + 1}/${allExercises.length})`);
                try {
                    const imageUrl = await generateExerciseImage(exercise.name, currentUser.gender);
                    exercisesWithImages.push({ ...exercise, imageUrl });
                } catch (imageError) {
                    console.error(`Failed to generate image for ${exercise.name}:`, imageError);
                    exercisesWithImages.push({ ...exercise, imageUrl: 'https://placehold.co/200x200/1e1e1e/ffffff?text=Image+Failed' });
                }
            }

            const finalPlan = { ...textPlan };
            let currentIndex = 0;
            if (finalPlan.warmUp) { finalPlan.warmUp = exercisesWithImages.slice(currentIndex, currentIndex + finalPlan.warmUp.length); currentIndex += finalPlan.warmUp.length; }
            finalPlan.training = exercisesWithImages.slice(currentIndex, currentIndex + finalPlan.training.length); currentIndex += finalPlan.training.length;
            if (finalPlan.stretching) { finalPlan.stretching = exercisesWithImages.slice(currentIndex, currentIndex + finalPlan.stretching.length); }
            
            setDailyAiPlan(finalPlan);
            setAiWorkoutGenerationStatus('Workout Ready!');
        } catch (error) {
            console.error("Failed to generate daily AI workout:", error);
            setAiWorkoutGenerationStatus("Failed to create workout.");
        } finally {
            setIsGeneratingAiWorkout(false);
        }
    };

    if (userId) { // Only generate after user is authenticated
         generateAndSetDailyWorkout();
    }
}, [userId]);


  const handleTabChange = (tab: Tab) => {
    setCreateModalView(null);
    setActiveTab(tab);
    if (tab === Tab.Profile && userId) {
      setCurrentView({ name: Tab.Profile, params: { userId: userId } });
    } else if (tab !== Tab.Profile) {
      setCurrentView({ name: tab });
    }
  };
  
  const navigateToAiPlanner = (initialPrompt: string) => {
    setActiveTab(Tab.AI);
    setCurrentView({ name: Tab.AI, params: { initialPrompt } });
  };

  const navigateToProfile = (profileUserId: string) => {
    setActiveTab(Tab.Profile);
    setCurrentView({ name: Tab.Profile, params: { userId: profileUserId } });
  }

  const handleOpenChat = (user: User) => {
    if (openChats.some(chatUser => chatUser.id === user.id)) return;
    if (openChats.length >= 3) {
      setOpenChats(prev => [...prev.slice(1), user]);
    } else {
      setOpenChats(prev => [...prev, user]);
    }
  };

  const handleCloseChat = (userIdToClose: string) => {
    setOpenChats(prev => prev.filter(user => user.id !== userIdToClose));
  };

  const handleStartCall = (user: User, type: 'video' | 'voice') => {
    setActiveCall({ user, type });
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };
  
  const handleOpenCreateModal = (view: CreateView) => {
    setCreateModalView(view);
  };
  
  const handleViewStory = (stories: Story[], startIndex: number) => {
    setActiveStory({ stories, startIndex });
  };
  
  const handleCloseStory = () => {
    setActiveStory(null);
  };

  const renderContent = () => {
    if (!userId) {
      return (
        <div className="flex items-center justify-center h-screen">
            <p>Authenticating...</p>
        </div>
      );
    }
    
    switch (currentView.name) {
      case Tab.Feed:
        return <FeedScreen onViewProfile={navigateToProfile} currentUserId={userId} onOpenCreateModal={handleOpenCreateModal} onOpenChat={handleOpenChat} onViewStory={handleViewStory} onTabChange={handleTabChange} />;
      case Tab.Workout:
        return <WorkoutScreen 
                  currentUserId={userId} 
                  onNavigateToAiPlanner={navigateToAiPlanner} 
                  dailyAiPlan={dailyAiPlan}
                  isGenerating={isGeneratingAiWorkout}
                  generationStatus={aiWorkoutGenerationStatus}
                  onSetFooterVisibility={setIsFooterVisible}
               />;
      case Tab.AI:
        return <AiHubScreen currentUserId={userId} onSetFooterVisibility={setIsFooterVisible} initialPrompt={currentView.params?.initialPrompt} />;
      case Tab.Messages:
        return <MessagesScreen currentUserId={userId} onOpenChat={handleOpenChat} />;
      case Tab.Videos:
        return <VideosScreen onViewProfile={navigateToProfile} />;
      case Tab.Notifications:
        return <NotificationsScreen onViewProfile={navigateToProfile} />;
      case Tab.Friends:
        return <FriendsScreen currentUserId={userId} onViewProfile={navigateToProfile} onOpenChat={handleOpenChat} />;
      case Tab.Marketplace:
        return <MarketplaceScreen onOpenChat={handleOpenChat} />;
      case Tab.Profile:
        return <ProfileScreen userId={currentView.params.userId} currentUserId={userId} onViewProfile={navigateToProfile} onOpenChat={handleOpenChat} onOpenCreateModal={handleOpenCreateModal} onTabChange={handleTabChange} />;
      default:
        return <FeedScreen onViewProfile={navigateToProfile} currentUserId={userId} onOpenCreateModal={handleOpenCreateModal} onOpenChat={handleOpenChat} onViewStory={handleViewStory} onTabChange={handleTabChange} />;
    }
  };

  const isProfile = currentView.name === Tab.Profile;

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-dark-bg">
      {!isProfile && (
        <div className="hidden md:block">
            <DesktopHeader 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                onOpenCreateModal={handleOpenCreateModal} 
            />
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
      
      {isFooterVisible && (
        <>
          <div className="md:hidden fixed bottom-20 right-4 z-30">
            <button 
              onClick={() => setCreateModalView('menu')}
              className="bg-brand-primary text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-110 focus:outline-none"
            >
              <PlusIcon className="w-8 h-8"/>
            </button>
          </div>
          
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
            <Footer activeTab={activeTab} onTabChange={handleTabChange} />
          </div>
        </>
      )}

      {createModalView && <CreateScreen initialView={createModalView} onClose={() => { setCreateModalView(null); }} />}

      {userId && (
        <>
            <div className="hidden md:flex fixed bottom-0 right-20 space-x-4 z-40">
                {openChats.map((user) => (
                    <ChatPopup key={user.id} user={user} currentUserId={userId} onClose={handleCloseChat} onStartCall={handleStartCall} />
                ))}
            </div>
            {openChats.length > 0 && (
                <div className="md:hidden">
                        <ChatPopup user={openChats[openChats.length - 1]} currentUserId={userId} onClose={handleCloseChat} onStartCall={handleStartCall} />
                </div>
            )}
        </>
      )}

      {activeCall && (
        <VideoCall user={activeCall.user} type={activeCall.type} onEndCall={handleEndCall} />
      )}
      
      {activeStory && (
        <StoryViewer stories={activeStory.stories} startIndex={activeStory.startIndex} onClose={handleCloseStory} />
      )}
    </div>
  );
};

export default App;