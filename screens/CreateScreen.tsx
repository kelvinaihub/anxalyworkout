import React, { useState, useRef, useEffect } from 'react';
import { CreateView, PrivacySetting, Song, Media, User, LifeEventType } from '../types.ts';
import { createPost, uploadFile, getFriendsForUser, searchMusic } from '../services/firebaseService.ts';
import WorkoutPlanEditor from './workout/WorkoutPlanEditor.tsx';
import NutritionPlanEditor from './nutrition/NutritionPlanEditor.tsx';
import LiveVideoCreator from './create/LiveVideoCreator.tsx';
import StoryCreator from './create/StoryCreator.tsx';
import { 
    XIcon, PencilIcon, DumbbellIcon, ChartBarIcon, VideoCameraIcon, PhotoIcon, 
    EllipsisHorizontalIcon, CalendarIcon, MapPinIcon, TagIcon, FaceSmileIcon, 
    MusicalNoteIcon, ArrowLeftIcon, SwatchIcon, GifIcon, FlagIcon, BriefcaseIcon, 
    AcademicCapIcon, HeartIcon, HomeIcon, MagnifyingGlassIcon 
} from '../components/Icons.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---

interface CreateMenuProps {
    setView: (view: CreateView) => void;
}

const CreateMenu: React.FC<CreateMenuProps> = ({ setView }) => {
    const menuItems = [
        { view: 'post' as CreateView, icon: PencilIcon, label: 'Post', description: 'Share your thoughts with friends.' },
        { view: 'workout' as CreateView, icon: DumbbellIcon, label: 'Workout Plan', description: 'Create a new workout routine.' },
        { view: 'nutrition' as CreateView, icon: ChartBarIcon, label: 'Nutrition Plan', description: 'Log your meals and track macros.' },
        { view: 'live' as CreateView, icon: VideoCameraIcon, label: 'Go Live', description: 'Stream live video to your followers.' },
    ];

    return (
        <div className="space-y-3">
            {menuItems.map(item => (
                <button 
                    key={item.view} 
                    onClick={() => setView(item.view)}
                    className="w-full flex items-center p-3 bg-dark-surface rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <item.icon className="w-8 h-8 mr-4 text-brand-primary" />
                    <div className="text-left">
                        <p className="font-bold">{item.label}</p>
                        <p className="text-sm text-dark-text-secondary">{item.description}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};

type CreatorSubView = 'main' | 'tagging' | 'feeling' | 'checkin' | 'gif' | 'music' | 'lifeEvent';

interface PostCreatorProps {
    onClose: () => void;
    initialView: CreateView;
}

const PostCreator: React.FC<PostCreatorProps> = ({ onClose, initialView }) => {
    
    const getInitialSubView = (view: CreateView): CreatorSubView => {
        switch (view) {
            case 'tag': return 'tagging';
            case 'feeling': return 'feeling';
            case 'checkin': return 'checkin';
            case 'gif': return 'gif';
            case 'music': return 'music';
            case 'lifeEvent': return 'lifeEvent';
            default: return 'main';
        }
    };
    
    const [creatorView, setCreatorView] = useState<CreatorSubView>(getInitialSubView(initialView));
    
    const [content, setContent] = useState('');
    const [privacy, setPrivacy] = useState<PrivacySetting>('public');
    const [media, setMedia] = useState<Media[]>([]);
    const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
    const [feeling, setFeeling] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [attachedMusic, setAttachedMusic] = useState<Song | null>(null);
    const [backgroundColor, setBackgroundColor] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    
    const [friends, setFriends] = useState<User[]>([]);
    const [musicResults, setMusicResults] = useState<Song[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const currentUser: User = { id: 'user_1', name: 'Khun Hoang', username: 'khun_hoang_fit', profilePictureUrl: 'https://i.pravatar.cc/150?u=user_1', age: 29, gender: 'male', bio: '', followers: 0, following: 0 };
    
    useEffect(() => {
        if (initialView === 'photo' || initialView === 'reel') {
            photoInputRef.current?.click();
        }
    }, [initialView]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setBackgroundColor(null); 
            const newMedia = files.map((file: File) => ({
                id: `media_${Date.now()}_${Math.random()}`,
                type: file.type.startsWith('image/') ? 'image' : 'video',
                url: URL.createObjectURL(file) 
            }));
            setMedia(prev => [...prev, ...newMedia]);
        }
    };
    
    const handlePost = async () => {
        if (!content.trim() && media.length === 0 && !backgroundColor) return;
        setIsSubmitting(true);
        try {
            await createPost({
                content, media: [], privacy,
                taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
                feeling: feeling || undefined,
                location: location || undefined,
                attachedMusic: attachedMusic || undefined,
                backgroundColor: backgroundColor || undefined
            });
            onClose();
        } catch (error) {
            console.error("Failed to create post:", error);
            alert("Could not create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTaggingOpen = async () => {
        const userFriends = await getFriendsForUser(currentUser.id);
        setFriends(userFriends);
        setCreatorView('tagging');
    }

    const handleMusicSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const results = await searchMusic(searchTerm);
        setMusicResults(results);
    }
    
    const renderHeader = (title: string, onBack: () => void) => (
        <div className="flex items-center p-2 border-b border-gray-700">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-dark-surface"><ArrowLeftIcon className="w-6 h-6"/></button>
            <h3 className="text-lg font-bold text-center flex-1 -ml-10">{title}</h3>
        </div>
    );
    
    const renderSubView = () => {
        switch(creatorView) {
            case 'main': return (
              <div className="p-4 flex flex-col h-full bg-dark-card">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                      <h2 className="text-xl font-bold text-center flex-1">Create Post</h2>
                      <button onClick={onClose} className="p-2 bg-dark-surface rounded-full -ml-8"><XIcon className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="flex items-center mb-4">
                      <img src={currentUser.profilePictureUrl} alt="profile" className="w-12 h-12 rounded-full" />
                      <div className="ml-3">
                          <p className="font-bold">
                              {currentUser.name}
                              {feeling && <span className="font-normal"> is feeling {feeling}</span>}
                              {taggedUsers.length > 0 && <span className="font-normal"> with {taggedUsers.map(u => u.name).join(', ')}</span>}
                              {location && <span className="font-normal"> at {location}</span>}
                          </p>
                          <select value={privacy} onChange={(e) => setPrivacy(e.target.value as PrivacySetting)} className="bg-dark-surface rounded py-1 px-2 text-xs">
                              <option value="public">Public</option>
                              <option value="friends">Friends</option>
                              <option value="only me">Only Me</option>
                          </select>
                      </div>
                  </div>
                  
                  {backgroundColor ? (
                     <div style={{ background: backgroundColor }} className="flex-1 flex items-center justify-center -mx-4"><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`What's on your mind?`} className="w-full h-full bg-transparent text-white text-3xl font-bold text-center focus:outline-none resize-none p-4 placeholder-white/70"/></div>
                  ) : (
                    <><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`} className="w-full flex-1 bg-transparent text-lg focus:outline-none resize-none"/>{media.length > 0 && (<div className="my-2 grid grid-cols-3 gap-2">{media.map(m => <img key={m.id} src={m.url} alt="preview" className="rounded-lg object-cover w-full h-24"/>)}</div>)}</>
                  )}
        
                  {attachedMusic && (<div className="flex items-center p-2 my-2 bg-dark-surface rounded-lg"><img src={attachedMusic.albumArtUrl} alt="album art" className="w-10 h-10 rounded-md mr-3"/><div><p className="font-bold text-sm">{attachedMusic.title}</p><p className="text-xs text-dark-text-secondary">{attachedMusic.artist}</p></div></div>)}
                  
                  <div className="border-t border-b border-gray-700 my-2 py-2 flex justify-around items-center text-sm md:border md:rounded-lg">
                      <span className="hidden md:inline-block font-semibold px-4">Add to your post</span>
                      <div className="flex justify-around md:justify-end flex-1 md:flex-none md:space-x-2">
                        <button onClick={() => photoInputRef.current?.click()} className="text-green-500 p-2 rounded-full hover:bg-dark-surface"><PhotoIcon className="w-7 h-7"/></button>
                        <button onClick={handleTaggingOpen} className="text-blue-500 p-2 rounded-full hover:bg-dark-surface"><TagIcon className="w-7 h-7"/></button>
                        <button onClick={() => setCreatorView('feeling')} className="text-yellow-500 p-2 rounded-full hover:bg-dark-surface"><FaceSmileIcon className="w-7 h-7"/></button>
                        <button onClick={() => setCreatorView('checkin')} className="text-red-500 p-2 rounded-full hover:bg-dark-surface"><MapPinIcon className="w-7 h-7"/></button>
                        <button onClick={() => setCreatorView('music')} className="text-purple-500 p-2 rounded-full hover:bg-dark-surface"><MusicalNoteIcon className="w-7 h-7"/></button>
                        <EllipsisHorizontalIcon className="w-7 h-7 text-dark-text-secondary p-1 hidden md:block"/>
                      </div>
                  </div>
                  
                  <div className="md:hidden">
                      <button onClick={() => setCreatorView('feeling')} className="w-full flex items-center py-2"><FaceSmileIcon className="w-6 h-6 mr-3 text-yellow-500"/> Feeling/Activity</button>
                      <button onClick={() => setCreatorView('checkin')} className="w-full flex items-center py-2"><MapPinIcon className="w-6 h-6 mr-3 text-red-500"/> Check in</button>
                      <button onClick={() => setCreatorView('gif')} className="w-full flex items-center py-2"><GifIcon className="w-6 h-6 mr-3 text-cyan-400"/> GIF</button>
                      <button onClick={() => setCreatorView('music')} className="w-full flex items-center py-2"><MusicalNoteIcon className="w-6 h-6 mr-3 text-purple-500"/> Music</button>
                      <button onClick={() => setBackgroundColor('#6a11cb')} className="w-full flex items-center py-2"><SwatchIcon className="w-6 h-6 mr-3 text-pink-400"/> Background color</button>
                  </div>
        
                  <button onClick={handlePost} disabled={isSubmitting || (!content.trim() && media.length === 0 && !backgroundColor)} className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg mt-2 disabled:bg-blue-800 disabled:cursor-not-allowed">{isSubmitting ? 'Posting...' : 'Post'}</button>
                  <input type="file" ref={photoInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" multiple />
              </div>
            );
            case 'tagging': return (<div>{renderHeader("Tag People", () => setCreatorView('main'))}<div className="p-4 space-y-2">{friends.map(friend => (<div key={friend.id} onClick={() => { setTaggedUsers(prev => [...prev, friend]); setCreatorView('main'); }} className="flex items-center p-2 rounded-lg hover:bg-dark-surface cursor-pointer"><img src={friend.profilePictureUrl} alt={friend.name} className="w-10 h-10 rounded-full mr-3"/><span>{friend.name}</span></div>))}</div></div>);
            case 'feeling': return (<div>{renderHeader("Feeling/Activity", () => setCreatorView('main'))}<div className="p-4">{['happy 😊', 'sad 😢', 'excited 🎉', 'strong 💪'].map(f => (<button key={f} onClick={() => {setFeeling(f); setCreatorView('main');}} className="w-full text-left p-2 rounded-lg hover:bg-dark-surface">{f}</button>))}</div></div>);
            case 'checkin': return (<div>{renderHeader("Check In", () => setCreatorView('main'))}<div className="p-4"><input type="text" placeholder="Search for places" className="w-full bg-dark-surface p-2 rounded-lg mb-2"/>{['Gold\'s Gym', 'Planet Fitness', 'Central Park'].map(l => (<button key={l} onClick={() => {setLocation(l); setCreatorView('main');}} className="w-full text-left p-2 rounded-lg hover:bg-dark-surface">{l}</button>))}</div></div>);
            case 'music': return (<div>{renderHeader("Music", () => setCreatorView('main'))}<div className="p-4"><form onSubmit={handleMusicSearch} className="flex mb-4"><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search for music" className="w-full bg-dark-surface p-2 rounded-l-lg"/><button type="submit" className="bg-brand-primary p-2 rounded-r-lg">Search</button></form><div className="space-y-2">{musicResults.map(song => (<div key={song.id} onClick={() => { setAttachedMusic(song); setCreatorView('main'); }} className="flex items-center p-2 rounded-lg hover:bg-dark-surface cursor-pointer"><img src={song.albumArtUrl} alt={song.title} className="w-12 h-12 rounded-md mr-3"/><div><p className="font-bold">{song.title}</p><p className="text-sm text-dark-text-secondary">{song.artist}</p></div></div>))}</div></div></div>)
            case 'lifeEvent': return (<div>{renderHeader("Life Event", () => setCreatorView('main'))}<div className="p-4 grid grid-cols-2 gap-4">{(Object.keys({work: 'Work', education: 'Education', relationship: 'Relationship', home: 'Home'}) as LifeEventType[]).map(le => (<button key={le} onClick={() => { setContent(`Exciting life event: ${le}! 🎉`); setCreatorView('main');}} className="p-4 bg-dark-surface rounded-lg hover:bg-gray-700">{le === 'work' && <BriefcaseIcon className="w-8 h-8 mx-auto mb-2"/>}{le === 'education' && <AcademicCapIcon className="w-8 h-8 mx-auto mb-2"/>}{le === 'relationship' && <HeartIcon className="w-8 h-8 mx-auto mb-2"/>}{le === 'home' && <HomeIcon className="w-8 h-8 mx-auto mb-2"/>}{le.charAt(0).toUpperCase() + le.slice(1)}</button>))}</div></div>);
            default: return null;
        }
    }
    
    return (
        <div className="bg-dark-card text-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-lg overflow-y-auto">
            {renderSubView()}
        </div>
    );
};

// --- MAIN CREATE SCREEN COMPONENT ---

interface CreateScreenProps {
  initialView: CreateView;
  onClose: () => void;
}

const CreateScreen: React.FC<CreateScreenProps> = ({ initialView, onClose }) => {
  const [view, setView] = useState<CreateView>(initialView);

  const renderContent = () => {
    switch(view) {
      case 'menu':
        return <CreateMenu setView={setView} />;
      case 'post':
      case 'photo':
      case 'reel':
      case 'feeling':
      case 'tag':
      case 'checkin':
      case 'gif':
      case 'lifeEvent':
      case 'music':
        return <PostCreator onClose={onClose} initialView={view} />;
      case 'workout':
        return <WorkoutPlanEditor plan={null} onClose={onClose} />;
      case 'nutrition':
        return <NutritionPlanEditor plan={null} onClose={onClose} />;
      case 'live':
        return <LiveVideoCreator onClose={onClose} />;
      case 'story':
        return <StoryCreator onClose={onClose} />;
      default:
        return <CreateMenu setView={setView} />;
    }
  };

  const isFullScreen = ['workout', 'nutrition', 'live', 'story'].includes(view);
  const isPostCreator = !isFullScreen && view !== 'menu';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-0 md:p-4">
        {isPostCreator ? (
            <PostCreator onClose={onClose} initialView={view}/>
        ) : (
            <div className={`bg-dark-card text-white w-full ${isFullScreen ? 'h-full' : 'fixed bottom-0 md:relative md:bottom-auto rounded-t-lg md:rounded-lg md:max-w-lg'}`}>
                {isFullScreen ? (
                    renderContent()
                ) : (
                     <div className="p-4">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                            <h2 className="text-xl font-bold text-center flex-1">Create</h2>
                            <button onClick={onClose} className="p-2 bg-dark-surface rounded-full -mr-2"><XIcon className="w-5 h-5"/></button>
                        </div>
                        {renderContent()}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default CreateScreen;