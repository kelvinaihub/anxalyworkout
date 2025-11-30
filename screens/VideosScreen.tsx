import React, { useState, useEffect } from 'react';
import { getFeedPosts } from '../services/firebaseService.ts';
import { SocialPost } from '../types.ts';
import { PlayIcon, XIcon } from '../components/Icons.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackType: 'user' | 'post' = 'post') => {
    e.currentTarget.onerror = null;
    if (fallbackType === 'user') {
        e.currentTarget.src = 'https://placehold.co/150x150/1e1e1e/ffffff?text=User';
    } else {
        e.currentTarget.src = 'https://placehold.co/600x400/1e1e1e/ffffff?text=Image+Error';
    }
};

const VideoPlayerModal: React.FC<{ post: SocialPost, onClose: () => void, onViewProfile: (userId: string) => void }> = ({ post, onClose, onViewProfile }) => {
    if (!post.media[0] || post.media[0].type !== 'video') return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full max-w-screen-sm h-full" onClick={(e) => e.stopPropagation()}>
                <video src={post.media[0].url} controls autoPlay className="w-full h-full object-contain" />
                <div className="absolute bottom-4 left-4 text-white bg-black/50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onViewProfile(post.author.id)}>
                        <img src={post.author.profilePictureUrl} alt={post.author.name} onError={(e) => handleImageError(e, 'user')} className="w-10 h-10 rounded-full" />
                        <div>
                            <p className="font-bold">{post.author.name}</p>
                            <p className="text-sm text-gray-300">{post.content}</p>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

// --- MAIN VIDEOS SCREEN COMPONENT ---

interface VideosScreenProps {
  onViewProfile: (userId: string) => void;
}

const VideosScreen: React.FC<VideosScreenProps> = ({ onViewProfile }) => {
  const [videoPosts, setVideoPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      try {
        const allPosts = await getFeedPosts();
        const videos = allPosts.filter(p => p.media.some(m => m.type === 'video'));
        setVideoPosts(videos);
      } catch (error) {
        console.error("Failed to load video posts:", error);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Videos</h1>
      {loading ? (
        <p>Loading videos...</p>
      ) : videoPosts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videoPosts.map(post => (
            <div key={post.id} onClick={() => setSelectedPost(post)} className="relative aspect-w-9 aspect-h-16 rounded-lg overflow-hidden cursor-pointer group">
              <img src={`https://picsum.photos/seed/${post.id}/300/500`} alt="video thumbnail" onError={(e) => handleImageError(e, 'post')} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <PlayIcon className="w-12 h-12 text-white/80" />
              </div>
              <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-white text-xs">
                <PlayIcon className="w-3 h-3"/>
                <span>{Math.floor(Math.random() * 1000)}K</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No videos found.</p>
      )}

      {selectedPost && <VideoPlayerModal post={selectedPost} onClose={() => setSelectedPost(null)} onViewProfile={onViewProfile} />}
    </div>
  );
};

export default VideosScreen;