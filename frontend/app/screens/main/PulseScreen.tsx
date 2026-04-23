import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH, formatIST, getISTDateString, getISTDate } from '../../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { useAIStore } from '../../../store/useAIStore';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as directusService from '../../../services/DirectusApiClient';
import { LeavesLayer } from '../../components/LeavesLayer';

const MORNING_OPTIONS = {
  mood: [
    { label: 'Energised', icon: '🌟' },
    { label: 'Calm', icon: '😌' },
    { label: 'Tired', icon: '😴' },
    { label: 'Anxious', icon: '😟' },
    { label: 'Hopeful', icon: '🌈' },
    { label: 'Overwhelmed', icon: '😤' }
  ],
  intention: [
    { label: 'Connect', icon: '🤱' },
    { label: 'Build routine', icon: '📅' },
    { label: 'Rest together', icon: '💤' },
    { label: 'Stay patient', icon: '🧘' },
    { label: 'Try something new', icon: '🌱' },
    { label: 'Just get through it', icon: '💪' }
  ]
};

const EVENING_OPTIONS = {
  mood: [
    { label: 'Wonderful', icon: '🌟' },
    { label: 'Good', icon: '✅' },
    { label: 'Challenging', icon: '😤' },
    { label: 'Exhausting', icon: '😴' },
    { label: 'Mixed', icon: '💭' },
    { label: 'Rough but okay', icon: '💪' }
  ],
  reflection: [
    { label: 'Yes, fully', icon: '🌟' },
    { label: 'Mostly yes', icon: '✅' },
    { label: 'Partially', icon: '🔄' },
    { label: 'Not really', icon: '😔' },
    { label: 'Things changed', icon: '🔀' }
  ],
  babyMood: [
    { label: 'Settled', icon: '😴' },
    { label: 'Happy', icon: '😊' },
    { label: 'Fussy', icon: '😢' },
    { label: 'Tired', icon: '🌙' },
    { label: 'Unwell', icon: '🤒' },
    { label: 'Hard to tell', icon: '🤔' }
  ]
};

export default function PulseScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { processChat } = useAIStore();
  const forcedMode = route.params?.forcedMode;

  const [mode, setMode] = useState<'morning' | 'evening'>(forcedMode || 'morning');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [logTime, setLogTime] = useState<string | null>(null);
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [existingLog, setExistingLog] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  const [morningRecordId, setMorningRecordId] = useState<number | null>(null);

  // Morning - 3 questions
  const [parentMood, setParentMood] = useState('');
  const [babyFocus, setBabyFocus] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);

  // Evening - 3 questions
  const [eveningOutcome, setEveningOutcome] = useState('');
  const [intentionMatch, setIntentionMatch] = useState('');
  const [babyMoodEvening, setBabyMoodEvening] = useState('');

  const [morningFilled, setMorningFilled] = useState(false);
  const [eveningFilled, setEveningFilled] = useState(false);

  useEffect(() => {
    const checkBoth = async () => {
      if (forcedMode) {
          setMode(forcedMode);
          return;
      }
      const dateStr = getISTDateString();
      const m = await AsyncStorage.getItem(`pulse_intent_${dateStr}`);
      const e = await AsyncStorage.getItem(`pulse_review_${dateStr}`);
      setMorningFilled(!!m);
      setEveningFilled(!!e);
      // Auto-select unfilled mode
      const hour = getISTDate().getHours();
      if (!m) setMode('morning');
      else if (!e && hour >= 14) setMode('evening');
    };
    checkBoth();
  }, [forcedMode]);

  useEffect(() => {
    const checkIfFilled = async () => {
      const dateStr = getISTDateString();
      const key = mode === 'morning'
        ? `pulse_intent_${dateStr}`
        : `pulse_review_${dateStr}`;

      // 1. Instant check from local storage
      const local = await AsyncStorage.getItem(key);
      if (local) {
          const parsed = JSON.parse(local);
          setAlreadyFilled(true);
          setExistingLog(parsed);
          // Pre-fill states
          if (mode === 'morning') {
            setParentMood(parsed.parentMood || parsed.baby_mood || '');
            setBabyFocus(parsed.babyFocus || parsed.parent_intention || parsed.cry_label || '');
            setEnergyLevel(parsed.energyLevel || parsed.parent_energy || parsed.sleep_hours || 3);
          } else {
            setEveningOutcome(parsed.eveningOutcome || parsed.parent_mood || parsed.baby_mood || '');
            setIntentionMatch(parsed.intentionMatch || parsed.evening_reflection || parsed.cry_label || '');
            setBabyMoodEvening(parsed.babyMoodEvening || parsed.baby_mood_evening || '');
            setEnergyLevel(parsed.energyLevel || parsed.parent_energy || parsed.sleep_hours || 3);
          }
      } else {
          setAlreadyFilled(false);
          setExistingLog(null);
      }
      setIsInitialCheck(false);

      // 2. Background sync with Directus
      if (user?.id) {
        try {
          const checkIns = await directusService.fetchCheckIns(user.id, dateStr);
          const remote = checkIns.find((c: any) => c.type === mode);
          if (remote) {
            const merged = {
                ...(local ? JSON.parse(local) : {}),
                ...remote,
                morningMood: remote.type === 'morning' ? remote.baby_mood : undefined,
                morningIntention: remote.type === 'morning' ? remote.cry_label : undefined,
                morningEnergy: remote.type === 'morning' ? remote.sleep_hours : undefined,
                eveningMood: remote.type === 'evening' ? remote.baby_mood : undefined,
                eveningReflection: remote.type === 'evening' ? remote.cry_label : undefined,
                eveningEnergy: remote.type === 'evening' ? remote.sleep_hours : undefined,
            };
            setAlreadyFilled(true);
            setExistingLog(merged);
            // Re-pre-fill if remote is different
            if (mode === 'morning') {
              setParentMood(merged.parentMood || merged.baby_mood || merged.parent_mood || '');
              setBabyFocus(merged.babyFocus || merged.cry_label || merged.parent_intention || '');
              setEnergyLevel(merged.energyLevel || merged.sleep_hours || merged.parent_energy || 3);
              if (merged.id) setMorningRecordId(merged.id);
            } else {
              setEveningOutcome(merged.eveningOutcome || merged.baby_mood || merged.parent_mood || '');
              setIntentionMatch(merged.intentionMatch || merged.cry_label || merged.evening_reflection || '');
              setBabyMoodEvening(merged.babyMoodEvening || merged.baby_mood_evening || '');
              setEnergyLevel(merged.energyLevel || merged.sleep_hours || merged.parent_energy || 3);
            }
          }
        } catch (e) { console.log("Check fill failed", e); }
      }
    };
    if (!isEditing) checkIfFilled();
  }, [mode, isEditing, user?.id]);


  const handleSave = async () => {
    setLoading(true);
    const dateStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timestampStr = now.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });

    // Get morning record ID for linking
    let morningId = morningRecordId;
    if (mode === 'evening' && !morningId) {
      const dateStr2 = new Date().toISOString().split('T')[0];
      try {
        const logs = await directusService.fetchCheckIns(
          user.id, dateStr2
        );
        const morning = logs.find((l: any) => l.type === 'morning');
        if (morning) morningId = morning.id;
      } catch (e) {}
    }

    const localData = mode === 'morning'
      ? { parentMood, babyFocus, energyLevel,
          timestamp: now.toISOString() }
      : { eveningOutcome, intentionMatch, babyMoodEvening,
          timestamp: now.toISOString() };

    const key = mode === 'morning'
      ? `pulse_intent_${dateStr}`
      : `pulse_review_${dateStr}`;
    await AsyncStorage.setItem(key, JSON.stringify(localData));

    if (user?.id) {
      try {
        const checkIn: any = {
          user_id: user.id,
          child_id: user.children?.[0]?.id,
          type: mode,
          date: dateStr,
          timestamp: now.toISOString(),
          is_perfect_timing: mode === 'morning'
            ? (now.getHours() < 10)
            : (now.getHours() >= 18),
        };

        if (mode === 'morning') {
          checkIn.parent_mood = parentMood;
          checkIn.parent_intention = babyFocus;
          checkIn.parent_energy = energyLevel;
          // Keep old fields for backward compatibility
          checkIn.baby_mood = parentMood;
          checkIn.cry_label = babyFocus;
          checkIn.sleep_hours = energyLevel;
        } else {
          checkIn.parent_mood = eveningOutcome;
          checkIn.baby_mood_evening = babyMoodEvening;
          checkIn.evening_reflection = intentionMatch;
          checkIn.parent_energy = energyLevel;
          checkIn.linked_morning_id = morningId;
          // Keep old fields for backward compatibility
          checkIn.baby_mood = eveningOutcome;
          checkIn.cry_label = intentionMatch;
        }

        if (existingLog?.id) {
            await directusService.updateCheckIn(existingLog.id, checkIn);
        } else {
            await directusService.saveCheckIn(checkIn);
        }
      } catch (error) {
        console.error('Directus save failed:', error);
      }
    }

    // Fire and forget AI with richer context
    const question = mode === 'morning'
      ? `Morning: Feeling ${parentMood}, focus is to ${babyFocus}, energy ${energyLevel}/5. Brief encouragement in one sentence.`
      : `Evening: Day went ${eveningOutcome}, achieved morning focus: ${intentionMatch}, baby is ${babyMoodEvening}. One sentence reflection.`;

    const childData = (user as any)?.children?.[0];
    const profile = {
      full_name: user?.full_name,
      stage: user?.stage,
      child_name: childData?.name,
      child_dob: childData?.dob,
    };

    if (user?.id) {
      processChat(user.id.toString(), question, profile, () => {})
        .catch(e => console.log("AI feedback silent fail", e));
    }

    setLoading(false);
    setExistingLog(localData);
    setAlreadyFilled(true);
    setIsEditing(false);
    setLogTime(timestampStr);
    setCompleted(true);
  };


  const renderOption = (option: { label: string, icon: string }, current: string, setter: (v: string) => void) => (
    <TouchableOpacity
      key={option.label}
      onPress={() => setter(option.label)}
      style={[styles.optionCard, current === option.label && styles.optionCardActive]}
    >
      <Text style={styles.optionIcon}>{option.icon}</Text>
      <Text style={[styles.optionText, current === option.label && styles.optionTextActive]}>{option.label}</Text>
    </TouchableOpacity>
  );

  if (isInitialCheck) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (alreadyFilled && existingLog && !isEditing) {
    const now = new Date();
    const hour = now.getHours();
    // Morning: Edit until 11 AM | Evening: Edit until 2 AM
    const canEdit = mode === 'morning' ? (hour < 11) : (hour >= 18 || hour < 2);
    const isLate = existingLog.is_perfect_timing === false;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topHeader}>
          <LeavesLayer color="#A8D5BA" />
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
              <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerSubtitleTop}>Daily Rhythm</Text>
              <Text style={styles.headerTitle}>Pulse Summary</Text>
            </View>
            <View style={{ width: scale(40) }} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {logTime && (
            <View style={styles.successToast}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.successToastText}>Log saved successfully</Text>
            </View>
          )}

          <View style={styles.filledCard}>
            <View style={styles.filledHeader}>
                <View style={styles.emojiCircleLarge}>
                    <Text style={styles.filledTitleEmoji}>{mode === 'morning' ? '🌅' : '🌙'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                        <Text style={styles.filledCardTitle}>
                            {mode === 'morning' ? 'Morning' : 'Evening'} Entry
                        </Text>
                        {isLate && (
                            <View style={styles.lateBadge}>
                                <Text style={styles.lateBadgeText}>LATE</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.filledTime}>
                        {(() => {
                            if (!existingLog?.timestamp) return 'Time unknown';
                            return formatIST(existingLog.timestamp, 'hh:mm a');
                        })()}
                    </Text>
                </View>
            </View>

            <View style={styles.dividerLight} />

          <View style={styles.filledSummary}>
            {mode === 'morning' ? (
              <>
                <View style={styles.summaryItemRow}>
                  <View>
                      <Text style={styles.summaryItemLabel}>Feeling</Text>
                      <Text style={styles.summaryItemValue}>{existingLog.parentMood || existingLog.baby_mood || '—'}</Text>
                  </View>
                  <Ionicons name="happy-outline" size={18} color={Theme.colors.primary} opacity={0.4} />
                </View>
                <View style={styles.summaryItemRow}>
                  <View>
                      <Text style={styles.summaryItemLabel}>Focus</Text>
                      <Text style={styles.summaryItemValue}>{existingLog.babyFocus || existingLog.parent_intention || existingLog.cry_label || '—'}</Text>
                  </View>
                  <Ionicons name="flag-outline" size={18} color={Theme.colors.primary} opacity={0.4} />
                </View>
                <View style={styles.summaryItemRow}>
                  <View style={{ borderBottomWidth: 0 }}>
                      <Text style={styles.summaryItemLabel}>Energy Level</Text>
                      <Text style={styles.summaryItemValue}>{existingLog.energyLevel || existingLog.parent_energy || existingLog.sleep_hours || '—'}/5</Text>
                  </View>
                  <Ionicons name="flash-outline" size={18} color={Theme.colors.primary} opacity={0.4} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.summaryItemRow}>
                  <View>
                      <Text style={styles.summaryItemLabel}>Outcome</Text>
                      <Text style={styles.summaryItemValue}>{existingLog.eveningOutcome || existingLog.parent_mood || existingLog.baby_mood || '—'}</Text>
                  </View>
                  <Ionicons name="moon-outline" size={18} color={Theme.colors.primary} opacity={0.4} />
                </View>
                <View style={styles.summaryItemRow}>
                  <View>
                      <Text style={styles.summaryItemLabel}>Intention Achieved</Text>
                      <Text style={styles.summaryItemValue}>{existingLog.intentionMatch || existingLog.evening_reflection || existingLog.cry_label || '—'}</Text>
                  </View>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Theme.colors.primary} opacity={0.4} />
                </View>
                <View style={styles.summaryItemRow}>
                  <View>
                      <Text style={styles.summaryItemLabel}>Baby Mood</Text>
                      <Text style={styles.summaryItemValue}>{existingLog.babyMoodEvening || existingLog.baby_mood_evening || '—'}</Text>
                  </View>
                  <Ionicons name="happy-outline" size={18} color={Theme.colors.primary} opacity={0.4} />
                </View>
              </>
            )}
          </View>

            <View style={styles.filledActions}>
                {canEdit ? (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditing(true)}>
                        <Ionicons name="create-outline" size={scale(16)} color="#fff" />
                        <Text style={styles.editButtonText}>Edit My Log</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={12} color={Theme.colors.textLight} />
                        <Text style={styles.lockedText}>Window closed for editing</Text>
                    </View>
                )}
            </View>
          </View>

          {/* Show the other log if it exists */}
          <DailyRhythmSummary
            mode={mode}
            date={getISTDateString()}
            userId={user?.id}
            onSwitch={() => setMode(mode === 'morning' ? 'evening' : 'morning')}
          />

          <View style={{ height: verticalScale(20) }} />
        </ScrollView>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topHeader}>
        <LeavesLayer color="#A8D5BA" />
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
            <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerSubtitleTop}>{mode === 'morning' ? "Morning Check" : "Evening Review"}</Text>
            <Text style={styles.headerTitle}>The Pulse</Text>
          </View>
          <View style={{ width: scale(40) }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {completed ? (
          <View style={styles.completedCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={scale(40)} color={Theme.colors.primary} />
            </View>
            <Text style={styles.completedTitle}>Logged successfully!</Text>
            <Text style={styles.completedTime}>Recorded at {logTime}</Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  mode === 'morning' && styles.modeBtnActive,
                  morningFilled && styles.modeBtnDone
                ]}
                onPress={() => setMode('morning')}>
                <Text style={styles.modeBtnText}>
                  {morningFilled ? '✅ Morning Done' : '🌅 Morning'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  mode === 'evening' && styles.modeBtnActive,
                  eveningFilled && styles.modeBtnDone
                ]}
                onPress={() => setMode('evening')}>
                <Text style={styles.modeBtnText}>
                  {eveningFilled ? '✅ Evening Done' : '🌙 Evening'}
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'morning' ? (
              <>
                <Text style={styles.sectionLabel}>How are you feeling?</Text>
                <View style={styles.optionsGrid}>
                  {MORNING_OPTIONS.mood.map(o => renderOption(o, parentMood, setParentMood))}
                </View>

                <Text style={styles.sectionLabel}>What's your focus for baby today?</Text>
                <View style={styles.optionsGrid}>
                  {MORNING_OPTIONS.intention.map(o => renderOption(o, babyFocus, setBabyFocus))}
                </View>

                <Text style={styles.sectionLabel}>Your energy level today?</Text>
                <View style={styles.energyRow}>
                  {[1, 2, 3, 4, 5].map(l => (
                    <TouchableOpacity
                      key={l}
                      onPress={() => setEnergyLevel(l)}
                      style={[styles.energyCircle, energyLevel === l && styles.energyCircleActive]}
                    >
                      <Text style={[styles.energyCircleText, energyLevel === l && styles.energyCircleTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>How did today go with baby?</Text>
                <View style={styles.optionsGrid}>
                  {EVENING_OPTIONS.mood.map(o => renderOption(o, eveningOutcome, setEveningOutcome))}
                </View>

                <Text style={styles.sectionLabel}>Did you achieve your morning focus?</Text>
                <View style={styles.optionsGrid}>
                  {EVENING_OPTIONS.reflection.map(o => renderOption(o, intentionMatch, setIntentionMatch))}
                </View>

                <Text style={styles.sectionLabel}>How is baby seeming tonight?</Text>
                <View style={styles.optionsGrid}>
                  {EVENING_OPTIONS.mood.map(o => renderOption(o, babyMoodEvening, setBabyMoodEvening))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.primary} />
              ) : (
                <Text style={styles.saveBtnText}>Save {mode === 'morning' ? 'Intent' : 'Review'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: verticalScale(20) }} />
      </ScrollView>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  topHeader: {
    height: verticalScale(80),
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitleTop: {
    fontSize: moderateScale(14),
    color: Theme.colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    marginBottom: -verticalScale(4)
  },
  backPetal: {
    width: scale(40),
    height: scale(40),
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(6),
    borderBottomLeftRadius: moderateScale(6),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: 0.5
  },
  scrollContent: { paddingHorizontal: scale(20), paddingTop: 0 },
  formContainer: { gap: verticalScale(10) },
  sectionLabel: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: 1.2,
    marginBottom: verticalScale(4),
    opacity: 0.8
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    backgroundColor: Theme.colors.white,
    padding: scale(10),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  optionCard: {
    width: (SCREEN_WIDTH - scale(80)) / 3,
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCardActive: {
    backgroundColor: '#DCFCE7',
    borderColor: Theme.colors.secondary,
  },
  optionIcon: {
    fontSize: moderateScale(20),
    marginBottom: verticalScale(4)
  },
  optionText: {
    fontSize: moderateScale(10),
    color: Theme.colors.textLight,
    fontWeight: '700',
    textAlign: 'center'
  },
  optionTextActive: {
    color: Theme.colors.primary,
  },
  energyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: scale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  energyCircle: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  energyCircleActive: {
    backgroundColor: '#DCFCE7',
    borderColor: Theme.colors.secondary,
  },
  energyCircleText: { fontSize: moderateScale(16), fontWeight: '800', color: Theme.colors.textLight },
  energyCircleTextActive: { color: Theme.colors.primary },
  energyLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: verticalScale(2), paddingHorizontal: scale(20) },
  energySubLabel: { fontSize: moderateScale(10), color: Theme.colors.textLight, fontWeight: '700' },

  mealSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(4), marginTop: verticalScale(4) },
  addMealPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: scale(4)
  },
  addMealText: { color: Theme.colors.primary, fontWeight: '800', fontSize: moderateScale(11) },
  mealsList: {
    gap: verticalScale(8),
    backgroundColor: Theme.colors.white,
    padding: scale(12),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: scale(10),
    borderRadius: scale(12),
    gap: scale(10)
  },
  mealTime: { fontWeight: '800', color: Theme.colors.primary, fontSize: moderateScale(13) },
  mealType: { color: Theme.colors.textLight, fontSize: moderateScale(12), fontWeight: '700' },

  saveBtn: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: verticalScale(14),
    borderRadius: scale(20),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    marginTop: verticalScale(12),
    ...Theme.shadows.soft
  },
  saveBtnText: { color: Theme.colors.primary, fontSize: moderateScale(16), fontWeight: '900' },

  completedCard: {
    alignItems: 'center',
    padding: scale(32),
    backgroundColor: Theme.colors.white,
    borderRadius: scale(32),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginTop: verticalScale(20),
    ...Theme.shadows.soft
  },
  successIconCircle: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16)
  },
  completedTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: verticalScale(4)
  },
  completedTime: { fontSize: moderateScale(13), color: Theme.colors.textLight, fontWeight: '700' },
  backHomeBtn: {
    marginTop: verticalScale(24),
    width: '100%',
    paddingVertical: verticalScale(14),
    backgroundColor: Theme.colors.primary,
    borderRadius: scale(16),
    alignItems: 'center'
  },
  backHomeBtnText: { color: Theme.colors.white, fontWeight: '800', fontSize: moderateScale(14) },
  modeSelector: { flexDirection: 'row', gap: 12,
    marginBottom: 24, justifyContent: 'center' },
  modeBtn: { flex: 1, padding: 12, borderRadius: 12,
    borderWidth: 2, borderColor: '#E5E7EB',
    alignItems: 'center' },
  modeBtnActive: { borderColor: '#6B4EFF',
    backgroundColor: '#F0EBFF' },
  modeBtnDone: { borderColor: '#16A34A',
    backgroundColor: '#F0FDF4' },
  modeBtnText: { fontSize: 14, fontWeight: '600',
    color: '#374151' },
  filledTitle: { fontSize: 22, fontWeight: '700',
    color: '#2D2D2D', textAlign: 'center',
    marginBottom: 8, marginTop: 40 },
  filledTime: { fontSize: 14, color: '#888',
    textAlign: 'center', marginBottom: 24 },
  filledSummary: { backgroundColor: '#F9FAFB',
    borderRadius: 16, padding: 20, width: '100%',
    marginBottom: 24 },
  summaryItem: { fontSize: 15, color: '#374151',
    paddingVertical: 6, borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB' },
  backButton: { backgroundColor: '#6B4EFF',
    borderRadius: 12, padding: 14,
    width: '100%', alignItems: 'center' },
  backButtonText: { color: '#fff', fontWeight: '700',
    fontSize: 16 },
  filledCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(20),
    marginTop: verticalScale(8),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  filledHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(12), marginBottom: verticalScale(12) },
  emojiCircleLarge: { width: scale(50), height: scale(50), borderRadius: scale(25), backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FEF3C7' },
  filledTitleEmoji: { fontSize: moderateScale(26) },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filledCardTitle: { fontSize: moderateScale(17), fontWeight: '900', color: Theme.colors.primary },
  filledTime: { fontSize: moderateScale(11), color: Theme.colors.textLight, fontWeight: '700', marginTop: 1 },
  lateBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lateBadgeText: { color: '#991B1B', fontSize: moderateScale(8), fontWeight: '900' },
  dividerLight: { height: 1, backgroundColor: '#FDE68A', opacity: 0.2, marginBottom: verticalScale(10) },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(10), borderBottomWidth: 1, borderBottomColor: '#FDE68A15' },
  summaryItemLabel: { fontSize: moderateScale(10), color: Theme.colors.textLight, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  summaryItemValue: { fontSize: moderateScale(14), color: Theme.colors.primary, fontWeight: '800' },
  filledActions: { marginTop: verticalScale(15) },
  editButton: { backgroundColor: Theme.colors.primary, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  editButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12 },
  lockedText: { fontSize: 11, color: Theme.colors.textLight, fontWeight: '700' },
  successToast: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  successToastText: { color: '#065F46', fontWeight: '700', fontSize: 12 },
  rhythmMiniCard: {
    marginTop: verticalScale(15),
    padding: scale(16),
    backgroundColor: Theme.colors.white,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...Theme.shadows.soft
  },
  rhythmTitle: { fontSize: moderateScale(12), fontWeight: '900', color: Theme.colors.primary, marginBottom: verticalScale(10), textTransform: 'uppercase', letterSpacing: 1 },
});

const DailyRhythmSummary = ({ mode, date, userId, onSwitch }: any) => {
    const [otherLog, setOtherLog] = useState<any>(null);
    useEffect(() => {
        const fetchOther = async () => {
            if (!userId) return;
            try {
                const logs = await directusService.fetchCheckIns(userId, date);
                const other = logs.find((l: any) => l.type !== mode);
                if (other) setOtherLog(other);
            } catch(e) {}
        };
        fetchOther();
    }, [userId, date, mode]);

    if (!otherLog) return null;

    return (
        <TouchableOpacity style={styles.rhythmMiniCard} onPress={onSwitch}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.rhythmTitle}>Daily Counterpart</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 11, color: Theme.colors.primary, fontWeight: '700' }}>View/Edit</Text>
                    <Ionicons name="chevron-forward" size={14} color={Theme.colors.primary} />
                </View>
            </View>
            <View style={styles.summaryItemRow}>
                <View>
                    <Text style={styles.summaryItemLabel}>{otherLog.type === 'morning' ? 'Morning Feeling' : 'Evening Outcome'}</Text>
                    <Text style={styles.summaryItemValue}>{otherLog.baby_mood || otherLog.cry_label || '—'}</Text>
                </View>
                <Text style={{ fontSize: 20 }}>{otherLog.type === 'morning' ? '🌅' : '🌙'}</Text>
            </View>
        </TouchableOpacity>
    );
};

