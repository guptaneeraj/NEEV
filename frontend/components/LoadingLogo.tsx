import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scale, moderateScale } from '../utils/responsive';

interface Props {
  size?: number;
}

export default function LoadingLogo({ size = scale(80) }: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.logoWrapper, animatedStyle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={require('../assets/images/neuron_avatar.jpeg')}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#A8D5BA',
  },
});
