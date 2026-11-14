'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UnifiedTrack } from '@/types/music';

interface FavoritesContextType {
  favorites: UnifiedTrack[];
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: UnifiedTrack) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<UnifiedTrack[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mars_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load favorites:', e);
    }
  }, []);

  const saveFavorites = (list: UnifiedTrack[]) => {
    setFavorites(list);
    try {
      localStorage.setItem('mars_favorites', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
  };

  const isFavorite = (trackId: string) => {
    return favorites.some((t) => t.id === trackId || (t.title === trackId));
  };

  const toggleFavorite = (track: UnifiedTrack) => {
    const exists = isFavorite(track.id);
    let updated: UnifiedTrack[];
    if (exists) {
      updated = favorites.filter((t) => t.id !== track.id && t.title !== track.title);
    } else {
      updated = [track, ...favorites];
    }
    saveFavorites(updated);
  };

  const clearFavorites = () => {
    saveFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
