import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAIStore } from '../../../store/useAIStore';
import LoadingLogo from '../../../components/LoadingLogo';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import AppEmoji from '../../../components/AppEmoji';
import NeevModal from '../../../components/NeevModal';
import * as directusService from '../../../services/DirectusApiClient';

const MOODS = [
  {emoji: '😊', label: 'Happy'},
  {emoji: '😔', label: 'Sad'},
  {emoji: '😰', label: 'Anxious'},
  {emoji: '😴', label: 'Tired'},
  {emoji: '😡', label: 'Angry'},
  {emoji: '😌', label: 'Calm'}
];

export default function MoodTracking() {
  const { user } = useAuth();
  const { processChat } = useAIStore();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [notes, setNotes] = useState('');

  // Alert Modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', icon: '' });

  // AI state
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [user?.id]);

  const loadLogs = async () => {
    if (!user?.id) return;
    try {
      const data = await directusService.fetchMoodLogs(user.id);
      setLogs(data);
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

  const showAlert = (title: string, message: string, icon: string = '⚠️') => {
    setAlertConfig({ title, message, icon });
    setAlertVisible(true);
  };

  const handleLogMood = async () => {
    if (!selectedMood) {
      showAlert('Selection Required', 'Please select a mood to continue.', '🤔');
      return;
    }
    const currentMood = selectedMood;
    const currentNotes = notes;

    if (!user?.id) return;

    try {
      await directusService.saveMoodLog({
          user_id: user.id,
          mood: currentMood,
          notes: currentNotes,
          date: new Date().toISOString()
      });

      setModalVisible(false);
      setSelectedMood('');
      setNotes('');
      loadLogs();

      // Trigger AI response
      askAI(currentMood, currentNotes);
    } catch (error) {
      showAlert('Error', 'Failed to log mood. Please try again.', '❌');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingLogo size={moderateScale(80)} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>

        { (aiLoading || aiResponse) && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={moderateScale(18)} color={Theme.colors.primary} />
              <Text style={styles.aiTitle}>Neev AI Advice</Text>
              {(aiLoading || aiResponse) && (
                <TouchableOpacity onPress={() => {setAiResponse(null); setAiLoading(false);}} style={{marginLeft: 'auto'}}>
                   <Ionicons name="close-circle" size={moderateScale(20)} color={Theme.colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
            {aiLoading && !aiResponse ? (
              <View style={{ padding: moderateScale(10), alignItems: 'center' }}>
                <LoadingLogo size={moderateScale(40)} />
              </View>
            ) : (
              <Text style={styles.aiText}>{aiResponse}</Text>
            )}
          </View>
        )}

        <View style={styles.moodGrid}>
          {logs.map((log: any) => (
            <View key={log.id} style={styles.moodCard}>
              <AppEmoji style={styles.moodEmoji}>{MOODS.find(m => m.label.toLowerCase() === log.mood.toLowerCase())?.emoji || '😊'}</AppEmoji>
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
                  <AppEmoji style={styles.moodOptionEmoji}>{mood.emoji}</AppEmoji>
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
        <Ionicons name="add" size={moderateScale(30)} color={Theme.colors.white} />
      </TouchableOpacity>

      <NeevModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        onConfirm={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  scrollView: { flex: 1, paddingHorizontal: scale(24), paddingTop: verticalScale(10) },
  aiCard: {
    backgroundColor: Theme.colors.softGreen,
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    marginBottom: verticalScale(20)
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: verticalScale(8) },
  aiTitle: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.primary, textTransform: 'uppercase' },
  aiText: { fontSize: moderateScale(15), color: Theme.colors.primary, lineHeight: moderateScale(22) },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(12), paddingBottom: verticalScale(100) },
  moodCard: { width: '47%', backgroundColor: Theme.colors.white, padding: moderateScale(16), borderRadius: moderateScale(16), alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.accent, ...Theme.shadows.soft },
  moodEmoji: { fontSize: moderateScale(40), marginBottom: verticalScale(8) },
  moodLabel: { fontSize: moderateScale(16), fontWeight: '600', color: Theme.colors.primary, marginBottom: verticalScale(4) },
  moodDate: { fontSize: moderateScale(12), color: Theme.colors.textLight },
  moodNotes: { fontSize: moderateScale(12), color: Theme.colors.textLight, marginTop: verticalScale(8), textAlign: 'center', fontStyle: 'italic' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: Theme.colors.background, borderRadius: moderateScale(25), padding: moderateScale(24), width: '85%', borderWidth: 1.5, borderColor: Theme.colors.accent },
  modalTitle: { fontSize: moderateScale(22), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(20), textAlign: 'center' },
  moodSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(12), marginBottom: verticalScale(20), justifyContent: 'center' },
  moodOption: { width: scale(80), backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: moderateScale(15), paddingVertical: verticalScale(12), alignItems: 'center' },
  moodOptionActive: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.softGreen },
  moodOptionEmoji: { fontSize: moderateScale(32), marginBottom: verticalScale(4) },
  moodOptionLabel: { fontSize: moderateScale(12), color: Theme.colors.textLight },
  input: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: moderateScale(12), paddingHorizontal: scale(16), paddingVertical: verticalScale(12), fontSize: moderateScale(16), color: Theme.colors.primary, marginBottom: verticalScale(12) },
  textArea: { minHeight: verticalScale(80), textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: scale(12) },
  cancelButton: { flex: 1, backgroundColor: Theme.colors.accent, paddingVertical: verticalScale(14), borderRadius: moderateScale(25), alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.accent },
  cancelButtonText: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.textLight },
  saveButton: { flex: 1, backgroundColor: Theme.colors.primary, paddingVertical: verticalScale(14), borderRadius: moderateScale(25), alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  saveButtonText: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.white },
  floatingAddButton: {
    position: 'absolute',
    bottom: verticalScale(30),
    right: scale(30),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
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
