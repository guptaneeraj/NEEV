import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import LoadingLogo from '../../components/LoadingLogo';

export default function AIChat() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const webViewUrl = `https://f.neevios.com?uid=${user?.id || ''}`;

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      // Scrolling down - hide
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Scrolling up - show
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    lastScrollY.current = currentScrollY;
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: webViewUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onScroll={handleScroll}
      />

      <Animated.View style={[styles.floatingBackContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2D5F3F" />
        </TouchableOpacity>
      </Animated.View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingLogo size={80} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  webview: { flex: 1 },
  floatingBackContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
