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
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'pregnancy' | 'child' | null>(null);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!stage) {
      Alert.alert('Error', 'Please select your stage');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, stage);
      router.replace('/(auth)/register-details');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#2D5F3F" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join NEEV family today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor="#B0BDB5"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#B0BDB5"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#6B7F71"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Journey</Text>
              <View style={styles.stageContainer}>
                <TouchableOpacity
                  style={[styles.stageCard, stage === 'pregnancy' && styles.stageCardActive]}
                  onPress={() => setStage('pregnancy')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="heart"
                    size={32}
                    color={stage === 'pregnancy' ? '#2D5F3F' : '#A8D5BA'}
                  />
                  <Text
                    style={[
                      styles.stageTitle,
                      stage === 'pregnancy' && styles.stageTitleActive,
                    ]}
                  >
                    Pregnancy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stageCard, stage === 'child' && styles.stageCardActive]}
                  onPress={() => setStage('child')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="happy"
                    size={32}
                    color={stage === 'child' ? '#2D5F3F' : '#A8D5BA'}
                  />
                  <Text
                    style={[
                      styles.stageTitle,
                      stage === 'child' && styles.stageTitleActive,
                    ]}
                  >
                    Parenting
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#2D5F3F" />
              ) : (
                <Text style={styles.registerButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D5F3F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7F71',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E9E3',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D5F3F',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  stageContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stageCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E9E3',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  stageCardActive: {
    borderColor: '#A8D5BA',
    backgroundColor: '#F0F8F4',
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7F71',
  },
  stageTitleActive: {
    color: '#2D5F3F',
  },
  registerButton: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7F71',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8D5BA',
  },
});