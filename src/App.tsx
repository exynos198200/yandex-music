/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Heart, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  Volume2, 
  Music, 
  ChevronDown,
  LayoutGrid,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioProvider, useAudio } from './AudioContext';

interface Track {
  id: string;
  album_id: string;
  title: string;
  artist: string;
  cover: string;
}

const MinimalPlayer = () => {
  const { currentTrack, isPlaying, progress, duration, togglePlay, next, prev, seek, volume, setVolume } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Mini Player */}
      <motion.div 
        layout
        className="fixed bottom-0 left-0 right-0 bg-[#1C1B1F] border-t border-white/5 p-3 z-50 flex items-center gap-4 safe-area-bottom"
        onClick={() => setIsExpanded(true)}
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
           <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="text-white font-medium truncate text-sm">{currentTrack.title}</div>
          <div className="text-zinc-400 text-xs truncate">{currentTrack.artist}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 flex items-center justify-center">
            {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white fill-current" />}
          </button>
        </div>
      </motion.div>

      {/* Full Player Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#1C1B1F] z-[100] p-6 flex flex-col pt-12"
          >
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-6 left-6 text-zinc-400 hover:text-white"
            >
              <ChevronDown className="w-8 h-8" />
            </button>

            <div className="flex-grow flex flex-col items-center justify-center mt-8">
              <motion.div 
                layoutId="cover"
                className="w-full aspect-square max-w-[320px] rounded-[32px] overflow-hidden shadow-2xl mb-12 bg-zinc-800"
              >
                <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>

              <div className="w-full max-w-[320px] mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">{currentTrack.title}</h1>
                <p className="text-lg text-zinc-400">{currentTrack.artist}</p>
              </div>

              <div className="w-full max-w-[320px] mb-8 space-y-2">
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 0} 
                  value={progress}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-[#D0BCFF]"
                />
                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between w-full max-w-[320px]">
                <button onClick={prev} className="text-white p-2">
                  <SkipBack className="w-8 h-8 fill-current" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-[#D0BCFF] flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                >
                  {isPlaying ? <Pause className="w-10 h-10 text-[#381E72] fill-current" /> : <Play className="w-10 h-10 text-[#381E72] fill-current ml-1" />}
                </button>
                <button onClick={next} className="text-white p-2">
                  <SkipForward className="w-8 h-8 fill-current" />
                </button>
              </div>
            </div>

            <div className="mt-auto flex justify-between p-4 text-zinc-400">
               <div className="flex items-center gap-4">
                 <button><Heart className="w-6 h-6" /></button>
                 <button><Download className="w-6 h-6" /></button>
               </div>
               <div className="flex items-center gap-2">
                 <Volume2 className="w-5 h-5" />
                 <input 
                   type="range" 
                   min="0" 
                   max="1" 
                   step="0.01" 
                   value={volume}
                   onChange={(e) => setVolume(parseFloat(e.target.value))}
                   className="w-24 h-1 bg-zinc-800 rounded-full accent-[#D0BCFF]"
                 />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MainView = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const { playTrack, setQueue } = useAudio();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const onTrackClick = (track: Track) => {
    setQueue(results);
    playTrack(track);
  };

  return (
    <div className="min-h-screen bg-[#1C1B1F] text-[#E6E1E5] pb-32">
      {/* Header */}
      <header className="p-6 pt-12 space-y-6">
        <div className="flex items-center justify-between">
          <Menu className="w-6 h-6 text-[#E6E1E5]" />
          <div className="w-8 h-8 rounded-full bg-[#49454F]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Поиск музыки</h1>
          <p className="text-[#CAC4D0]">Найди свои любимые треки</p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#CAC4D0]" />
          <input 
            type="text" 
            placeholder="Искать треки, альбомы..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#2B2930] border-none rounded-2xl py-4 pl-12 pr-6 text-white placeholder-[#938F99] focus:ring-2 focus:ring-[#D0BCFF] transition-all outline-none"
          />
        </form>
      </header>

      {/* Results */}
      <div className="px-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D0BCFF]/20 border-t-[#D0BCFF] rounded-full animate-spin" />
          </div>
        ) : (
          results.map((track) => (
            <motion.div 
              key={track.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTrackClick(track)}
              className="flex items-center gap-4 bg-[#2B2930]/40 p-3 rounded-[24px] cursor-pointer active:bg-[#2B2930]"
            >
              <div className="w-14 h-14 rounded-[16px] overflow-hidden flex-shrink-0 bg-zinc-800">
                <img src={track.cover} alt={track.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow overflow-hidden">
                <h3 className="font-semibold text-white truncate">{track.title}</h3>
                <p className="text-[#CAC4D0] text-sm truncate">{track.artist}</p>
              </div>
              <button className="p-2 text-[#CAC4D0]">
                <Play className="w-6 h-6 fill-current" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <MinimalPlayer />
    </div>
  );
};

export default function App() {
  return (
    <AudioProvider>
      <MainView />
    </AudioProvider>
  );
}
