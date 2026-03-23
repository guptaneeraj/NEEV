import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAIStore } from '../../store/useAIStore';
import LoadingLogo from '../../components/LoadingLogo';

const API_URL = 'https://api.neevios.com';

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😌', label: 'Calm' },
];

export default function MoodTracking() {
  const { token, user } = useAuth();
  const { processChat, getStoredSessionId, selectedChildId } = useAIStore();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [notes, setNotes] = useState('');

  // AI state
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [latestMoodId, setLatestMoodId] = useState<number | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mood/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { days: 30 },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading mood logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Build minimal child_profile for mood AI call ─────────────────────────
  const buildChildProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prof = res.data;
      const firstChild = prof?.children?.[0] || null;
      return {
        full_name: prof?.full_name || null,
        relationship_type: prof?.relationship_type || null,
        stage: prof?.stage || 'parenting',
        child_name: firstChild?.name || null,
        child_dob: firstChild?.dob
          ? new Date(firstChild.dob).toISOString().split('T')[0]
          : null,
        child_sex: firstChild?.sex || null,
        diet_preference: firstChild?.diet_preference || null,
        mood_logs: logs.slice(0, 5).map((l: any) => ({
          mood: l.mood,
          notes: l.notes,
          date: l.date,
        })),
        health_records: [],
        task_completions: [],
      };
    } catch {
      return {};
    }
  };

  // ─── Ask AI after mood is saved ───────────────────────────────────────────
  const askAI = async (mood: string, noteText: string, recentLogs: any[]) => {
    if (!user?.id) return;
    const userId = user.id.toString();
    const childId = selectedChildId || userId;

    setAiLoading(true);
    setAiResponse(null);

    const question = noteText.trim()
      ? `I just logged that I'm feeling ${mood}. ${noteText.trim()}. Any advice?`
      : `I just logged that I'm feeling ${mood}. Any advice?`;

    const sessionId = await getStoredSessionId(userId, childId);
    const rawProfile = await buildChildProfile();

    // Object.keys check to ensure {} is not sent
    const childProfile = (rawProfile && Object.keys(rawProfile).length > 0) ? rawProfile : null;

    if (childProfile) {
      // inject the just-saved mood into profile before sending
      childProfile.mood_logs = [
        { mood, notes: noteText, date: new Date().toISOString() },
        ...recentLogs.slice(0, 4).map((l: any) => ({
          mood: l.mood,
          notes: l.notes,
          date: l.date,
        })),
      ];
    }

    let response = '';
    try {
      await processChat(userId, question, childProfile, (token) => {
        response += token;
        setAiResponse(response);
      });
    } catch (error) {
      console.error('AI advice error:', error);
      setAiResponse("I'm sorry, I couldn't get advice right now. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Save mood log ────────────────────────────────────────────────────────
  const handleLogMood = async () => {
    if (!selectedMood) {
      Alert.alert('Error', 'Please select a mood');
      return;
    }

    const moodToSave = selectedMood;
    const notesToSave = notes;

    try {
      const res = await axios.post(
        `${API_URL}/api/mood/log`,
        { mood: moodToSave, notes: notesToSave },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLatestMoodId(res.data?.id || null);
      setModalVisible(false);
      setSelectedMood('');
      setNotes('');

      await loadLogs();
      askAI(moodToSave, notesToSave, logs);
    } catch {
      Alert.alert('Error', 'Failed to log mood');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingLogo size={80} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood Tracking</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {(aiLoading || aiResponse) && (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <Ionicons name="sparkles" size={16} color="#2D5F3F" />
              <Text style={styles.aiCardLabel}>Neev AI</Text>
            </View>
            {aiLoading && !aiResponse ? (
              <View style={styles.aiLoadingRow}>
                <LoadingLogo size={24} />
                <Text style={styles.aiLoadingText}>Getting advice…</Text>
              </View>
            ) : (
              <Text style={styles.aiCardText}>{aiResponse}</Text>
            )}
          </View>
        )}

        <View style={styles.moodGrid}>
          {logs.map((log: any) => (
            <View key={log.id} style={styles.moodCard}>
              <Text style={styles.moodEmoji}>
                {MOODS.find((m) => m.label.toLowerCase() === log.mood.toLowerCase())?.emoji || '😊'}
              </Text>
              <Text style={styles.moodLabel}>{log.mood}</Text>
              <Text style={styles.moodDate}>
                {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              {log.notes ? (
                <Text style={styles.moodNotes}>{log.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How are you feeling?</Text>
            <View style={styles.moodSelector}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodOption,
                    selectedMood === mood.label && styles.moodOptionActive,
                  ]}
                  onPress={() => setSelectedMood(mood.label)}
                >
                  <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodOptionLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes (optional)"
              placeholderTextColor="#B0BDB5"
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedMood('');
                  setNotes('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleLogMood}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D5F3F' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#A8D5BA', justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  aiCard: { backgroundColor: '#F0F8F4', borderRadius: 14, borderWidth: 1, borderColor: '#A8D5BA', padding: 14, marginBottom: 16 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiCardLabel: { fontSize: 11, fontWeight: '700', color: '#2D5F3F', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiCardText: { fontSize: 14, color: '#2D5F3F', lineHeight: 21 },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLoadingText: { fontSize: 14, color: '#6B7F71' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moodCard: { width: '47%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E0E9E3' },
  moodEmoji: { fontSize: 40, marginBottom: 8 },
  moodLabel: { fontSize: 16, fontWeight: '600', color: '#2D5F3F', marginBottom: 4 },
  moodDate: { fontSize: 12, color: '#6B7F71' },
  moodNotes: { fontSize: 12, color: '#6B7F71', marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF9F0', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#2D5F3F', marginBottom: 20, textAlign: 'center' },
  moodSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, justifyContent: 'center' },
  moodOption: { width: 80, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E0E9E3', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  moodOptionActive: { borderColor: '#A8D5BA', backgroundColor: '#F0F8F4' },
  moodOptionEmoji: { fontSize: 32, marginBottom: 4 },
  moodOptionLabel: { fontSize: 12, color: '#6B7F71' },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0E9E3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2D5F3F', marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#E0E9E3', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7F71' },
  saveButton: { flex: 1, backgroundColor: '#A8D5BA', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#2D5F3F' },
});
