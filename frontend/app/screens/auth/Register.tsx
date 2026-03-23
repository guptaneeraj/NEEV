import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

const RELATIONSHIP_OPTIONS = [
  { label: 'Mother', emoji: '👩' }, { label: 'Father', emoji: '👨' },
  { label: 'Grandmother', emoji: '👵' }, { label: 'Grandfather', emoji: '👴' },
  { label: 'Guardian', emoji: '🛡️' }, { label: 'Caregiver', emoji: '🤗' },
  { label: 'Aunt', emoji: '👩‍🦰' }, { label: 'Uncle', emoji: '👨‍🦰' },
  { label: 'Foster Parent', emoji: '🏠' }, { label: 'Adoptive Parent', emoji: '💝' },
  { label: 'Stepmother', emoji: '👩‍👧' }, { label: 'Stepfather', emoji: '👨‍👦' },
  { label: 'Myself', emoji: '👤' },
];

const DIET_OPTIONS = [
  { label: 'Vegetarian', emoji: '🥗' },
  { label: 'Eggetarian', emoji: '🥚' },
  { label: 'Non-vegetarian', emoji: '🍖' },
];

const PLAN_OPTIONS = [
  { label: '20 Min Plan', value: '20_min_plan', icon: '⏱️' },
  { label: '40 Min Plan', value: '40_min_plan', icon: '⏲️' },
  { label: '60 Min Plan', value: '60_min_plan', icon: '⏰' },
];

const TIME_OF_DAY_OPTIONS = [
  { label: 'Morning', value: 'morning', icon: '🌅' },
  { label: 'Afternoon', value: 'afternoon', icon: '☀️' },
  { label: 'Night', value: 'night', icon: '🌙' },
];

const SPECIFIC_TIMES: any = {
  morning: ['07:00 AM', '08:00 AM', '09:00 AM'],
  afternoon: ['01:00 PM', '02:00 PM', '03:00 PM'],
  night: ['07:00 PM', '08:00 PM', '09:00 PM'],
};

const API_URL = "https://api.neevios.com";

export default function Register() {
  const navigation = useNavigation<any>();
  const { token, fetchProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Registration State
  const [relationship, setRelationship] = useState('');
  const [stage, setStage] = useState<'pregnancy' | 'child' | ''>('');
  const [pregnancyWeek, setPregnancyWeek] = useState(1);
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState('');
  const [childSex, setChildSex] = useState('');
  const [diet, setDiet] = useState('');
  const [planType, setPlanType] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [specificTime, setSpecificTime] = useState('');

  const handleNext = () => {
    if (step === 1 && !relationship) return Alert.alert('Wait', 'Select your role');
    if (step === 2 && !stage) return Alert.alert('Wait', 'Select your stage');
    if (step === 3) {
      if (stage === 'child') {
        if (!childName || !childDOB) return Alert.alert('Wait', 'Enter child details');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(childDOB)) return Alert.alert('Format Error', 'Use YYYY-MM-DD');
      }
    }
    if (step === 4 && !diet) return Alert.alert('Wait', 'Select diet preference');
    if (step === 5 && (!planType || !timeOfDay || !specificTime)) return Alert.alert('Wait', 'Complete your plan selection');

    if (step === 5) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Update basic user info
      await axios.patch(`${API_URL}/api/user/update`, {
        relationship_type: relationship,
        preferred_plan_type: planType,
        preferred_time_of_day: timeOfDay,
        preferred_activity_time: specificTime, // Using preferred_activity_time
        stage: stage
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 2. Save stage-specific details
      if (stage === 'pregnancy') {
        await axios.post(`${API_URL}/api/user/pregnancy`, {
          pregnant_person_name: 'Self',
          is_user_pregnant: true,
          relationship_to_pregnant: 'Self',
          current_week: pregnancyWeek,
          diet_preference: diet
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/user/child`, {
          name: childName,
          dob: childDOB,
          sex: childSex,
          diet_preference: diet
        }, { headers: { Authorization: `Bearer ${token}` } });
      }

      await fetchProfile();
      navigation.replace('DashboardTabs');
    } catch (error: any) {
      Alert.alert('Setup Failed', 'We couldn\'t save your preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#2D5F3F" />
          </TouchableOpacity>

          <View style={styles.progress}>
            {[1, 2, 3, 4, 5].map(i => <View key={i} style={[styles.dot, step >= i ? styles.dotActive : styles.dotInactive]} />)}
          </View>

          {step === 1 && (
            <View>
              <Text style={styles.title}>Who are you?</Text>
              <View style={styles.grid}>
                {RELATIONSHIP_OPTIONS.map(o => (
                  <TouchableOpacity key={o.label} style={[styles.card, relationship === o.label && styles.cardActive]} onPress={() => setRelationship(o.label)}>
                    <Text style={styles.emoji}>{o.emoji}</Text>
                    <Text style={styles.label}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.title}>Current Stage</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.stageCard, stage === 'pregnancy' && styles.cardActive]} onPress={() => setStage('pregnancy')}>
                  <Text style={styles.emojiLarge}>🤰</Text>
                  <Text style={styles.labelLarge}>Pregnancy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stageCard, stage === 'child' && styles.cardActive]} onPress={() => setStage('child')}>
                  <Text style={styles.emojiLarge}>👶</Text>
                  <Text style={styles.labelLarge}>Parenting</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.title}>Details</Text>
              {stage === 'pregnancy' ? (
                <View>
                  <Text style={styles.inputLabel}>Current Week</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekPicker}>
                    {[...Array(42)].map((_, i) => (
                      <TouchableOpacity key={i+1} style={[styles.weekBtn, pregnancyWeek === i+1 && styles.weekBtnActive]} onPress={() => setPregnancyWeek(i+1)}>
                        <Text style={[styles.weekTxt, pregnancyWeek === i+1 && styles.weekTxtActive]}>{i+1}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.form}>
                  <TextInput style={styles.input} value={childName} onChangeText={setChildName} placeholder="Child's Name" />
                  <TextInput style={styles.input} value={childDOB} onChangeText={setChildDOB} placeholder="Birth Date (YYYY-MM-DD)" keyboardType="numeric" />
                  <View style={styles.row}>
                    {['Male', 'Female'].map(s => (
                      <TouchableOpacity key={s} style={[styles.sexBtn, childSex === s && styles.cardActive]} onPress={() => setChildSex(s)}>
                        <Text style={styles.label}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.title}>Diet Preference</Text>
              <View style={styles.grid}>
                {DIET_OPTIONS.map(o => (
                  <TouchableOpacity key={o.label} style={[styles.card, diet === o.label && styles.cardActive]} onPress={() => setDiet(o.label)}>
                    <Text style={styles.emoji}>{o.emoji}</Text>
                    <Text style={styles.label}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.title}>Activity Plan</Text>
              <Text style={styles.sectionLabel}>PLAN TYPE</Text>
              <View style={styles.grid}>
                {PLAN_OPTIONS.map(p => (
                  <TouchableOpacity key={p.value} style={[styles.card, planType === p.value && styles.cardActive]} onPress={() => setPlanType(p.value)}>
                    <Text style={styles.emoji}>{p.icon}</Text>
                    <Text style={styles.label}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>TIME OF DAY</Text>
              <View style={styles.grid}>
                {TIME_OF_DAY_OPTIONS.map(t => (
                  <TouchableOpacity key={t.value} style={[styles.card, timeOfDay === t.value && styles.cardActive]} onPress={() => { setTimeOfDay(t.value); setSpecificTime(''); }}>
                    <Text style={styles.emoji}>{t.icon}</Text>
                    <Text style={styles.label}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {timeOfDay && (
                <View>
                  <Text style={styles.sectionLabel}>SELECT TIMING</Text>
                  <View style={styles.grid}>
                    {SPECIFIC_TIMES[timeOfDay].map((t: string) => (
                      <TouchableOpacity key={t} style={[styles.timeSlot, specificTime === t && styles.timeSlotActive]} onPress={() => setSpecificTime(t)}>
                        <Text style={[styles.timeSlotTxt, specificTime === t && styles.timeSlotTxtActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading}>
            {loading ? <ActivityIndicator color="#2D5F3F" /> : <Text style={styles.nextBtnTxt}>{step === 5 ? 'Complete Profile' : 'Next Step'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 32 },
  backBtn: { marginBottom: 10 },
  progress: { flexDirection: 'row', gap: 10, marginBottom: 40, justifyContent: 'center' },
  dot: { width: 30, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#A8D5BA' },
  dotInactive: { backgroundColor: '#E0E9E3' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2D5F3F', marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '30%', backgroundColor: '#FFF', borderRadius: 15, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E0E9E3' },
  cardActive: { borderColor: '#A8D5BA', backgroundColor: '#F0F8F4' },
  emoji: { fontSize: 24, marginBottom: 5 },
  label: { fontSize: 12, color: '#2D5F3F', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 15 },
  stageCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#E0E9E3' },
  emojiLarge: { fontSize: 40, marginBottom: 10 },
  labelLarge: { fontSize: 16, fontWeight: 'bold', color: '#2D5F3F' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#2D5F3F', marginBottom: 15 },
  weekPicker: { flexDirection: 'row' },
  weekBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E9E3', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  weekBtnActive: { backgroundColor: '#A8D5BA', borderColor: '#A8D5BA' },
  weekTxt: { color: '#6B7F71' },
  weekTxtActive: { color: '#FFF', fontWeight: 'bold' },
  form: { gap: 15 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E9E3', borderRadius: 12, padding: 15, fontSize: 16 },
  sexBtn: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E9E3', borderRadius: 12, padding: 15, alignItems: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#2D5F3F', marginBottom: 15, marginTop: 20, letterSpacing: 1 },
  timeSlot: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E9E3' },
  timeSlotActive: { borderColor: '#A8D5BA', backgroundColor: '#F0F8F4' },
  timeSlotTxt: { color: '#6B7F71', fontWeight: 'bold' },
  timeSlotTxtActive: { color: '#2D5F3F' },
  nextBtn: { backgroundColor: '#A8D5BA', padding: 20, borderRadius: 30, alignItems: 'center', marginTop: 40 },
  nextBtnTxt: { fontSize: 18, fontWeight: 'bold', color: '#2D5F3F' }
});
