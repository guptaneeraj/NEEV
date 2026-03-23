import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

const API_URL = 'https://api.neevios.com';

export default function HealthTracking() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [recordType, setRecordType] = useState('weight');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddRecord = async () => {
    if (!value) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/health/record`,
        { record_type: recordType, value, date, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalVisible(false);
      setValue('');
      setNotes('');
      loadRecords();
      Alert.alert('Success', 'Record added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add record');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRecords(); }} tintColor="#A8D5BA" />}>
        {records.length > 0 ? (
          records.map((record: any) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Ionicons name={record.type === 'weight' ? 'scale' : record.type === 'height' ? 'resize' : 'medical'} size={24} color="#A8D5BA" />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordType}>{record.type}</Text>
                  <Text style={styles.recordDate}>{new Date(record.date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.recordValue}>{record.value}</Text>
              </View>
              {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#E0E9E3" />
            <Text style={styles.emptyText}>No health records yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your health data</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Health Record</Text>
            <View style={styles.typeSelector}>
              {['weight', 'height', 'appointment', 'vaccination'].map((type) => (
                <TouchableOpacity key={type} style={[styles.typeButton, recordType === type && styles.typeButtonActive]} onPress={() => setRecordType(type)}>
                  <Text style={[styles.typeText, recordType === type && styles.typeTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} value={value} onChangeText={setValue} placeholder="Value (e.g., 65 kg)" placeholderTextColor="#B0BDB5" />
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#B0BDB5" />
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Notes (optional)" placeholderTextColor="#B0BDB5" multiline numberOfLines={3} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddRecord}>
                <Text style={styles.saveButtonText}>Add Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button - Moved to Left to avoid Chat overlap */}
      <TouchableOpacity style={styles.floatingAddButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F0' },
  scrollView: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  recordCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E0E9E3' },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordInfo: { flex: 1 },
  recordType: { fontSize: 16, fontWeight: '600', color: '#2D5F3F', textTransform: 'capitalize' },
  recordDate: { fontSize: 14, color: '#6B7F71', marginTop: 2 },
  recordValue: { fontSize: 18, fontWeight: '700', color: '#A8D5BA' },
  recordNotes: { fontSize: 14, color: '#6B7F71', marginTop: 12, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7F71' },
  emptySubtext: { fontSize: 14, color: '#B0BDB5', textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF9F0', borderRadius: 16, padding: 24, width: '85%', maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#2D5F3F', marginBottom: 20 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeButton: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E0E9E3', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  typeButtonActive: { borderColor: '#A8D5BA', backgroundColor: '#F0F8F4' },
  typeText: { fontSize: 14, color: '#6B7F71', textTransform: 'capitalize' },
  typeTextActive: { color: '#2D5F3F', fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0E9E3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2D5F3F', marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, backgroundColor: '#E0E9E3', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7F71' },
  saveButton: { flex: 1, backgroundColor: '#A8D5BA', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#2D5F3F' },
  floatingAddButton: {
    position: 'absolute',
    bottom: 30,
    left: 30, // Moved to left
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#A8D5BA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});
