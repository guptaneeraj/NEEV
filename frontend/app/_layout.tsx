import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';
import AIAssistant from '../components/AIAssistant';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <AIAssistant />
    </AuthProvider>
  );
}