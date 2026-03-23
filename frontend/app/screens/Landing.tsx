import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Video from 'react-native-video';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Theme } from '../../constants/Theme';

const { width, height } = Dimensions.get('window');

export default function Landing() {
  const navigation = useNavigation<any>();
  const { token, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && token) {
      if (user?.relationship_type) {
        navigation.replace('Home');
      } else {
        navigation.replace('Register');
      }
    }
  }, [token, isLoading, user]);

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/images/neuron_background.mp4')}
        style={styles.backgroundVideo}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={1.0}
        ignoreSilentSwitch="obey"
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(1500)} style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/neuron_avatar.jpeg')}
            style={styles.logo}
          />
          <Text style={styles.brandName}>NEEV</Text>
          <Text style={styles.tagline}>AI-Guided Parenting</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(1500)} style={styles.footer}>
          <Text style={styles.description}>
            A calm, spiritual journey through your child's first 1,000 days.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 30, paddingVertical: 80 },
  logoContainer: { alignItems: 'center' },
  logo: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#A8D5BA', marginBottom: 20 },
  brandName: { fontSize: 48, fontWeight: '200', color: '#FFF', letterSpacing: 12, marginBottom: 8 },
  tagline: { fontSize: 16, color: '#A8D5BA', fontWeight: '500', letterSpacing: 2 },
  footer: { alignItems: 'center' },
  description: { fontSize: 18, color: '#E0E9E3', textAlign: 'center', lineHeight: 28, marginBottom: 40, fontWeight: '300' },
  primaryButton: { backgroundColor: '#2D5F3F', width: '100%', paddingVertical: 20, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: '#A8D5BA' },
  primaryButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF', letterSpacing: 1 },
});
