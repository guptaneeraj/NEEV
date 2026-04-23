import { Dimensions } from 'react-native';
import { format, toZonedTime } from 'date-fns-tz';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// IST Timezone configuration
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Gets current date/time in IST
 */
const getISTDate = () => {
  return toZonedTime(new Date(), IST_TIMEZONE);
};

/**
 * Formats a date to IST with specified format
 */
const formatIST = (date: Date | string | number, formatStr: string) => {
  const zonedDate = toZonedTime(new Date(date), IST_TIMEZONE);
  return format(zonedDate, formatStr, { timeZone: IST_TIMEZONE });
};

/**
 * Gets local YYYY-MM-DD string for IST
 */
const getISTDateString = () => {
  return formatIST(new Date(), 'yyyy-MM-dd');
};

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

export {
  scale,
  verticalScale,
  moderateScale,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  IST_TIMEZONE,
  getISTDate,
  formatIST,
  getISTDateString
};

