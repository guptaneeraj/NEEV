import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as directusService from '../../../services/DirectusApiClient';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';

const ACTIVITY_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Custom time'];
const RELATIONSHIP_OPTIONS = [
  'Mother', 'Father', 'Grandmother', 'Grandfather', 'Guardian', 'Caregiver', 'Aunt', 'Uncle', 'Foster Parent', 'Adoptive Parent', 'Stepmother', 'Stepfather'
];

export default function EditProfile() {
  const navigation = useNavigation<any>();
  const { token, user, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [relationship, setRelationship] = useState(user?.relationship_type || '');
  const [activityTime, setActivityTime] = useState(user?.preferred_activity_time || '');
  const [pregnancyWeek, setPregnancyWeek] = useState(user?.pregnancy_info?.current_week?.toString() || '');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', icon: '', onConfirm: () => {} });

  const showAlert = (title: string, message: string, icon: string = 'ℹ️', onConfirm?: () => void) => {
    setModalConfig({
      title,
      message,
      icon,
      onConfirm: onConfirm || (() => setModalVisible(false))
    });
    setModalVisible(true);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    if (user.relationship_type) setRelationship(user.relationship_type);
    if (user.preferred_activity_time) setActivityTime(user.preferred_activity_time);
    if (user.pregnancy_info?.current_week) setPregnancyWeek(user.pregnancy_info.current_week.toString());
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await directusService.updateUser(user.id, {
        relationship_type: relationship,
        preferred_activity_time: activityTime
      });

      if (user?.stage === 'pregnancy' && pregnancyWeek) {
        await directusService.savePregnancyInfo({
          user_id: user.id,
          current_week: parseInt(pregnancyWeek)
        });
      }

      await fetchProfile();
      showAlert('Profile Updated', 'Your personal details have been saved successfully.', '✅', () => {
        setModalVisible(false);
        navigation.goBack();
      });
    } catch (error: any) {
      showAlert('Update Failed', error.message || 'We couldn\'t update your profile at this time.', '❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(24)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Info</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.label}>Your Role</Text>
            <View style={styles.optionsGrid}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionCard, relationship === option && styles.optionCardActive]}
                  onPress={() => setRelationship(option)}
                >
                  <Text style={[styles.optionText, relationship === option && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Activity Reminder</Text>
            <View style={styles.optionsGrid}>
              {ACTIVITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionCard, activityTime === option && styles.optionCardActive]}
                  onPress={() => setActivityTime(option)}
                >
                  <Text style={[styles.optionText, activityTime === option && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {user?.stage === 'pregnancy' && (
            <View style={styles.section}>
              <Text style={styles.label}>Current Pregnancy Week</Text>
              <TextInput
                style={styles.input}
                value={pregnancyWeek}
                onChangeText={setPregnancyWeek}
                placeholder="e.g., 24"
                placeholderTextColor="#B0BDB5"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={Theme.colors.white} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NeevModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        onConfirm={modalConfig.onConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(30),
  },
  form: { gap: verticalScale(24) },
  section: {
    backgroundColor: Theme.colors.white,
    padding: moderateScale(20),
    borderRadius: moderateScale(32),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft,
    gap: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: Theme.colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  optionCard: {
    backgroundColor: Theme.colors.softSlate,
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder,
    borderRadius: moderateScale(15),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
  },
  optionCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.secondary,
  },
  optionText: {
    fontSize: moderateScale(14),
    color: Theme.colors.textLight,
    fontWeight: '700',
  },
  optionTextActive: {
    color: Theme.colors.primary,
  },
  input: {
    backgroundColor: Theme.colors.softSlate,
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder,
    borderRadius: moderateScale(15),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    fontSize: moderateScale(16),
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    marginTop: verticalScale(10),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.soft,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: Theme.colors.white,
  },
});
