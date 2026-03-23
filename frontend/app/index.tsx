import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Landing() {
  const navigation = useNavigation<any>();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && token) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
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
          <Ionicons name="sparkles" size={80} color="#A8D5BA" />
          <Text style={styles.brandName}>NEEV</Text>
          <Text style={styles.tagline}>AI-Guided Parenting</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            A calm, spiritual journey through your child's first 1,000 days.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Begin Journey</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F0' },
  content: { flex: 1, paddingHorizontal: 32, paddingVertical: 64, justifyContent: 'space-between' },
  logoContainer: { alignItems: 'center', marginTop: 40 },
  brandName: { fontSize: 42, fontWeight: '300', color: '#2D5F3F', marginTop: 16, letterSpacing: 8 },
  tagline: { fontSize: 16, color: '#6B7F71', marginTop: 8, fontWeight: '500' },
  descriptionContainer: { paddingHorizontal: 20 },
  description: { fontSize: 18, color: '#5A6B5E', textAlign: 'center', lineHeight: 28, fontWeight: '400' },
  buttonContainer: { marginBottom: 20 },
  primaryButton: { backgroundColor: '#2D5F3F', paddingVertical: 20, borderRadius: 25, alignItems: 'center' },
  primaryButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
