import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { User, AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWith2FA: (userId: string, otpCode: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        // Проверяем валидность токена, получая профиль пользователя
        const userProfile = await api.getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Если токен невалиден, очищаем его
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.login({ email, password });
      
      if (response.user && response.access_token) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWith2FA = async (userId: string, otpCode: string): Promise<AuthResponse> => {
    try {
      const response = await api.loginWith2FA(userId, otpCode);
      
      if (response.user && response.access_token) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('2FA login error:', error);
      throw error;
    }
  };

  const register = async (userData: any): Promise<AuthResponse> => {
    try {
      const response = await api.register(userData);
      
      if (response.user && response.access_token) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Даже если API вызов не удался, очищаем локальное состояние
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await api.updateProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWith2FA,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
