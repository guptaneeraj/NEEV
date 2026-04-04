import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Svg, { Path } from 'react-native-svg';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', icon: '' });
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

  const showAlert = (title: string, message: string, icon: string = '⚠️') => {
    setModalConfig({ title, message, icon });
    setModalVisible(true);
  };

  const handleSendOtp = async () => {
    if (!identifier) {
      showAlert('Email Required', 'Please enter your email to continue.', '📧');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(identifier);
      setIsOtpSent(true);
      setTimer(60);
    } catch (error: any) {
      showAlert('Login Failed', error.message || 'Failed to send OTP. Please try again.', '❌');
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
      showAlert('Invalid Code', 'Please enter the 6-digit verification code sent to your email.', '🔢');
      return;
    }
    setLoading(true);
    try {
      const onboardingComplete = await verifyOtp(identifier, otpString);
      if (onboardingComplete) {
        navigation.replace('Home');
      } else {
        navigation.replace('LampScreen', { onboardingComplete: false });
      }
    } catch (error: any) {
      showAlert('Verification Failed', error.message || 'The code you entered is incorrect.', '❌');
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
            onPress={() => isOtpSent ? setIsOtpSent(false) : (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Landing'))}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={scale(28)} color="#FFF" />
          </TouchableOpacity>

          <LoginHeader
            isOtpSent={isOtpSent}
            identifier={identifier}
            animatedLogoStyle={animatedLogoStyle}
          />

          <View style={styles.formSection}>
            {!isOtpSent ? (
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={scale(22)} color={Theme.colors.secondary} style={styles.inputIcon} />
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
                <Svg height={verticalScale(40)} width={SCREEN_WIDTH - scale(60)} viewBox="0 0 300 40">
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
          <View style={{ height: verticalScale(100) }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <NeevModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        onConfirm={() => setModalVisible(false)}
      />
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
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(60),
  },
  backBtn: {
    position: 'absolute',
    top: verticalScale(20),
    left: 0,
    zIndex: 10,
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: scale(22),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(40)
  },
  logoContainer: { alignItems: 'center' },
  logoGlowWrapper: {
    width: scale(130),
    height: scale(130),
    borderRadius: scale(65),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 230, 207, 0.2)',
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 20,
    marginBottom: verticalScale(16),
  },
  logoAnimatedContainer: {
    width: scale(115),
    height: scale(115),
    borderRadius: scale(57.5),
    overflow: 'hidden',
  },
  logo: {
    width: scale(115),
    height: scale(115),
    borderWidth: 2,
    borderColor: Theme.colors.secondary,
  },
  brandName: {
    fontSize: moderateScale(52),
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 12,
    marginTop: verticalScale(8),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 15
  },
  tagline: {
    fontSize: moderateScale(14),
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 5,
    lineHeight: moderateScale(22),
  },
  titleSection: {
    marginTop: verticalScale(30),
    alignItems: 'center',
  },
  formSection: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(36),
    fontWeight: '900',
    color: '#FFF',
    marginBottom: verticalScale(8),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 10
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#E0E9E3',
    marginBottom: verticalScale(30),
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: moderateScale(20)
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(30),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(16),
    height: verticalScale(60),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 230, 207, 0.3)',
  },
  inputIcon: { marginRight: scale(12) },
  input: {
    flex: 1,
    fontSize: moderateScale(18),
    color: '#FFF',
    fontWeight: '800'
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: verticalScale(16),
  },
  otpBox: {
    width: scale(48),
    aspectRatio: 1,
    borderRadius: moderateScale(12),
    textAlign: 'center',
    fontSize: moderateScale(24),
    fontWeight: '900',
    color: Theme.colors.primary,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: Theme.colors.secondary,
  },
  primaryButton: {
    width: SCREEN_WIDTH - scale(60),
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(35),
    alignItems: 'center',
    backgroundColor: Theme.colors.secondary,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  primaryButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: 2
  },
  resendBtn: { marginTop: verticalScale(16) },
  resendText: {
    color: Theme.colors.secondary,
    fontWeight: '800',
    fontSize: moderateScale(16),
    textDecorationLine: 'underline'
  },
  creativeFooter: {
    marginTop: verticalScale(40),
    width: '100%',
    alignItems: 'center',
  },
  heartbeatContainer: {
    width: '100%',
    height: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8)
  },
  footerNote: {
    fontSize: moderateScale(10),
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase'
  }
});
