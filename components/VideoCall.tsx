import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types.ts';
// FIX: Consolidated and corrected the icon imports.
import { MicrophoneIcon, MicrophoneSlashIcon, VideoCameraIcon, VideoCameraSlashIcon, PhoneXMarkIcon } from './Icons.tsx';

interface VideoCallProps {
  user: User;
  type: 'video' | 'voice';
  onEndCall: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ user, type, onEndCall }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');

  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (type === 'voice') {
            stream.getVideoTracks().forEach(track => track.enabled = false);
        }
      } catch (err) {
        console.error('Error accessing media devices.', err);
        let message = 'Could not access camera or microphone. Please check permissions.';
        if (err instanceof DOMException) {
          if (err.name === 'NotFoundError') {
            message = 'No camera or microphone found. Please connect a device and try again.';
          } else if (err.name === 'NotAllowedError') {
            message = 'Permission to use camera and microphone was denied. Please allow access in your browser settings.';
          } else {
            message = `An unexpected error occurred: ${err.name}. Please check your device and browser settings.`;
          }
        }
        setError(message);
      }
    };

    startStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [type]);

  const toggleMute = () => {
    if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        setIsMuted(prev => !prev);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        setIsVideoOff(prev => !prev);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-surface z-50 flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <img src={user.profilePictureUrl} alt={user.name} onError={(e) => e.currentTarget.src = 'https://placehold.co/150x150/1e1e1e/ffffff?text=User'} className="w-40 h-40 rounded-full opacity-50" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-2xl font-bold">{user.name}</p>
          <p className="text-sm">Connecting...</p>
        </div>
      </div>

      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`absolute w-24 h-36 md:w-40 md:h-56 object-cover bg-dark-card rounded-md bottom-28 md:bottom-32 right-4 ${isVideoOff ? 'hidden' : 'block'}`}
      ></video>

      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-2 text-center rounded-md text-sm">
            {error}
        </div>
      )}

      <div className="bg-dark-card py-4 flex justify-center items-center space-x-6">
        <button onClick={toggleMute} disabled={!!error} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} text-white disabled:opacity-50`}>
          {isMuted ? <MicrophoneSlashIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
        </button>
        <button onClick={toggleVideo} disabled={!!error} className={`p-3 rounded-full ${isVideoOff ? 'bg-gray-600' : 'bg-gray-600'} text-white disabled:opacity-50`}>
           {isVideoOff ? <VideoCameraSlashIcon className="w-6 h-6" /> : <VideoCameraIcon className="w-6 h-6" />}
        </button>
        <button onClick={onEndCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white">
          <PhoneXMarkIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;