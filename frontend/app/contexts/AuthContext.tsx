import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Live App Backend URL
const API_URL = "https://api.neevios.com";

interface User {
  id: number;
  email?: string;
  phone_number?: string;
  stage: string;
  role: string;
  relationship_type?: string;
  full_name?: string;
  onboarding_complete: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (identifier: string) => Promise<void>;
  verifyOtp: (identifier: string, otp: string) => Promise<boolean>;
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
      console.log('Storage error');
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
      // If profile fetch fails with 401, logout
      if ((error as any).response?.status === 401) {
        await logout();
      }
      return null;
    }
  };

  const sendOtp = async (identifier: string) => {
    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, { identifier });
    } catch (error: any) {
      console.error('Send OTP Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to send OTP.');
    }
  };

  const verifyOtp = async (identifier: string, otp: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, { identifier, otp });
      const { access_token, onboarding_complete } = response.data;

      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);
      const profile = await fetchProfile(access_token);

      return !!(profile?.relationship_type);
    } catch (error: any) {
      console.error('Verify OTP Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Verification failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
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
