import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiService from '../services/api';
import type { AuthResponse } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse | { requires2FA: boolean; userId: string; message: string; otpCode: string; expiresAt: Date }>;
  register: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  complete2FA: (userId: string, otpCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const profile = await apiService.getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await apiService.login({ email, password });
      
      // 2FA теперь всегда требуется для всех пользователей
      if (response.requires2FA) {
        return response;
      }
      
      // Если по какой-то причине 2FA не требуется, устанавливаем пользователя
      if (response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response: AuthResponse = await apiService.register({ username, email, password, firstName, lastName });
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const complete2FA = async (userId: string, otpCode: string) => {
    try {
      console.log('Starting 2FA completion...', { userId, otpCode });
      
      const response = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otpCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Неверный код 2FA');
      }

      const data = await response.json();
      console.log('2FA completion response:', data);
      
      // Сохраняем токен
      localStorage.setItem('auth_token', data.access_token);
      
      // Устанавливаем пользователя
      if (data.user) {
        console.log('Setting user in context:', data.user);
        setUser(data.user);
      } else {
        console.warn('No user data in 2FA response');
      }
    } catch (error) {
      console.error('2FA completion failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    complete2FA,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Экспортируем контекст для использования в хуке
export { AuthContext }; 