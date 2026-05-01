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
  setVolume: (volume: number) => void;
  next: () => void;
  prev: () => void;
  queue: Track[];
  setQueue: (tracks: Track[]) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueue] = useState<Track[]>([]);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]); // 5 bands: 60, 230, 910, 3600, 14000 Hz

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous";
    
    audioRef.current.addEventListener('timeupdate', () => {
      setProgress(audioRef.current?.currentTime || 0);
    });

    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current?.duration || 0);
    });

    audioRef.current.addEventListener('ended', () => {
      next();
    });

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const freqs = [60, 230, 910, 3600, 14000];
      const filters = freqs.map(freq => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      filtersRef.current = filters;
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      // Connect filters in series
      let lastNode: AudioNode = source;
      filters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(ctx.destination);
    }
  };

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return;
    
    try {
      setCurrentTrack(track);
      const res = await fetch(`/api/stream/${track.id}/${track.album_id}`);
      const { url } = await res.json();
      
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const next = () => {
    if (queue.length > 0) {
      const index = queue.findIndex(t => t.id === currentTrack?.id);
      if (index !== -1 && index < queue.length - 1) {
        playTrack(queue[index + 1]);
      } else {
        playTrack(queue[0]);
      }
    }
  };

  const prev = () => {
    if (queue.length > 0) {
      const index = queue.findIndex(t => t.id === currentTrack?.id);
      if (index > 0) {
        playTrack(queue[index - 1]);
      }
    }
  };

  const setEqBand = (index: number, value: number) => {
    const newBands = [...eqBands];
    newBands[index] = value;
    setEqBands(newBands);
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = value;
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
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
