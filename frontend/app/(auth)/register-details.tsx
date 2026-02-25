import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function RegisterDetails() {
  const router = useRouter();
  const { user, token, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Pregnancy state
  const [currentWeek, setCurrentWeek] = useState('');

  // Child state
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (user?.stage === 'pregnancy') {
        if (!currentWeek || parseInt(currentWeek) < 1 || parseInt(currentWeek) > 42) {
          Alert.alert('Error', 'Please enter a valid pregnancy week (1-42)');
          setLoading(false);
          return;
        }

        await axios.post(
          `${API_URL}/api/user/pregnancy`,
          { current_week: parseInt(currentWeek) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        if (!childName || !childDOB) {
          Alert.alert('Error', 'Please fill in all child details');
          setLoading(false);
          return;
        }

        await axios.post(
          `${API_URL}/api/user/child`,
          { name: childName, dob: childDOB },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchProfile();
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="information-circle" size={48} color="#A8D5BA" />
            <Text style={styles.title}>Tell Us More</Text>
            <Text style={styles.subtitle}>
              Help us personalize your experience
            </Text>
          </View>

          <View style={styles.form}>
            {user?.stage === 'pregnancy' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Current Pregnancy Week</Text>
                <TextInput
                  style={styles.input}
                  value={currentWeek}
                  onChangeText={setCurrentWeek}
                  placeholder="e.g., 12"
                  placeholderTextColor="#B0BDB5"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.hint}>Enter a number between 1 and 42</Text>
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Child's Name</Text>
                  <TextInput
                    style={styles.input}
                    value={childName}
                    onChangeText={setChildName}
                    placeholder="Enter child's name"
                    placeholderTextColor="#B0BDB5"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    value={childDOB}
                    onChangeText={setChildDOB}
                    placeholder="YYYY-MM-DD (e.g., 2023-06-15)"
                    placeholderTextColor="#B0BDB5"
                  />
                  <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#2D5F3F" />
              ) : (
                <Text style={styles.submitButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.replace('/(tabs)/dashboard')}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7F71',
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D5F3F',
  },
  hint: {
    fontSize: 12,
    color: '#6B7F71',
  },
  submitButton: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7F71',
  },
});