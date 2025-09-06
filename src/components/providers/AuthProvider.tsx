'use client';

import { createContext, useContext, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isSeededAdmin } from '@/lib/auth-client';
import { useAuthStore } from '@/store/authStore';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any; redirectTo?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: any; needsEmailConfirmation?: boolean; user?: User; redirectTo?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    session,
    isAdmin,
    isLoading,
    isInitialized,
    setUser,
    setSession,
    setIsAdmin,
    setIsLoading,
    setIsInitialized
  } = useAuthStore();

  const checkUserRole = useCallback(async (userId: string, email: string) => {
    if (isSeededAdmin(email)) {
      setIsAdmin(true);
      return true;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        return false;
      }

      const adminStatus = profile?.role === 'admin';
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
      return false;
    }
  }, [setIsAdmin]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (session) {
        setSession(session);
        setUser(session.user);
        await checkUserRole(session.user.id, session.user.email || '');
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  }, [checkUserRole]);

  useEffect(() => {
    let mounted = true;

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          setSession(session);
          setUser(session.user);
          await checkUserRole(session.user.id, session.user.email || '');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth changes with optimized handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, !!session);

        // Update session and user immediately for instant UI updates
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Ensure profile exists for new signups and sign-ins
          if (event === 'SIGNED_IN') {
            try {
              const { ensureProfileExists } = await import('@/lib/profile-utils');
              await ensureProfileExists(session.user);
            } catch (error) {
              console.warn('Could not ensure profile exists:', error);
            }
          }
          
          // Check role after profile operations
          await checkUserRole(session.user.id, session.user.email || '');
        } else {
          setIsAdmin(false);
        }

        // Set loading to false after auth state is processed
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserRole]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error };
      }

      // Session will be updated via onAuthStateChange
      // Determine redirect path based on role
      const isAdminUser = isSeededAdmin(email);
      let redirectTo = '/student/dashboard';
      
      if (isAdminUser) {
        redirectTo = '/admin/dashboard';
      } else {
        // Check role from database for non-seeded users
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (!error && profile?.role === 'admin') {
            redirectTo = '/admin/dashboard';
          }
        } catch (error) {
          console.warn('Could not check user role:', error);
        }
      }

      return { success: true, redirectTo };
    } catch (error) {
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        return { success: false, error };
      }

      if (data.user) {
        // Session will be updated via onAuthStateChange
        // New users are always students initially
        const redirectTo = '/student/dashboard';
        
        return { 
          success: true, 
          needsEmailConfirmation: false,
          user: data.user,
          redirectTo
        };
      }

      return { success: false, error: new Error('User creation failed') };
    } catch (error) {
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      // State will be updated via onAuthStateChange
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isAdmin,
    isLoading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}