import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAIStore } from '../../../store/useAIStore';
import LoadingLogo from '../../../components/LoadingLogo';
import { Theme } from '../../../constants/Theme';

const API_URL = 'https://api.neevios.com';
const MOODS = [
  {emoji: '😊', label: 'Happy'},
  {emoji: '😔', label: 'Sad'},
  {emoji: '😰', label: 'Anxious'},
  {emoji: '😴', label: 'Tired'},
  {emoji: '😡', label: 'Angry'},
  {emoji: '😌', label: 'Calm'}
];

export default function MoodTracking() {
  const { token, user } = useAuth();
  const { processChat } = useAIStore();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [notes, setNotes] = useState('');

  // AI state
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mood/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { days: 30 }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading mood logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const askAI = async (mood: string, moodNotes: string) => {
    setAiLoading(true);
    setAiResponse("");
    try {
      const question = `I just logged that I'm feeling ${mood}. ${moodNotes ? `Notes: ${moodNotes}` : ""}. Any advice?`;

      const childData = (user as any)?.children?.[0];
      const profile = {
        full_name: user?.full_name,
        stage: user?.stage || 'parenting',
        child_name: childData?.name,
        child_dob: childData?.dob,
        child_sex: childData?.sex,
      };

      await processChat(user?.id.toString() || "", question, profile, (token) => {
        setAiResponse(prev => (prev || "") + token);
      });
    } catch (error) {
      console.error("Mood AI Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogMood = async () => {
    if (!selectedMood) {
      Alert.alert('Error', 'Please select a mood');
      return;
    }
    const currentMood = selectedMood;
    const currentNotes = notes;

    try {
      await axios.post(
        `${API_URL}/api/mood/log`,
        { mood: currentMood, notes: currentNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalVisible(false);
      setSelectedMood('');
      setNotes('');
      loadLogs();

      // Trigger AI response
      askAI(currentMood, currentNotes);
    } catch (error) {
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
      <ScrollView style={styles.scrollView}>

        { (aiLoading || aiResponse) && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={18} color={Theme.colors.primary} />
              <Text style={styles.aiTitle}>Neev AI Advice</Text>
              {(aiLoading || aiResponse) && (
                <TouchableOpacity onPress={() => {setAiResponse(null); setAiLoading(false);}} style={{marginLeft: 'auto'}}>
                   <Ionicons name="close-circle" size={20} color={Theme.colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
            {aiLoading && !aiResponse ? (
              <View style={{ padding: 10, alignItems: 'center' }}>
                <LoadingLogo size={40} />
              </View>
            ) : (
              <Text style={styles.aiText}>{aiResponse}</Text>
            )}
          </View>
        )}

        <View style={styles.moodGrid}>
          {logs.map((log: any) => (
            <View key={log.id} style={styles.moodCard}>
              <Text style={styles.moodEmoji}>{MOODS.find(m => m.label.toLowerCase() === log.mood.toLowerCase())?.emoji || '😊'}</Text>
              <Text style={styles.moodLabel}>{log.mood}</Text>
              <Text style={styles.moodDate}>{new Date(log.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</Text>
              {log.notes && <Text style={styles.moodNotes}>{log.notes}</Text>}
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
                <TouchableOpacity key={mood.label} style={[styles.moodOption, selectedMood === mood.label && styles.moodOptionActive]} onPress={() => setSelectedMood(mood.label)}>
                  <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodOptionLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Add notes (optional)" placeholderTextColor="#B0BDB5" multiline numberOfLines={3} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleLogMood}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.floatingAddButton} onPress={() => { setAiResponse(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color={Theme.colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  scrollView: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  aiCard: {
    backgroundColor: Theme.colors.softGreen,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    marginBottom: 20
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.primary, textTransform: 'uppercase' },
  aiText: { fontSize: 15, color: Theme.colors.primary, lineHeight: 22 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 100 },
  moodCard: { width: '47%', backgroundColor: Theme.colors.white, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.accent, ...Theme.shadows.soft },
  moodEmoji: { fontSize: 40, marginBottom: 8 },
  moodLabel: { fontSize: 16, fontWeight: '600', color: Theme.colors.primary, marginBottom: 4 },
  moodDate: { fontSize: 12, color: Theme.colors.textLight },
  moodNotes: { fontSize: 12, color: Theme.colors.textLight, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: Theme.colors.background, borderRadius: 25, padding: 24, width: '85%', borderWidth: 1.5, borderColor: Theme.colors.accent },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Theme.colors.primary, marginBottom: 20, textAlign: 'center' },
  moodSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, justifyContent: 'center' },
  moodOption: { width: 80, backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: 15, paddingVertical: 12, alignItems: 'center' },
  moodOptionActive: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.softGreen },
  moodOptionEmoji: { fontSize: 32, marginBottom: 4 },
  moodOptionLabel: { fontSize: 12, color: Theme.colors.textLight },
  input: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Theme.colors.primary, marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, backgroundColor: Theme.colors.accent, paddingVertical: 14, borderRadius: 25, alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.accent },
  cancelButtonText: { fontSize: 16, fontWeight: '700', color: Theme.colors.textLight },
  saveButton: { flex: 1, backgroundColor: Theme.colors.primary, paddingVertical: 14, borderRadius: 25, alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: Theme.colors.white },
  floatingAddButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
  }
});
