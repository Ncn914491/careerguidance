'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  lastActivity: number;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  updateActivity: () => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  session: null,
  isAdmin: false,
  isLoading: true,
  isInitialized: false,
  lastActivity: Date.now(),
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      
      setSession: (session) => set({ session }),
      
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      
      setIsLoading: (isLoading) => set({ isLoading }),
      
      setIsInitialized: (isInitialized) => set({ isInitialized }),
      
      updateActivity: () => set({ lastActivity: Date.now() }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        lastActivity: state.lastActivity,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Helper hooks for common auth checks
export const useIsAuthenticated = () => {
  const { user, session } = useAuthStore();
  return !!(user && session);
};

export const useIsAdmin = () => {
  const { isAdmin } = useAuthStore();
  return isAdmin;
};

export const useAuthLoading = () => {
  const { isLoading } = useAuthStore();
  return isLoading;
};