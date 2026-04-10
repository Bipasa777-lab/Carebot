'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  profile: {
    firstName?: string;
    lastName?: string;
    location?: string;
    avatar?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrMobile: string, password: string) => Promise<void>;
  signup: (userData: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is logged in natively on app start via JWT
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          
          // Verify token is still valid with the real backend
          const profileData = await authAPI.getProfile().catch(() => null);
          if (profileData && profileData.user) {
            setUser({ ...JSON.parse(savedUser), ...profileData.user });
            localStorage.setItem('user', JSON.stringify({ ...JSON.parse(savedUser), ...profileData.user }));
          } else {
            // Token invalid or network down, clear session to force re-auth
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (emailOrMobile: string, password: string) => {
    try {
      const response = await authAPI.login({ emailOrMobile, password });
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  };

  const signup = async (userData: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      const response = await authAPI.signup(userData);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Signup failed. Please try again.');
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = { ...user, ...response.user };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
