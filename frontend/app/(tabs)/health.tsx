import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAIStore } from '../../store/useAIStore';
import LoadingLogo from '../../components/LoadingLogo';
import DatePickerField from '../../components/DatePickerField';

const API_URL = 'https://api.neevios.com';

const RECORD_TYPES = [
  "Weight","Height","Head Circumference",
  "Feeds Per Day","Feed Duration","Feed Type","Water Intake",
  "Night Sleep","Total Sleep","Night Wakings","Naps Per Day",
  "Tummy Time","Screen Time","Outdoor Time",
  "Vaccination","Fever","Doctor Visit"
];

const DROPDOWN_VALUES: Record<string, string[]> = {
  "Weight": ["1.0","1.5","2.0","2.5","3.0","3.5","4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0","9.5","10.0","10.5","11.0","11.5","12.0","12.5","13.0","13.5","14.0","14.5","15.0","16.0","17.0","18.0","19.0","20.0"],
  "Height": ["30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60","62","64","66","68","70","72","74","76","78","80","82","84","86","88","90","92","94","96","98","100","105","110","115","120"],
  "Head Circumference": ["25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55"],
  "Feeds Per Day": ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"],
  "Feed Duration": ["5","10","15","20","25","30","35","40","45"],
  "Feed Type": ["Breastfeed","Formula","Mixed","Solids Started","Breastfeed + Solids","Formula + Solids"],
  "Water Intake": ["0","50","100","150","200","250","300","350","400","450","500"],
  "Night Sleep": ["2","2.5","3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12"],
  "Total Sleep": ["6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13","13.5","14","14.5","15","15.5","16","16.5","17","17.5","18","18.5","19","19.5","20"],
  "Night Wakings": ["0","1","2","3","4","5","6","7","8","9","10"],
  "Naps Per Day": ["0","1","2","3","4","5","6"],
  "Tummy Time": ["0","5","10","15","20","25","30","35","40","45","50","55","60"],
  "Screen Time": ["0","15","30","45","60","75","90","105","120","135","150","165","180"],
  "Outdoor Time": ["0","15","30","45","60","75","90","105","120"],
  "Vaccination": ["BCG","OPV-0","Hepatitis B (Birth)","DTP-1","Hib-1","IPV-1","PCV-1","Rotavirus-1","DTP-2","Hib-2","IPV-2","PCV-2","Rotavirus-2","DTP-3","Hib-3","IPV-3","PCV-3","Rotavirus-3","OPV-1","OPV-2","OPV-3","MMR-1","Varicella-1","Hepatitis A-1","Hepatitis A-2","Typhoid","MMR-2","DTP Booster","OPV Booster"],
  "Fever": ["36.0","36.5","37.0","37.5","38.0","38.5","39.0","39.5","40.0","40.5","41.0","41.5","42.0"],
  "Doctor Visit": ["Routine Checkup","Sick Visit","Specialist - Pediatrician","Specialist - Neurologist","Specialist - Developmental Pediatrician","Specialist - Therapist","Specialist - ENT","Emergency Visit"]
};

const UNITS: Record<string, string> = {
  "Weight":"kg","Height":"cm","Head Circumference":"cm",
  "Feeds Per Day":"times","Feed Duration":"min","Feed Type":"",
  "Water Intake":"ml","Night Sleep":"hrs","Total Sleep":"hrs",
  "Night Wakings":"times","Naps Per Day":"times",
  "Tummy Time":"min","Screen Time":"min","Outdoor Time":"min",
  "Vaccination":"","Fever":"°C","Doctor Visit":""
};

const recordIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('weight')) return 'scale';
  if (t.includes('height')) return 'resize';
  if (t.includes('vaccination')) return 'shield-checkmark';
  if (t.includes('sleep')) return 'moon';
  if (t.includes('feed')) return 'restaurant';
  return 'medical';
};

const calculateAgeMonths = (dob: string): number => {
  try {
    const birth = new Date(dob);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
  } catch {
    return 0;
  }
};

export default function HealthTracking() {
  const { token, user } = useAuth();
  const { processChat, getStoredSessionId, selectedChildId } = useAIStore();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedType, setSelectedType] = useState('Weight');
  const [selectedValue, setSelectedValue] = useState('');
  const [subValue, setSubValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // AI state
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const buildChildProfile = async (recentRecords: any[]) => {
    try {
      const res = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prof = res.data;
      const firstChild = prof?.children?.[0] || null;
      return {
        full_name: prof?.full_name || null,
        relationship_type: prof?.relationship_type || null,
        stage: prof?.stage || 'parenting',
        child_name: firstChild?.name || null,
        child_dob: firstChild?.dob
          ? new Date(firstChild.dob).toISOString().split('T')[0]
          : null,
        child_sex: firstChild?.sex || null,
        diet_preference: firstChild?.diet_preference || null,
        mood_logs: [],
        health_records: recentRecords.slice(0, 5).map((r: any) => ({
          record_type: r.record_type,
          value: r.value,
          date: r.date,
        })),
        task_completions: [],
      };
    } catch {
      return {};
    }
  };

  const askAI = async (
    question: string,
    recentRecords: any[]
  ) => {
    if (!user?.id) return;
    const userId = user.id.toString();
    const childId = selectedChildId || userId;

    setAiLoading(true);
    setAiResponse(null);

    try {
      const sessionId = await getStoredSessionId(userId, childId);
      const rawProfile = await buildChildProfile(recentRecords);
      const childProfile = (rawProfile && Object.keys(rawProfile).length > 0) ? rawProfile : null;

      let response = '';
      await processChat(userId, question, childProfile, (token) => {
        response += token;
        setAiResponse(response);
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiResponse("I'm sorry, I couldn't analyze this record right now. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!selectedValue) {
      Alert.alert('Error', 'Please select a value');
      return;
    }

    const typeSaved = selectedType;
    const valueSaved = selectedValue;
    const subValueSaved = subValue;
    const notesSaved = notes;

    try {
      await axios.post(
        `${API_URL}/api/health/record`,
        {
          record_type: typeSaved,
          value: valueSaved,
          unit: UNITS[typeSaved] || '',
          sub_value: subValueSaved || null,
          date,
          notes: typeSaved === 'Doctor Visit' ? notesSaved : ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModalVisible(false);
      setSelectedValue('');
      setSubValue('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);

      await loadRecords();

      // Build AI Question logic
      const buildAIQuestion = () => {
        const unit = UNITS[typeSaved] || '';
        const childName = user?.children?.[0]?.name || 'your child';
        const dob = user?.children?.[0]?.dob;
        const ageMonths = dob ? calculateAgeMonths(dob) : null;
        const age = ageMonths !== null ? `${ageMonths} months` : '';

        if (typeSaved === 'Vaccination') return `We just gave ${childName} the ${valueSaved} vaccine (${subValueSaved || 'Dose 1'}) at ${age}. Any things to watch for?`;
        if (typeSaved === 'Doctor Visit') return `We had a ${valueSaved} for ${childName} at ${age}. Notes: ${notesSaved || 'none'}. Any follow up advice?`;
        if (typeSaved === 'Fever') return `${childName} has a fever of ${valueSaved}°C at ${age}. What should we watch for?`;
        if (typeSaved === 'Feed Type') return `${childName} is now on ${valueSaved} feeding at ${age}. Is this appropriate?`;
        return `I just recorded ${childName}'s ${typeSaved} as ${valueSaved} ${unit} at ${age}. Is this on track?`;
      };

      askAI(buildAIQuestion(), records);
    } catch (error: any) {
      console.error('Add record error:', error);
      const detail = error.response?.data?.detail || 'Failed to add record';
      Alert.alert('Error', detail);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingLogo size={80} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Tracking</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadRecords(); }}
            tintColor="#A8D5BA"
          />
        }
      >
        {(aiLoading || aiResponse) && (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <Ionicons name="sparkles" size={16} color="#2D5F3F" />
              <Text style={styles.aiCardLabel}>Neev AI</Text>
            </View>
            {aiLoading && !aiResponse ? (
              <View style={styles.aiLoadingRow}>
                <LoadingLogo size={24} />
                <Text style={styles.aiLoadingText}>Analysing record…</Text>
              </View>
            ) : (
              <Text style={styles.aiCardText}>{aiResponse}</Text>
            )}
          </View>
        )}

        {records.length > 0 ? (
          records.map((record: any) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Ionicons
                  name={recordIcon(record.record_type) as any}
                  size={24}
                  color="#A8D5BA"
                />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordType}>
                    {record.record_type}
                  </Text>
                  <Text style={styles.recordDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.recordValue}>{record.value}</Text>
                  <Text style={styles.recordUnit}>{record.unit}</Text>
                  {record.sub_value && <Text style={styles.recordSubValue}>{record.sub_value}</Text>}
                </View>
              </View>
              {record.notes ? (
                <Text style={styles.recordNotes}>{record.notes}</Text>
              ) : null}
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelectorScroll}>
              {RECORD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, selectedType === type && styles.typeButtonActive]}
                  onPress={() => {
                    setSelectedType(type);
                    setSelectedValue('');
                    setSubValue('');
                  }}
                >
                  <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.formContent}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.inputLabel}>Value {UNITS[selectedType] ? `(${UNITS[selectedType]})` : ''}</Text>
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {DROPDOWN_VALUES[selectedType].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.dropdownItem, selectedValue === val && styles.dropdownItemActive]}
                      onPress={() => setSelectedValue(val)}
                    >
                      <Text style={[styles.dropdownItemText, selectedValue === val && styles.dropdownItemTextActive]}>{val}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {selectedType === "Vaccination" && (
                <View style={styles.pickerWrapper}>
                  <Text style={styles.inputLabel}>Dose</Text>
                  <View style={styles.subValueRow}>
                    {["Dose 1","Dose 2","Dose 3","Booster"].map((dose) => (
                      <TouchableOpacity
                        key={dose}
                        style={[styles.subValueButton, subValue === dose && styles.subValueButtonActive]}
                        onPress={() => setSubValue(dose)}
                      >
                        <Text style={[styles.subValueText, subValue === dose && styles.subValueTextActive]}>{dose}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {selectedType === "Doctor Visit" && (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes (Symptoms, prescriptions, etc.)"
                  placeholderTextColor="#B0BDB5"
                  multiline
                  numberOfLines={3}
                />
              )}

              <DatePickerField label="Date" value={date} onChange={setDate} />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedValue('');
                  setSubValue('');
                  setNotes('');
                  setDate(new Date().toISOString().split('T')[0]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddRecord}>
                <Text style={styles.saveButtonText}>Add Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D5F3F' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#A8D5BA', justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  aiCard: { backgroundColor: '#F0F8F4', borderRadius: 14, borderWidth: 1, borderColor: '#A8D5BA', padding: 14, marginBottom: 16 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiCardLabel: { fontSize: 11, fontWeight: '700', color: '#2D5F3F', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiCardText: { fontSize: 14, color: '#2D5F3F', lineHeight: 21 },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLoadingText: { fontSize: 14, color: '#6B7F71' },
  recordCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E0E9E3' },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordInfo: { flex: 1 },
  recordType: { fontSize: 16, fontWeight: '600', color: '#2D5F3F' },
  recordDate: { fontSize: 14, color: '#6B7F71', marginTop: 2 },
  recordValue: { fontSize: 18, fontWeight: '700', color: '#2D5F3F' },
  recordUnit: { fontSize: 12, color: '#A8D5BA', fontWeight: '600', marginTop: -2 },
  recordSubValue: { fontSize: 13, color: '#6B7F71', fontStyle: 'italic' },
  recordNotes: { fontSize: 14, color: '#6B7F71', marginTop: 12, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7F71' },
  emptySubtext: { fontSize: 14, color: '#B0BDB5', textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF9F0', borderRadius: 16, padding: 24, width: '90%', maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#2D5F3F', marginBottom: 20 },
  typeSelectorScroll: { marginBottom: 16 },
  typeButton: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E0E9E3', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, height: 40 },
  typeButtonActive: { borderColor: '#A8D5BA', backgroundColor: '#F0F8F4' },
  typeText: { fontSize: 14, color: '#6B7F71' },
  typeTextActive: { color: '#2D5F3F', fontWeight: '600' },
  formContent: { gap: 16 },
  pickerWrapper: { gap: 8 },
  inputLabel: { fontSize: 13, color: '#6B7F71', fontWeight: '600' },
  dropdownList: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E9E3', borderRadius: 12, maxHeight: 150 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F2' },
  dropdownItemActive: { backgroundColor: '#F0F8F4' },
  dropdownItemText: { fontSize: 15, color: '#6B7F71' },
  dropdownItemTextActive: { color: '#2D5F3F', fontWeight: '600' },
  subValueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subValueButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#E0E9E3', backgroundColor: '#FFF' },
  subValueButtonActive: { backgroundColor: '#A8D5BA', borderColor: '#A8D5BA' },
  subValueText: { fontSize: 12, color: '#6B7F71' },
  subValueTextActive: { color: '#2D5F3F', fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E9E3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2D5F3F' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, backgroundColor: '#E0E9E3', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7F71' },
  saveButton: { flex: 1, backgroundColor: '#A8D5BA', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#2D5F3F' },
});
