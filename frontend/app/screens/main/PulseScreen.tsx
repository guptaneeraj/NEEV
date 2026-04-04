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
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { useAIStore } from '../../../store/useAIStore';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTENT_OPTIONS = {
  focus: ['Bonding', 'Routine', 'Sensory Discovery', 'Physical Growth', 'Language', 'Calmness'],
  mindset: ['Patient', 'Playful', 'Observant', 'Energetic', 'Present', 'Mindful'],
};

const REVIEW_OPTIONS = {
  adherence: ['Perfectly', 'Mostly', 'Some changes', 'Completely different'],
  reasons: ["Baby's needs", "Energy levels", "Work/Chores", "Unexpected Event", "Health/Teething"],
  victory: ['New sound/word', 'Great nap', 'Calm feeding', 'Interactive play', 'Parent stayed calm', 'Smooth routine'],
  environment: ['Mostly Indoors', 'Mix of both', 'Lots of Outdoors'],
};

export default function PulseScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { processChat } = useAIStore();

  const [mode, setMode] = useState<'morning' | 'evening'>('morning');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [logTime, setLogTime] = useState<string | null>(null);

  // Morning State
  const [intentFocus, setIntentFocus] = useState('');
  const [intentMindset, setIntentMindset] = useState('');

  // Evening State
  const [reviewAdherence, setReviewAdherence] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewVictory, setReviewVictory] = useState('');
  const [reviewEnvironment, setReviewEnvironment] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [meals, setMeals] = useState<{id: number, time: string, type: string}[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 15) setMode('evening');
    checkTodayStatus();
  }, []);

  const checkTodayStatus = async () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const morningKey = `pulse_intent_${dateStr}`;
    const eveningKey = `pulse_review_${dateStr}`;

    const mData = await AsyncStorage.getItem(morningKey);
    const eData = await AsyncStorage.getItem(eveningKey);

    if (mode === 'morning' && mData) {
      setCompleted(true);
      const parsed = JSON.parse(mData);
      setLogTime(parsed.timestamp);
    } else if (mode === 'evening' && eData) {
      setCompleted(true);
      const parsed = JSON.parse(eData);
      setLogTime(parsed.timestamp);
    }
  };

  const addMeal = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMeals([...meals, { id: Date.now(), time: timeStr, type: 'Milk/Solid' }]);
  };

  const handleSave = async () => {
    setLoading(true);
    const dateStr = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const data = mode === 'morning'
      ? { intentFocus, intentMindset, timestamp }
      : { reviewAdherence, reviewReason, reviewVictory, reviewEnvironment, energyLevel, meals, timestamp };

    const key = mode === 'morning' ? `pulse_intent_${dateStr}` : `pulse_review_${dateStr}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));

    // Optional AI Feedback
    const question = mode === 'morning'
      ? `My intent for today with my baby is ${intentFocus} and I want to be ${intentMindset}. Any quick advice?`
      : `Daily review: Adherence was ${reviewAdherence}. Victory: ${reviewVictory}. Energy: ${energyLevel}/5. Give me a 2-sentence wrap up.`;

    const childData = (user as any)?.children?.[0];
    const profile = { full_name: user?.full_name, stage: user?.stage, child_name: childData?.name };

    try {
      if (user?.id) {
        await processChat(user.id.toString(), question, profile, () => {});
      }
    } finally {
      setLoading(false);
      setCompleted(true);
      setLogTime(timestamp);
    }
  };

  const renderOption = (val: string, current: string, setter: (v: string) => void) => (
    <TouchableOpacity
      key={val}
      onPress={() => setter(val)}
      style={[styles.optionPill, current === val && styles.optionPillActive]}
    >
      <Text style={[styles.optionText, current === val && styles.optionTextActive]}>{val}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Pulse</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Image
            source={require('../../../assets/images/neuron_avatar.jpeg')} // Placeholder for Zen/Reflection image
            style={styles.heroImage}
          />
          <Text style={styles.heroTitle}>{mode === 'morning' ? "Today's Rhythm" : "Daily Review"}</Text>
          <Text style={styles.heroSubtitle}>
            {mode === 'morning'
              ? "Set your intent for a mindful journey today."
              : "Reflect on your day and baby's growth."}
          </Text>
        </View>

        {completed ? (
          <Animated.View entering={FadeInUp} style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={scale(50)} color={Theme.colors.primary} />
            <Text style={styles.completedTitle}>Logged successfully!</Text>
            <Text style={styles.completedTime}>Recorded at {logTime}</Text>
            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.backHomeBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown} style={styles.formContainer}>
            {mode === 'morning' ? (
              <>
                <Text style={styles.label}>Primary Focus for Today</Text>
                <View style={styles.optionsGrid}>
                  {INTENT_OPTIONS.focus.map(o => renderOption(o, intentFocus, setIntentFocus))}
                </View>

                <Text style={styles.label}>How do you want to show up?</Text>
                <View style={styles.optionsGrid}>
                  {INTENT_OPTIONS.mindset.map(o => renderOption(o, intentMindset, setIntentMindset))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Did you stick to your morning intent?</Text>
                <View style={styles.optionsGrid}>
                  {REVIEW_OPTIONS.adherence.map(o => renderOption(o, reviewAdherence, setReviewAdherence))}
                </View>

                {reviewAdherence && reviewAdherence !== 'Perfectly' && (
                  <>
                    <Text style={styles.label}>What led to the change?</Text>
                    <View style={styles.optionsGrid}>
                      {REVIEW_OPTIONS.reasons.map(o => renderOption(o, reviewReason, setReviewReason))}
                    </View>
                  </>
                )}

                <Text style={styles.label}>Today's Win</Text>
                <View style={styles.optionsGrid}>
                  {REVIEW_OPTIONS.victory.map(o => renderOption(o, reviewVictory, setReviewVictory))}
                </View>

                <Text style={styles.label}>Your Energy Level (1-5)</Text>
                <View style={styles.row}>
                  {[1, 2, 3, 4, 5].map(l => (
                    <TouchableOpacity
                      key={l}
                      onPress={() => setEnergyLevel(l)}
                      style={[styles.circle, energyLevel === l && styles.circleActive]}
                    >
                      <Text style={[styles.circleText, energyLevel === l && styles.circleTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Meals / Feeds</Text>
                <View style={styles.mealsContainer}>
                  {meals.map((m, i) => (
                    <View key={m.id} style={styles.mealItem}>
                      <Text style={styles.mealTime}>{m.time}</Text>
                      <Text style={styles.mealType}>{m.type}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addMealBtn} onPress={addMeal}>
                    <Ionicons name="add" size={scale(20)} color={Theme.colors.primary} />
                    <Text style={styles.addMealText}>Add Meal</Text>
                  </TouchableOpacity>
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
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
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
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
    flex: 1,
    textAlign: 'center',
    marginRight: scale(10)
  },
  scrollContent: { padding: scale(20) },
  heroSection: { alignItems: 'center', marginBottom: verticalScale(30) },
  heroImage: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    marginBottom: verticalScale(15),
    borderWidth: 2,
    borderColor: Theme.colors.secondary
  },
  heroTitle: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: verticalScale(5)
  },
  heroSubtitle: {
    fontSize: moderateScale(14),
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  formContainer: { gap: verticalScale(20) },
  label: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
    marginBottom: verticalScale(10)
  },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  optionPill: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder,
  },
  optionPillActive: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.primary,
  },
  optionText: {
    fontSize: moderateScale(13),
    color: Theme.colors.textLight,
    fontWeight: '600'
  },
  optionTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700'
  },
  row: { flexDirection: 'row', gap: scale(12) },
  circle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder,
  },
  circleActive: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.primary,
  },
  circleText: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.textLight },
  circleTextActive: { color: Theme.colors.primary },
  mealsContainer: { gap: verticalScale(10) },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.white,
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: Theme.colors.softSlateBorder
  },
  mealTime: { fontWeight: '700', color: Theme.colors.primary },
  mealType: { color: Theme.colors.textLight },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    alignSelf: 'flex-start',
    padding: scale(8)
  },
  addMealText: { color: Theme.colors.primary, fontWeight: '700' },
  saveBtn: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: verticalScale(18),
    borderRadius: scale(25),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    marginTop: verticalScale(20),
    marginBottom: verticalScale(40)
  },
  saveBtnText: { color: Theme.colors.primary, fontSize: moderateScale(16), fontWeight: '800' },
  completedCard: {
    alignItems: 'center',
    padding: scale(30),
    backgroundColor: Theme.colors.white,
    borderRadius: scale(25),
    borderWidth: 1.5,
    borderColor: Theme.colors.secondary,
    ...Theme.shadows.soft
  },
  completedTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginTop: verticalScale(15)
  },
  completedTime: { fontSize: moderateScale(14), color: Theme.colors.textLight, marginTop: verticalScale(5) },
  backHomeBtn: {
    marginTop: verticalScale(25),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: Theme.colors.primary,
    borderRadius: scale(15)
  },
  backHomeBtnText: { color: Theme.colors.white, fontWeight: '700' }
});
