/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Heart, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  Volume2, 
  ChevronDown,
  Menu,
  SlidersHorizontal,
  PlusCircle,
  Library,
  Music4
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

const Equalizer = ({ onClose }: { onClose: () => void }) => {
  const { eqBands, setEqBand } = useAudio();
  const labels = ['60Hz', '230Hz', '910Hz', '3.6k', '14k'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-24 left-6 right-6 bg-[#2B2930] p-6 rounded-[24px] shadow-2xl z-[110]"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-bold text-lg">Эквалайзер</h3>
        <button onClick={onClose} className="text-zinc-400">Закрыть</button>
      </div>
      <div className="flex justify-between items-end h-40 gap-4">
        {eqBands.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-grow h-full">
            <div className="h-full w-full flex items-center justify-center">
              <input 
                type="range" 
                min="-12" 
                max="12" 
                step="1"
                value={val}
                onChange={(e) => setEqBand(i, parseInt(e.target.value))}
                style={{ 
                  writingMode: 'vertical-lr', 
                  direction: 'rtl',
                  width: '6px',
                  height: '120px',
                  appearance: 'none',
                  background: '#49454F',
                  borderRadius: '3px'
                }}
                className="accent-[#D0BCFF] cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-medium">{labels[i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const MinimalPlayer = () => {
  const { currentTrack, isPlaying, progress, duration, togglePlay, next, prev, seek, volume, setVolume, isLiked, toggleLike } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEq, setShowEq] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.div 
        layout
        className="fixed bottom-20 left-4 right-4 bg-[#2B2930] rounded-2xl p-3 z-50 flex items-center gap-4 shadow-xl mb-4"
        onClick={() => setIsExpanded(true)}
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
           <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="text-white font-medium truncate text-sm">{currentTrack.title}</div>
          <div className="text-zinc-400 text-xs truncate">{currentTrack.artist}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-12 h-12 flex items-center justify-center">
            {isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white fill-current" />}
          </button>
        </div>
      </motion.div>

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
              onClick={() => { setIsExpanded(false); setShowEq(false); }}
              className="absolute top-6 left-6 text-zinc-400 hover:text-white"
            >
              <ChevronDown className="w-8 h-8" />
            </button>

            <button 
              onClick={() => setShowEq(!showEq)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white"
            >
              <SlidersHorizontal className="w-6 h-6" />
            </button>

            <div className="flex-grow flex flex-col items-center justify-center mt-8">
              <div className="w-full aspect-square max-w-[320px] rounded-[32px] overflow-hidden shadow-2xl mb-12 bg-zinc-800 relative group">
                <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
              </div>

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

            <AnimatePresence>
              {showEq && <Equalizer onClose={() => setShowEq(false)} />}
            </AnimatePresence>

            <div className="mt-auto flex justify-between p-4 text-zinc-400">
               <div className="flex items-center gap-6">
                 <button onClick={() => toggleLike(currentTrack)}>
                   <Heart className={`w-8 h-8 ${isLiked(currentTrack.id) ? 'fill-[#D0BCFF] text-[#D0BCFF]' : ''}`} />
                 </button>
                 <button><Download className="w-7 h-7" /></button>
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
  const [importUrl, setImportUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'likes' | 'import'>('search');
  const { playTrack, setQueue, likedTracks, isLiked, toggleLike } = useAudio();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    setLoading(true);
    try {
      const baseUrl = 'http://127.0.0.1:3000';
      const endpoint = `/api/search?q=${encodeURIComponent(search)}`;
      let res;
      try {
        res = await fetch(`${baseUrl}${endpoint}`);
      } catch (e) {
        res = await fetch(endpoint);
      }
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/playlist/import?url=${encodeURIComponent(importUrl)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
        setQueue(data);
        setActiveTab('search');
        setSearch('Импортированный плейлист');
      }
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const onTrackClick = (track: Track, list: Track[]) => {
    setQueue(list);
    playTrack(track);
  };

  return (
    <div className="min-h-screen bg-[#1C1B1F] text-[#E6E1E5] pb-40">
      <header className="p-6 pt-10 space-y-6 bg-[#1C1B1F] sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <Menu className="w-6 h-6 text-[#E6E1E5]" />
          <h2 className="text-xl font-bold">AIS MUSIC</h2>
          <div className="w-8 h-8 rounded-full bg-[#D0BCFF] flex items-center justify-center text-[#381E72] font-bold">A</div>
        </div>

        {activeTab === 'search' && (
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#CAC4D0]" />
            <input 
              type="text" 
              placeholder="Треки, артисты, альбомы..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#2B2930] border-none rounded-2xl py-4 pl-12 pr-6 text-white placeholder-[#938F99] focus:ring-2 focus:ring-[#D0BCFF] transition-all outline-none shadow-lg"
            />
          </form>
        )}

        {activeTab === 'import' && (
          <form onSubmit={handleImport} className="relative">
            <PlusCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D0BCFF]" />
            <input 
              type="text" 
              placeholder="Ссылка на плейлист Яндекса..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="w-full bg-[#2B2930] border-none rounded-2xl py-4 pl-12 pr-6 text-white placeholder-[#938F99] focus:ring-2 focus:ring-[#D0BCFF] transition-all outline-none"
            />
          </form>
        )}
      </header>

      <div className="px-6 space-y-3">
        {activeTab === 'search' && (
          <>
            <h2 className="text-zinc-500 font-bold uppercase text-xs tracking-widest pt-4">Результаты поиска</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#D0BCFF]/20 border-t-[#D0BCFF] rounded-full animate-spin" />
              </div>
            ) : results.length > 0 ? (
              results.map((track) => (
                <TrackItem key={track.id} track={track} onClick={() => onTrackClick(track, results)} />
              ))
            ) : (
              <div className="text-center py-20 text-zinc-600">
                <Music4 className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p>Введите запрос для поиска</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'likes' && (
          <>
            <h2 className="text-zinc-500 font-bold uppercase text-xs tracking-widest pt-4">Любимые треки ({likedTracks.length})</h2>
            {likedTracks.length > 0 ? (
              likedTracks.map((track) => (
                <TrackItem key={track.id} track={track} onClick={() => onTrackClick(track, likedTracks)} />
              ))
            ) : (
              <div className="text-center py-20 text-zinc-600">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p>Здесь пока пусто. Ставьте лайки!</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#1C1B1F]/95 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-4 z-40">
        <TabButton active={activeTab === 'search'} icon={<Search />} label="Поиск" onClick={() => setActiveTab('search')} />
        <TabButton active={activeTab === 'likes'} icon={<Heart />} label="Любимое" onClick={() => setActiveTab('likes')} />
        <TabButton active={activeTab === 'import'} icon={<Library />} label="Импорт" onClick={() => setActiveTab('import')} />
      </div>

      <MinimalPlayer />
    </div>
  );
};

interface TrackItemProps {
  track: Track;
  onClick: () => void;
  key?: React.Key;
}

const TrackItem = ({ track, onClick }: TrackItemProps) => {
  const { isLiked, toggleLike } = useAudio();
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 bg-[#2B2930]/30 p-3 rounded-[20px] cursor-pointer active:bg-[#2B2930]/60 transition-colors"
    >
      <div className="w-14 h-14 rounded-[14px] overflow-hidden flex-shrink-0 bg-zinc-800">
        <img src={track.cover} alt={track.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="flex-grow overflow-hidden">
        <h3 className="font-semibold text-white truncate text-sm">{track.title}</h3>
        <p className="text-[#CAC4D0] text-xs truncate">{track.artist}</p>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
        className="p-2"
      >
        <Heart className={`w-6 h-6 ${isLiked(track.id) ? 'fill-[#D0BCFF] text-[#D0BCFF]' : 'text-[#CAC4D0]'}`} />
      </button>
    </motion.div>
  );
};

const TabButton = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-[#D0BCFF]' : 'text-[#CAC4D0]'}`}>
    <div className={`p-1 px-5 rounded-full transition-all ${active ? 'bg-[#49454F]' : ''}`}>
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default function App() {
  return (
    <AudioProvider>
      <MainView />
    </AudioProvider>
  );
}
