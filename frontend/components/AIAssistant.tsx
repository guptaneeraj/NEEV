import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../app/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIAssistant() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Call local AI endpoint at port 81
      const response = await axios.post(
        'http://localhost:81/ask',
        { query: inputText },
        { timeout: 30000 }
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response || response.data.answer || 'No response from AI',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('AI request error:', error);
      
      // Show user-friendly error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ]
    );
  };

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

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={20} color="#2D5F3F" />
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Assistant</Text>
                <Text style={styles.headerSubtitle}>Ask me anything</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {messages.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={20} color="#6B7F71" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#2D5F3F" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={64} color="#E0E9E3" />
                <Text style={styles.emptyTitle}>Hi there!</Text>
                <Text style={styles.emptyText}>
                  I'm your AI wellness assistant. Ask me about pregnancy, parenting, nutrition, or
                  general wellness tips.
                </Text>
                <View style={styles.suggestionsContainer}>
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => setInputText('What are safe exercises during pregnancy?')}
                  >
                    <Text style={styles.suggestionText}>Safe exercises during pregnancy?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => setInputText('What foods should I avoid during pregnancy?')}
                  >
                    <Text style={styles.suggestionText}>Foods to avoid during pregnancy?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => setInputText('How to soothe a crying baby?')}
                  >
                    <Text style={styles.suggestionText}>How to soothe a crying baby?</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.aiMessageAvatar}>
                      <Ionicons name="sparkles" size={16} color="#2D5F3F" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageContent,
                      message.isUser ? styles.userContent : styles.aiContent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isUser ? styles.userText : styles.aiText,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        message.isUser ? styles.userTime : styles.aiTime,
                      ]}
                    >
                      {message.timestamp.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}
            {loading && (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color="#6B7F71" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your question..."
              placeholderTextColor="#B0BDB5"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#FFF9F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E9E3',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7F71',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7F71',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  suggestionsContainer: {
    marginTop: 16,
    gap: 12,
    width: '100%',
  },
  suggestion: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2D5F3F',
    textAlign: 'center',
  },
  messageBubble: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiMessageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F8F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 4,
  },
  userContent: {
    backgroundColor: '#A8D5BA',
    borderBottomRightRadius: 4,
  },
  aiContent: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E9E3',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#2D5F3F',
  },
  aiText: {
    color: '#2D5F3F',
  },
  messageTime: {
    fontSize: 10,
  },
  userTime: {
    color: '#2D5F3F',
    opacity: 0.7,
  },
  aiTime: {
    color: '#6B7F71',
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E9E3',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7F71',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E9E3',
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#E0E9E3',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D5F3F',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A8D5BA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});