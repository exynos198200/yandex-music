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
  likedTracks: Track[];
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
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
  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('likedTracks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
  }, [likedTracks]);

  useEffect(() => {
    const audio = new Audio();
    // Мы не используем crossOrigin, если это вызывает проблемы с локальными mp3
    audioRef.current = audio;
    
    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => next();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const isLiked = (trackId: string) => likedTracks.some(t => t.id === trackId);

  const toggleLike = (track: Track) => {
    setLikedTracks(prev => {
      if (prev.some(t => t.id === track.id)) {
        return prev.filter(t => t.id !== track.id);
      }
      return [track, ...prev];
    });
  };

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return;
    
    try {
      setCurrentTrack(track);
      
      const baseUrl = 'https://server-for-yandex-music.onrender.com';
      const endpoint = `/api/stream/${track.id}/${track.album_id}`;
      
      let res;
      try {
        res = await fetch(`${baseUrl}${endpoint}`);
      } catch (e) {
        res = await fetch(endpoint);
      }

      const data = await res.json();
      const url = data.url;
      
      if (audioRef.current && url) {
        audioRef.current.src = url;
        audioRef.current.load();
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
        });
      }
    } catch (error) {
      console.error("Failed to play track:", error);
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
      currentTrack, isPlaying, progress, duration, volume, likedTracks, toggleLike, isLiked,
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
