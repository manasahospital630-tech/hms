import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { User, UserRole, ApiResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hms_token'));

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('hms_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('hms_token');
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        localStorage.setItem('hms_user', JSON.stringify(response.data.data));
      }
    } catch (err: any) {
      console.warn('Profile sync warning:', err?.response?.data || err?.message);
      // ONLY log out if server explicitly returns 401 Unauthorized
      if (err?.response?.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []); // Run once on mount

  const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      const { token: newToken, user: loggedInUser } = response.data.data;
      localStorage.setItem('hms_token', newToken);
      localStorage.setItem('hms_user', JSON.stringify(loggedInUser));
      setToken(newToken);
      setUser(loggedInUser);
      setLoading(false);
      return loggedInUser;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
  };

  const isAuthenticated = !!user && !!token;

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
