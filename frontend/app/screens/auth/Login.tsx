import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function Login() {
  const navigation = useNavigation<any>();
  const { sendOtp, verifyOtp } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter your Email or Phone Number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(identifier);
      setIsOtpSent(true);
      setTimer(60);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const onboardingComplete = await verifyOtp(identifier, otp);
      if (onboardingComplete) {
        navigation.replace('Home');
      } else {
        navigation.replace('Register');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={28} color={Theme.colors.primary} />
      </TouchableOpacity>

      <Animated.View entering={FadeInUp.duration(1000)} style={styles.formContainer}>
        <Text style={styles.title}>{isOtpSent ? 'Verify OTP' : 'Login / Sign Up'}</Text>
        <Text style={styles.subtitle}>
          {isOtpSent
            ? `Enter the 6-digit code sent to ${identifier}`
            : 'Enter your details to continue your parenting journey'}
        </Text>

        {!isOtpSent ? (
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#B0BDB5"
            />
          </View>
        ) : (
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#B0BDB5"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>{isOtpSent ? 'Verify & Continue' : 'Get OTP'}</Text>
          )}
        </TouchableOpacity>

        {isOtpSent && (
          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={timer > 0 || loading}
            style={styles.resendContainer}
          >
            <Text style={[styles.resendText, timer > 0 && { color: '#B0BDB5' }]}>
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0', padding: 30, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 24, zIndex: 10 },
  formContainer: { width: '100%' },
  title: { fontSize: 32, fontWeight: '700', color: Theme.colors.primary, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7F71', marginBottom: 40, lineHeight: 22 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E0E9E3',
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 60
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: Theme.colors.primary },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    ...Theme.shadows.soft
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  resendContainer: { marginTop: 25, alignItems: 'center' },
  resendText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 14 }
});
