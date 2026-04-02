import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'customer' | 'supplier' | 'warehouse_manager';
  customer_id: number | null;
  supplier_id: number | null;
  warehouse_id: number | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timed out');
        setLoading(false);
      }
    }, 15000);

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }).catch(err => {
      console.error('Session check failed:', err);
      setLoading(false);
      clearTimeout(timeoutId);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile not found, retry a few times (trigger might be slow)
        if (error.code === 'PGRST116' && retryCount < 5) {
          console.log(`Profile not found, retrying... (${retryCount + 1}/5)`);
          setTimeout(() => fetchProfile(userId, retryCount + 1), 2000);
          return;
        }
        throw error;
      }
      setProfile(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message || 'Failed to fetch user profile');
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
