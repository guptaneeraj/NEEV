import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from '../../../utils/responsive';
import AppEmoji from '../../../components/AppEmoji';
import NeevModal from '../../../components/NeevModal';

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

  // Alert Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', icon: '' });

  const { relationship, stage, pregnancyWeek, childName, childDOB, childSex } = route.params || {};

  const showAlert = (title: string, message: string, icon: string = '⚠️') => {
    setModalConfig({ title, message, icon });
    setModalVisible(true);
  };

  const [diet, setDiet] = useState('');
  const [planType, setPlanType] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [specificTime, setSpecificTime] = useState('');

  const handleSubmit = async () => {
    if (!planType || !timeOfDay || !specificTime) {
      return showAlert('Selection Required', 'Please select your full plan including specific timing.', '⏰');
    }

    setLoading(true);
    try {
      await axios.patch(`${API_URL}/api/user/update`, {
        relationship_type: relationship,
        preferred_plan_type: planType,
        preferred_time_of_day: timeOfDay,
        preferred_specific_time: specificTime,
        stage: stage
      }, { headers: { Authorization: `Bearer ${token}` } });

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
      navigation.replace('Home');
    } catch (error) {
      showAlert('Error', 'Failed to save your profile. Please check your connection.', '❌');
    } finally {
      setLoading(false);
    }
  };

  const OptionCard = ({ label, icon, selected, onPress }: any) => (
    <TouchableOpacity style={[styles.card, selected && styles.cardActive]} onPress={onPress}>
      <AppEmoji style={styles.cardIcon}>{icon}</AppEmoji>
      <Text style={[styles.cardLabel, selected && styles.cardLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => subStep === 2 ? setSubStep(1) : navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color={Theme.colors.primary} />
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
              onPress={() => diet ? setSubStep(2) : showAlert('Selection Required', 'Please select a diet preference.', '🥗')}
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
              {loading ? <ActivityIndicator color={Theme.colors.primary} /> : <Text style={styles.submitBtnTxt}>Complete Profile</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <NeevModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        onConfirm={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: scale(24) },
  backBtn: { marginBottom: verticalScale(16) },
  progress: { flexDirection: 'row', gap: scale(8), marginBottom: verticalScale(32), justifyContent: 'center' },
  dot: { width: scale(32), height: verticalScale(6), borderRadius: moderateScale(4) },
  dotActive: { backgroundColor: Theme.colors.secondary },
  dotInactive: { backgroundColor: Theme.colors.accent },
  title: { fontSize: moderateScale(28), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(8) },
  subtitle: { fontSize: moderateScale(14), color: Theme.colors.textLight, marginBottom: verticalScale(32), fontWeight: '600' },
  sectionLabel: { fontSize: moderateScale(12), fontWeight: '800', color: Theme.colors.primary, marginBottom: verticalScale(12), marginTop: verticalScale(12), letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(12), marginBottom: verticalScale(16) },
  card: { width: (SCREEN_WIDTH - scale(72)) / 3, aspectRatio: 1, backgroundColor: Theme.colors.white, borderRadius: moderateScale(15), padding: moderateScale(8), justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.accent },
  cardActive: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.softGreen },
  cardIcon: { fontSize: moderateScale(24), marginBottom: verticalScale(5) },
  cardLabel: { fontSize: moderateScale(10), textAlign: 'center', color: Theme.colors.textLight, fontWeight: '700' },
  cardLabelActive: { color: Theme.colors.primary },
  timeSlot: { paddingHorizontal: scale(16), paddingVertical: verticalScale(12), borderRadius: moderateScale(12), backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, marginBottom: verticalScale(5) },
  timeSlotActive: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.softGreen },
  timeSlotTxt: { color: Theme.colors.textLight, fontWeight: '700', fontSize: moderateScale(13) },
  timeSlotTxtActive: { color: Theme.colors.primary },
  nextBtn: { backgroundColor: Theme.colors.secondary, padding: verticalScale(18), borderRadius: moderateScale(25), alignItems: 'center', marginTop: verticalScale(16), borderWidth: 1.5, borderColor: Theme.colors.primary },
  nextBtnTxt: { fontSize: moderateScale(16), fontWeight: '900', color: Theme.colors.primary },
  submitBtn: { backgroundColor: Theme.colors.secondary, padding: verticalScale(18), borderRadius: moderateScale(25), alignItems: 'center', marginTop: verticalScale(16), borderWidth: 1.5, borderColor: Theme.colors.primary },
  submitBtnTxt: { fontSize: moderateScale(16), fontWeight: '900', color: Theme.colors.primary },
  disabled: { opacity: 0.5 }
});
