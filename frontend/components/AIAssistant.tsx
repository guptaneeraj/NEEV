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

// POINTING TO YOUR EXISTING AI FRONTEND (IIS Port 81)
const AI_WEB_URL = 'https://ai.neevios.com';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Bubble */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={28} color="#FFF" />
        <View style={styles.pulseDot} />
      </TouchableOpacity>

      {/* Chat Modal with WebView */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#2D5F3F" />
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
    bottom: 80,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#A8D5BA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  pulseDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2D5F3F',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E9E3',
    backgroundColor: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
});
