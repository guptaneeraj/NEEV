import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
  useAnimatedProps,
  FadeIn,
  withSequence
} from 'react-native-reanimated';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Theme } from '../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';
import { LeavesLayer } from '../components/LeavesLayer';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function LampScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { onboardingComplete } = route.params || {};

  const isLampOn = useSharedValue(0);
  const pullAnim = useSharedValue(0);

  const navigateNext = () => {
    navigation.replace(onboardingComplete ? 'Home' : 'Register');
  };

  const handlePull = () => {
    isLampOn.value = withTiming(1, { duration: 75 });

    // Animate cord down and then immediately back up
    pullAnim.value = withSequence(
      withSpring(0.6, { damping: 15, stiffness: 200 }),
      withSpring(0, { damping: 20, stiffness: 250 }, (finished) => {
        if (finished) {
          runOnJS(handleNavigation)();
        }
      })
    );
  };

  const handleNavigation = () => {
    // Start navigation after the cord snaps back
    navigation.replace(onboardingComplete ? 'Home' : 'Register');
  };

  const lampGlowStyle = useAnimatedStyle(() => ({
    opacity: isLampOn.value,
    transform: [{ scale: interpolate(isLampOn.value, [0, 1], [0.8, 1.8]) }],
  }));

  const onShadeProps = useAnimatedProps(() => ({
    opacity: isLampOn.value,
  }));

  const animatedCordProps = useAnimatedProps(() => ({
    transform: [{ translateY: pullAnim.value * verticalScale(35) }],
  }));

  return (
    <View style={styles.container}>
      <LeavesLayer color="#A8D5BA" fullScreen={true} />

      <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.mainText}>Illuminate the Path</Text>
          <Text style={styles.subText}>Your journey of mindful parenting begins with a single spark.</Text>
        </View>

        <View style={styles.lampSection}>
          <View style={styles.lampWrapper}>
            <Animated.View style={[styles.lampGlow, lampGlowStyle]}>
              <Svg height={scale(400)} width={scale(400)} viewBox="0 0 200 200">
                <Defs>
                  <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <Stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.85" />
                    <Stop offset="100%" stopColor="#FFF9C4" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="100" cy="100" r="100" fill="url(#grad)" />
              </Svg>
            </Animated.View>

            <Svg height={scale(280)} width={scale(180)} viewBox="0 0 140 220">
              <AnimatedG animatedProps={animatedCordProps}>
                <Path d="M90,80 L90,135" stroke="#AAA" strokeWidth={2} />
                <Circle cx={90} cy={140} r={8} fill="#D4AF37" />
              </AnimatedG>

              <Path
                d="M20,100 Q70,40 120,100 L120,110 Q70,115 20,110 Z"
                fill="#444444"
                stroke="#333"
                strokeWidth={0.5}
              />
              <AnimatedPath
                d="M20,100 Q70,40 120,100 L120,110 Q70,115 20,110 Z"
                fill="#FFFFFF"
                animatedProps={onShadeProps}
              />

              <Rect x={68} y={110} width={4} height={80} fill="#888" />
              <Path d="M40,190 L100,190 L110,200 L30,200 Z" fill="#888" />
            </Svg>

            <TouchableOpacity
              style={styles.cordTouchArea}
              onPress={handlePull}
              activeOpacity={1}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.pullHint}>Pull the cord to enter</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBF9', // Warm white/nature theme
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: verticalScale(60),
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  mainText: {
    fontSize: moderateScale(32),
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: verticalScale(12),
  },
  subText: {
    fontSize: moderateScale(18),
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: moderateScale(26),
    fontStyle: 'italic',
  },
  lampSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lampWrapper: {
    width: scale(180),
    height: scale(260),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampGlow: {
    position: 'absolute',
    top: verticalScale(-30),
    zIndex: 0,
  },
  cordTouchArea: {
    position: 'absolute',
    width: scale(120),
    height: scale(160),
    right: scale(-10),
    top: verticalScale(80),
    zIndex: 20,
  },
  footer: {
    paddingBottom: verticalScale(20),
  },
  pullHint: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
});
