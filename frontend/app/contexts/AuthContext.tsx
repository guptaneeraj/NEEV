import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Live App Backend URL
const API_URL = "https://api.neevios.com";

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

interface User {
  id: number;
  email?: string;
  phone_number?: string;
  stage: string;
  role: string;
  relationship_type?: string;
  full_name?: string;
  onboarding_complete: boolean;
  children?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (identifier: string) => Promise<void>;
  verifyOtp: (identifier: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: (authToken?: string) => Promise<any>;
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
      const cachedUser = await AsyncStorage.getItem('userProfile');

      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      if (storedToken) {
        setToken(storedToken);
        fetchProfile(storedToken);
      }
    } catch (error) {
      console.log('Storage error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (authToken?: string) => {
    try {
      const tkn = authToken || token;
      if (!tkn) return null;
      
      const response = await api.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${tkn}` }
      });

      const userData = response.data;
      setUser(userData);
      await AsyncStorage.setItem('userProfile', JSON.stringify(userData));

      return userData;
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      if (error.response?.status === 401) {
        await logout();
      }
      return null;
    }
  };

  const sendOtp = async (identifier: string) => {
    try {
      console.log(`Attempting to send OTP to ${identifier}...`);
      const response = await api.post('/api/auth/send-otp', { identifier });
      console.log('OTP Sent Successfully:', response.data);
    } catch (error: any) {
      console.error('Detailed Send OTP Error:', {
        message: error.message,
        code: error.code,
        url: `${API_URL}/api/auth/send-otp`
      });
      throw new Error(error.response?.data?.detail || 'Network error: Could not connect to server.');
    }
  };

  const verifyOtp = async (identifier: string, otp: string): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/verify-otp', { identifier, otp });
      const { access_token } = response.data;

      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);
      const profile = await fetchProfile(access_token);

      return !!(profile?.relationship_type);
    } catch (error: any) {
      console.error('Verify OTP Error:', error.message);
      throw new Error(error.response?.data?.detail || 'Verification failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sendOtp, verifyOtp, logout, fetchProfile }}>
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
