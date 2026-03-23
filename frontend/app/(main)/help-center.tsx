import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useAIStore } from '../../store/useAIStore';
import { Theme } from '../../constants/Theme';

export default function HelpCenter() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { processChat, isLoading } = useAIStore();

  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || !user) return;

    setAiResponse('');
    setIsStreaming(true);

    // Create a mock profile to satisfy the AI contract
    const profile = {
      full_name: user.full_name,
      relationship_type: user.relationship_type,
      stage: user.stage
    };

    await processChat(user.id.toString(), question, profile, (token) => {
      setAiResponse(prev => prev + token);
    });

    setIsStreaming(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#2D5F3F" />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <Ionicons name="help-buoy" size={40} color="#2D5F3F" />
          <Text style={styles.introTitle}>How can NEEV help?</Text>
          <Text style={styles.introText}>
            Ask anything about the app, your child's development, or parenting tips.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Type your question here..."
            placeholderTextColor="#B0BDB5"
            multiline
            value={question}
            onChangeText={setQuestion}
          />
          <TouchableOpacity
            style={[styles.askButton, (!question.trim() || isLoading) && styles.disabledButton]}
            onPress={handleAsk}
            disabled={!question.trim() || isLoading}
          >
            {isLoading && !isStreaming ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.askButtonText}>Ask AI</Text>
                <Ionicons name="send" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {(aiResponse || isStreaming) && (
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Ionicons name="sparkles" size={20} color="#2D5F3F" />
              <Text style={styles.responseTitle}>NEEV Response</Text>
            </View>
            <Text style={styles.responseText}>{aiResponse}</Text>
            {isStreaming && (
              <View style={styles.streamingIndicator}>
                <View style={styles.dot} />
                <View style={[styles.dot, { opacity: 0.6 }]} />
                <View style={[styles.dot, { opacity: 0.3 }]} />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: '700', color: '#2D5F3F' },
  content: { padding: 20 },
  introCard: {
    backgroundColor: '#A8D5BA',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginBottom: 25,
    ...Theme.shadows.soft
  },
  introTitle: { fontSize: 22, fontWeight: '700', color: '#2D5F3F', marginTop: 10 },
  introText: { fontSize: 16, color: '#2D5F3F', textAlign: 'center', marginTop: 8, opacity: 0.8 },
  inputSection: { marginBottom: 25 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    color: '#2D5F3F',
    minHeight: 120,
    textAlignVertical: 'top',
    ...Theme.shadows.soft,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  askButton: {
    backgroundColor: '#2D5F3F',
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 10
  },
  disabledButton: { opacity: 0.6 },
  askButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  responseCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 25,
    ...Theme.shadows.soft,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  responseTitle: { fontSize: 18, fontWeight: '700', color: '#2D5F3F' },
  responseText: { fontSize: 16, color: '#6B7F71', lineHeight: 24 },
  streamingIndicator: { flexDirection: 'row', gap: 4, marginTop: 15 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2D5F3F' }
});
