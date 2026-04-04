import React from 'react';
import { Text, TextStyle } from 'react-native';

interface AppEmojiProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

// Forcing NotoColorEmoji-Regular to ensure Google Pixel-style emojis on all devices (including iOS)
const EMOJI_FONT = 'NotoColorEmoji-Regular';

/**
 * A component to ensure emojis look consistent across all platforms
 * by forcing the NotoColorEmoji-Regular font.
 */
const AppEmoji: React.FC<AppEmojiProps> = ({ children, style }) => {
  return (
    <Text style={[{ fontFamily: EMOJI_FONT }, style]}>
      {children}
    </Text>
  );
};

export default AppEmoji;
