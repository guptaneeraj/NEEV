import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Video from 'react-native-video';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Theme } from '../../constants/Theme';

const { width, height } = Dimensions.get('window');

export default function Landing() {
  const navigation = useNavigation<any>();
  const { token, user, isLoading } = useAuth();
  const hasNavigated = useRef(false);

  // Rotation value for the logo
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Start continuous rotation
    rotation.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );

    if (isLoading || hasNavigated.current) return;

    if (token && user) {
      hasNavigated.current = true;
      if (user?.relationship_type) {
        navigation.replace('Home');
      } else {
        navigation.replace('Register');
      }
    }
  }, [token, isLoading, user]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value * 360}deg` }],
    };
  });

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
        <Animated.View entering={FadeInDown.duration(1500)} style={styles.logoContainer}>
          <View style={styles.logoGlowWrapper}>
            <Animated.View style={[styles.logoAnimatedContainer, animatedLogoStyle]}>
              <Image
                source={require('../../assets/images/neuron_avatar.jpeg')}
                style={styles.logo}
              />
            </Animated.View>
          </View>
          <Text style={styles.brandName}>NEEV</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(1500)} style={styles.footer}>
          <Text style={styles.description}>
            Neural Engine for Early Values,{"\n"}Intelligence & Optimized Support.
          </Text>

          <Text style={styles.subDescription}>
            Personalized guidance for pregnancy{"\n"}and your child's early years
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, {backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.primary, borderWidth: 1.5}]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Begin Journey</Text>
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
    paddingHorizontal: 30,
    paddingVertical: height * 0.08
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
    marginBottom: height * 0.02,
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
  footer: { alignItems: 'center', width: '100%' },
  description: {
    fontSize: height * 0.032,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: height * 0.045,
    marginBottom: height * 0.06,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 5
  },
  subDescription: {
    fontSize: height * 0.02,
    color: '#E0E9E3',
    textAlign: 'center',
    lineHeight: height * 0.028,
    marginBottom: height * 0.04,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3
  },
  primaryButton: {
    width: '100%',
    paddingVertical: height * 0.022,
    borderRadius: height * 0.04,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: height * 0.03,
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: 2
  },
});
