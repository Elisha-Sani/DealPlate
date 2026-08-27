'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '@/types';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (userData?: Partial<User>) => void;
  logout: () => void;
  updateStats: (savedAmount: number) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Use getUser() (not getSession()) here — it revalidates against the
    // Supabase Auth server instead of trusting the locally stored session.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (user.app_metadata?.account_status === 'revoked') {
          supabase.auth.signOut().then(() => {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoadingAuth(false);
          });
          return;
        }

        if (user.app_metadata?.role === 'student' || !user.app_metadata?.role) {
          fetchStudentProfile(user.id, user.email || '');
        } else {
          setIsLoadingAuth(false);
        }
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.user.app_metadata?.account_status === 'revoked') {
          supabase.auth.signOut();
          setUser(null);
          setIsAuthenticated(false);
          setIsLoadingAuth(false);
          return;
        }

        if (session.user.app_metadata?.role === 'student' || !session.user.app_metadata?.role) {
          fetchStudentProfile(session.user.id, session.user.email || '');
        } else {
          setIsLoadingAuth(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchStudentProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      setUser({
        id: data.id,
        fullName: data.full_name,
        phone: data.phone,
        email: email,
        university: data.university,
        regNumber: data.reg_number,
        isVerified: data.is_verified,
        avatar: data.id_photo_url || DEFAULT_AVATAR,
        totalSaved: Number(data.total_saved),
        mealsEnjoyed: Number(data.meals_enjoyed),
      });
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  };

  const login = useCallback((userData?: Partial<User>) => {
    // Used for optimistic updates if needed
    if (user) {
      setUser({ ...user, ...userData });
    }
    setIsAuthenticated(true);
  }, [user]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateStats = useCallback((savedAmount: number) => {
    setUser((prev) => prev ? ({
      ...prev,
      mealsEnjoyed: prev.mealsEnjoyed + 1,
      totalSaved: prev.totalSaved + savedAmount,
    }) : null);
  }, []);

  return (
    <UserContext.Provider
      value={{ user, setUser, isAuthenticated, isLoadingAuth, login, logout, updateStats }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
