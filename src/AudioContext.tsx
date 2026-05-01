import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Track {
  id: string;
  album_id: string;
  title: string;
  artist: string;
  cover: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  next: () => void;
  prev: () => void;
  queue: Track[];
  setQueue: (tracks: Track[]) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Track[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    // Мы убираем crossOrigin, так как он может блокировать HTTP-стримы в WebView без CORS-заголовков
    audioRef.current = audio;
    
    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => next();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return;
    
    try {
      setCurrentTrack(track);
      
      // Формируем URL для запроса стрима
      const baseUrl = 'http://127.0.0.1:3000';
      const endpoint = `/api/stream/${track.id}/${track.album_id}`;
      
      let res;
      try {
        res = await fetch(`${baseUrl}${endpoint}`);
      } catch (e) {
        // Если 127.0.0.1:3000 недоступен прямо, пробуем относительный путь
        res = await fetch(endpoint);
      }

      const data = await res.json();
      const url = data.url;
      
      if (audioRef.current && url) {
        audioRef.current.src = url;
        audioRef.current.load(); // Обязательно для некоторых версий Android
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Playback failed:", error);
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch stream URL:", error);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const next = () => {
    if (queue.length > 0 && currentTrack) {
      const index = queue.findIndex(t => t.id === currentTrack.id);
      if (index !== -1 && index < queue.length - 1) {
        playTrack(queue[index + 1]);
      } else {
        playTrack(queue[0]);
      }
    }
  };

  const prev = () => {
    if (queue.length > 0 && currentTrack) {
      const index = queue.findIndex(t => t.id === currentTrack.id);
      if (index > 0) {
        playTrack(queue[index - 1]);
      }
    }
  };

  return (
    <AudioContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume,
      playTrack, togglePlay, seek, setVolume, next, prev, queue, setQueue
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};
