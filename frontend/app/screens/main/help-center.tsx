import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../../constants/Theme';

export default function HelpCenter() {
  const navigation = useNavigation<any>();
  const [question, setQuestion] = useState('');

  const handleAsk = () => {
    if (!question.trim()) return;
    navigation.navigate('AIChat', { initialQuestion: question });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <Ionicons name="help-buoy" size={40} color={Theme.colors.primary} />
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
            style={[styles.askButton, !question.trim() && styles.disabledButton]}
            onPress={handleAsk}
            disabled={!question.trim()}
          >
            <Text style={styles.askButtonText}>Ask AI</Text>
            <Ionicons name="send" size={18} color={Theme.colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Theme.colors.background,
  },
  backBtn: { marginRight: 15 },
  title: { fontSize: 22, fontWeight: '700', color: Theme.colors.primary },
  content: { padding: 24 },
  introCard: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginBottom: 25,
    ...Theme.shadows.soft,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary
  },
  introTitle: { fontSize: 22, fontWeight: '700', color: Theme.colors.primary, marginTop: 10 },
  introText: { fontSize: 16, color: Theme.colors.primary, textAlign: 'center', marginTop: 8, opacity: 0.8 },
  inputSection: { marginBottom: 25 },
  input: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    color: Theme.colors.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    ...Theme.shadows.soft,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent
  },
  askButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary
  },
  disabledButton: { opacity: 0.6 },
  askButtonText: { color: Theme.colors.white, fontSize: 18, fontWeight: '700' }
});
