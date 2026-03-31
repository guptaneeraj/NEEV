import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { Theme } from '../../../constants/Theme';
import DatePickerField from '../../../components/DatePickerField';

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

  const handleSubmit = async () => {
    if (!name || !dob) {
      Alert.alert('Error', 'Please fill in name and date of birth');
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
      Alert.alert('Success', `${name} has been added successfully!`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Another Child</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Child's Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter name" placeholderTextColor="#B0BDB5" />
            </View>

            <View style={styles.inputContainer}>
              <DatePickerField label="Date of Birth" value={dob} onChange={setDob} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sex</Text>
              <View style={styles.optionsContainer}>
                {SEX_OPTIONS.map((option) => (
                  <TouchableOpacity key={option} style={[styles.optionButton, sex === option && styles.optionButtonActive]} onPress={() => setSex(option)}>
                    <Text style={[styles.optionText, sex === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Diet Preference</Text>
              <View style={styles.optionsContainer}>
                {DIET_OPTIONS.map((option) => (
                  <TouchableOpacity key={option} style={[styles.optionButton, diet === option && styles.optionButtonActive]} onPress={() => setDiet(option)}>
                    <Text style={[styles.optionText, diet === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={Theme.colors.primary} /> : <Text style={styles.submitButtonText}>Add Child</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: Theme.colors.primary, marginLeft: 8 },
  form: { gap: 24 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.colors.primary },
  input: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Theme.colors.primary },
  optionsContainer: { gap: 10 },
  optionButton: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: 15, paddingVertical: 14, alignItems: 'center' },
  optionButtonActive: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.softGreen },
  optionText: { fontSize: 16, color: Theme.colors.textLight, fontWeight: '600' },
  optionTextActive: { color: Theme.colors.primary, fontWeight: '700' },
  submitButton: { backgroundColor: Theme.colors.secondary, paddingVertical: 18, borderRadius: 25, alignItems: 'center', marginTop: 16, borderWidth: 1.5, borderColor: Theme.colors.primary },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, fontWeight: '700', color: Theme.colors.primary },
});
