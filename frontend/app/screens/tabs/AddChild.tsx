import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { Theme } from '../../../constants/Theme';
import DatePickerField from '../../../components/DatePickerField';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';

const API_URL = 'https://api.neevios.com';

const DIET_OPTIONS = ['Vegetarian', 'Eggetarian', 'Non-vegetarian'];
const SEX_OPTIONS = ['Male', 'Female', 'Prefer not to say'];

export default function AddChild() {
  const navigation = useNavigation<any>();
  const { token, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [diet, setDiet] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', icon: '', onConfirm: () => {} });

  const showAlert = (title: string, message: string, icon: string = '⚠️', onConfirm?: () => void) => {
    setModalConfig({
      title,
      message,
      icon,
      onConfirm: onConfirm || (() => setModalVisible(false))
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name || !dob) {
      showAlert('Required Information', 'Please provide your child\'s name and date of birth to continue.', '👶');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/user/child`,
        { name, dob, sex, diet_preference: diet },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchProfile();
      showAlert('Success!', `${name}'s profile has been created successfully.`, '🎉', () => {
        setModalVisible(false);
        navigation.goBack();
      });
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'We encountered an issue while adding the child profile. Please try again.', '❌');
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
        <Text style={styles.title}>Add Child</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.label}>Child's Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
                placeholderTextColor="#B0BDB5"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Birth Details</Text>
              <DatePickerField label="Date of Birth" value={dob} onChange={setDob} />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Sex</Text>
              <View style={styles.optionsGrid}>
                {SEX_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionCard, sex === option && styles.optionCardActive]}
                    onPress={() => setSex(option)}
                  >
                    <Text style={[styles.optionText, sex === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Diet Preference</Text>
              <View style={styles.optionsGrid}>
                {DIET_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionCard, diet === option && styles.optionCardActive]}
                    onPress={() => setDiet(option)}
                  >
                    <Text style={[styles.optionText, diet === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Theme.colors.white} /> : <Text style={styles.submitButtonText}>Add Child</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: { flex: 1 },
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
  form: { gap: verticalScale(20) },
  section: {
    backgroundColor: Theme.colors.white,
    padding: moderateScale(20),
    borderRadius: moderateScale(32),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft,
    gap: verticalScale(12),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: Theme.colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  optionCard: {
    backgroundColor: Theme.colors.softSlate,
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder,
    borderRadius: moderateScale(12),
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
  submitButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    marginTop: verticalScale(10),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.soft,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: Theme.colors.white,
  },
});
