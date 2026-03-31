import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { Theme } from '../../../constants/Theme';

const API_URL = 'https://api.neevios.com';

const ACTIVITY_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Custom time'];
const RELATIONSHIP_OPTIONS = ['Mother', 'Father', 'Grandmother', 'Grandfather', 'Guardian', 'Caregiver', 'Other'];

export default function EditProfile() {
  const navigation = useNavigation<any>();
  const { token, user, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [relationship, setRelationship] = useState(user?.relationship_type || '');
  const [activityTime, setActivityTime] = useState(user?.preferred_activity_time || '');
  const [pregnancyWeek, setPregnancyWeek] = useState(user?.pregnancy_info?.current_week?.toString() || '');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      if (data.relationship_type) setRelationship(data.relationship_type);
      if (data.preferred_activity_time) setActivityTime(data.preferred_activity_time);
      if (data.pregnancy_info?.current_week) setPregnancyWeek(data.pregnancy_info.current_week.toString());
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch(
        `${API_URL}/api/user/update`,
        { relationship_type: relationship, preferred_activity_time: activityTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (user?.stage === 'pregnancy' && pregnancyWeek) {
        await axios.post(
          `${API_URL}/api/user/pregnancy`,
          { current_week: parseInt(pregnancyWeek) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchProfile();
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Relationship</Text>
            <View style={styles.optionsGrid}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <TouchableOpacity key={option} style={[styles.optionCard, relationship === option && styles.optionCardActive]} onPress={() => setRelationship(option)}>
                  <Text style={[styles.optionText, relationship === option && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Activity Time</Text>
            <View style={styles.optionsGrid}>
              {ACTIVITY_OPTIONS.map((option) => (
                <TouchableOpacity key={option} style={[styles.optionCard, activityTime === option && styles.optionCardActive]} onPress={() => setActivityTime(option)}>
                  <Text style={[styles.optionText, activityTime === option && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {user?.stage === 'pregnancy' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Pregnancy Week</Text>
              <TextInput style={styles.input} value={pregnancyWeek} onChangeText={setPregnancyWeek} placeholder="e.g., 24" placeholderTextColor="#B0BDB5" keyboardType="number-pad" maxLength={2} />
            </View>
          )}

          <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color={Theme.colors.primary} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: Theme.colors.primary, marginLeft: 8 },
  form: { gap: 24 },
  inputContainer: { gap: 12 },
  label: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionCard: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  optionCardActive: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.softGreen },
  optionText: { fontSize: 14, color: Theme.colors.textLight, fontWeight: '600' },
  optionTextActive: { color: Theme.colors.primary, fontWeight: '700' },
  input: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Theme.colors.primary },
  saveButton: { backgroundColor: Theme.colors.secondary, paddingVertical: 16, borderRadius: 25, alignItems: 'center', marginTop: 16, borderWidth: 1.5, borderColor: Theme.colors.primary },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 18, fontWeight: '700', color: Theme.colors.primary },
});
