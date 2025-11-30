import React, { useState, useEffect } from 'react';
import { getFriendsForUser } from '../services/firebaseService.ts';
import { User } from '../types.ts';

interface MessagesScreenProps {
  currentUserId: string;
  onOpenChat: (user: User) => void;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ currentUserId, onOpenChat }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      setLoading(true);
      try {
        const userFriends = await getFriendsForUser(currentUserId);
        setFriends(userFriends);
      } catch (error) {
        console.error("Failed to load friends:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFriends();
  }, [currentUserId]);

  return (
    <div className="h-full flex flex-col md:pt-4">
      <div className="max-w-xl mx-auto w-full px-4 pb-16 md:pb-0">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        {loading ? (
          <p className="text-dark-text-secondary text-center">Loading conversations...</p>
        ) : friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map(friend => (
              <button 
                key={friend.id} 
                onClick={() => onOpenChat(friend)}
                className="w-full flex items-center p-2 rounded-lg hover:bg-dark-surface transition-colors"
              >
                <img src={friend.profilePictureUrl} alt={friend.name} className="w-14 h-14 rounded-full mr-4" />
                <div className="text-left">
                  <p className="font-semibold text-dark-text">{friend.name}</p>
                  <p className="text-sm text-dark-text-secondary">Tap to start chatting...</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-dark-text-secondary">You have no conversations yet.</p>
              <p className="text-dark-text-secondary mt-1">Add some friends to start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesScreen;
