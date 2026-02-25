import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Landing() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && token) {
      router.replace('/(tabs)/dashboard');
    }
  }, [token, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="heart" size={80} color="#A8D5BA" />
          <Text style={styles.brandName}>NEEV</Text>
          <Text style={styles.tagline}>Mother & Child Wellness</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Your personalized companion for pregnancy and parenting journey
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => router.push('/(auth)/demo')}
            activeOpacity={0.8}
          >
            <Text style={styles.demoButtonText}>Try Demo (3 AI queries)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  brandName: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2D5F3F',
    marginTop: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7F71',
    marginTop: 8,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 18,
    color: '#5A6B5E',
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A8D5BA',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  demoButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 16,
    color: '#6B7F71',
    textDecorationLine: 'underline',
  },
});