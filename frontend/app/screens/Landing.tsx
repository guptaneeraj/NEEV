import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Video from 'react-native-video';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  withSpring,
  interpolate,
  runOnJS,
  useAnimatedProps
} from 'react-native-reanimated';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Theme } from '../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function Landing() {
  const navigation = useNavigation<any>();
  const { token, user, isLoading } = useAuth();
  const hasNavigated = useRef(false);

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );

    if (isLoading || hasNavigated.current) return;

    if (token && user) {
      hasNavigated.current = true;
      const onboardingComplete = !!user?.onboarding_complete;
      if (onboardingComplete) {
        navigation.replace('Home');
      } else {
        navigation.replace('LampScreen', { onboardingComplete });
      }
    }
  }, [token, isLoading, user, navigation]);

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/images/neuron_background.mp4')}
        style={styles.backgroundVideo}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={0.9}
        ignoreSilentSwitch="obey"
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(1500)} style={styles.logoHeader}>
          <View style={styles.logoGlowWrapper}>
            <Animated.View style={[styles.logoAnimatedContainer, animatedLogoStyle]}>
              <Image
                source={require('../../assets/images/neuron_avatar.jpeg')}
                style={styles.logo}
              />
            </Animated.View>
          </View>
          <Text style={styles.brandName}>NEEV</Text>
          <Text style={styles.aiTagline}>AI-Guided Parenting</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(1500)} style={styles.middleSection}>
          <Text style={styles.mainTitle}>
            Neural Engine for Early Values,{"\n"}Intelligence & Optimized Support.
          </Text>
          <Text style={styles.subDescription}>
            Personalized guidance for pregnancy{"\n"}and your child's early years
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(1000)} style={styles.footer}>
          <TouchableOpacity
            style={styles.beginButton}
            onPress={navigateToLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.beginButtonText}>Begin Journey</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundVideo: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)'
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(50)
  },
  logoHeader: {
    alignItems: 'center',
  },
  logoGlowWrapper: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
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
    width: scale(95),
    height: scale(95),
    borderRadius: scale(47.5),
    overflow: 'hidden',
  },
  logo: {
    width: scale(95),
    height: scale(95),
    borderWidth: 2,
    borderColor: Theme.colors.secondary,
  },
  brandName: {
    fontSize: moderateScale(48),
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 15
  },
  aiTagline: {
    fontSize: moderateScale(18),
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: verticalScale(10),
    textTransform: 'uppercase'
  },
  middleSection: {
    alignItems: 'center',
    marginVertical: verticalScale(20)
  },
  mainTitle: {
    fontSize: moderateScale(26),
    color: '#FFF',
    textAlign: 'center',
    lineHeight: moderateScale(36),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: verticalScale(20),
  },
  subDescription: {
    fontSize: moderateScale(16),
    color: '#E0E9E3',
    textAlign: 'center',
    lineHeight: moderateScale(24),
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  beginButton: {
    backgroundColor: '#A8D5BA',
    width: '100%',
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(40),
    alignItems: 'center',
    shadowColor: '#A8D5BA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  beginButtonText: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#2D5F3F',
    letterSpacing: 1,
  },
});
