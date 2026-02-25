import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: number;
  email: string;
  stage: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, stage: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        await fetchProfile(storedToken);
      }
    } catch (error) {
      // AsyncStorage not available on web, skip
      console.log('Storage not available');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (authToken?: string) => {
    try {
      const tkn = authToken || token;
      if (!tkn) return null;
      
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${tkn}` }
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/login`, { email, password });
      const { access_token } = response.data;
      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);
      await fetchProfile(access_token);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (email: string, password: string, stage: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/register`, { email, password, stage });
      const { access_token } = response.data;
      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);
      await fetchProfile(access_token);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('demoQueryCount');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};