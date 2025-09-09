'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  role: 'student' | 'admin' | null;
  isLoading: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: unknown; redirectTo?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: unknown; needsEmailConfirmation?: boolean; user?: User; redirectTo?: string }>;
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
  const [role, setRole] = useState<'student' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Computed property for isAdmin
  const isAdmin = role === 'admin';

  // Simple role determination based on email
  const determineUserRole = (email: string | undefined): 'student' | 'admin' => {
    const adminEmails = ['nchaitanyanaidu@yahoo.com', 'admin@example.com'];
    return email && adminEmails.includes(email) ? 'admin' : 'student';
  };

  // Initialize auth - much simpler approach
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          setUser(session.user);
          setRole(determineUserRole(session.user.email));
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (isMounted) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setRole(determineUserRole(session.user.email));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
      }
    });

    init();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error };
      }

      if (data.user && data.session) {
        const userRole = determineUserRole(data.user.email);
        const redirectTo = userRole === 'admin' ? '/admin/dashboard' : '/student/dashboard';
        
        setIsLoading(false);
        return { success: true, redirectTo };
      }

      setIsLoading(false);
      return { success: false, error: new Error('No user data received') };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error };
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
        setIsLoading(false);
        return { success: false, error };
      }

      if (data.user) {
        const redirectTo = '/student/dashboard';
        setIsLoading(false);
        
        return { 
          success: true, 
          needsEmailConfirmation: !data.session,
          user: data.user,
          redirectTo
        };
      }

      setIsLoading(false);
      return { success: false, error: new Error('User creation failed') };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Clear state immediately regardless of error
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Sign out catch error:', error);
      // Still clear state even if there was an error
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    role,
    isLoading,
    isAdmin,
    isInitialized,
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
