import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Demo() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [queriesLeft, setQueriesLeft] = useState(3);

  const checkQueriesLeft = async () => {
    const count = await AsyncStorage.getItem('demoQueryCount');
    const used = count ? parseInt(count) : 0;
    setQueriesLeft(3 - used);
    return 3 - used;
  };

  React.useEffect(() => {
    checkQueriesLeft();
  }, []);

  const handleAsk = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    const left = await checkQueriesLeft();
    if (left <= 0) {
      Alert.alert(
        'Demo Limit Reached',
        'You have used all 3 demo queries. Please register to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Register', onPress: () => navigation.navigate('Register') },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/ask`, { query });
      setResponse(res.data.response);

      const count = await AsyncStorage.getItem('demoQueryCount');
      const newCount = count ? parseInt(count) + 1 : 1;
      await AsyncStorage.setItem('demoQueryCount', newCount.toString());
      setQueriesLeft(3 - newCount);

      if (newCount >= 3) {
        setTimeout(() => {
          Alert.alert(
            'Demo Limit Reached',
            'Register now to continue using NEEV!',
            [{ text: 'Register', onPress: () => navigation.navigate('Register') }]
          );
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2D5F3F" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="chatbubbles" size={48} color="#A8D5BA" />
          <Text style={styles.title}>Demo Mode</Text>
          <Text style={styles.subtitle}>Try our AI assistant (3 queries left: {queriesLeft})</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ask a Question</Text>
            <TextInput
              style={styles.textArea}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g., What exercises are safe during pregnancy?"
              placeholderTextColor="#B0BDB5"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.askButton, loading && styles.askButtonDisabled]}
            onPress={handleAsk}
            disabled={loading || queriesLeft <= 0}
          >
            {loading ? (
              <ActivityIndicator color="#2D5F3F" />
            ) : (
              <Text style={styles.askButtonText}>Ask AI</Text>
            )}
          </TouchableOpacity>

          {response ? (
            <View style={styles.responseContainer}>
              <Text style={styles.responseLabel}>Response:</Text>
              <Text style={styles.responseText}>{response}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.registerPrompt}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerPromptText}>
            Want unlimited access? Register now!
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7F71',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D5F3F',
    minHeight: 100,
  },
  askButton: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  askButtonDisabled: {
    opacity: 0.6,
  },
  askButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  responseContainer: {
    backgroundColor: '#F0F8F4',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  responseText: {
    fontSize: 15,
    color: '#5A6B5E',
    lineHeight: 22,
  },
  registerPrompt: {
    backgroundColor: '#A8D5BA',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  registerPromptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5F3F',
    textAlign: 'center',
  },
});
