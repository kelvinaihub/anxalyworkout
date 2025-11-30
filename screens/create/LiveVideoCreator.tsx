import React, { useRef, useEffect, useState } from 'react';
import { XIcon, VideoCameraIcon, MicrophoneIcon, MicrophoneSlashIcon } from '../../components/Icons';

interface LiveVideoCreatorProps {
  onClose: () => void;
}

const LiveVideoCreator: React.FC<LiveVideoCreatorProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        let message = 'Could not access your camera. Please check permissions and try again.';
        if (err instanceof DOMException) {
            if (err.name === 'NotFoundError') {
                message = 'No camera or microphone found. Please connect a device to go live.';
            } else if (err.name === 'NotAllowedError') {
                message = 'Live video requires camera and microphone access. Please allow permission in your browser settings.';
            } else {
                message = `An error occurred: ${err.name}. Please check your hardware and settings.`;
            }
        }
        setError(message);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Go Live</h2>
        <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
      </div>

      <div className="relative flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {error ? (
           <div className="text-center p-4">
              <p className="text-red-500 font-semibold text-lg">Unable to start live video</p>
              <p className="text-dark-text-secondary mt-2">{error}</p>
           </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
            <div className="absolute top-2 left-2 bg-red-600 px-2 py-1 rounded text-sm font-bold flex items-center">
                <VideoCameraIcon className="w-4 h-4 mr-1"/> LIVE
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4">
        <input type="text" placeholder="Add a title..." className="w-full bg-dark-surface p-3 rounded-lg focus:outline-none" disabled={!!error} />
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex space-x-4">
            <button onClick={toggleMute} className="p-3 bg-dark-surface rounded-full disabled:opacity-50" disabled={!!error}>
                {isMuted ? <MicrophoneSlashIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6"/>}
            </button>
            {/* Add more controls like flip camera, effects etc. here */}
        </div>
        <button className="bg-red-600 font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-900 disabled:cursor-not-allowed" disabled={!!error}>
            Start Live Video
        </button>
      </div>
    </div>
  );
};

export default LiveVideoCreator;