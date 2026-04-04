import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (e.g. iPhone X)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales a size based on screen width.
 * Added 'worklet' to allow usage within Reanimated hooks.
 */
const scale = (size: number) => {
  'worklet';
  return (SCREEN_WIDTH / guidelineBaseWidth) * size;
};

/**
 * Scales a size based on screen height.
 */
const verticalScale = (size: number) => {
  'worklet';
  return (SCREEN_HEIGHT / guidelineBaseHeight) * size;
};

/**
 * Moderately scales a size.
 */
const moderateScale = (size: number, factor = 0.5) => {
  'worklet';
  return size + (scale(size) - size) * factor;
};

export { scale, verticalScale, moderateScale, SCREEN_WIDTH, SCREEN_HEIGHT };
