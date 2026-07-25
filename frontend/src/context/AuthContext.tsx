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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hms_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
      }
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (token) {
        await fetchProfile();
      }
      setLoading(false);
    };
    init();
  }, [token, fetchProfile]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      const { token: newToken, user: loggedInUser } = response.data.data;
      setToken(newToken);
      setUser(loggedInUser);
      localStorage.setItem('hms_token', newToken);
      localStorage.setItem('hms_user', JSON.stringify(loggedInUser));
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
