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

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          setIsAdmin(isSeededAdmin(session.user.email || ''));
        } else {
          // Auto-authenticate the seeded admin user for initial setup and testing
          await autoAuthenticateAdmin();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // If session check fails, try auto-authentication
        await autoAuthenticateAdmin();
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
          setIsAdmin(isSeededAdmin(session.user.email || ''));
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const autoAuthenticateAdmin = async () => {
    try {
      // Attempt to sign in the seeded admin user automatically
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password
      });

      if (!error && data.user) {
        setUser(data.user);
        setIsAdmin(true);
        console.log('Auto-authenticated seeded admin user');
      } else {
        console.log('Admin user not found or credentials invalid, continuing without authentication');
      }
    } catch (error) {
      console.error('Auto-authentication failed:', error);
      // Continue without authentication - the app should still work for viewing content
    }
  };

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
      setIsAdmin(isSeededAdmin(email));
      return { success: true };
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
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}