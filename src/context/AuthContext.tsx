import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
    company_name?: string;
    location?: string;
  }) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isCandidate: boolean;
  isRecruiter: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hiresense_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('hiresense_token');
      const storedUser = localStorage.getItem('hiresense_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const me = await authApi.getMe();
          setUser(me);
          localStorage.setItem('hiresense_user', JSON.stringify(me));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('hiresense_token');
          localStorage.removeItem('hiresense_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      if (!data || !data.user) {
        throw new Error('Login failed: invalid response received from server.');
      }
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('hiresense_token', data.access_token);
      localStorage.setItem('hiresense_user', JSON.stringify(data.user));
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
    company_name?: string;
    location?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      if (!data || !data.user) {
        throw new Error('Registration failed: invalid response received from server.');
      }
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('hiresense_token', data.access_token);
      localStorage.setItem('hiresense_user', JSON.stringify(data.user));
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('hiresense_token');
    localStorage.removeItem('hiresense_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        isCandidate: user?.role === 'candidate',
        isRecruiter: user?.role === 'recruiter',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
