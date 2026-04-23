import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { scale } from '../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// More distinct shapes for variety
const LEAF_ICONS = ['leaf', 'leaf-outline', 'leaf-sharp', 'flower-outline'];

interface LeafProps {
  color: string;
  index: number;
  fullScreen?: boolean;
}

const Leaf = ({ color, index, fullScreen }: LeafProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Assign a random icon style
  const iconName = useMemo(() => LEAF_ICONS[Math.floor(Math.random() * LEAF_ICONS.length)], []);

  // Randomize initial flip and spin directions
  const randomFlip = useMemo(() => Math.random() > 0.5 ? 1 : -1, []);
  const randomSpin = useMemo(() => Math.random() > 0.5 ? 1 : -1, []);

  useEffect(() => {
    const runAnimation = () => {
      animatedValue.setValue(0);

      const delay = Math.random() * 12000;
      const duration = 12000 + Math.random() * 10000;

      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start(() => runAnimation());
    };

    runAnimation();
  }, [animatedValue]);

  // Start from various depths behind the left edge to stagger appearance
  const startX = useMemo(() => -scale(50) - Math.random() * scale(100), []);
  const startY = useMemo(() => Math.random() * (fullScreen ? SCREEN_HEIGHT : scale(160)), []);

  // Drift Pattern: wind blowing from left to right, reaching past the screen
  const driftX = useMemo(() => SCREEN_WIDTH + scale(200), []);
  // Wider vertical drift to prevent clumping
  const driftY = useMemo(() => (Math.random() - 0.5) * scale(150), []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, startX + driftX],
  });

  // translateY with a "wobble" (sine wave) effect for turbulence
  const translateY = animatedValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      startY,
      startY + driftY * 0.2 + scale(10),
      startY + driftY * 0.4 - scale(10),
      startY + driftY * 0.6 + scale(15),
      startY + driftY * 0.8 - scale(5),
      startY + driftY
    ],
  });

  // Fade in at start and fade out much later, almost at the right edge
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.5, 0.5, 0],
    extrapolate: 'clamp'
  });

  // Flat rotation (Spin)
  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${randomSpin * (360 + Math.random() * 720)}deg`],
  });

  // 3D Flipping effect
  const rotateY = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', `${randomFlip * 180}deg`, `${randomFlip * 360}deg`],
  });

  // Scale variety for depth
  const scaleVal = 0.3 + Math.random() * 0.7;

  return (
    <Animated.View
      style={[
        styles.leafContainer,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { rotateY },
            { scale: scaleVal },
          ],
        },
      ]}
    >
      <Ionicons name={iconName} size={scale(16)} color={color} />
    </Animated.View>
  );
};

export const LeavesLayer = ({ color, fullScreen = false }: { color: string; fullScreen?: boolean }) => {
  const leavesCount = fullScreen ? 120 : 80; // Restoring original count as requested
  const leaves = useMemo(() => Array.from({ length: leavesCount }), [leavesCount]);

  return (
    <View style={styles.container} pointerEvents="none">
      {leaves.map((_, i) => (
        <Leaf key={i} index={i} color={color} fullScreen={fullScreen} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  leafContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
