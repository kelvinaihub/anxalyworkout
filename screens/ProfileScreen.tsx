import React, { useState, useEffect, useCallback } from 'react';
import { User, CreateView, SocialPost, Media, Comment, Tab } from '../types.ts';
import { getUserProfile, getPostsForUser, getFriendsForUser, getPhotosForUser, toggleLikePost, addCommentToPost, createPost, getSuggestedFriends } from '../services/firebaseService.ts';
import { HandThumbUpIcon, ChatBubbleOvalLeftIcon, ShareIcon, PhotoIcon, UserGroupIcon, VideoCameraIcon, EllipsisHorizontalIcon, PaperAirplaneIcon, InformationCircleIcon, PencilSquareIcon, ChartBarIcon, ChevronRightIcon, XIcon, HomeIcon, UserIcon, CalendarIcon } from '../components/Icons.tsx';

// Helper for fallback images
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackType: 'user' | 'post' = 'post') => {
    e.currentTarget.onerror = null; // Prevent infinite loop
    if (fallbackType === 'user') {
        e.currentTarget.src = 'https://placehold.co/150x150/1e1e1e/ffffff?text=User';
    } else {
        e.currentTarget.src = 'https://placehold.co/600x400/1e1e1e/ffffff?text=Image+Error';
    }
};

// --- POST CARD SUB-COMPONENTS ---

const PostHeader: React.FC<{ post: SocialPost; onViewProfile: (userId: string) => void; }> = ({ post, onViewProfile }) => (
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
);

const PostFooter: React.FC<{ isLiked: boolean; likeCount: number; commentCount: number; onLikeClick: () => void; onCommentClick: () => void; onShareClick: () => void; }> = ({ isLiked, likeCount, commentCount, onLikeClick, onCommentClick, onShareClick }) => (
    <div className="flex justify-around p-2 border-t border-gray-700 text-dark-text-secondary">
        <button onClick={onLikeClick} className={`flex items-center space-x-2 hover:text-white ${isLiked ? 'text-brand-primary' : ''}`}><HandThumbUpIcon className="w-5 h-5"/> <span>{likeCount} Like</span></button>
        <button onClick={onCommentClick} className="flex items-center space-x-2 hover:text-white"><ChatBubbleOvalLeftIcon className="w-5 h-5"/> <span>{commentCount} Comment</span></button>
        <button onClick={onShareClick} className="flex items-center space-x-2 hover:text-white"><ShareIcon className="w-5 h-5"/> <span>Share</span></button>
    </div>
);

const CommentSection: React.FC<{
    comments: Comment[];
    newComment: string;
    tagSuggestions: User[];
    onViewProfile: (userId: string) => void;
    onCommentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCommentSubmit: (e: React.FormEvent) => void;
    onTagSelect: (user: User) => void;
}> = ({ comments, newComment, tagSuggestions, onViewProfile, onCommentChange, onCommentSubmit, onTagSelect }) => {
    const renderCommentContent = (comment: Comment) => {
        const parts = comment.content.split(/(@[\w\s]+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                const name = part.substring(1).trim();
                const taggedUser = comment.taggedUsers?.find(u => u.name === name);
                if (taggedUser) {
                    return <strong key={index} className="text-brand-primary cursor-pointer" onClick={() => onViewProfile(taggedUser.id)}>{part}</strong>;
                }
            }
            return part;
        });
    };

    return (
        <div className="p-3 border-t border-gray-700">
            <div className="space-y-3 max-h-48 overflow-y-auto mb-3">{comments.map(comment => (<div key={comment.id} className="flex items-start space-x-2"><img src={comment.author.profilePictureUrl} alt={comment.author.name} onError={(e) => handleImageError(e, 'user')} className="w-8 h-8 rounded-full cursor-pointer" onClick={() => onViewProfile(comment.author.id)} /><div className="bg-dark-surface rounded-xl p-2 text-sm"><p className="font-bold cursor-pointer" onClick={() => onViewProfile(comment.author.id)}>{comment.author.name}</p><p>{renderCommentContent(comment)}</p></div></div>))}</div>
            <div className="relative">
                {tagSuggestions.length > 0 && (<div className="absolute bottom-full left-0 w-full bg-dark-card border border-gray-600 rounded-lg mb-1 z-10 max-h-32 overflow-y-auto">{tagSuggestions.map(user => (<div key={user.id} onClick={() => onTagSelect(user)} className="p-2 hover:bg-dark-surface cursor-pointer flex items-center"><img src={user.profilePictureUrl} alt={user.name} onError={(e) => handleImageError(e, 'user')} className="w-6 h-6 rounded-full mr-2" /><span>{user.name}</span></div>))}</div>)}
                <form onSubmit={onCommentSubmit} className="flex items-center space-x-2"><input type="text" value={newComment} onChange={onCommentChange} placeholder="Write a comment..." className="flex-1 bg-dark-surface rounded-full py-2 px-3 text-sm focus:outline-none" /><button type="submit" className="text-brand-primary p-1"><PaperAirplaneIcon className="w-6 h-6"/></button></form>
            </div>
        </div>
    );
};

// --- PROFILE SCREEN SUB-COMPONENTS ---

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
        const originalLiked = isLiked;
        const originalCount = likeCount;
        setIsLiked(!originalLiked);
        setLikeCount(originalLiked ? originalCount - 1 : originalCount + 1);
        try { await toggleLikePost(post.id, currentUserId); } catch (error) { console.error("Failed to like post", error); setIsLiked(originalLiked); setLikeCount(originalCount); }
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewComment(value);
        const tagQueryMatch = value.match(/@(\w+)$/);
        if (tagQueryMatch) {
            const query = tagQueryMatch[1].toLowerCase();
            setTagSuggestions(friends.filter(f => f.name.toLowerCase().includes(query) || f.username.toLowerCase().includes(query)));
        } else { setTagSuggestions([]); }
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
        try { const savedComment = await addCommentToPost(post.id, commentToSubmit, currentUserId, tagsToSubmit); setComments(prev => [...prev, savedComment]); } catch (error) { console.error("Failed to post comment", error); }
    };

    const handleShare = async () => {
        if (window.confirm("Share this post to your feed?")) {
            try { await createPost({ content: `Shared from @${post.author.username}`, media: [], privacy: 'public', sharedPost: post }); alert("Post shared successfully!"); onPostShared(); } catch (error) { console.error("Failed to share post", error); alert("Could not share post."); }
        }
    };
    
    return (
        <div className="bg-dark-card rounded-lg mb-4 shadow">
            <PostHeader post={post} onViewProfile={onViewProfile} />
            {post.content && <p className="px-3 pb-3 break-words">{post.content}</p>}
            {post.sharedPost && <div className="m-3 border border-gray-700 rounded-lg"><PostHeader post={post.sharedPost} onViewProfile={onViewProfile} /><p className="px-2 pb-2 text-sm">{post.sharedPost.content}</p>{post.sharedPost.media && post.sharedPost.media.length > 0 && <img src={post.sharedPost.media[0].url} alt="shared post media" onError={(e) => handleImageError(e, 'post')} className="w-full" />}</div>}
            {post.media && post.media.length > 0 && <img src={post.media[0].url} alt="post media" onError={(e) => handleImageError(e, 'post')} className="w-full" />}
            {post.attachedMusic && (<div className="flex items-center p-3 m-3 bg-dark-surface rounded-lg"><img src={post.attachedMusic.albumArtUrl} alt="album art" onError={(e) => handleImageError(e, 'post')} className="w-16 h-16 rounded-md mr-4"/><div><p className="font-bold">{post.attachedMusic.title}</p><p className="text-sm text-dark-text-secondary">{post.attachedMusic.artist}</p></div></div>)}
            <PostFooter isLiked={isLiked} likeCount={likeCount} commentCount={comments.length} onLikeClick={handleLikeClick} onCommentClick={() => setShowComments(!showComments)} onShareClick={handleShare} />
            {showComments && <CommentSection comments={comments} newComment={newComment} tagSuggestions={tagSuggestions} onViewProfile={onViewProfile} onCommentChange={handleCommentChange} onCommentSubmit={handleCommentSubmit} onTagSelect={handleTagSelect} />}
        </div>
    );
};

const CreatePostPrompt: React.FC<{ user: User; onOpenCreateModal: (view: CreateView) => void; }> = ({ user, onOpenCreateModal }) => (
    <div className="p-4 bg-dark-card rounded-lg shadow">
        <div className="flex items-center space-x-3"><img src={user.profilePictureUrl} alt={user.name} onError={(e) => handleImageError(e, 'user')} className="w-10 h-10 rounded-full" /><button onClick={() => onOpenCreateModal('post')} className="flex-1 text-left bg-dark-surface rounded-full py-2 px-4 text-dark-text-secondary hover:bg-gray-600">What's on your mind?</button></div>
        <div className="flex justify-around mt-4 pt-3 border-t border-gray-700"><button onClick={() => onOpenCreateModal('live')} className="flex items-center space-x-2 text-red-500 hover:bg-dark-surface p-2 rounded-md"><VideoCameraIcon className="w-6 h-6"/><span>Live video</span></button><button onClick={() => onOpenCreateModal('photo')} className="flex items-center space-x-2 text-green-500 hover:bg-dark-surface p-2 rounded-md"><PhotoIcon className="w-6 h-6"/><span>Photo/video</span></button><button onClick={() => onOpenCreateModal('reel')} className="flex items-center space-x-2 text-purple-500 hover:bg-dark-surface p-2 rounded-md"><EllipsisHorizontalIcon className="w-6 h-6"/><span>Reel</span></button></div>
    </div>
);

const ProfileHeader: React.FC<{ user: User; isCurrentUser: boolean; onOpenChat: (user: User) => void; activeTab: 'posts' | 'about' | 'friends' | 'photos'; setActiveTab: (tab: 'posts' | 'about' | 'friends' | 'photos') => void; }> = ({ user, isCurrentUser, onOpenChat, activeTab, setActiveTab }) => (
    <div className="bg-dark-card shadow-md">
        <div className="relative h-48 md:h-80 bg-dark-surface"><img src={user.coverPhotoUrl} alt="Cover" onError={(e) => handleImageError(e, 'post')} className="w-full h-full object-cover"/></div>
        <div className="px-4">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20">
                <img src={user.profilePictureUrl} alt={user.name} onError={(e) => handleImageError(e, 'user')} className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-dark-card bg-dark-card"/>
                <div className="md:ml-4 mt-2 md:mt-0 text-center md:text-left flex-1"><h1 className="text-3xl font-bold">{user.name}</h1><p className="text-dark-text-secondary">{user.followers} followers · {user.following} following</p></div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                    {isCurrentUser ? (<><button onClick={() => alert('Professional Dashboard coming soon!')} className="bg-brand-primary py-2 px-4 rounded-lg font-semibold flex items-center justify-center"><ChartBarIcon className="w-5 h-5 mr-2"/> Professional Dashboard</button><button onClick={() => alert('Edit Profile coming soon!')} className="bg-dark-surface py-2 px-4 rounded-lg font-semibold flex items-center justify-center"><PencilSquareIcon className="w-5 h-5 mr-2"/> Edit</button></>) : (<><button onClick={() => alert('Add Friend coming soon!')} className="bg-brand-primary py-2 px-4 rounded-lg font-semibold">Add Friend</button><button onClick={() => onOpenChat(user)} className="bg-dark-surface py-2 px-4 rounded-lg font-semibold">Message</button></>)}
                </div>
            </div>
            <div className="border-t border-gray-700 mt-4 flex items-center">{(['posts', 'about', 'friends', 'photos'] as const).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 px-4 text-sm font-semibold transition-colors ${activeTab === tab ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-dark-text-secondary hover:bg-dark-surface rounded-md'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>))}</div>
        </div>
    </div>
);

const PeopleYouMayKnow: React.FC<{ suggestedFriends: User[]; onViewProfile: (userId: string) => void; }> = ({ suggestedFriends, onViewProfile }) => (
    <div className="bg-dark-card rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-2"><h3 className="font-bold">People you may know</h3><a href="#" onClick={(e) => { e.preventDefault(); alert('Coming soon!');}} className="text-sm text-brand-primary">See all</a></div>
        <div className="flex overflow-x-auto space-x-3 pb-2 -mx-4 px-4">{suggestedFriends.map(p => (<div key={p.id} className="border border-gray-700 rounded-lg w-36 flex-shrink-0 text-center"><img src={p.profilePictureUrl} onError={(e) => handleImageError(e, 'user')} className="w-full h-36 object-cover rounded-t-lg cursor-pointer" onClick={() => onViewProfile(p.id)} /><div className="p-2"><p className="font-semibold text-sm truncate cursor-pointer" onClick={() => onViewProfile(p.id)}>{p.name}</p><button onClick={() => alert('Coming soon!')} className="w-full bg-brand-primary/20 text-brand-primary text-sm font-semibold py-1.5 mt-2 rounded-md hover:bg-brand-primary/30">Add friend</button></div></div>))}</div>
    </div>
);

const IntroCard: React.FC<{ user: User | null }> = ({ user }) => (
    <div className="bg-dark-card rounded-lg shadow p-4">
        <h3 className="font-bold text-xl mb-2">Intro</h3><p className="text-center text-sm mb-4">{user?.bio}</p><button onClick={() => alert('Coming soon!')} className="w-full bg-dark-surface py-2 rounded-lg font-semibold text-sm hover:bg-gray-600">Edit details</button>
    </div>
);

const PhotosPreviewCard: React.FC<{ photos: Media[]; setActiveTab: (tab: 'photos') => void; }> = ({ photos, setActiveTab }) => (
    <div className="bg-dark-card rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-xl">Photos</h3><button onClick={() => setActiveTab('photos')} className="text-sm text-brand-primary">See all photos</button></div>
        <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">{photos.slice(0, 9).map(p => <img key={p.id} src={p.url} onError={(e) => handleImageError(e, 'post')} className="w-full aspect-square object-cover" />)}</div>
    </div>
);

const FriendsPreviewCard: React.FC<{ friends: User[]; onViewProfile: (userId: string) => void; setActiveTab: (tab: 'friends') => void; }> = ({ friends, onViewProfile, setActiveTab }) => (
     <div className="bg-dark-card rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-xl">Friends</h3><button onClick={() => setActiveTab('friends')} className="text-sm text-brand-primary">See all friends</button></div>
        <p className="text-sm text-dark-text-secondary -mt-2 mb-2">{friends.length} friends</p>
        <div className="grid grid-cols-3 gap-2">{friends.slice(0, 6).map(f => (<div key={f.id} onClick={() => onViewProfile(f.id)} className="cursor-pointer"><img src={f.profilePictureUrl} onError={(e) => handleImageError(e, 'user')} className="w-full aspect-square object-cover rounded-lg" /><p className="text-xs font-semibold mt-1 truncate">{f.name}</p></div>))}</div>
    </div>
);

const FullWidthCard: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="max-w-screen-xl mx-auto p-4"><div className="bg-dark-card rounded-lg shadow p-4"><h3 className="font-bold text-xl mb-4">{title}</h3>{children}</div></div>
);

// --- MAIN PROFILE SCREEN COMPONENT ---

interface ProfileScreenProps { userId: string; currentUserId: string; onViewProfile: (userId: string) => void; onOpenChat: (user: User) => void; onOpenCreateModal: (view: CreateView) => void; onTabChange: (tab: Tab) => void; }

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userId, currentUserId, onViewProfile, onOpenChat, onOpenCreateModal, onTabChange }) => {
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [photos, setPhotos] = useState<Media[]>([]);
    const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);
    const [loading, setLoading] = useState({ user: true, content: true });
    const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'friends' | 'photos'>('posts');
    const isCurrentUser = userId === currentUserId;

    const loadContent = useCallback(async () => {
        setLoading(prev => ({ ...prev, content: true }));
        try {
            const [fetchedPosts, fetchedFriends, fetchedPhotos, fetchedSuggestions] = await Promise.all([ getPostsForUser(userId), getFriendsForUser(userId), getPhotosForUser(userId), getSuggestedFriends(currentUserId) ]);
            setPosts(fetchedPosts); setFriends(fetchedFriends); setPhotos(fetchedPhotos); setSuggestedFriends(fetchedSuggestions);
        } catch (error) { console.error("Failed to load profile content:", error); } finally { setLoading(prev => ({ ...prev, content: false })); }
    }, [userId, currentUserId]);

    useEffect(() => {
        const loadInitialProfile = async () => {
            setLoading({ user: true, content: true });
            setActiveTab('posts');
            try { const fetchedUser = await getUserProfile(userId); setUser(fetchedUser); } catch (error) { console.error("Failed to load user profile:", error); } finally { setLoading(prev => ({ ...prev, user: false })); }
        };
        loadInitialProfile();
    }, [userId]);

    useEffect(() => { if (!user) return; loadContent(); }, [user, loadContent]);

    const renderContent = () => {
        if (loading.content) { return <div className="p-4 text-center">Loading content...</div>; }

        if (activeTab === 'posts') {
            return (
                <div className="max-w-screen-xl mx-auto p-0 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-5 space-y-4 px-4 sm:px-0">
                       <IntroCard user={user} />
                       <PhotosPreviewCard photos={photos} setActiveTab={setActiveTab} />
                       <FriendsPreviewCard friends={friends} onViewProfile={onViewProfile} setActiveTab={setActiveTab} />
                    </div>
                    <div className="lg:col-span-7 space-y-4 px-4 sm:px-0">
                        {isCurrentUser && user && <CreatePostPrompt user={user} onOpenCreateModal={onOpenCreateModal} />}
                        {posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} onViewProfile={onViewProfile} currentUserId={currentUserId} onPostShared={loadContent} />) : <p className="text-center text-dark-text-secondary mt-8 bg-dark-card p-8 rounded-lg">No posts yet.</p>}
                    </div>
                </div>
            );
        }
        if (activeTab === 'about') {
            return (<FullWidthCard title="About"><div className="space-y-6 text-dark-text max-w-md"><div className="flex items-center"><UserIcon className="w-6 h-6 mr-4 text-dark-text-secondary" /><div><p className="font-bold">Username</p><p className="text-dark-text-secondary">@{user!.username}</p></div></div><div className="flex items-start"><InformationCircleIcon className="w-6 h-6 mr-4 text-dark-text-secondary mt-1" /><div><p className="font-bold">Bio</p><p className="text-dark-text-secondary">{user!.bio}</p></div></div><div className="flex items-center"><CalendarIcon className="w-6 h-6 mr-4 text-dark-text-secondary" /><div><p className="font-bold">Age</p><p className="text-dark-text-secondary">{user!.age}</p></div></div><div className="flex items-center"><UserIcon className="w-6 h-6 mr-4 text-dark-text-secondary" /><div><p className="font-bold">Gender</p><p className="text-dark-text-secondary">{user!.gender.charAt(0).toUpperCase() + user!.gender.slice(1)}</p></div></div></div></FullWidthCard>);
        }
        if (activeTab === 'friends') return <FullWidthCard title={`Friends (${friends.length})`}><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">{friends.map(f => (<div key={f.id} onClick={() => onViewProfile(f.id)} className="cursor-pointer text-center"><img src={f.profilePictureUrl} onError={(e) => handleImageError(e, 'user')} className="w-full aspect-square object-cover rounded-lg" /><p className="text-sm font-semibold mt-1 truncate">{f.name}</p></div>))}</div></FullWidthCard>;
        if (activeTab === 'photos') return <FullWidthCard title={`Photos (${photos.length})`}><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">{photos.map(p => <img key={p.id} src={p.url} onError={(e) => handleImageError(e, 'post')} className="w-full aspect-square object-cover rounded-lg" />)}</div></FullWidthCard>;
    };

    if (loading.user) return <div className="flex justify-center items-center h-screen"><p>Loading profile...</p></div>;
    if (!user) return <div className="flex justify-center items-center h-screen"><p>User not found.</p></div>;

    return (
        <div className="bg-dark-bg min-h-screen pb-16 md:pb-0">
            <button onClick={() => onTabChange(Tab.Feed)} className="fixed top-4 left-4 z-40 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 hidden md:block"><HomeIcon className="w-7 h-7"/></button>
            <ProfileHeader user={user} isCurrentUser={isCurrentUser} onOpenChat={onOpenChat} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="max-w-screen-xl mx-auto p-0 sm:p-4"><PeopleYouMayKnow suggestedFriends={suggestedFriends} onViewProfile={onViewProfile} /></div>
            {renderContent()}
        </div>
    );
};

export default ProfileScreen;