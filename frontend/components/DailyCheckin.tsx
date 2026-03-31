import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAuth } from '../app/contexts/AuthContext';
import { useAIStore } from '../store/useAIStore';
import { Theme } from '../constants/Theme';

const API_URL = 'https://api.neevios.com';

const SLEEP_HOURS = ['4', '5', '6', '7', '8', '9', '10', '11', '12+'];
const WAKINGS = ['0', '1', '2', '3', '4', '5+'];
const FEED_COUNTS = ['4', '5', '6', '7', '8', '9', '10', '11', '12+'];
const TUMMY_TIME_OPTS = ['5 min', '10 min', '15 min', '20 min', '30+ min'];

const MOODS_MORNING = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😭', label: 'Fussy' },
  { emoji: '😴', label: 'Sleepy' },
  { emoji: '🤒', label: 'Unwell' },
];

const MOODS_EVENING = [
  { emoji: '😄', label: 'Good' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😰', label: 'Stressed' },
  { emoji: '🙏', label: 'Grateful' },
];

export default function DailyCheckin() {
  const { user, token } = useAuth();
  const { processChat } = useAIStore();

  const [type, setType] = useState<'morning' | 'evening' | null>(null);
  const [completed, setCompleted] = useState(false);
  const [missed, setMissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  // Form states
  const [sleep, setSleep] = useState('8');
  const [wakings, setWakings] = useState('1');
  const [mood, setMood] = useState('Happy');
  const [concerns, setConcerns] = useState('');

  const [feeds, setFeeds] = useState('8');
  const [tummyTime, setTummyTime] = useState('15 min');
  const [parentMood, setParentMood] = useState('Good');
  const [milestone, setMilestone] = useState('');

  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    checkTimeAndStatus();
  }, []);

  const checkTimeAndStatus = async () => {
    const now = new Date();
    const hour = now.getHours();
    const dateStr = now.toISOString().split('T')[0];

    // Current Windows
    let activeType: 'morning' | 'evening' | null = null;
    if (hour >= 5 && hour < 10) activeType = 'morning';
    else if (hour >= 18 && hour < 24) activeType = 'evening';

    // Fetch completions
    const mData = await AsyncStorage.getItem(`checkin_morning_${dateStr}`);
    const eData = await AsyncStorage.getItem(`checkin_evening_${dateStr}`);

    if (activeType) {
      setType(activeType);
      const data = activeType === 'morning' ? mData : eData;
      if (data) {
        setCompleted(true);
        setSummary(JSON.parse(data));
      } else {
        setCompleted(false);
        setMissed(false);
      }
    } else {
      // Off-hours Logic
      if (hour >= 10 && hour < 18) {
        // Afternoon: Check morning
        setType('morning');
        if (mData) {
          setCompleted(true);
          setSummary(JSON.parse(mData));
        } else {
          setMissed(true);
        }
      } else if (hour >= 0 && hour < 5) {
        // Late Night: Check if yesterday's evening was filled
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        const prevEData = await AsyncStorage.getItem(`checkin_evening_${yStr}`);
        setType('evening');
        if (prevEData) {
          setCompleted(true);
          setSummary(JSON.parse(prevEData));
        } else {
          setMissed(true);
        }
      } else {
        setType(null);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      const data = type === 'morning'
        ? { sleep, wakings, mood, concerns }
        : { feeds, tummyTime, parentMood, milestone };

      // 1. Save to Local
      const key = `checkin_${type}_${dateStr}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));

      // 2. Sync to API
      if (type === 'morning') {
        await axios.post(`${API_URL}/api/health/record`,
          { record_type: 'Night Sleep', value: sleep, date: dateStr },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
      } else {
        await axios.post(`${API_URL}/api/mood/log`,
          { mood: parentMood, notes: milestone, date: dateStr },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
      }

      await axios.post(`${API_URL}/api/checkin`,
        {
          type: type,
          date: dateStr,
          sleep_hours: type === 'morning' ? parseFloat(sleep) : null,
          night_wakings: type === 'morning' ? parseInt(wakings) : null,
          baby_mood: type === 'morning' ? mood : null,
          total_feeds: type === 'evening' ? parseInt(feeds) : null,
          tummy_time: type === 'evening' ? tummyTime : null,
          parent_mood: type === 'evening' ? parentMood : null,
          new_milestone: type === 'evening' ? milestone : null,
          concerns: type === 'morning' ? concerns : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});

      // AI Advice
      const question = type === 'morning'
        ? `Morning Check-in: Baby slept ${sleep} hours with ${wakings} wakings. Mood: ${mood}. Any morning tips?`
        : `Evening Check-in: Total ${feeds} feeds today. Tummy time: ${tummyTime}. Parent mood: ${parentMood}. Milestone: ${milestone || 'None'}. Give me a 2-sentence wrap up.`;

      const childData = (user as any)?.children?.[0];
      const profile = { full_name: user?.full_name, stage: user?.stage || 'parenting', child_name: childData?.name };

      await processChat(user?.id.toString() || "", question, profile, (token) => {
        setAiResponse(prev => prev + token);
      });

      setCompleted(true);
      setSummary(data);
    } catch (error) {
      console.error('Checkin Error:', error);
      setCompleted(true);
      setSummary(type === 'morning' ? { sleep, wakings, mood, concerns } : { feeds, tummyTime, parentMood, milestone });
    } finally {
      setLoading(false);
    }
  };

  if (!type && !missed) return null;

  const childName = (user as any)?.children?.[0]?.name || 'your baby';

  if (missed) {
    return (
      <View style={[styles.card, styles.missedCard]}>
        <View style={styles.missedContent}>
          <View style={styles.missedTextContainer}>
            <View style={styles.missedHeaderRow}>
              <Text style={styles.missedEmoji}>🌱</Text>
              <Text style={styles.missedTitle}>Nurture the Journey</Text>
            </View>
            <Text style={styles.importanceText}>
              A quick update helps NEEV map out {childName}'s growth today.
            </Text>
            <View style={styles.timingBadge}>
              <Ionicons name="time-outline" size={14} color={Theme.colors.primary} />
              <Text style={styles.timingText}>
                {type === 'morning'
                  ? 'Morning check-in: 5:00 AM - 10:00 AM'
                  : 'Evening check-in: 6:00 PM - 12:00 AM'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={[styles.card, styles.premiumSummaryCard]}>
        <View style={styles.header}>
          <Ionicons name={type === 'morning' ? 'sunny' : 'moon'} size={24} color={Theme.colors.primary} />
          <Text style={styles.title}>{type === 'morning' ? 'Morning Report' : 'Evening Report'}</Text>
          <View style={styles.completedBadge}><Ionicons name="checkmark" size={14} color={Theme.colors.white} /></View>
        </View>
        <View style={styles.summaryGrid}>
          {type === 'morning' ? (
            <>
              <View style={styles.summaryItem}><Text style={styles.summaryVal}>{summary.sleep}h</Text><Text style={styles.summaryLab}>Sleep</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryVal}>{summary.wakings}</Text><Text style={styles.summaryLab}>Wakings</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryVal}>{summary.mood}</Text><Text style={styles.summaryLab}>Mood</Text></View>
            </>
          ) : (
            <>
              <View style={styles.summaryItem}><Text style={styles.summaryVal}>{summary.feeds}</Text><Text style={styles.summaryLab}>Feeds</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryVal}>{summary.tummyTime}</Text><Text style={styles.summaryLab}>Tummy Time</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryVal}>{summary.parentMood}</Text><Text style={styles.summaryLab}>Feeling</Text></View>
            </>
          )}
        </View>
        {aiResponse ? (
          <View style={[styles.aiInsightBox, {borderColor: Theme.colors.softGreenBorder}]}>
            <Text style={styles.aiInsightTitle}>NEEV'S TAKE</Text>
            <Text style={styles.aiInsightContent}>{aiResponse}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={type === 'morning' ? 'sunny' : 'moon'} size={24} color={Theme.colors.primary} />
        <Text style={styles.title}>{type === 'morning' ? 'Morning Check-in' : 'Evening Check-in'}</Text>
      </View>

      {type === 'morning' ? (
        <View style={styles.form}>
          <Text style={styles.label}>Baby sleep last night (hours)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
            {SLEEP_HOURS.map(h => (
              <TouchableOpacity key={h} onPress={() => setSleep(h)} style={[styles.pill, sleep === h && styles.pillActive]}>
                <Text style={[styles.pillText, sleep === h && styles.pillTextActive]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Night wakings</Text>
          <View style={styles.row}>
            {WAKINGS.slice(0, 6).map(w => (
              <TouchableOpacity key={w} onPress={() => setWakings(w)} style={[styles.circle, wakings === w && styles.circleActive]}>
                <Text style={[styles.circleText, wakings === w && styles.circleTextActive]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Baby mood</Text>
          <View style={styles.row}>
            {MOODS_MORNING.map(m => (
              <TouchableOpacity key={m.label} onPress={() => setMood(m.label)} style={[styles.moodPill, mood === m.label && styles.moodPillActive]}>
                <Text>{m.emoji}</Text>
                <Text style={styles.moodLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Any concerns? (optional)"
            value={concerns}
            onChangeText={setConcerns}
            maxLength={200}
            multiline
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Total feeds today</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
            {FEED_COUNTS.map(f => (
              <TouchableOpacity key={f} onPress={() => setFeeds(f)} style={[styles.pill, feeds === f && styles.pillActive]}>
                <Text style={[styles.pillText, feeds === f && styles.pillTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Tummy time completed</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
            {TUMMY_TIME_OPTS.map(t => (
              <TouchableOpacity key={t} onPress={() => setTummyTime(t)} style={[styles.pill, tummyTime === t && styles.pillActive]}>
                <Text style={[styles.pillText, tummyTime === t && styles.pillTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>How are you feeling, Parent?</Text>
          <View style={styles.row}>
            {MOODS_EVENING.map(m => (
              <TouchableOpacity key={m.label} onPress={() => setParentMood(m.label)} style={[styles.moodPill, parentMood === m.label && styles.moodPillActive]}>
                <Text>{m.emoji}</Text>
                <Text style={styles.moodLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Something new baby did today? (milestone)"
            value={milestone}
            onChangeText={setMilestone}
            maxLength={200}
            multiline
          />
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={Theme.colors.white} /> : <Text style={styles.submitText}>Submit Check-in</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.white, borderRadius: 24, padding: 24, marginHorizontal: 24, marginBottom: 20, borderWidth: 1.5, borderColor: Theme.colors.accent, ...Theme.shadows.soft },
  missedCard: { backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.softGreenBorder, padding: 20 },
  missedContent: { flexDirection: 'row', alignItems: 'center' },
  missedEmoji: { fontSize: 24, marginRight: 10 },
  missedTextContainer: { flex: 1 },
  missedHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  missedTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.primary },
  importanceText: { fontSize: 13, color: Theme.colors.textLight, lineHeight: 18, marginBottom: 10 },
  timingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', gap: 6, borderWidth: 1, borderColor: Theme.colors.softGreenBorder },
  timingText: { fontSize: 12, fontWeight: '700', color: Theme.colors.primary },
  premiumSummaryCard: { backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.softGreenBorder, borderLeftWidth: 6, borderLeftColor: Theme.colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.primary },
  completedBadge: { marginLeft: 'auto', width: 22, height: 22, borderRadius: 11, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryVal: { fontSize: 16, fontWeight: '800', color: Theme.colors.primary },
  summaryLab: { fontSize: 11, color: Theme.colors.textLight, textTransform: 'uppercase', marginTop: 4 },
  aiInsightBox: { marginTop: 15, padding: 15, backgroundColor: Theme.colors.white, borderRadius: 12, borderWidth: 1.5 },
  aiInsightTitle: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, marginBottom: 5, letterSpacing: 1 },
  aiInsightContent: { fontSize: 14, color: Theme.colors.primary, fontStyle: 'italic', lineHeight: 20 },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textLight, marginBottom: 4 },
  pickerScroll: { marginBottom: 5 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Theme.colors.softSlate, marginRight: 8, borderWidth: 1.5, borderColor: Theme.colors.softSlateBorder },
  pillActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.primary },
  pillText: { color: Theme.colors.textLight, fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: Theme.colors.primary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 5 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.softSlate, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.softSlateBorder },
  circleActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.primary },
  circleText: { color: Theme.colors.textLight, fontWeight: '700' },
  circleTextActive: { color: Theme.colors.primary },
  moodPill: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Theme.colors.softSlate, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Theme.colors.softSlateBorder },
  moodPillActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.primary },
  moodLabel: { fontSize: 12, fontWeight: '600', color: Theme.colors.primary },
  input: { backgroundColor: Theme.colors.white, borderRadius: 12, padding: 12, fontSize: 14, color: Theme.colors.primary, minHeight: 60, textAlignVertical: 'top', borderWidth: 1.5, borderColor: Theme.colors.accent },
  submitBtn: { backgroundColor: Theme.colors.primary, padding: 16, borderRadius: 25, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderColor: Theme.colors.primary },
  submitText: { color: Theme.colors.white, fontWeight: '700', fontSize: 16 },
});
