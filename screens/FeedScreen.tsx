import React, { useState, useEffect } from 'react';
import { SocialPost, User, Comment, Story, CreateView, Tab } from '../types.ts';
import { getFeedPosts, toggleLikePost, addCommentToPost, createPost, getFriendsForUser, getStories, getUserProfile } from '../services/firebaseService.ts';
import { 
    HandThumbUpIcon, ChatBubbleOvalLeftIcon, ShareIcon, VideoCameraIcon, 
    PhotoIcon, UserGroupIcon, PlayCircleIcon, BuildingStorefrontIcon, 
    FlameIcon, FaceSmileIcon, UserIcon, PaperAirplaneIcon
} from '../components/Icons.tsx';

// Helper for fallback images
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackType: 'user' | 'post' = 'post') => {
    e.currentTarget.onerror = null; // Prevent infinite loop
    if (fallbackType === 'user') {
        e.currentTarget.src = 'https://placehold.co/150x150/1e1e1e/ffffff?text=User';
    } else {
        e.currentTarget.src = 'https://placehold.co/600x400/1e1e1e/ffffff?text=Image+Error';
    }
};

// --- SUB-COMPONENTS (Moved to top-level to fix Hook errors) ---

const LeftSidebar: React.FC<{
  user: User | null;
  onViewProfile: (userId: string) => void;
  onTabChange: (tab: Tab) => void;
}> = ({ user, onViewProfile, onTabChange }) => {
    if (!user) return null;
    const items = [
        { icon: UserIcon, label: user.name, action: () => onViewProfile(user.id), profile: true },
        { icon: UserGroupIcon, label: 'Friends', action: () => onTabChange(Tab.Friends) },
        { icon: FlameIcon, label: 'Feeds', action: () => onTabChange(Tab.Feed) },
        { icon: PlayCircleIcon, label: 'Videos', action: () => onTabChange(Tab.Videos) },
        { icon: BuildingStorefrontIcon, label: 'Marketplace', action: () => onTabChange(Tab.Marketplace) },
    ];
    return (
        <div className="p-2 space-y-2">
            {items.map(item => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-dark-surface transition-colors">
                    {item.profile && user.profilePictureUrl ? 
                        <img src={user.profilePictureUrl} onError={(e) => handleImageError(e, 'user')} className="w-7 h-7 rounded-full" alt={user.name} /> 
                        : <item.icon className="w-7 h-7 text-brand-primary" />
                    }
                    <span className="font-semibold">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

const Stories: React.FC<{ stories: Story[]; onViewStory: (stories: Story[], startIndex: number) => void; onCreateStory: () => void; }> = ({ stories, onViewStory, onCreateStory }) => (
    <div className="relative mb-4">
        <div className="flex space-x-2 overflow-x-auto p-2 pb-3 scrollbar-hide">
            {stories.map((story, index) => (
                <div key={story.id} onClick={story.id === 'story_create' ? onCreateStory : () => onViewStory(stories, index)} className="flex-shrink-0 w-28 h-48 rounded-lg shadow-md overflow-hidden relative group cursor-pointer">
                    <img src={story.imageUrl} alt={story.user.name} onError={(e) => handleImageError(e, 'post')} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    {story.id === 'story_create' ? (
                        <div className="absolute bottom-0 w-full text-center pb-2">
                            <div className="relative w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center mx-auto border-4 border-dark-card -mb-5">
                                <span className="text-2xl font-light text-white">+</span>
                            </div>
                            <p className="absolute bottom-2 w-full text-white text-xs font-semibold">Create story</p>
                        </div>
                    ) : (
                         <>
                            <img src={story.user.profilePictureUrl} alt={story.user.name} onError={(e) => handleImageError(e, 'user')} className="w-9 h-9 rounded-full absolute top-2 left-2 border-2 border-brand-primary" />
                            <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate">{story.user.name}</p>
                         </>
                    )}
                </div>
            ))}
        </div>
    </div>
);

const CreatePostPrompt: React.FC<{ user: User | null; onOpenCreateModal: (view: CreateView) => void; }> = ({ user, onOpenCreateModal }) => {
    if (!user) return null;
    return (
        <div className="p-3 bg-dark-card rounded-lg shadow mb-4">
            <div className="flex items-center space-x-3">
                <img src={user.profilePictureUrl} alt={user.name} onError={(e) => handleImageError(e, 'user')} className="w-10 h-10 rounded-full" />
                <button onClick={() => onOpenCreateModal('post')} className="flex-1 text-left bg-dark-surface rounded-full py-2.5 px-4 text-dark-text-secondary hover:bg-gray-600">
                    What's on your mind, {user.name.split(' ')[0]}?
                </button>
            </div>
            <div className="flex justify-around mt-3 pt-2 border-t border-gray-700/50">
                <button onClick={() => onOpenCreateModal('live')} className="flex-1 flex items-center justify-center space-x-2 text-dark-text-secondary hover:bg-dark-surface p-2 rounded-md transition-colors"><VideoCameraIcon className="w-6 h-6 text-red-500"/><span>Live video</span></button>
                <button onClick={() => onOpenCreateModal('photo')} className="flex-1 flex items-center justify-center space-x-2 text-dark-text-secondary hover:bg-dark-surface p-2 rounded-md transition-colors"><PhotoIcon className="w-6 h-6 text-green-500"/><span>Photo/video</span></button>
                <button onClick={() => onOpenCreateModal('feeling')} className="flex-1 hidden md:flex items-center justify-center space-x-2 text-dark-text-secondary hover:bg-dark-surface p-2 rounded-md transition-colors"><FaceSmileIcon className="w-6 h-6 text-yellow-500"/><span>Feeling/activity</span></button>
            </div>
        </div>
    );
};

const RightSidebar: React.FC<{ contacts: User[], onOpenChat: (user: User) => void; }> = ({ contacts, onOpenChat }) => (
    <div className="p-2">
        <h3 className="font-semibold text-dark-text-secondary mb-2 px-2">Contacts</h3>
        <div className="space-y-2">
            {contacts.map(contact => (
                <button key={contact.id} onClick={() => onOpenChat(contact)} className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-dark-surface transition-colors">
                    <div className="relative">
                        <img src={contact.profilePictureUrl} onError={(e) => handleImageError(e, 'user')} className="w-7 h-7 rounded-full" alt={contact.name}/>
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-dark-card"></div>
                    </div>
                    <span className="font-semibold text-sm">{contact.name}</span>
                </button>
            ))}
        </div>
    </div>
);

const PostCard: React.FC<{ post: SocialPost; onViewProfile: (userId: string) => void; currentUserId: string; onPostShared: () => void; }> = ({ post, onViewProfile, onPostShared, currentUserId }) => {
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUserId));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [newComment, setNewComment] = useState('');
  const [taggedInNewComment, setTaggedInNewComment] = useState<User[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);

  useEffect(() => { getFriendsForUser(currentUserId).then(setFriends); }, [currentUserId]);
  
  const handleLikeClick = async () => {
    setIsLiked(prev => !prev);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    try { await toggleLikePost(post.id, currentUserId); } catch (error) {
      console.error("Failed to like post", error);
      setIsLiked(prev => !prev);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);
    const tagQueryMatch = value.match(/@(\w+)$/);
    if (tagQueryMatch) {
      const query = tagQueryMatch[1].toLowerCase();
      setTagSuggestions(friends.filter(f => f.name.toLowerCase().includes(query)));
    } else {
      setTagSuggestions([]);
    }
  };

  const handleTagSelect = (user: User) => {
    setNewComment(prev => prev.replace(/@\w+$/, `@${user.name} `));
    setTaggedInNewComment(prev => [...prev, user]);
    setTagSuggestions([]);
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const commentToSubmit = newComment; const tagsToSubmit = taggedInNewComment;
    setNewComment(''); setTaggedInNewComment([]);
    try {
      const savedComment = await addCommentToPost(post.id, commentToSubmit, currentUserId, tagsToSubmit);
      setComments(prev => [...prev, savedComment]);
    } catch (error) { console.error("Failed to post comment", error); }
  };
  
  const handleShare = async () => {
    if (window.confirm("Share this post to your feed?")) {
      try {
        await createPost({ content: `Shared from @${post.author.username}`, media: [], privacy: 'public', sharedPost: post });
        alert("Post shared successfully!");
        onPostShared();
      } catch (error) {
        console.error("Failed to share post", error);
        alert("Could not share post.");
      }
    }
  };

    const renderCommentContent = (comment: Comment) => {
        const parts = comment.content.split(/(@[\w_]+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                const username = part.substring(1);
                const taggedUser = comment.taggedUsers?.find(u => u.name === username);
                if (taggedUser) { return <strong key={index} className="text-brand-primary cursor-pointer" onClick={() => onViewProfile(taggedUser.id)}>{part}</strong>; }
            }
            return part;
        });
    };

  return (
    <div className="bg-dark-card rounded-lg mb-4">
        <div className="flex items-center p-3">
            <img src={post.author.profilePictureUrl} alt={post.author.name} onError={(e) => handleImageError(e, 'user')} className="w-10 h-10 rounded-full cursor-pointer" onClick={() => onViewProfile(post.author.id)} />
            <div className="ml-3">
                <p className="font-bold">
                    <span className="cursor-pointer" onClick={() => onViewProfile(post.author.id)}>{post.author.name}</span>
                    {post.feeling && <span className="font-normal"> is feeling {post.feeling}</span>}
                    {post.taggedUsers && post.taggedUsers.length > 0 &&
                        <span className="font-normal"> with {post.taggedUsers.map((user, index) => (
                            <React.Fragment key={user.id}>
                                {index > 0 && ', '}
                                <span className="text-brand-primary font-semibold cursor-pointer" onClick={() => onViewProfile(user.id)}>{user.name}</span>
                            </React.Fragment>
                        ))}
                        </span>
                    }
                    {post.location && <span className="font-normal"> at {post.location}</span>}
                </p>
                <p className="text-xs text-dark-text-secondary">{new Date(post.timestamp).toLocaleString()}</p>
            </div>
        </div>
        {post.content && <p className="px-3 pb-3 break-words">{post.content}</p>}
        {post.media?.length > 0 && <img src={post.media[0].url} alt="post media" onError={(e) => handleImageError(e, 'post')} className="w-full" />}
        <div className="flex justify-around p-2 border-t border-gray-700 text-dark-text-secondary">
            <button onClick={handleLikeClick} className={`flex items-center space-x-2 hover:text-white ${isLiked ? 'text-brand-primary' : ''}`}><HandThumbUpIcon className="w-5 h-5"/> <span>{likeCount} Like</span></button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 hover:text-white"><ChatBubbleOvalLeftIcon className="w-5 h-5"/> <span>{comments.length} Comment</span></button>
            <button onClick={handleShare} className="flex items-center space-x-2 hover:text-white"><ShareIcon className="w-5 h-5"/> <span>Share</span></button>
        </div>
        {showComments && (
            <div className="p-3 border-t border-gray-700">
                 <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-2">
                            <img src={comment.author.profilePictureUrl} alt={comment.author.name} onError={(e) => handleImageError(e, 'user')} className="w-8 h-8 rounded-full cursor-pointer" onClick={() => onViewProfile(comment.author.id)} />
                            <div className="bg-dark-surface rounded-xl p-2 text-sm">
                                <p className="font-bold cursor-pointer" onClick={() => onViewProfile(comment.author.id)}>{comment.author.name}</p>
                                <p>{renderCommentContent(comment)}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="relative">
                {tagSuggestions.length > 0 && (<div className="absolute bottom-full left-0 w-full bg-dark-card border border-gray-600 rounded-lg mb-1 z-10 max-h-32 overflow-y-auto">{tagSuggestions.map(user => (<div key={user.id} onClick={() => handleTagSelect(user)} className="p-2 hover:bg-dark-surface cursor-pointer flex items-center"><img src={user.profilePictureUrl} alt={user.name} onError={(e) => handleImageError(e, 'user')} className="w-6 h-6 rounded-full mr-2" /><span>{user.name}</span></div>))}</div>)}
                <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2"><input type="text" value={newComment} onChange={handleCommentChange} placeholder="Write a comment..." className="flex-1 bg-dark-surface rounded-full py-2 px-3 text-sm focus:outline-none" /><button type="submit" className="text-brand-primary p-1"><PaperAirplaneIcon className="w-6 h-6"/></button></form>
            </div>
            </div>
        )}
    </div>
  );
};


// --- MAIN FEED SCREEN COMPONENT ---

interface FeedScreenProps {
  onViewProfile: (userId: string) => void;
  currentUserId: string;
  onOpenCreateModal: (view: CreateView) => void;
  onOpenChat: (user: User) => void;
  onViewStory: (stories: Story[], startIndex: number) => void;
  onTabChange: (tab: Tab) => void;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ onViewProfile, currentUserId, onOpenCreateModal, onOpenChat, onViewStory, onTabChange }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPosts, fetchedStories, user, userFriends] = await Promise.all([ getFeedPosts(), getStories(), getUserProfile(currentUserId), getFriendsForUser(currentUserId) ]);
      setPosts(fetchedPosts);
      setStories(fetchedStories);
      setCurrentUser(user);
      setFriends(userFriends);
    } catch (error) { console.error("Failed to load feed data:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [currentUserId]);

  return (
    <div className="bg-dark-bg min-h-screen md:pt-4 pb-16 md:pb-0">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-9 gap-6">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-2">
            <LeftSidebar user={currentUser} onViewProfile={onViewProfile} onTabChange={onTabChange} />
        </aside>

        {/* Center Content */}
        <div className="col-span-1 lg:col-span-5 px-2 md:px-0">
            <Stories stories={stories} onViewStory={onViewStory} onCreateStory={() => onOpenCreateModal('story')} />
            <CreatePostPrompt user={currentUser} onOpenCreateModal={onOpenCreateModal} />
            {loading ? ( <p className="text-center mt-8">Loading feed...</p> ) : (
                posts.map(post => <PostCard key={post.id} post={post} onViewProfile={onViewProfile} currentUserId={currentUserId} onPostShared={loadData} />)
            )}
        </div>

        {/* Right Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-2">
            <RightSidebar contacts={friends} onOpenChat={onOpenChat} />
        </aside>
      </div>
    </div>
  );
};

export default FeedScreen;