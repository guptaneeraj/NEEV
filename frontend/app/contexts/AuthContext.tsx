import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@env';
import axios from 'axios';
import * as directusService from '../../services/DirectusApiClient';

// Live App Backend URL
const API_URL = BACKEND_URL;

// Create a configured axios instance for custom backend (FastAPI)
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
  fetchProfile: (identifier?: string) => Promise<any>;
  updateUser: (data: Partial<User>) => Promise<void>;
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

      // One-time cache migration - remove after one release
      const cacheVersion = await AsyncStorage.getItem('cache_v3');
      if (!cacheVersion) {
        await AsyncStorage.removeItem('userProfile');
        await AsyncStorage.setItem('cache_v3', '1');
      }

      const cachedUser = await AsyncStorage.getItem('userProfile');
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        // Apply same placeholder check before using cache
        const raw_name = parsed?.full_name;
        const is_placeholder = !raw_name ||
          raw_name === 'New User' ||
          raw_name === 'new user' ||
          raw_name.trim() === '';
        if (is_placeholder && parsed?.relationship_type) {
          parsed.full_name = parsed.relationship_type;
        } else if (is_placeholder && parsed?.first_name) {
          parsed.full_name = `${parsed.first_name} ${parsed.last_name || ''}`.trim();
        }
        setUser(parsed);
      }

      if (storedToken) {
        setToken(storedToken);
        const email = await AsyncStorage.getItem('userEmail');
        if (email) {
          fetchProfile(email);
        }
      }
    } catch (error) {
      console.log('Storage error');
    } finally {
      setIsLoading(false);
    }
  };

  const mapUserData = (directusUser: any, childrenData?: any[]): User => {
    // Standardize: Use 'role' as the relationship/role indicator (e.g., 'Mother', 'Father')
    const relationship_type =
      (directusUser.role &&
       directusUser.role !== 'user' &&
       directusUser.role !== 'admin'
       ? directusUser.role
       : null) || 'Parent';

    const raw_name = directusUser.full_name;
    const is_placeholder = !raw_name ||
      raw_name === 'New User' ||
      raw_name === 'new user' ||
      raw_name.trim() === '';
    const full_name = is_placeholder
      ? (directusUser.first_name
          ? `${directusUser.first_name} ${directusUser.last_name || ''}`.trim()
          : relationship_type)
      : raw_name;

    return {
      ...directusUser,
      children: childrenData || directusUser.children,
      stage: directusUser.stage || (directusUser.onboarding_complete ? 'child' : 'onboarding'),
      relationship_type, // Mapping for backward compatibility in components
      role: directusUser.role || relationship_type,
      full_name
    };
  };

  const fetchProfile = async (identifier?: string) => {
    try {
      const email = identifier || user?.email || (await AsyncStorage.getItem('userEmail'));
      if (!email) return null;
      
      const directusUser = await directusService.fetchUserProfile(email);

      if (directusUser) {
        const childrenData = await directusService.fetchUserChildren(directusUser.id);
        const userData = mapUserData(directusUser, childrenData);

        setUser(userData);
        await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching profile from Directus:', error.message);
      return null;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user?.id) return;
    try {
      const updated = await directusService.updateUserProfile(user.id, data);
      const mapped = mapUserData(updated);
      // Merge with existing user state to avoid losing fields not returned by update
      setUser(prev => {
        const newUser = prev ? { ...prev, ...mapped } : mapped;
        AsyncStorage.setItem('userProfile', JSON.stringify(newUser));
        return newUser;
      });
    } catch (error) {
      console.error('Update user error:', error);
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
      // Backend still handles OTP verification via FastAPI
      const response = await api.post('/api/auth/verify-otp', { identifier, otp });
      const { access_token } = response.data;

      setToken(access_token);
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('userEmail', identifier);

      // 1. Try fetching existing profile from Directus
      let userData = await fetchProfile(identifier);

      // 2. If no user exists in Directus yet, create a skeleton record
      if (!userData) {
        try {
          const newUser = await directusService.createDirectusUser({
            email: identifier,
            onboarding_complete: false,
            role: 'parent' // Default
          });

          if (newUser) {
            userData = {
              ...newUser,
              stage: 'onboarding',
              onboarding_complete: false
            };
            setUser(userData);
            await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
          }
        } catch (createErr) {
          console.error("Failed to create Directus skeleton user", createErr);
        }
      }

      return userData?.onboarding_complete || false;
    } catch (error: any) {
      console.error('Verify OTP Error:', error.message);
      // Even if Directus fails to find a user, if OTP is verified, we can let them through to onboarding
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userProfile');
    } catch (e) {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sendOtp, verifyOtp, logout, fetchProfile, updateUser }}>
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
