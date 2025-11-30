
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types.ts';
import { PhoneIcon, VideoCameraIcon, MinusIcon, XIcon, MicrophoneIcon, PaperClipIcon, FaceSmileIcon, HandThumbUpIcon, PaperAirplaneIcon, StopIcon, TrashIcon } from './Icons.tsx';
import { getMessagesForChat, sendMessage, uploadFile } from '../services/firebaseService.ts';
import EmojiPicker from './EmojiPicker.tsx';

interface ChatPopupProps {
  user: User;
  currentUserId: string;
  onClose: (userId: string) => void;
  onStartCall: (user: User, type: 'video' | 'voice') => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ user, currentUserId, onClose, onStartCall }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingSeconds, setRecordingSeconds] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<number | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        const loadMessages = async () => {
            setLoading(true);
            const chatMessages = await getMessagesForChat(currentUserId, user.id);
            setMessages(chatMessages);
            setLoading(false);
        };
        loadMessages();
    }, [currentUserId, user.id]);

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        return () => {
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
        }
    }, []);

    const sendOptimisticMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
        const optimisticMessage: ChatMessage = {
            id: `temp_${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...msg
        };
        setMessages(prev => [...prev, optimisticMessage]);
        return optimisticMessage;
    }
    
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        setMessage('');
        const optimisticMsg = sendOptimisticMessage({ senderId: currentUserId, recipientId: user.id, text: trimmedMessage });
        try {
            const sentMessage = await sendMessage(currentUserId, user.id, trimmedMessage);
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? sentMessage : m));
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    }
    
    const handleSendLike = async () => {
        const optimisticMsg = sendOptimisticMessage({ senderId: currentUserId, recipientId: user.id, text: '👍' });
        try {
            const sentMessage = await sendMessage(currentUserId, user.id, '👍');
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? sentMessage : m));
        } catch (error) {
            console.error("Failed to send like:", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    };
    
    const handlePhotoClick = () => fileInputRef.current?.click();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const tempUrl = URL.createObjectURL(file);
        const optimisticMsg = sendOptimisticMessage({ senderId: currentUserId, recipientId: user.id, text: '', mediaUrl: tempUrl, mediaType: 'image' });
        
        try {
            const uploadedUrl = await uploadFile(file);
            const sentMessage = await sendMessage(currentUserId, user.id, '', uploadedUrl, 'image');
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...sentMessage, mediaUrl: uploadedUrl } : m));
        } catch (error) {
            console.error("Failed to upload image and send message:", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        } finally {
            URL.revokeObjectURL(tempUrl);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    };
    
    const handleEmojiSelect = (emoji: string) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                setRecordingStatus('recorded');
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setRecordingStatus('recording');
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Could not start recording. Please check microphone permissions.");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.stop();
            if(recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            setRecordingSeconds(0);
        }
    };
    
    const discardRecording = () => {
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
        setAudioBlob(null);
        setRecordingStatus('idle');
    };
    
    const handleSendAudio = async () => {
        if (!audioBlob) return;
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        discardRecording();
        
        const tempUrl = URL.createObjectURL(audioFile);
        const optimisticMsg = sendOptimisticMessage({ senderId: currentUserId, recipientId: user.id, text: '', mediaUrl: tempUrl, mediaType: 'audio' });
        
        try {
            const uploadedUrl = await uploadFile(audioFile);
            const sentMessage = await sendMessage(currentUserId, user.id, '', uploadedUrl, 'audio');
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...sentMessage, mediaUrl: uploadedUrl } : m));
        } catch (error) {
            console.error("Failed to send audio message:", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        } finally {
            URL.revokeObjectURL(tempUrl);
        }
    };

    const renderInputArea = () => {
        if (recordingStatus === 'recording') {
            return (
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center text-red-500">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <span>{formatTime(recordingSeconds)}</span>
                    </div>
                    <button onClick={stopRecording} className="p-2 rounded-full bg-red-500 text-white">
                        <StopIcon className="w-6 h-6" />
                    </button>
                </div>
            );
        }

        if (recordingStatus === 'recorded' && audioBlob) {
            if (!audioUrlRef.current) {
                 audioUrlRef.current = URL.createObjectURL(audioBlob);
            }
            return (
                <div className="flex items-center p-2 space-x-2">
                    <button onClick={discardRecording} className="text-dark-text-secondary hover:text-white"><TrashIcon className="w-6 h-6" /></button>
                    <audio src={audioUrlRef.current} controls className="w-full h-8" />
                    <button onClick={handleSendAudio} className="text-brand-primary p-1"><PaperAirplaneIcon className="w-6 h-6"/></button>
                </div>
            )
        }
        
        return (
            <div className="p-2 border-t border-gray-700">
                {showEmojiPicker && <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)}/>}
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                     <button type="button" onClick={startRecording} className="text-dark-text-secondary hover:text-brand-primary p-1"><MicrophoneIcon className="w-6 h-6"/></button>
                     <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} className="hidden" />
                     <button type="button" onClick={handlePhotoClick} className="text-dark-text-secondary hover:text-brand-primary p-1"><PaperClipIcon className="w-6 h-6"/></button>
                     <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="text-dark-text-secondary hover:text-brand-primary p-1"><FaceSmileIcon className="w-6 h-6"/></button>
                    <input 
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Aa"
                        className="flex-1 bg-dark-card rounded-full py-2 px-3 text-sm focus:outline-none"
                        autoFocus
                    />
                     {message.trim() ? (
                        <button type="submit" className="text-brand-primary p-1"><PaperAirplaneIcon className="w-6 h-6"/></button>
                     ) : (
                        <button type="button" onClick={handleSendLike} className="text-brand-primary p-1"><HandThumbUpIcon className="w-6 h-6"/></button>
                     )}
                </form>
            </div>
        );
    };

    return (
        <div className="md:w-96 md:h-[500px] bg-dark-surface rounded-t-lg shadow-2xl flex flex-col fixed bottom-0 md:relative md:bottom-auto md:right-auto inset-0 md:inset-auto z-50">
            <div className="flex items-center justify-between p-2 bg-dark-card rounded-t-lg flex-shrink-0">
                <div className="flex items-center">
                    <img src={user.profilePictureUrl} alt={user.name} className="w-8 h-8 rounded-full mr-2" />
                    <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-xs text-green-400">Active now</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-dark-text-secondary">
                    <button onClick={() => onStartCall(user, 'voice')} className="hover:text-white p-1 rounded-full"><PhoneIcon className="w-5 h-5"/></button>
                    <button onClick={() => onStartCall(user, 'video')} className="hover:text-white p-1 rounded-full"><VideoCameraIcon className="w-5 h-5"/></button>
                    <button className="hidden md:block hover:text-white p-1 rounded-full"><MinusIcon className="w-5 h-5"/></button>
                    <button onClick={() => onClose(user.id)} className="hover:text-white p-1 rounded-full"><XIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="flex-1 p-3 flex flex-col overflow-y-auto">
                {loading ? (
                    <p className="text-center text-dark-text-secondary m-auto">Loading messages...</p>
                ) : messages.length > 0 ? (
                    <div className="space-y-2">
                        {messages.map(msg => {
                            const isSent = msg.senderId === currentUserId;
                            return (
                                <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`py-2 px-3 rounded-2xl max-w-xs md:max-w-sm ${isSent ? 'bg-brand-primary text-white' : 'bg-dark-card text-dark-text'}`}>
                                        {msg.mediaType === 'image' && msg.mediaUrl && <img src={msg.mediaUrl} alt="chat attachment" className="rounded-lg mb-1 max-w-full" />}
                                        {msg.mediaType === 'audio' && msg.mediaUrl && <audio controls src={msg.mediaUrl} className="w-full h-10" />}
                                        {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                    </div>
                                </div>
                            )
                        })}
                         <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="m-auto text-center">
                        <img src={user.profilePictureUrl} alt={user.name} className="w-20 h-20 rounded-full mb-2 mx-auto" />
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-dark-text-secondary mt-1">You are now connected.</p>
                    </div>
                )}
            </div>

            {renderInputArea()}
        </div>
    );
};

export default ChatPopup;