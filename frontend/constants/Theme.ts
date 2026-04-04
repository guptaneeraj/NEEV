import { scale, verticalScale, moderateScale } from '../utils/responsive';

export const Theme = {
  colors: {
    background: '#FFF9F0',
    primary: '#2D5F3F',
    primaryLight: '#E0F2E9',
    secondary: '#A8D5BA',
    accent: '#E0E9E3',
    text: '#2D5F3F',
    textLight: '#6B7F71',
    white: '#FFFFFF',
    error: '#E07A5F',

    // Soft Palette for Cards/Buttons
    softGreen: '#E0F2E9',
    softGreenBorder: '#C1E1D2',
    softAmber: '#FEF3C7',
    softAmberBorder: '#FDE68A',
    softCyan: '#E0F7FA',
    softCyanBorder: '#B2EBF2',
    softRose: '#FFF1F2',
    softRoseBorder: '#FECDD3',
    softSlate: '#F8FAFC',
    softSlateBorder: '#E2E8F0',
    softViolet: '#F5F3FF',
    softVioletBorder: '#DDD6FE',
  },
  spacing: {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
  },
  borderRadius: {
    sm: moderateScale(8),
    md: moderateScale(15),
    lg: moderateScale(20),
    xl: moderateScale(25),
    xxl: moderateScale(30),
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // softSlateBorder default
  },
  button: {
    borderRadius: moderateScale(25),
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  }
};
