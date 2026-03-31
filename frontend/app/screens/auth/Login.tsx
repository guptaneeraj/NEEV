import React, { useState, useEffect, useRef, memo } from 'react';
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
  Dimensions,
  Image,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  useAnimatedProps
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

const LoginHeader = memo(({ isOtpSent, identifier, animatedLogoStyle }: { isOtpSent: boolean, identifier: string, animatedLogoStyle: any }) => (
  <View style={styles.header}>
    <Animated.View entering={FadeInDown.duration(1500)} style={styles.logoContainer}>
      <View style={styles.logoGlowWrapper}>
        <Animated.View style={[styles.logoAnimatedContainer, animatedLogoStyle]}>
          <Image
            source={require('../../../assets/images/neuron_avatar.jpeg')}
            style={styles.logo}
          />
        </Animated.View>
      </View>
      <Text style={styles.brandName}>NEEV</Text>
      <Text style={styles.tagline}>
        Neural Engine for Early Values,{"\n"}Intelligence & Optimized Support
      </Text>
    </Animated.View>
    <Animated.View entering={FadeInUp.duration(1500).delay(200)} style={styles.titleSection}>
      <Text style={styles.title}>{isOtpSent ? 'Verify' : 'Login'}</Text>
      <Text style={styles.subtitle}>
        {isOtpSent
          ? `Verification code sent to ${identifier}`
          : "Let's continue your parenting journey"}
      </Text>
    </Animated.View>
  </View>
));

export default function Login() {
  const navigation = useNavigation<any>();
  const { sendOtp, verifyOtp } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const inputs = useRef<any[]>([]);

  // Animation values
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const heartbeatProgress = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    heartbeatProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const animatedPathProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: 400 * (1 - heartbeatProgress.value),
    };
  });

  const handleSendOtp = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter your Email');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(identifier);
      setIsOtpSent(true);
      setTimer(60);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split('');
      pastedOtp.forEach((char, i) => { if (i < 6) newOtp[i] = char; });
      setOtp(newOtp);
      inputs.current[Math.min(pastedOtp.length, 5)]?.focus();
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const onboardingComplete = await verifyOtp(identifier, otpString);
      navigation.replace(onboardingComplete ? 'Home' : 'Register');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Video
        source={require('../../../assets/images/neuron_background.mp4')}
        style={styles.backgroundVideo}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={0.5}
        ignoreSilentSwitch="obey"
      />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => isOtpSent ? setIsOtpSent(false) : navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>

          <LoginHeader
            isOtpSent={isOtpSent}
            identifier={identifier}
            animatedLogoStyle={animatedLogoStyle}
          />

          <View style={styles.formSection}>
            {!isOtpSent ? (
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={22} color={Theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>
            ) : (
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
                  />
                ))}
              </View>
            )}

            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Theme.colors.primary} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isOtpSent ? 'Verify & Continue' : 'Get OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {isOtpSent && (
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={timer > 0 || loading}
                style={styles.resendBtn}
              >
                <Text style={[styles.resendText, timer > 0 && { color: 'rgba(255,255,255,0.4)' }]}>
                  {timer > 0 ? `Resend code in ${timer}s` : 'Didn\'t receive code? Resend'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.creativeFooter}>
              <View style={styles.heartbeatContainer}>
                <Svg height="40" width={width - 60} viewBox="0 0 300 40">
                  <Path
                    d="M0,20 L120,20 L130,10 L140,30 L150,5 L160,35 L170,20 L300,20"
                    stroke="rgba(168, 230, 207, 0.1)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <AnimatedPath
                    d="M0,20 L120,20 L130,10 L140,30 L150,5 L160,35 L170,20 L300,20"
                    stroke={Theme.colors.secondary}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="400"
                    animatedProps={animatedPathProps}
                  />
                </Svg>
              </View>
              <Text style={styles.footerNote}>Building values, one heartbeat at a time</Text>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundVideo: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: height * 0.08,
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
  },
  header: {
    alignItems: 'center',
    marginBottom: height * 0.05
  },
  logoContainer: { alignItems: 'center' },
  logoGlowWrapper: {
    width: height * 0.16,
    height: height * 0.16,
    borderRadius: (height * 0.16) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 230, 207, 0.2)',
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 20,
    marginBottom: 20,
  },
  logoAnimatedContainer: {
    width: height * 0.145,
    height: height * 0.145,
    borderRadius: (height * 0.145) / 2,
    overflow: 'hidden',
  },
  logo: {
    width: height * 0.145,
    height: height * 0.145,
    borderWidth: 2,
    borderColor: Theme.colors.secondary,
  },
  brandName: {
    fontSize: height * 0.065,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 12,
    marginTop: height * 0.01,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 15
  },
  tagline: {
    fontSize: height * 0.018,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 5,
    lineHeight: height * 0.028,
  },
  titleSection: {
    marginTop: height * 0.04,
    alignItems: 'center',
  },
  formSection: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: height * 0.045,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 10
  },
  subtitle: {
    fontSize: height * 0.018,
    color: '#E0E9E3',
    marginBottom: height * 0.04,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 24
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: height * 0.075,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 230, 207, 0.3)',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#FFF',
    fontWeight: '800'
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  otpBox: {
    width: width * 0.12,
    aspectRatio: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.primary,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: Theme.colors.secondary,
  },
  primaryButton: {
    width: width - 60,
    paddingVertical: height * 0.02,
    borderRadius: 35,
    alignItems: 'center',
    backgroundColor: Theme.colors.secondary,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  primaryButtonText: {
    fontSize: height * 0.022,
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: 2
  },
  resendBtn: { marginTop: 20 },
  resendText: {
    color: Theme.colors.secondary,
    fontWeight: '800',
    fontSize: 16,
    textDecorationLine: 'underline'
  },
  creativeFooter: {
    marginTop: height * 0.05,
    width: '100%',
    alignItems: 'center',
  },
  heartbeatContainer: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  footerNote: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase'
  }
});
