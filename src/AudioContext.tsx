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
  eqBands: number[];
  setEqBand: (index: number, value: number) => void;
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
  const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
  }, [likedTracks]);

  const initAudioCtx = () => {
    if (audioContextRef.current || !audioRef.current) return;
    
    // @ts-ignore
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    const frequencies = [60, 230, 910, 3600, 14000];
    const filters = frequencies.map((freq) => {
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
    
    let lastNode: any = source;
    filters.forEach(filter => {
      lastNode.connect(filter);
      lastNode = filter;
    });
    lastNode.connect(ctx.destination);
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => next();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, []);

  const setEqBand = (index: number, value: number) => {
    const newBands = [...eqBands];
    newBands[index] = value;
    setEqBands(newBands);
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = value;
    }
  };

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
    initAudioCtx();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    try {
      setCurrentTrack(track);
      const baseUrl = 'http://127.0.0.1:3000';
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
        audioRef.current.play().catch(console.error);
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
      playTrack, togglePlay, seek, setVolume, next, prev, queue, setQueue,
      eqBands, setEqBand
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
