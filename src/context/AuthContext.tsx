'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';

interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  totalTracksInDb: number;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [totalTracksInDb, setTotalTracksInDb] = useState(5);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check current user session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.warn('Failed to fetch user session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  // Initial catalog sync to ensure tracks are in DB
  useEffect(() => {
    triggerSync();
  }, []);

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.stats?.totalInDb) {
          setTotalTracksInDb(data.stats.totalInDb);
        }
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        logout,
        setUser,
        totalTracksInDb,
        isSyncing,
        triggerSync,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
