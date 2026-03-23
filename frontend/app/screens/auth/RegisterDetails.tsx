import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';

const API_URL = "https://api.neevios.com";

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

export default function RegisterDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token, fetchProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [subStep, setSubStep] = useState(1); // 1: Diet, 2: Activity Plan

  // Onboarding Data from previous screen
  const { relationship, stage, pregnancyWeek, childName, childDOB, childSex } = route.params || {};

  // Step 5: Diet
  const [diet, setDiet] = useState('');

  // Step 6: Plan
  const [planType, setPlanType] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [specificTime, setSpecificTime] = useState('');

  const handleSubmit = async () => {
    if (!planType || !timeOfDay || !specificTime) {
      return Alert.alert('Wait', 'Please select your full plan including specific timing');
    }

    setLoading(true);
    try {
      // 1. Update User Profile
      await axios.patch(`${API_URL}/api/user/update`, {
        relationship_type: relationship,
        preferred_plan_type: planType,
        preferred_time_of_day: timeOfDay,
        preferred_specific_time: specificTime,
        stage: stage
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 2. Save Stage Details
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
    } catch (error) {
      Alert.alert('Error', 'Failed to save your profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const OptionCard = ({ label, icon, selected, onPress }: any) => (
    <TouchableOpacity style={[styles.card, selected && styles.cardActive]} onPress={onPress}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={[styles.cardLabel, selected && styles.cardLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => subStep === 2 ? setSubStep(1) : navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2D5F3F" />
        </TouchableOpacity>

        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, subStep >= 1 ? styles.dotActive : styles.dotInactive]} />
          <View style={[styles.dot, subStep >= 2 ? styles.dotActive : styles.dotInactive]} />
        </View>

        {subStep === 1 ? (
          <View>
            <Text style={styles.title}>Diet Preference</Text>
            <Text style={styles.subtitle}>Step 5: What's your dietary preference?</Text>
            <View style={styles.grid}>
              <OptionCard label="Vegetarian" icon="🥗" selected={diet === 'Vegetarian'} onPress={() => setDiet('Vegetarian')} />
              <OptionCard label="Eggetarian" icon="🥚" selected={diet === 'Eggetarian'} onPress={() => setDiet('Eggetarian')} />
              <OptionCard label="Non-vegetarian" icon="🍗" selected={diet === 'Non-vegetarian'} onPress={() => setDiet('Non-vegetarian')} />
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, !diet && styles.disabled]}
              onPress={() => diet ? setSubStep(2) : Alert.alert('Wait', 'Please select a diet')}
            >
              <Text style={styles.nextBtnTxt}>Continue to Step 6</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.title}>Activity Plan</Text>
            <Text style={styles.subtitle}>Step 6: Choose your preferred schedule</Text>

            <Text style={styles.sectionLabel}>PLAN TYPE</Text>
            <View style={styles.grid}>
              {PLAN_OPTIONS.map(p => (
                <OptionCard key={p.value} label={p.label} icon={p.icon} selected={planType === p.value} onPress={() => setPlanType(p.value)} />
              ))}
            </View>

            <Text style={styles.sectionLabel}>TIME OF DAY</Text>
            <View style={styles.grid}>
              {TIME_OF_DAY_OPTIONS.map(t => (
                <OptionCard key={t.value} label={t.label} icon={t.icon} selected={timeOfDay === t.value} onPress={() => {
                  setTimeOfDay(t.value);
                  setSpecificTime('');
                }} />
              ))}
            </View>

            {timeOfDay && (
              <View>
                <Text style={styles.sectionLabel}>SELECT TIMING</Text>
                <View style={styles.grid}>
                  {SPECIFIC_TIMES[timeOfDay].map((t: string) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeSlot, specificTime === t && styles.timeSlotActive]}
                      onPress={() => setSpecificTime(t)}
                    >
                      <Text style={[styles.timeSlotTxt, specificTime === t && styles.timeSlotTxtActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading || !specificTime}>
              {loading ? <ActivityIndicator color="#2D5F3F" /> : <Text style={styles.submitBtnTxt}>Complete Profile</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  scrollContent: { padding: 24 },
  backBtn: { marginBottom: 20 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 30, justifyContent: 'center' },
  dot: { width: 30, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#A8D5BA' },
  dotInactive: { backgroundColor: '#E0E9E3' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2D5F3F', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7F71', marginBottom: 30 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#2D5F3F', marginBottom: 15, marginTop: 10, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  card: { width: '30%', aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 15, padding: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E9E3' },
  cardActive: { borderColor: '#A8D5BA', backgroundColor: '#F0F8F4' },
  cardIcon: { fontSize: 24, marginBottom: 5 },
  cardLabel: { fontSize: 11, textAlign: 'center', color: '#6B7F71', fontWeight: '600' },
  cardLabelActive: { color: '#2D5F3F' },
  timeSlot: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E9E3', marginBottom: 5 },
  timeSlotActive: { borderColor: '#A8D5BA', backgroundColor: '#F0F8F4' },
  timeSlotTxt: { color: '#6B7F71', fontWeight: 'bold' },
  timeSlotTxtActive: { color: '#2D5F3F' },
  nextBtn: { backgroundColor: '#A8D5BA', padding: 20, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  nextBtnTxt: { fontSize: 18, fontWeight: 'bold', color: '#2D5F3F' },
  submitBtn: { backgroundColor: '#A8D5BA', padding: 20, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  submitBtnTxt: { fontSize: 18, fontWeight: 'bold', color: '#2D5F3F' },
  disabled: { opacity: 0.5 }
});
