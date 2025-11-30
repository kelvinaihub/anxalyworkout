import React, { useState, useEffect } from 'react';
import { getFriendsForUser, getSuggestedFriends } from '../services/firebaseService.ts';
import { User } from '../types.ts';
import { MessagesIcon } from '../components/Icons.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---

const FriendCard: React.FC<{ user: User, onAction: () => void, actionLabel: string, actionIcon?: React.FC<{className?: string}> }> = ({ user, onAction, actionLabel, actionIcon: Icon }) => (
    <div className="bg-dark-card p-3 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <img src={user.profilePictureUrl} alt={user.name} className="w-12 h-12 rounded-full" />
            <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-xs text-dark-text-secondary">@{user.username}</p>
            </div>
        </div>
        <button onClick={onAction} className="bg-brand-primary/20 text-brand-primary font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-2 hover:bg-brand-primary/30">
            {Icon && <Icon className="w-4 h-4" />}
            <span>{actionLabel}</span>
        </button>
    </div>
);

const SuggestionCard: React.FC<{ user: User, onAdd: () => void, onRemove: () => void, onViewProfile: (userId: string) => void }> = ({ user, onAdd, onRemove, onViewProfile }) => (
    <div className="bg-dark-card rounded-lg overflow-hidden text-center">
        <img src={user.profilePictureUrl} alt={user.name} onClick={() => onViewProfile(user.id)} className="w-full h-40 object-cover cursor-pointer" />
        <div className="p-3">
            <p onClick={() => onViewProfile(user.id)} className="font-bold cursor-pointer">{user.name}</p>
            <div className="mt-3 space-y-2">
                <button onClick={onAdd} className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg text-sm">Add Friend</button>
                <button onClick={onRemove} className="w-full bg-dark-surface text-dark-text font-semibold py-2 rounded-lg text-sm">Remove</button>
            </div>
        </div>
    </div>
);

// --- MAIN FRIENDS SCREEN COMPONENT ---

interface FriendsScreenProps {
  currentUserId: string;
  onViewProfile: (userId: string) => void;
  onOpenChat: (user: User) => void;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ currentUserId, onViewProfile, onOpenChat }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'suggestions'>('friends');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [userFriends, suggestedFriends] = await Promise.all([
          getFriendsForUser(currentUserId),
          getSuggestedFriends(currentUserId)
        ]);
        setFriends(userFriends);
        setSuggestions(suggestedFriends);
      } catch (error) {
        console.error("Failed to load friends data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUserId]);

  const renderContent = () => {
    if (loading) return <p className="text-center mt-8">Loading...</p>;

    if (activeTab === 'friends') {
        return friends.length > 0 ? (
            <div className="space-y-3">
                {friends.map(friend => (
                    <FriendCard 
                        key={friend.id}
                        user={friend}
                        onAction={() => onOpenChat(friend)}
                        actionLabel="Message"
                        actionIcon={MessagesIcon}
                    />
                ))}
            </div>
        ) : (
            <p className="text-center mt-8 text-dark-text-secondary">You haven't added any friends yet.</p>
        );
    }

    if (activeTab === 'suggestions') {
        return suggestions.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {suggestions.map(user => (
                    <SuggestionCard 
                        key={user.id}
                        user={user}
                        onAdd={() => alert(`Friend request sent to ${user.name}!`)}
                        onRemove={() => setSuggestions(prev => prev.filter(s => s.id !== user.id))}
                        onViewProfile={onViewProfile}
                    />
                ))}
            </div>
        ) : (
             <p className="text-center mt-8 text-dark-text-secondary">No new friend suggestions right now.</p>
        )
    }
    return null;
  };

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>
      <div className="flex space-x-1 border-b border-gray-700 mb-4">
        <button onClick={() => setActiveTab('friends')} className={`py-2 px-4 font-semibold ${activeTab === 'friends' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-dark-text-secondary'}`}>
            Your Friends ({friends.length})
        </button>
        <button onClick={() => setActiveTab('suggestions')} className={`py-2 px-4 font-semibold ${activeTab === 'suggestions' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-dark-text-secondary'}`}>
            Suggestions
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default FriendsScreen;