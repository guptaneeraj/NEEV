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
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 15,
    lg: 20,
    xl: 25,
    xxl: 30,
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
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // softSlateBorder default
  },
  button: {
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  }
};
