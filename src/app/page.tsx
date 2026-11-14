'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Shuffle,
  ChevronLeft,
  Share2,
  Download,
  MoreHorizontal,
  Home,
  Flame,
  Bookmark,
  Library,
  User,
  Sparkles,
  Loader2,
  RefreshCw,
  Heart,
  Music2,
  Radio,
  SlidersHorizontal,
  Settings,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UnifiedTrack } from '@/types/music';
import { TrackRow } from '@/components/track/TrackRow';
import { AudioPlayer } from '@/components/player/AudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { ArtistModal, ArtistData } from '@/components/artist/ArtistModal';

const POPULAR_ARTISTS: ArtistData[] = [
  {
    id: 'brambles',
    name: 'Brambles',
    genre: 'Ambient / Neoclassical',
    listeners: '420 000',
    avatarUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'miyagi',
    name: 'Miyagi & Эндшпиль',
    genre: 'Hip-Hop / Reggae',
    listeners: '5 400 000',
    avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'the_weeknd',
    name: 'The Weeknd',
    genre: 'R&B / Synthpop',
    listeners: '110 000 000',
    avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'billie_eilish',
    name: 'Billie Eilish',
    genre: 'Alt Pop / Indie',
    listeners: '94 000 000',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'queen',
    name: 'Queen',
    genre: 'Classic Rock',
    listeners: '52 000 000',
    avatarUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'kish',
    name: 'Король и Шут',
    genre: 'Punk Rock',
    listeners: '3 800 000',
    avatarUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'daft_punk',
    name: 'Daft Punk',
    genre: 'Electronic / French House',
    listeners: '28 000 000',
    avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
  },
];

export default function HomePage() {
  const { user, openAuthModal, triggerSync, isSyncing } = useAuth();
  const { favorites } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedTrack[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Active Feed: 'yam' (Яндекс Музыка), 'new' (Новинки), 'rock', 'electronic', 'hiphop'
  const [activeTab, setActiveTab] = useState<'yam' | 'new' | 'rock' | 'electronic' | 'hiphop'>('yam');
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Artist for Modal
  const [selectedArtist, setSelectedArtist] = useState<ArtistData | null>(null);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<UnifiedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Bottom Navigation state: 'home' | 'search' | 'library' | 'hotlist' | 'settings'
  const [bottomNav, setBottomNav] = useState<'home' | 'search' | 'library' | 'hotlist' | 'settings'>('home');

  // Application Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('mars_theme') as 'light' | 'dark' | 'system') || 'light';
      setTheme(saved);
      applyTheme(saved);
    } catch (e) {}
  }, []);

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    try {
      localStorage.setItem('mars_theme', t);
    } catch (e) {}

    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const loadFeed = async (type: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/charts?type=${type}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
        if (data.tracks?.length > 0 && !currentTrack) {
          setCurrentTrack(data.tracks[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(activeTab);
  }, [activeTab]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tracks || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayTrack = (track: UnifiedTrack) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleSelectSource = (sourceIndex: number) => {
    if (!currentTrack) return;
    setCurrentTrack({
      ...currentTrack,
      activeSourceIndex: sourceIndex,
    });
  };

  const handleNext = () => {
    const list = bottomNav === 'library' ? favorites : (searchResults.length > 0 ? searchResults : tracks);
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % list.length;
    setCurrentTrack(list[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const list = bottomNav === 'library' ? favorites : (searchResults.length > 0 ? searchResults : tracks);
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    setCurrentTrack(list[prevIndex]);
    setIsPlaying(true);
  };

  const activeList = bottomNav === 'library'
    ? favorites
    : (searchResults.length > 0 ? searchResults : tracks);

  const featured = activeList[0] || tracks[0];

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#121316] pb-32 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full px-5 py-6 space-y-6">
        {/* =========================================================================
            TOP BAR: Back arrow on left, Title in center, Search & Profile on right
           ========================================================================= */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => {
              if (searchResults.length > 0) {
                setSearchResults([]);
                setSearchQuery('');
              } else if (bottomNav !== 'home') {
                setBottomNav('home');
              }
              setIsSearchOpen(false);
            }}
            className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              {bottomNav === 'library' ? 'Избранное & Медиатека' : bottomNav === 'hotlist' ? 'Топ-чарты' : 'MARS Music'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#121316] text-white">
              YAM API
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="w-10 h-10 rounded-2xl bg-[#121316] text-white text-xs font-bold flex items-center justify-center shadow-md">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="w-10 h-10 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black"
                title="Войти"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Search Bar Input (Animated / Expandable) */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="animate-fadeIn">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по Яндекс Музыке, трекам мира, альбомам..."
                className="w-full pl-11 pr-24 py-3 rounded-2xl neu-input text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-[#121316] text-white text-xs font-bold hover:bg-black transition-colors"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Найти'}
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            ALBUM / FEATURED HEADER (Exact design matching Mockup Right Phone!)
           ========================================================================= */}
        {!searchResults.length && bottomNav !== 'library' && bottomNav !== 'settings' && featured && (
          <div className="flex items-start gap-5 pt-2">
            {/* Square Rounded Artwork */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-[0_12px_28px_rgba(163,177,198,0.4)] border border-white flex-shrink-0">
              <img
                src={featured.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Album Info & Action Icons */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Альбом • 2026 • 328 kbps Hi-Fi
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
                {featured.title}
              </h1>
              <p className="text-sm font-semibold text-slate-400 truncate">
                {featured.artistName}
              </p>

              {/* Action Icons Pill: Share, Download, More (from mockup) */}
              <div className="flex items-center gap-2 pt-2 text-slate-700">
                <button
                  onClick={triggerSync}
                  className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                  title="Синхронизировать каталог"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-black' : ''}`} />
                </button>
                <button className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Поделиться">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Сохранить">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Еще">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BIG ACTION BUTTONS: ▶ Play & 🔀 Shuffle (Exact from Mockup)
           ========================================================================= */}
        {!searchResults.length && bottomNav !== 'settings' && featured && (
          <div className="grid grid-cols-2 gap-4 pt-1">
            <button
              onClick={() => handlePlayTrack(featured)}
              className="py-3.5 px-6 rounded-2xl bg-[#121316] text-white font-bold text-sm shadow-[0_8px_20px_rgba(18,19,22,0.35)] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{bottomNav === 'library' ? 'Play Favorites' : 'Play'}</span>
            </button>

            <button
              onClick={() => {
                const list = bottomNav === 'library' ? favorites : tracks;
                if (list.length > 1) {
                  const randomIdx = Math.floor(Math.random() * list.length);
                  handlePlayTrack(list[randomIdx]);
                }
              }}
              className="py-3.5 px-6 rounded-2xl neu-flat text-slate-800 font-bold text-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            КАРТОЧКИ МУЗЫКАНТОВ (Artist Cards Carousel on Home Screen)
           ========================================================================= */}
        {bottomNav === 'home' && !searchResults.length && (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-base text-slate-900">Популярные музыканты</h3>
              <span className="text-xs font-bold text-slate-400">Все</span>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
              {POPULAR_ARTISTS.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => setSelectedArtist(artist)}
                  className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl overflow-hidden shadow-[0_8px_20px_rgba(163,177,198,0.35)] border border-white group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center w-24">
                    <p className="font-bold text-xs text-slate-900 truncate">{artist.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{artist.genre.split('/')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Genre / Source Filter Pills */}
        {!searchResults.length && bottomNav !== 'library' && bottomNav !== 'settings' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            {[
              { id: 'yam', label: '🔥 Яндекс Топ' },
              { id: 'new', label: '✨ Новинки' },
              { id: 'rock', label: '🎸 Рок' },
              { id: 'electronic', label: '⚡ Электроника' },
              { id: 'hiphop', label: '🎤 Рэп' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#121316] text-white shadow-md'
                    : 'neu-btn text-slate-600 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* =========================================================================
            SETTINGS VIEW OR TRACKLIST
           ========================================================================= */}
        {bottomNav === 'settings' ? (
          <div className="space-y-6 pt-2 animate-fadeIn pb-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Настройки MARS</h2>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                v1.2.0
              </span>
            </div>

            {/* Section 1: Тема приложения (Theme) */}
            <div className="neu-card rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Тема оформления</h3>
              </div>
              <p className="text-xs text-slate-400">
                Выберите визуальный стиль: неоморфный светлый Soft-UI или глубокий ночной обсидиан.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <button
                  onClick={() => applyTheme('light')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold transition-all border ${
                    theme === 'light'
                      ? 'bg-[#121316] text-white shadow-lg border-transparent'
                      : 'neu-btn text-slate-700 hover:text-black border-slate-200/60'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span>Светлая</span>
                </button>

                <button
                  onClick={() => applyTheme('dark')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold transition-all border ${
                    theme === 'dark'
                      ? 'bg-[#121316] text-white shadow-lg border-transparent'
                      : 'neu-btn text-slate-700 hover:text-black border-slate-200/60'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span>Обсидиан</span>
                </button>

                <button
                  onClick={() => applyTheme('system')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold transition-all border ${
                    theme === 'system'
                      ? 'bg-[#121316] text-white shadow-lg border-transparent'
                      : 'neu-btn text-slate-700 hover:text-black border-slate-200/60'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span>Системная</span>
                </button>
              </div>
            </div>

            {/* Section 2: Качество воспроизведения */}
            <div className="neu-card rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Звук и Воспроизведение</h3>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                  <span>Битрейт аудио</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">328 kbps Hi-Fi Master</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                  <span>Режим треков</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">Полная песня (без 30с превью)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                  <span>Музыкальные клипы</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Full HD Video Engine</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Аппаратное ускорение</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">Включено</span>
                </div>
              </div>
            </div>

            {/* Section 3: Музыкальные интеграции */}
            <div className="neu-card rounded-3xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Подключенные сервисы</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Яндекс Музыка (YAM)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Apple Music Catalog</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>YouTube Music Clips</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Jamendo Studio HQ</span>
                </div>
              </div>
            </div>

            {/* Section 4: О программе */}
            <div className="neu-card rounded-3xl p-5 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-bold text-slate-800 dark:text-slate-200">MARS Multi-Platform Music Aggregator</p>
              <p>Версия: 1.2.0 (Windows Standalone + PWA)</p>
              <p>Репозиторий проекта: <a href="https://github.com/d1sochka/mars" target="_blank" rel="noreferrer" className="text-blue-500 underline">github.com/d1sochka/mars</a></p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pt-2">
            {bottomNav === 'library' && (
              <div className="flex items-center justify-between pb-2 px-1">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Избранные треки ({favorites.length})
                </h3>
              </div>
            )}

            {isLoading && !searchResults.length && bottomNav !== 'library' ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#121316] dark:text-white" />
                <p className="text-sm font-semibold">Загрузка музыки...</p>
              </div>
            ) : activeList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 neu-card rounded-3xl p-8 space-y-2">
                <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-800 dark:text-slate-200 font-bold">
                  {bottomNav === 'library' ? 'У вас пока нет избранных треков' : 'Ничего не найдено'}
                </p>
                <p className="text-xs">
                  {bottomNav === 'library'
                    ? 'Нажмите на сердечко на любом треке, чтобы добавить его сюда'
                    : 'Попробуйте ввести другой поисковый запрос'}
                </p>
              </div>
            ) : (
              activeList.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  isCurrent={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onPlay={() => handlePlayTrack(track)}
                  onSelectSource={handleSelectSource}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          PERSISTENT AUDIO PLAYER (Floating black pill + Expanded Now Playing)
         ========================================================================= */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={handleNext}
        onPrev={handlePrev}
        onSelectSource={handleSelectSource}
      />

      {/* =========================================================================
          ARTIST PROFILE MODAL
         ========================================================================= */}
      <ArtistModal
        artist={selectedArtist}
        isOpen={!!selectedArtist}
        onClose={() => setSelectedArtist(null)}
        onPlayTrack={handlePlayTrack}
        currentTrackId={currentTrack?.id}
        isPlaying={isPlaying}
      />

      {/* =========================================================================
          BOTTOM DOCK NAVIGATION BAR (Exact matching Mockup Bottom Bar + Settings!)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#F2F4F8]/90 dark:bg-[#0E1015]/90 backdrop-blur-lg border-t border-slate-200/60 dark:border-zinc-800 px-6 flex items-center justify-around z-30 max-w-2xl mx-auto">
        <button
          onClick={() => {
            setBottomNav('home');
            setSearchResults([]);
            setIsSearchOpen(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'home' ? 'text-[#121316] dark:text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => {
            setBottomNav('search');
            setIsSearchOpen(true);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'search' ? 'text-[#121316] dark:text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Search</span>
        </button>

        <button
          onClick={() => {
            setBottomNav('library');
            setIsSearchOpen(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors relative ${
            bottomNav === 'library' ? 'text-[#121316] dark:text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Library className="w-5 h-5" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-red-500" />
          )}
          <span className="text-[10px]">Library</span>
        </button>

        <button
          onClick={() => {
            setBottomNav('hotlist');
            setActiveTab('yam');
            setIsSearchOpen(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'hotlist' ? 'text-[#121316] dark:text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px]">Hotlist</span>
        </button>

        <button
          onClick={() => {
            setBottomNav('settings');
            setIsSearchOpen(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'settings' ? 'text-[#121316] dark:text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>
    </div>
  );
}
