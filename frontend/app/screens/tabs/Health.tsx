import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAIStore } from '../../../store/useAIStore';
import LoadingLogo from '../../../components/LoadingLogo';
import DatePickerField from '../../../components/DatePickerField';
import TimePickerField from '../../../components/TimePickerField';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';
import { fetchHealthRecords, saveHealthRecord, saveSleepLog } from '../../../services/DirectusApiClient';
import { format, differenceInHours } from 'date-fns';

const RECORD_TYPES = [
  "Weight","Height","Head Circumference",
  "Feeds Per Day","Feed Duration","Feed Type","Water Intake",
  "Night Sleep","Total Sleep","Night Wakings","Naps Per Day",
  "Tummy Time","Screen Time","Outdoor Time",
  "Vaccination","Fever","Doctor Visit",
  "Sleep Session"
];

const DROPDOWN_VALUES: Record<string, string[]> = {
  "Weight": Array.from({ length: 400 }, (_, i) => (1 + i * 0.05).toFixed(2)), // 1kg to 21kg in 50g steps
  "Height": Array.from({ length: 200 }, (_, i) => (30 + i * 0.5).toFixed(1)), // 30cm to 130cm in 5mm steps
  "Head Circumference": Array.from({ length: 120 }, (_, i) => (25 + i * 0.25).toFixed(1)),
  "Feeds Per Day": ["1","2","3","4","5","6","7","8","9","10","11","12"],
  "Feed Duration": ["5","10","15","20","25","30","35","40","45"],
  "Feed Type": ["Breastfeed","Formula","Mixed","Solids Started","Breastfeed + Solids","Formula + Solids"],
  "Water Intake": ["0","25","50","75","100","150","200","250","300","350","400","450","500"],
  "Night Sleep": ["2","2.5","3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12"],
  "Total Sleep": ["6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13","13.5","14","14.5","15","15.5","16","16.5","17","17.5","18","18.5","19","19.5","20"],
  "Night Wakings": ["0","1","2","3","4","5","6","7","8"],
  "Naps Per Day": ["0","1","2","3","4","5"],
  "Tummy Time": ["0","5","10","15","20","25","30","35","40","45","50","55","60"],
  "Screen Time": ["0","15","30","45","60","75","90","105","120","135","150","165","180"],
  "Outdoor Time": ["0","15","30","45","60","75","90","105","120"],
  "Vaccination": ["BCG","OPV-0","Hepatitis B (Birth)","DTP-1","Hib-1","IPV-1","PCV-1","Rotavirus-1","DTP-2","Hib-2","IPV-2","PCV-2","Rotavirus-2","DTP-3","Hib-3","IPV-3","PCV-3","Rotavirus-3","OPV-1","OPV-2","OPV-3","MMR-1","Varicella-1","Hepatitis A-1","Hepatitis A-2","Typhoid","MMR-2","DTP Booster","OPV Booster"],
  "Fever": ["36.0","36.1","36.2","36.3","36.4","36.5","36.6","36.7","36.8","36.9","37.0","37.1","37.2","37.3","37.4","37.5","37.6","37.7","37.8","37.9","38.0","38.1","38.2","38.3","38.4","38.5","38.6","38.7","38.8","38.9","39.0","39.1","39.2","39.3","39.4","39.5","39.6","39.7","39.8","39.9","40.0"],
  "Doctor Visit": ["Routine Checkup","Sick Visit","Specialist - Pediatrician","Specialist - Neurologist","Specialist - Developmental Pediatrician","Specialist - Therapist","Specialist - ENT","Emergency Visit"],
  "Sleep Session": []
};

const UNITS: Record<string, string> = {
  "Weight":"kg","Height":"cm","Head Circumference":"cm",
  "Feeds Per Day":"times","Feed Duration":"min","Feed Type":"",
  "Water Intake":"ml","Night Sleep":"hrs","Total Sleep":"hrs",
  "Night Wakings":"times","Naps Per Day":"times",
  "Tummy Time":"min","Screen Time":"min","Outdoor Time":"min",
  "Vaccination":"","Fever":"°C","Doctor Visit":"","Sleep Session":"hrs"
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

export default function HealthTracking({ route }: any) {
  const navigation = useNavigation<any>();
  const { token, user, fetchProfile } = useAuth();
  const { processChat, getStoredSessionId, selectedChildId } = useAIStore();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'hub' | 'history' | 'growth' | 'rhythm' | 'activity' | 'nutrition' | 'medical'>('hub');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState({ day: 'All', month: 'All', year: 'All' });
  const [selectedType, setSelectedType] = useState('Weight');
  const [selectedValue, setSelectedValue] = useState('');
  const [subValue, setSubValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [weightWhole, setWeightWhole] = useState('');
  const [weightDecimal, setWeightDecimal] = useState('');
  const [heightWhole, setHeightWhole] = useState('');
  const [heightDecimal, setHeightDecimal] = useState('');
  const [headWhole, setHeadWhole] = useState('');
  const [headDecimal, setHeadDecimal] = useState('');

  const [sleepStartTime, setSleepStartTime] = useState('08:00 PM');
  const [sleepEndTime, setSleepEndTime] = useState('07:00 AM');
  const [nightWakings, setNightWakings] = useState('');
  const [napsPerDay, setNapsPerDay] = useState('');

  const [feedType, setFeedType] = useState('');
  const [numFeeds, setNumFeeds] = useState('');
  const [waterIntake, setWaterIntake] = useState('');

  const [tummyMins, setTummyMins] = useState('');
  const [outdoorMins, setOutdoorMins] = useState('');
  const [screenMins, setScreenMins] = useState('');
  const [readingMins, setReadingMins] = useState(''); // New suggestion

  const [vaccine, setVaccine] = useState('');
  const [fever, setFever] = useState('');
  const [doctorVisit, setDoctorVisit] = useState('');

  // Alert Modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', icon: '' });

  // AI state
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    let filtered = records;

    // 1. Filter by Record Type
    if (filterType === 'Journey Log') {
      filtered = filtered.filter(r => ['Weight', 'Height', 'Head Circumference', 'Vaccination', 'Cry Analysis'].includes(r.record_type));
    } else if (filterType !== 'All') {
      filtered = filtered.filter(r => r.record_type === filterType);
    }

    // 2. Filter by Date Parts
    if (filterDate.day !== 'All') {
      filtered = filtered.filter(r => new Date(r.date).getDate() === parseInt(filterDate.day));
    }
    if (filterDate.month !== 'All') {
      filtered = filtered.filter(r => format(new Date(r.date), 'MMMM') === filterDate.month);
    }
    if (filterDate.year !== 'All') {
      filtered = filtered.filter(r => new Date(r.date).getFullYear() === parseInt(filterDate.year));
    }

    return filtered;
  }, [records, filterType, filterDate]);

  useEffect(() => {
    loadRecords();
    // Removed auto-popup logic
  }, []);

  const loadRecords = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchHealthRecords(user.id);
      setRecords(data);
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
    if (!selectedValue && selectedType !== 'Sleep Session') {
      showAlert('Selection Required', 'Please select a value for the record.', '📋');
      return;
    }
    if (!user?.id) return;

    const typeSaved = selectedType;
    let valueSaved = selectedValue;
    const subValueSaved = subValue;
    const notesSaved = notes;

    try {
      if (typeSaved === 'Sleep Session') {
        const startIso = new Date(`${date} ${sleepStartTime}`).toISOString();
        let endIso = new Date(`${date} ${sleepEndTime}`).toISOString();

        // Handle overnight sleep
        if (new Date(endIso) < new Date(startIso)) {
          const endPlusDay = new Date(endIso);
          endPlusDay.setDate(endPlusDay.getDate() + 1);
          endIso = endPlusDay.toISOString();
        }

        await saveSleepLog({
          user_id: user.id,
          child_id: selectedChildId ? parseInt(selectedChildId) : undefined,
          sleep_start: startIso,
          sleep_end: endIso,
        });

        const durationHours = differenceInHours(new Date(endIso), new Date(startIso)).toFixed(1);
        valueSaved = String(durationHours);

        await saveHealthRecord({
          user_id: user.id,
          child_id: selectedChildId ? parseInt(selectedChildId) : undefined,
          record_type: typeSaved,
          value: valueSaved,
          unit: 'hrs',
          date,
          notes: `Sleep from ${sleepStartTime} to ${sleepEndTime}`
        });
      } else {
        await saveHealthRecord({
          user_id: user.id,
          child_id: selectedChildId ? parseInt(selectedChildId) : undefined,
          record_type: typeSaved,
          value: String(valueSaved),
          unit: UNITS[typeSaved] || '',
          sub_value: subValueSaved || undefined,
          date,
          notes: typeSaved === 'Doctor Visit' ? notesSaved : ''
        });
      }

      setModalVisible(false);
      setSelectedValue('');
      setSubValue('');
      setNotes('');
      setDate(getISTDateString());

      await loadRecords();
      setShowHistory(true); // Jump to history to see the new record

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

  const ActionCard = ({ type, icon, color }: { type: string, icon: string, color: string }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={() => {
        setSelectedType(type);
        setModalVisible(true);
      }}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={scale(24)} color={color} />
      </View>
      <Text style={styles.actionLabelText}>{type}</Text>
    </TouchableOpacity>
  );

  const FoundationCard = ({ title, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity style={[styles.foundationCard, { borderColor: color + '40' }]} onPress={onPress}>
      <View style={[styles.foundationIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={scale(32)} color={color} />
      </View>
      <View style={styles.foundationTextContainer}>
        <Text style={[styles.foundationTitle, { color }]}>{title}</Text>
        <Text style={styles.foundationSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={scale(20)} color={color} opacity={0.5} />
    </TouchableOpacity>
  );

  const PremiumDial = ({ value, onValueChange, range, label }: any) => {
    const itemHeight = verticalScale(60);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
      const index = range.indexOf(value);
      if (index !== -1 && scrollRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: index * itemHeight, animated: false });
        }, 150);
      }
    }, [value]); // Sync when value changes externally

    return (
      <View style={styles.dialContainer}>
        <Text style={styles.dialTopLabel}>{label}</Text>
        <View style={[styles.dialWrapper, { height: itemHeight }]}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            nestedScrollEnabled={true}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
              const newVal = String(range[index]);
              if (range[index] !== undefined && newVal !== value) {
                onValueChange(newVal);
              }
            }}
            scrollEventThrottle={16}
          >
            {range.map((v: any, i: number) => (
              <View key={i} style={[styles.dialItem, { height: itemHeight }]}>
                <Text style={[
                  styles.dialText,
                  String(v) === String(value) && styles.dialTextActive
                ]}>
                  {v}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const HorizontalPremiumDial = ({ value, onValueChange, range, label, icon, color, unit }: any) => {
    const itemWidth = scale(80);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
      const index = range.indexOf(value);
      if (index !== -1 && scrollRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: index * itemWidth, animated: false });
        }, 150);
      }
    }, []);

    return (
      <View style={styles.hDialContainer}>
        <View style={styles.hDialHeader}>
           <Ionicons name={icon} size={scale(18)} color={color} />
           <Text style={[styles.hDialLabel, { color }]}>{label}</Text>
        </View>
        <View style={styles.hDialWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={itemWidth}
            decelerationRate="fast"
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
              const newVal = String(range[index]);
              if (range[index] !== undefined && newVal !== value) {
                onValueChange(newVal);
              }
            }}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: (SCREEN_WIDTH - scale(40) - itemWidth) / 2 }}
          >
            {range.map((v: any, i: number) => {
                const isActive = String(v) === String(value);
                return (
                  <View key={i} style={[styles.hDialItem, { width: itemWidth }]}>
                    <View style={[styles.hDialTick, { backgroundColor: isActive ? color : color + '20', height: isActive ? verticalScale(12) : verticalScale(6) }]} />
                    <Text style={[
                      styles.hDialText,
                      isActive && [styles.hDialTextActive, { color }]
                    ]}>
                      {v}
                    </Text>
                    {isActive && <Text style={[styles.hDialUnit, { color }]}>{unit}</Text>}
                  </View>
                );
            })}
          </ScrollView>
          <View style={[styles.hDialFocalPoint, { borderColor: color + '30', backgroundColor: color + '05' }]} pointerEvents="none" />
        </View>
      </View>
    );
  };

  const renderGrowthView = () => (
    <ScrollView style={styles.directFeedScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.premiumCard}>
        <Text style={styles.cardSectionLabel}>PHYSICAL FOUNDATION</Text>

        <Text style={[styles.fieldLabel, { color: '#38A169' }]}>Weight (kg)</Text>
        <View style={styles.dialRowPremium}>
          <PremiumDial label="WHOLE" value={weightWhole} onValueChange={setWeightWhole} range={Array.from({ length: 21 }, (_, i) => i + 1)} />
          <View style={styles.dialSeparator}><Text style={styles.dialSeparatorText}>.</Text></View>
          <PremiumDial label="DECIMAL" value={weightDecimal} onValueChange={setWeightDecimal} range={['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85', '90', '95']} />
        </View>

        <Text style={[styles.fieldLabel, { color: '#38A169' }]}>Height (cm)</Text>
        <View style={styles.dialRowPremium}>
          <PremiumDial label="WHOLE" value={heightWhole} onValueChange={setHeightWhole} range={Array.from({ length: 101 }, (_, i) => i + 30)} />
          <View style={styles.dialSeparator}><Text style={styles.dialSeparatorText}>.</Text></View>
          <PremiumDial label="DECIMAL" value={heightDecimal} onValueChange={setHeightDecimal} range={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']} />
        </View>

        <Text style={[styles.fieldLabel, { color: '#38A169' }]}>Head Circumference (cm)</Text>
        <View style={styles.dialRowPremium}>
          <PremiumDial label="WHOLE" value={headWhole} onValueChange={setHeadWhole} range={Array.from({ length: 41 }, (_, i) => i + 25)} />
          <View style={styles.dialSeparator}><Text style={styles.dialSeparatorText}>.</Text></View>
          <PremiumDial label="DECIMAL" value={headDecimal} onValueChange={setHeadDecimal} range={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']} />
        </View>

        <DatePickerField label="Recording Date" value={date} onChange={setDate} labelColor="#38A169" />

        <TouchableOpacity
          style={[styles.saveFoundationBtn, { backgroundColor: '#38A169' }]}
          onPress={async () => {
            const finalWeight = weightWhole && weightDecimal ? `${weightWhole}.${weightDecimal}` : '';
            const finalHeight = heightWhole && heightDecimal ? `${heightWhole}.${heightDecimal}` : '';
            const finalHead = headWhole && headDecimal ? `${headWhole}.${headDecimal}` : '';
            if (finalWeight) await saveHealthRecord({ user_id: user.id, record_type: 'Weight', value: finalWeight, unit: 'kg', date });
            if (finalHeight) await saveHealthRecord({ user_id: user.id, record_type: 'Height', value: finalHeight, unit: 'cm', date });
            if (finalHead) await saveHealthRecord({ user_id: user.id, record_type: 'Head Circumference', value: finalHead, unit: 'cm', date });
            loadRecords();
            setViewMode('history');
          }}
        >
          <Text style={styles.saveFoundationBtnText}>Save Growth Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRhythmView = () => (
    <ScrollView style={styles.directFeedScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.premiumCard}>
        <Text style={styles.cardSectionLabel}>NEURAL DEVELOPMENT</Text>

        <HorizontalPremiumDial
          label="Sunlight Slumbers"
          icon="sunny-outline"
          value={napsPerDay || "0"}
          onValueChange={setNapsPerDay}
          range={["0","1","2","3","4","5"]}
          color="#3182CE"
          unit="naps"
        />

        <HorizontalPremiumDial
          label="Midnight Stirrings"
          icon="moon-outline"
          value={nightWakings || "0"}
          onValueChange={setNightWakings}
          range={["0","1","2","3","4","5","6","7","8"]}
          color="#3182CE"
          unit="times"
        />

        <TimePickerField label="Target Bedtime" value={sleepStartTime} onChange={setSleepStartTime} labelColor="#3182CE" />
        <TimePickerField label="Morning Wake Time" value={sleepEndTime} onChange={setSleepEndTime} labelColor="#3182CE" />

        <TouchableOpacity
          style={[styles.saveFoundationBtn, { backgroundColor: '#3182CE' }]}
          onPress={async () => {
             if (nightWakings) await saveHealthRecord({ user_id: user.id, record_type: 'Night Wakings', value: nightWakings, unit: 'times', date });
             if (napsPerDay) await saveHealthRecord({ user_id: user.id, record_type: 'Naps Per Day', value: napsPerDay, unit: 'times', date });
            loadRecords();
            setViewMode('history');
          }}
        >
          <Text style={styles.saveFoundationBtnText}>Save Rhythm Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderNutritionView = () => (
    <ScrollView style={styles.directFeedScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.premiumCard}>
        <Text style={styles.cardSectionLabel}>FUELING DEVELOPMENT</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#D69E2E' }]}>Feed Type</Text>
          <View style={styles.chipRow}>
            {DROPDOWN_VALUES["Feed Type"].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, feedType === t && styles.chipActive]}
                onPress={() => setFeedType(t)}
              >
                <Text style={[styles.chipText, feedType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#D69E2E' }]}>Number of Feeds</Text>
          <View style={styles.chipRow}>
            {["1","2","3","4","5","6","7","8","9","10"].map(m => (
              <TouchableOpacity key={m} style={[styles.chip, numFeeds === m && styles.chipActive]} onPress={() => setNumFeeds(m)}>
                <Text style={styles.chipText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#D69E2E' }]}>Water Intake (ml)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {["0","50","100","150","200","250","300","400","500"].map(m => (
              <TouchableOpacity key={m} style={[styles.chip, waterIntake === m && styles.chipActive]} onPress={() => setWaterIntake(m)}>
                <Text style={styles.chipText}>{m}ml</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.saveFoundationBtn, { backgroundColor: '#D69E2E' }]}
          onPress={async () => {
            if (feedType) await saveHealthRecord({ user_id: user.id, record_type: 'Feed Type', value: feedType, unit: '', date });
            if (numFeeds) await saveHealthRecord({ user_id: user.id, record_type: 'Feeds Per Day', value: numFeeds, unit: 'times', date });
            if (waterIntake) await saveHealthRecord({ user_id: user.id, record_type: 'Water Intake', value: waterIntake, unit: 'ml', date });
            loadRecords();
            setViewMode('history');
          }}
        >
          <Text style={styles.saveFoundationBtnText}>Save Nutrition Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderActivityView = () => (
    <ScrollView style={styles.directFeedScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.premiumCard}>
        <Text style={styles.cardSectionLabel}>SENSORY VALUES</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#DD6B20' }]}>Tummy Time (mins)</Text>
          <View style={styles.chipRow}>
            {["5","10","15","20","30","45","60"].map(m => (
              <TouchableOpacity key={m} style={[styles.chip, tummyMins === m && styles.chipActive]} onPress={() => setTummyMins(m)}>
                <Text style={styles.chipText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#DD6B20' }]}>Outdoor Time (mins)</Text>
          <View style={styles.chipRow}>
            {["15","30","45","60","90","120"].map(m => (
              <TouchableOpacity key={m} style={[styles.chip, outdoorMins === m && styles.chipActive]} onPress={() => setOutdoorMins(m)}>
                <Text style={styles.chipText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#DD6B20' }]}>Screen Time (mins)</Text>
          <View style={styles.chipRow}>
            {["0","15","30","45","60"].map(m => (
              <TouchableOpacity key={m} style={[styles.chip, screenMins === m && styles.chipActive]} onPress={() => setScreenMins(m)}>
                <Text style={styles.chipText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#DD6B20' }]}>Reading/Social Play (mins)</Text>
          <View style={styles.chipRow}>
            {["0","10","20","30","45","60"].map(m => (
              <TouchableOpacity key={m} style={[styles.chip, readingMins === m && styles.chipActive]} onPress={() => setReadingMins(m)}>
                <Text style={styles.chipText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveFoundationBtn, { backgroundColor: '#DD6B20' }]}
          onPress={async () => {
            if (tummyMins) await saveHealthRecord({ user_id: user.id, record_type: 'Tummy Time', value: tummyMins, unit: 'min', date });
            if (outdoorMins) await saveHealthRecord({ user_id: user.id, record_type: 'Outdoor Time', value: outdoorMins, unit: 'min', date });
            if (screenMins) await saveHealthRecord({ user_id: user.id, record_type: 'Screen Time', value: screenMins, unit: 'min', date });
            if (readingMins) await saveHealthRecord({ user_id: user.id, record_type: 'Reading Time', value: readingMins, unit: 'min', date });
            loadRecords();
            setViewMode('history');
          }}
        >
          <Text style={styles.saveFoundationBtnText}>Save Activity Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderMedicalView = () => (
    <ScrollView style={styles.directFeedScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.premiumCard}>
        <Text style={styles.cardSectionLabel}>HEALTH SHIELD</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#E53E3E' }]}>Vaccination</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {DROPDOWN_VALUES["Vaccination"].map(v => (
              <TouchableOpacity key={v} style={[styles.chip, vaccine === v && styles.chipActive]} onPress={() => setVaccine(v)}>
                <Text style={styles.chipText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#E53E3E' }]}>Fever Temperature (°C)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {DROPDOWN_VALUES["Fever"].map(f => (
              <TouchableOpacity key={f} style={[styles.chip, fever === f && styles.chipActive]} onPress={() => setFever(f)}>
                <Text style={styles.chipText}>{f}°C</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: '#E53E3E' }]}>Doctor Visit Type</Text>
          <View style={styles.chipRow}>
            {DROPDOWN_VALUES["Doctor Visit"].map(d => (
              <TouchableOpacity key={d} style={[styles.chip, doctorVisit === d && styles.chipActive]} onPress={() => setDoctorVisit(d)}>
                <Text style={styles.chipText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveFoundationBtn, { backgroundColor: '#E53E3E' }]}
          onPress={async () => {
            if (vaccine) await saveHealthRecord({ user_id: user.id, record_type: 'Vaccination', value: vaccine, unit: '', date });
            if (fever) await saveHealthRecord({ user_id: user.id, record_type: 'Fever', value: fever, unit: '°C', date });
            if (doctorVisit) await saveHealthRecord({ user_id: user.id, record_type: 'Doctor Visit', value: doctorVisit, unit: '', date });
            loadRecords();
            setViewMode('history');
          }}
        >
          <Text style={styles.saveFoundationBtnText}>Save Medical Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const handleBack = () => {
    if (viewMode !== 'hub') {
      setViewMode('hub');
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backPetal}
        >
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {viewMode === 'hub' ? 'Nurture Hub' :
           viewMode === 'history' ? 'Health Log' :
           viewMode === 'growth' ? 'Growth Foundation' :
           viewMode === 'rhythm' ? 'Rhythm Foundation' :
           viewMode === 'activity' ? 'Activity Foundation' :
           viewMode === 'nutrition' ? 'Nutrition Foundation' :
           viewMode === 'medical' ? 'Medical Foundation' :
           'Foundation'}
        </Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setViewMode(viewMode === 'history' ? 'hub' : 'history')}
        >
          <Ionicons
            name={viewMode === 'history' ? "apps-outline" : "list-outline"}
            size={moderateScale(24)}
            color={Theme.colors.white}
          />
        </TouchableOpacity>
      </View>

      {viewMode === 'hub' && (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {(aiLoading || aiResponse) && (
            <View style={[styles.aiCard, {backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.softGreenBorder, marginBottom: verticalScale(20)}]}>
              <View style={styles.aiCardHeader}>
                <Ionicons name="sparkles" size={moderateScale(16)} color={Theme.colors.primary} />
                <Text style={styles.aiCardLabel}>Neev AI Insights</Text>
              </View>
              {aiLoading && !aiResponse ? (
                <View style={styles.aiLoadingRow}>
                  <LoadingLogo size={moderateScale(24)} />
                  <Text style={styles.aiLoadingText}>Analysing current health trends…</Text>
                </View>
              ) : (
                <Text style={[styles.aiCardText, {color: Theme.colors.primary}]}>{aiResponse}</Text>
              )}
            </View>
          )}

          <View style={styles.foundationList}>
            <FoundationCard
              title="GROWTH"
              subtitle="Physical Foundation"
              icon="fitness-outline"
              color="#38A169"
              onPress={() => setViewMode('growth')}
            />
            <FoundationCard
              title="RHYTHM"
              subtitle="Neural Development"
              icon="moon-outline"
              color="#3182CE"
              onPress={() => setViewMode('rhythm')}
            />
            <FoundationCard
              title="NUTRITION"
              subtitle="Fueling Development"
              icon="restaurant-outline"
              color="#D69E2E"
              onPress={() => setViewMode('nutrition')}
            />
            <FoundationCard
              title="ACTIVITY"
              subtitle="Sensory Values"
              icon="sunny-outline"
              color="#DD6B20"
              onPress={() => setViewMode('activity')}
            />
            <FoundationCard
              title="MEDICAL"
              subtitle="Health Shield"
              icon="medical-outline"
              color="#E53E3E"
              onPress={() => setViewMode('medical')}
            />
          </View>

          <View style={{ height: verticalScale(40) }} />
        </ScrollView>
      )}

      {viewMode === 'history' && (
        <View style={{ flex: 1 }}>
          <View style={styles.historyFilters}>
            <View style={styles.dateFilterRow}>
              <View style={styles.datePartCol}>
                <Text style={styles.datePartLabel}>DATE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePartScroll}>
                  {['All', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())].map(d => (
                    <TouchableOpacity key={d} style={[styles.datePartPill, filterDate.day === d && styles.datePartPillActive]} onPress={() => setFilterDate({ ...filterDate, day: d })}>
                      <Text style={[styles.datePartText, filterDate.day === d && styles.datePartTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePartCol}>
                <Text style={styles.datePartLabel}>MONTH</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePartScroll}>
                  {['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <TouchableOpacity key={m} style={[styles.datePartPill, filterDate.month === m && styles.datePartPillActive]} onPress={() => setFilterDate({ ...filterDate, month: m })}>
                      <Text style={[styles.datePartText, filterDate.month === m && styles.datePartTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePartCol}>
                <Text style={styles.datePartLabel}>YEAR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePartScroll}>
                  {['All', '2023', '2024', '2025', '2026'].map(y => (
                    <TouchableOpacity key={y} style={[styles.datePartPill, filterDate.year === y && styles.datePartPillActive]} onPress={() => setFilterDate({ ...filterDate, year: y })}>
                      <Text style={[styles.datePartText, filterDate.year === y && styles.datePartTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.typeFilterSection}>
               <Text style={styles.datePartLabel}>MILESTONE & LOG TYPE</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {['All', 'Journey Log', ...RECORD_TYPES].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterPill, filterType === type && styles.filterPillActive]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item: record }) => (
              <View style={[styles.recordCard, {backgroundColor: Theme.colors.white, borderColor: Theme.colors.accent, marginHorizontal: scale(24)}]}>
                <View style={styles.recordHeader}>
                  <Ionicons
                    name={recordIcon(record.record_type) as any}
                    size={moderateScale(24)}
                    color={Theme.colors.secondary}
                  />
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordType}>{record.record_type}</Text>
                    <Text style={styles.recordDate}>{new Date(record.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.recordValue}>{record.value}</Text>
                    <Text style={styles.recordUnit}>{record.unit}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text>No records yet</Text></View>}
          />
        </View>
      )}

      {viewMode === 'growth' && renderGrowthView()}
      {viewMode === 'rhythm' && renderRhythmView()}
      {viewMode === 'nutrition' && renderNutritionView()}
      {viewMode === 'activity' && renderActivityView()}
      {viewMode === 'medical' && renderMedicalView()}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    gap: scale(15)
  },
  backPetal: {
    width: scale(40),
    height: scale(40),
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(6),
    borderBottomLeftRadius: moderateScale(6),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  title: { fontSize: moderateScale(22), fontWeight: '800', color: Theme.colors.primary, flex: 1, textAlign: 'center' },
  historyButton: { width: scale(40), height: scale(40), borderRadius: scale(12), backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  addButton: { width: scale(40), height: scale(40), borderRadius: scale(12), backgroundColor: Theme.colors.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  scrollView: { flex: 1, paddingHorizontal: scale(24) },
  foundationList: { gap: verticalScale(16), marginTop: verticalScale(10) },
  foundationCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    ...Theme.shadows.soft
  },
  foundationIconContainer: { width: scale(60), height: scale(60), borderRadius: scale(15), justifyContent: 'center', alignItems: 'center', marginRight: scale(16) },
  foundationTextContainer: { flex: 1 },
  foundationTitle: { fontSize: moderateScale(18), fontWeight: '900', letterSpacing: 1 },
  foundationSubtitle: { fontSize: moderateScale(12), color: Theme.colors.textLight, marginTop: 4, fontWeight: '600' },
  directFeedScroll: { flex: 1, backgroundColor: Theme.colors.background },
  premiumCard: { margin: scale(20), padding: moderateScale(24), backgroundColor: Theme.colors.white, borderRadius: moderateScale(32), borderWidth: 1.5, borderColor: '#FDE68A', ...Theme.shadows.soft },
  cardSectionLabel: { fontSize: moderateScale(11), fontWeight: '900', color: Theme.colors.textLight, letterSpacing: 1.5, marginBottom: verticalScale(24) },
  inputGroup: { marginBottom: verticalScale(24) },
  fieldLabel: { fontSize: moderateScale(14), fontWeight: '800', color: Theme.colors.primary, marginBottom: verticalScale(12) },
  valueStrip: { flexDirection: 'row' },
  stripItem: { paddingHorizontal: scale(20), paddingVertical: verticalScale(12), borderRadius: moderateScale(15), backgroundColor: Theme.colors.softSlate, marginRight: scale(10), borderWidth: 1.5, borderColor: 'transparent' },
  stripItemActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.primary },
  stripText: { fontSize: moderateScale(15), fontWeight: '700', color: Theme.colors.textLight },
  stripTextActive: { color: Theme.colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  chip: { paddingHorizontal: scale(16), paddingVertical: verticalScale(10), borderRadius: moderateScale(12), backgroundColor: Theme.colors.white, borderWidth: 1.5, borderColor: Theme.colors.accent },
  chipActive: { backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.secondary },
  chipText: { fontSize: moderateScale(13), fontWeight: '700', color: Theme.colors.primary },
  chipTextActive: { color: Theme.colors.primary },
  saveFoundationBtn: { backgroundColor: Theme.colors.primary, paddingVertical: verticalScale(18), borderRadius: moderateScale(25), alignItems: 'center', marginTop: verticalScale(10), ...Theme.shadows.soft },
  saveFoundationBtnText: { color: Theme.colors.white, fontSize: moderateScale(16), fontWeight: '800' },
  directFeedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: scale(24) },
  placeholderText: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary, textAlign: 'center', marginBottom: 20 },
  tempBtn: { padding: 15, backgroundColor: Theme.colors.secondary, borderRadius: 10 },
  aiCard: { borderRadius: moderateScale(16), borderWidth: 1.5, padding: moderateScale(20) },
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
  dialContainer: { flex: 1, alignItems: 'center' },
  dialTopLabel: { fontSize: moderateScale(10), fontWeight: '700', color: Theme.colors.textLight, marginBottom: 8, textTransform: 'uppercase' },
  dialWrapper: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  dialItem: { justifyContent: 'center', alignItems: 'center' },
  dialText: { fontSize: moderateScale(22), color: Theme.colors.textLight + '30', fontWeight: '600' },
  dialTextActive: { fontSize: moderateScale(32), color: Theme.colors.primary, fontWeight: '900' },
  dialRowPremium: { flexDirection: 'row', alignItems: 'center', gap: scale(10), marginBottom: verticalScale(24), paddingHorizontal: scale(5) },
  dialSeparator: { paddingHorizontal: 2 },
  dialSeparatorText: { fontSize: 32, fontWeight: '900', color: Theme.colors.primary, marginTop: 10 },
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

  // Horizontal Dial Styles
  hDialContainer: { marginBottom: verticalScale(24) },
  hDialHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: verticalScale(12) },
  hDialLabel: { fontSize: moderateScale(14), fontWeight: '800' },
  hDialWrapper: { height: verticalScale(100), backgroundColor: '#F8FAFC', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center' },
  hDialItem: { justifyContent: 'center', alignItems: 'center' },
  hDialTick: { width: 2, borderRadius: 1, marginBottom: 8 },
  hDialText: { fontSize: moderateScale(22), color: Theme.colors.textLight + '30', fontWeight: '600' },
  hDialTextActive: { fontSize: moderateScale(38), fontWeight: '900' },
  hDialUnit: { fontSize: moderateScale(10), fontWeight: '800', marginTop: -2, textTransform: 'uppercase', opacity: 0.6 },
  hDialFocalPoint: { position: 'absolute', width: scale(80), height: scale(85), borderRadius: 22, borderWidth: 2.5, alignSelf: 'center', zIndex: -1 },
  filterContainer: { paddingVertical: verticalScale(12) },
  filterScroll: { paddingHorizontal: scale(20), gap: scale(8) },
  filterPill: { paddingHorizontal: scale(16), paddingVertical: verticalScale(8), borderRadius: scale(20), backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  filterText: { fontSize: moderateScale(12), fontWeight: '700', color: Theme.colors.textLight },
  filterTextActive: { color: Theme.colors.white },

  // Enhanced History Filters
  historyFilters: { backgroundColor: '#F8FAFC', paddingBottom: verticalScale(16), borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dateFilterRow: { gap: verticalScale(12), paddingVertical: verticalScale(12) },
  datePartCol: { gap: verticalScale(6) },
  datePartLabel: { fontSize: moderateScale(9), fontWeight: '900', color: Theme.colors.textLight, paddingHorizontal: scale(20), letterSpacing: 1 },
  datePartScroll: { paddingHorizontal: scale(20), gap: scale(6) },
  datePartPill: { paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: scale(10), backgroundColor: Theme.colors.white, borderWidth: 1, borderColor: '#E2E8F0' },
  datePartPillActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.primary },
  datePartText: { fontSize: moderateScale(11), fontWeight: '700', color: Theme.colors.textLight },
  datePartTextActive: { color: Theme.colors.primary },
  typeFilterSection: { marginTop: verticalScale(8), gap: verticalScale(6) },
});
