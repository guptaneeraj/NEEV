import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface LoadingLogoProps {
  size?: number;
}

const LoadingLogo: React.FC<LoadingLogoProps> = ({ size = 60 }) => {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedRotation = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedGlow = useAnimatedStyle(() => {
    const opacity = interpolate(pulse.value, [0, 1], [0.2, 1]);
    return {
      opacity,
      shadowOpacity: opacity,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.glow,
          { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
          animatedGlow,
        ]}
      />
      <Animated.View style={[styles.logoContainer, animatedRotation]}>
        <Image
          source={require('../assets/images/neuron_avatar.jpeg')}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    zIndex: 1,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#A8D5BA',
    shadowColor: '#A8D5BA',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
});

export default LoadingLogo;
