import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import { Theme } from '../constants/Theme';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const AI_WEB_URL = 'https://ai.neevios.com';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={moderateScale(28)} color={Theme.colors.white} />
        <View style={styles.pulseDot} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
              <Ionicons name="close" size={moderateScale(28)} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <WebView
            source={{ uri: AI_WEB_URL }}
            style={{ flex: 1 }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: verticalScale(80),
    right: scale(24),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
  },
  pulseDot: {
    position: 'absolute',
    top: verticalScale(8),
    right: scale(8),
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: Theme.colors.primary,
    borderWidth: 1,
    borderColor: Theme.colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    height: verticalScale(60),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    borderBottomWidth: 1.5,
    borderBottomColor: Theme.colors.accent,
    backgroundColor: Theme.colors.background,
  },
  closeButton: {
    padding: scale(4),
  },
});
