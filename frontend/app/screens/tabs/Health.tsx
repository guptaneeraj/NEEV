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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAIStore } from '../../../store/useAIStore';
import LoadingLogo from '../../../components/LoadingLogo';
import DatePickerField from '../../../components/DatePickerField';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';

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
  const { token, user, fetchProfile } = useAuth();
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

  // Alert Modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', icon: '' });

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
      const prof = await fetchProfile();
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

  const showAlert = (title: string, message: string, icon: string = '⚠️') => {
    setAlertConfig({ title, message, icon });
    setAlertVisible(true);
  };

  const handleAddRecord = async () => {
    if (!selectedValue) {
      showAlert('Selection Required', 'Please select a value for the record.', '📋');
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
      const detail = error.response?.data?.detail || 'Failed to add record. Please try again.';
      showAlert('Error', detail, '❌');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingLogo size={moderateScale(80)} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Tracking</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={moderateScale(24)} color={Theme.colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadRecords(); }}
            tintColor={Theme.colors.secondary}
          />
        }
      >
        {(aiLoading || aiResponse) && (
          <View style={[styles.aiCard, {backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.softGreenBorder}]}>
            <View style={styles.aiCardHeader}>
              <Ionicons name="sparkles" size={moderateScale(16)} color={Theme.colors.primary} />
              <Text style={styles.aiCardLabel}>Neev AI</Text>
            </View>
            {aiLoading && !aiResponse ? (
              <View style={styles.aiLoadingRow}>
                <LoadingLogo size={moderateScale(24)} />
                <Text style={styles.aiLoadingText}>Analysing record…</Text>
              </View>
            ) : (
              <Text style={[styles.aiCardText, {color: Theme.colors.primary}]}>{aiResponse}</Text>
            )}
          </View>
        )}

        {records.length > 0 ? (
          records.map((record: any) => (
            <View key={record.id} style={[styles.recordCard, {backgroundColor: Theme.colors.white, borderColor: Theme.colors.accent}]}>
              <View style={styles.recordHeader}>
                <Ionicons
                  name={recordIcon(record.record_type) as any}
                  size={moderateScale(24)}
                  color={Theme.colors.secondary}
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
            <Ionicons name="fitness-outline" size={moderateScale(64)} color={Theme.colors.accent} />
            <Text style={styles.emptyText}>No health records yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your health data</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: Theme.colors.background, borderColor: Theme.colors.accent, borderWidth: 1.5}]}>
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
                <ScrollView style={[styles.dropdownList, {borderColor: Theme.colors.accent}]} nestedScrollEnabled={true}>
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
                  style={[styles.input, styles.textArea, {borderColor: Theme.colors.accent}]}
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
                style={[styles.cancelButton, {backgroundColor: Theme.colors.accent, borderColor: Theme.colors.accent}]}
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
              <TouchableOpacity style={[styles.saveButton, {backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary}]} onPress={handleAddRecord}>
                <Text style={[styles.saveButtonText, {color: Theme.colors.white}]}>Add Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NeevModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        onConfirm={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(24), paddingVertical: verticalScale(20) },
  title: { fontSize: moderateScale(28), fontWeight: '700', color: Theme.colors.primary },
  addButton: { width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: Theme.colors.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  scrollView: { flex: 1, paddingHorizontal: scale(24) },
  aiCard: { borderRadius: moderateScale(16), borderWidth: 1.5, padding: moderateScale(20), marginBottom: verticalScale(16) },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: verticalScale(8) },
  aiCardLabel: { fontSize: moderateScale(11), fontWeight: '700', color: Theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  aiCardText: { fontSize: moderateScale(14), lineHeight: moderateScale(21) },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  aiLoadingText: { fontSize: moderateScale(14), color: Theme.colors.textLight },
  recordCard: { padding: moderateScale(16), borderRadius: moderateScale(16), marginBottom: verticalScale(12), borderWidth: 1.5, ...Theme.shadows.soft },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  recordInfo: { flex: 1 },
  recordType: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary },
  recordDate: { fontSize: moderateScale(14), color: Theme.colors.textLight, marginTop: verticalScale(2) },
  recordValue: { fontSize: moderateScale(18), fontWeight: '800', color: Theme.colors.primary },
  recordUnit: { fontSize: moderateScale(12), color: Theme.colors.secondary, fontWeight: '700', marginTop: -verticalScale(2) },
  recordSubValue: { fontSize: moderateScale(13), color: Theme.colors.textLight, fontStyle: 'italic' },
  recordNotes: { fontSize: moderateScale(14), color: Theme.colors.textLight, marginTop: verticalScale(12), fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(64), gap: verticalScale(16) },
  emptyText: { fontSize: moderateScale(18), fontWeight: '600', color: Theme.colors.textLight },
  emptySubtext: { fontSize: moderateScale(14), color: '#B0BDB5', textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderRadius: moderateScale(25), padding: moderateScale(24), width: '90%', maxHeight: '90%' },
  modalTitle: { fontSize: moderateScale(22), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(20) },
  typeSelectorScroll: { marginBottom: verticalScale(16) },
  typeButton: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent, borderRadius: moderateScale(20), paddingVertical: verticalScale(8), paddingHorizontal: scale(16), marginRight: scale(8), height: verticalScale(40) },
  typeButtonActive: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.softGreen },
  typeText: { fontSize: moderateScale(14), color: Theme.colors.textLight },
  typeTextActive: { color: Theme.colors.primary, fontWeight: '700' },
  formContent: { gap: verticalScale(16) },
  pickerWrapper: { gap: verticalScale(8) },
  inputLabel: { fontSize: moderateScale(13), color: Theme.colors.textLight, fontWeight: '600' },
  dropdownList: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderRadius: moderateScale(12), maxHeight: verticalScale(150) },
  dropdownItem: { padding: moderateScale(12), borderBottomWidth: 1, borderBottomColor: Theme.colors.background },
  dropdownItemActive: { backgroundColor: Theme.colors.softGreen },
  dropdownItemText: { fontSize: moderateScale(15), color: Theme.colors.textLight },
  dropdownItemTextActive: { color: Theme.colors.primary, fontWeight: '700' },
  subValueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  subValueButton: { paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: moderateScale(15), borderWidth: 1.5, borderColor: Theme.colors.accent, backgroundColor: Theme.colors.white },
  subValueButtonActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  subValueText: { fontSize: moderateScale(12), color: Theme.colors.textLight },
  subValueTextActive: { color: Theme.colors.primary, fontWeight: '700' },
  input: { backgroundColor: Theme.colors.white, borderWidth: 1.5, borderRadius: moderateScale(12), paddingHorizontal: scale(16), paddingVertical: verticalScale(12), fontSize: moderateScale(16), color: Theme.colors.primary },
  textArea: { minHeight: verticalScale(80), textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: scale(12), marginTop: verticalScale(24) },
  cancelButton: { flex: 1, paddingVertical: verticalScale(15), borderRadius: moderateScale(25), alignItems: 'center', borderWidth: 1.5 },
  cancelButtonText: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.textLight },
  saveButton: { flex: 1, paddingVertical: verticalScale(15), borderRadius: moderateScale(25), alignItems: 'center', borderWidth: 1.5 },
  saveButtonText: { fontSize: moderateScale(16), fontWeight: '700' },
});
