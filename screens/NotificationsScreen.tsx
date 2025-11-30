import React, { useState, useEffect } from 'react';
import { getNotifications } from '../services/firebaseService.ts';
import { Notification, NotificationType } from '../types.ts';
import { HandThumbUpIcon, ChatBubbleOvalLeftIcon, UserGroupIcon, ShareIcon } from '../components/Icons.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    switch(type) {
        case 'like':
            return <HandThumbUpIcon className="w-6 h-6 text-white" />;
        case 'comment':
            return <ChatBubbleOvalLeftIcon className="w-6 h-6 text-white" />;
        case 'friend_request':
            return <UserGroupIcon className="w-6 h-6 text-white" />;
        case 'share':
            return <ShareIcon className="w-6 h-6 text-white" />;
        default:
            return null;
    }
};

const getNotificationText = (notification: Notification): React.ReactNode => {
    const userName = <strong className="font-bold">{notification.user.name}</strong>;
    switch(notification.type) {
        case 'like':
            return <>{userName} liked your post.</>;
        case 'comment':
            const comment = notification.post?.comments.slice(-1)[0]?.content;
            return <>{userName} commented on your post{comment ? `: "${comment}"` : '.'}</>;
        case 'friend_request':
            return <>{userName} sent you a friend request.</>;
        case 'share':
            return <>{userName} shared your post.</>;
        default:
            return "New notification";
    }
}

// --- MAIN NOTIFICATIONS SCREEN COMPONENT ---

interface NotificationsScreenProps {
  onViewProfile: (userId: string) => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onViewProfile }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        // Assuming current user is user_1 for mock purposes
        const notifs = await getNotifications('user_1');
        setNotifications(notifs);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  };

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(notif => (
            <button key={notif.id} className={`w-full text-left p-3 rounded-lg flex items-start space-x-4 transition-colors ${notif.isRead ? 'bg-dark-card hover:bg-dark-surface' : 'bg-brand-primary/20 hover:bg-brand-primary/30'}`}>
              <div className={`relative flex-shrink-0 mt-1`}>
                <img src={notif.user.profilePictureUrl} alt={notif.user.name} className="w-12 h-12 rounded-full" />
                <div className="absolute -bottom-1 -right-1 bg-dark-card p-1 rounded-full">
                    <NotificationIcon type={notif.type}/>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm">{getNotificationText(notif)}</p>
                <p className={`text-xs font-bold ${notif.isRead ? 'text-dark-text-secondary' : 'text-brand-primary'}`}>{timeSince(notif.timestamp)}</p>
              </div>
              {!notif.isRead && <div className="w-3 h-3 bg-brand-primary rounded-full flex-shrink-0 mt-1"></div>}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center mt-8 text-dark-text-secondary">You have no new notifications.</p>
      )}
    </div>
  );
};

export default NotificationsScreen;