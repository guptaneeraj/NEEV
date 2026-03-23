import React, { useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Login() {
  const navigation = useNavigation<any>();
  const { sendOtp, verifyOtp } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<any[]>([]);

  const handleSendOtp = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(identifier);
      setStep('otp');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const isOnboardingComplete = await verifyOtp(identifier, otpString);
      if (isOnboardingComplete) {
        navigation.replace('Home');
      } else {
        navigation.replace('RegisterDetails');
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message);
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
            onPress={() => step === 'otp' ? setStep('input') : navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#2D5F3F" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'input' ? 'Welcome Back' : 'Enter OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'input'
                ? 'Sign in to continue your journey'
                : `We sent a 6-digit code to ${identifier}`}
            </Text>
          </View>

          {step === 'input' ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email or Phone</Text>
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#B0BDB5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#2D5F3F" />
                ) : (
                  <Text style={styles.loginButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => inputs.current[index] = ref}
                    style={styles.otpBox}
                    value={digit}
                    onChangeText={value => handleOtpChange(value, index)}
                    onKeyPress={e => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#2D5F3F" />
                ) : (
                  <Text style={styles.loginButtonText}>Verify & Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSendOtp} style={styles.resendButton}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', marginBottom: 16 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#2D5F3F', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7F71' },
  form: { gap: 24 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#2D5F3F' },
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 16,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  loginButton: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: 18, fontWeight: '600', color: '#2D5F3F' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 14, color: '#6B7F71' },
  footerLink: { fontSize: 14, fontWeight: '600', color: '#A8D5BA' },
  resendButton: { alignItems: 'center', paddingVertical: 8 },
  resendText: { fontSize: 14, color: '#6B7F71', textDecorationLine: 'underline' },
});