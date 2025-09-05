'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ADMIN_CREDENTIALS, isSeededAdmin } from '@/lib/auth-client';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: any; needsEmailConfirmation?: boolean; user?: User }>;
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserRole = async (userId: string, email: string) => {
    if (isSeededAdmin(email)) {
      setIsAdmin(true);
      return true;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const adminStatus = profile?.role === 'admin';
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await checkUserRole(session.user.id, session.user.email || '');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          // Ensure profile exists when user signs in or signs up
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              const { ensureProfileExists } = await import('@/lib/profile-utils');
              await ensureProfileExists(session.user);
            } catch (error) {
              console.warn('Could not ensure profile exists:', error);
              // Don't fail the auth process if profile creation fails
            }
          }
          
          await checkUserRole(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error };
      }

      setUser(data.user);
      await checkUserRole(data.user.id, email);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
          // Remove emailRedirectTo to disable email confirmation
        }
      });

      if (error) {
        return { success: false, error };
      }

      if (data.user) {
        // Set user immediately since we're not requiring email confirmation
        setUser(data.user);
        
        // Create profile manually if session exists (user is confirmed)
        if (data.session) {
          const { ensureProfileExists } = await import('@/lib/profile-utils');
          await ensureProfileExists(data.user);
          await checkUserRole(data.user.id, email);
        }
        
        return { 
          success: true, 
          needsEmailConfirmation: false, // Always false now
          user: data.user 
        };
      }

      return { success: false, error: new Error('User creation failed') };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    isAdmin,
    isLoading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}