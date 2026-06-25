'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '@/types';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';

// Default mock user fallback (without fixed ID)
const defaultUser: User = {
  id: '',
  fullName: 'Alex Mercer',
  phone: '+254 712 345 678',
  email: 'alex.mercer@student.uonbi.ac.ke',
  university: 'Technical University of Kenya',
  regNumber: 'SCCI/00586/2020',
  isVerified: true,
  avatar: DEFAULT_AVATAR,
  totalSaved: 4500,
  mealsEnjoyed: 12,
};

interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  isAuthenticated: boolean;
  login: (userData?: Partial<User>) => void;
  logout: () => void;
  updateStats: (savedAmount: number) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch real mock user from Supabase if available
  useEffect(() => {
    async function loadMockUser() {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .limit(1)
        .single();
        
      if (data && !error) {
        setUser({
          id: data.id,
          fullName: data.full_name,
          phone: data.phone,
          email: 'alex.mercer@student.uonbi.ac.ke', // Mock fallback since email is in auth
          university: data.university,
          regNumber: data.reg_number,
          isVerified: data.is_verified,
          avatar: data.id_photo_url || DEFAULT_AVATAR,
          totalSaved: data.total_saved,
          mealsEnjoyed: data.meals_enjoyed,
        });
      }
    }
    loadMockUser();
  }, []);

  const login = useCallback((userData?: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...userData }));
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const updateStats = useCallback((savedAmount: number) => {
    setUser((prev) => ({
      ...prev,
      mealsEnjoyed: prev.mealsEnjoyed + 1,
      totalSaved: prev.totalSaved + savedAmount,
    }));
  }, []);

  return (
    <UserContext.Provider
      value={{ user, setUser, isAuthenticated, login, logout, updateStats }}
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
