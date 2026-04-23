import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, { FadeInUp, FadeInRight, FadeIn } from 'react-native-reanimated';
import { fetchCheckIns } from '../../../services/DirectusApiClient';
import AppEmoji from '../../../components/AppEmoji';
import { ProfileBackground } from '../tabs/Profile';

export default function PulseHistory() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(today.toLocaleString('en-IN', { month: 'short' }));
  const [selectedYear, setSelectedYear] = useState<string>(today.getFullYear().toString());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 5 }, (_, i) => (today.getFullYear() - i).toString());
  const days = ['All', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())];
  const types = ['All', 'Morning', 'Evening'];

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const checkIns = await fetchCheckIns(user.id);

      const enriched = checkIns.map((h: any) => {
        const dt = new Date(h.timestamp || h.date);
        return {
          ...h,
          month: dt.toLocaleString('en-IN', { month: 'short' }),
          year: dt.getFullYear().toString(),
          day: dt.getDate().toString(),
          completed_at_date: dt.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          dayName: dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
          completed_at_time: dt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      });

      setHistory(enriched);
    } catch (error) {
      console.error('Failed to load pulse history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const monthIdx = months.indexOf(selectedMonth);
    const year = parseInt(selectedYear);
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    let slots: any[] = [];

    let startDayNum = 1;
    let endDayNum = daysInMonth;

    if (selectedDay) {
        startDayNum = parseInt(selectedDay);
        endDayNum = parseInt(selectedDay);
    }

    if (year > currentYear || (year === currentYear && monthIdx > currentMonthIdx)) {
        return [];
    }

    if (year === currentYear && monthIdx === currentMonthIdx) {
        endDayNum = Math.min(endDayNum, currentDay);
    }

    for (let d = endDayNum; d >= startDayNum; d--) {
        const dateObj = new Date(year, monthIdx, d);
        const dayStr = d.toString();
        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

        const typesToCheck = ['morning', 'evening'];

        typesToCheck.forEach(type => {
            if (selectedType && selectedType.toLowerCase() !== 'all' && selectedType.toLowerCase() !== type) {
                return;
            }

            const realRecord = history.find(h =>
                h.day === dayStr &&
                h.month === selectedMonth &&
                h.year === selectedYear &&
                h.type.toLowerCase() === type
            );

            if (realRecord) {
                slots.push(realRecord);
            } else {
                let isMissed = false;
                if (year < currentYear || (year === currentYear && monthIdx < currentMonthIdx) || d < currentDay) {
                    isMissed = true;
                } else if (d === currentDay) {
                    if (type === 'morning' && currentHour >= 11) { // 11 AM cutoff for history
                        isMissed = true;
                    }
                    if (type === 'evening' && currentHour >= 23) { // Late night cutoff
                        isMissed = true;
                    }
                }

                if (isMissed) {
                    slots.push({
                        id: `missed-${type}-${d}-${selectedMonth}-${selectedYear}`,
                        type: type,
                        status: 'missed',
                        day: dayStr,
                        month: selectedMonth,
                        year: selectedYear,
                        dayName: dayName,
                        timestamp: new Date(year, monthIdx, d, type === 'morning' ? 9 : 21).toISOString(),
                        completed_at_time: 'MISSED'
                    });
                }
            }
        });
    }

    return slots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, selectedMonth, selectedYear, selectedDay, selectedType]);

  const groupedHistory = useMemo(() => {
    return filteredHistory.reduce((acc: any, item) => {
      if (!acc[item.dayName]) acc[item.dayName] = [];
      acc[item.dayName].push(item);
      return acc;
    }, {});
  }, [filteredHistory]);

  const childName = user?.children?.[0]?.name || 'your little one';

  const realLogs = filteredHistory.filter(h => h.status !== 'missed');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProfileBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pulse Logs</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <View style={styles.stickySection}>
        <Animated.View entering={FadeInUp.springify()} style={styles.heroSection}>
          <View style={styles.heroRow}>
            <View style={styles.heroPetal}>
              <AppEmoji style={styles.heroEmoji}>❤️</AppEmoji>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{realLogs.length}</Text>
                <Text style={styles.statLabel}>Logs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {realLogs.filter(h => h.type === 'morning').length}
                </Text>
                <Text style={styles.statLabel}>Morning</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {realLogs.filter(h => h.type === 'evening').length}
                </Text>
                <Text style={styles.statLabel}>Evening</Text>
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Date</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowDayPicker(true)}>
                <Text style={styles.dropdownText}>{selectedDay || 'All'}</Text>
                <Ionicons name="chevron-down" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Month</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowMonthPicker(true)}>
                <Text style={styles.dropdownText}>{selectedMonth}</Text>
                <Ionicons name="chevron-down" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Year</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowYearPicker(true)}>
                <Text style={styles.dropdownText}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.filterItem, { flex: 1.2 }]}>
              <Text style={styles.filterLabel}>Type</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowTypePicker(true)}>
                <Text style={styles.dropdownText}>{selectedType || 'All'}</Text>
                <Ionicons name="funnel" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.heroTitle}>Daily Rhythm</Text>
          <Text style={styles.heroSubtitle}>Tracking {childName}'s wellness journey.</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Modal visible={showMonthPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
            <Animated.View entering={FadeIn.duration(200)} style={styles.pickerCardSmall}>
              <Text style={styles.modalTitle}>Month</Text>
              <View style={styles.optionsGrid}>
                {months.map(m => (
                  <TouchableOpacity key={m} style={[styles.optionItem, selectedMonth === m && styles.optionItemActive]} onPress={() => { setSelectedMonth(m); setShowMonthPicker(false); }}>
                    <Text style={[styles.optionText, selectedMonth === m && styles.optionTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showYearPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
            <Animated.View entering={FadeIn.duration(200)} style={styles.pickerCardSmall}>
              <Text style={styles.modalTitle}>Year</Text>
              <View style={styles.optionsGrid}>
                {years.map(y => (
                  <TouchableOpacity key={y} style={[styles.optionItem, selectedYear === y && styles.optionItemActive]} onPress={() => { setSelectedYear(y); setShowYearPicker(false); }}>
                    <Text style={[styles.optionText, selectedYear === y && styles.optionTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showDayPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDayPicker(false)}>
            <Animated.View entering={FadeIn.duration(200)} style={styles.pickerCardLarge}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <View style={styles.dateGrid}>
                {days.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dateItem,
                      (selectedDay === d || (!selectedDay && d === 'All')) && styles.optionItemActive
                    ]}
                    onPress={() => { setSelectedDay(d === 'All' ? null : d); setShowDayPicker(false); }}
                  >
                    <Text style={[
                      styles.dateItemText,
                      (selectedDay === d || (!selectedDay && d === 'All')) && styles.optionTextActive
                    ]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showTypePicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
            <Animated.View entering={FadeIn.duration(200)} style={styles.pickerCardSmall}>
              <Text style={styles.modalTitle}>Filter by Type</Text>
              <View style={styles.optionsGrid}>
                {types.map(t => (
                  <TouchableOpacity key={t} style={[styles.optionItem, (selectedType === t || (t === 'All' && !selectedType)) && styles.optionItemActive]} onPress={() => { setSelectedType(t === 'All' ? null : t); setShowTypePicker(false); }}>
                    <Text style={[styles.optionText, (selectedType === t || (t === 'All' && !selectedType)) && styles.optionTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={Theme.colors.primary} size="large" />
            <Text style={styles.loadingText}>Unrolling your scroll...</Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyArea}>
             <AppEmoji style={styles.emptyEmoji}>🌱</AppEmoji>
             <Text style={styles.emptyText}>No records found for {selectedMonth}.</Text>
          </View>
        ) : (
          Object.keys(groupedHistory).map((day, dIdx) => (
            <View key={day} style={styles.daySection}>
               <View style={styles.dayHeader}>
                  <View style={styles.dayLine} />
                  <Text style={styles.dayHeaderText}>{day}</Text>
                  <View style={styles.dayLine} />
               </View>

               {groupedHistory[day].map((item: any, index: number) => (
                <Animated.View
                  key={item.id || index}
                  entering={FadeInRight.delay(index * 100).springify()}
                  style={[styles.historyCard, item.status === 'missed' && styles.missedCard]}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardBody}>
                      <Text style={styles.domainText}>{item.type}</Text>
                      {item.status === 'missed' ? (
                        <Text style={[styles.activityName, styles.missedText]}>Session Missed</Text>
                      ) : item.type === 'morning' ? (
                        <Text style={styles.activityName}>Intent: {item.intentFocus || item.cry_label || 'Focus set'}</Text>
                      ) : (
                        <View>
                           <Text style={styles.activityName}>Evening Review</Text>
                           <View style={styles.statsRowSmall}>
                              <View style={styles.smallStat}>
                                 <Ionicons name="flash" size={12} color={Theme.colors.primary} />
                                 <Text style={styles.smallStatText}>Energy: {item.energyLevel || item.sleep_hours}/5</Text>
                              </View>
                              <View style={styles.smallStat}>
                                 <Ionicons name="restaurant" size={12} color={Theme.colors.primary} />
                                 <Text style={styles.smallStatText}>{item.meals?.length || 0} meals</Text>
                              </View>
                           </View>
                        </View>
                      )}
                    </View>

                    <View style={styles.modernTimeBox}>
                      <Text style={[styles.modernTimeText, item.status === 'missed' && styles.missedTimeText]}>
                        {item.completed_at_time.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
               ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    height: verticalScale(50)
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
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: Theme.colors.primary
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
    paddingTop: verticalScale(10)
  },
  stickySection: {
    backgroundColor: '#FFFDF6',
    zIndex: 10,
    paddingBottom: verticalScale(5)
  },
  heroSection: {
    alignItems: 'center',
    marginTop: verticalScale(0),
    marginBottom: verticalScale(2)
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
    marginBottom: verticalScale(2)
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C750',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center'
  },
  statBox: {
    alignItems: 'center',
    minWidth: scale(45)
  },
  statDivider: {
    width: 1,
    height: verticalScale(14),
    backgroundColor: '#FDE68A',
    marginHorizontal: scale(4)
  },
  statValue: {
    fontSize: moderateScale(14),
    fontWeight: '900',
    color: Theme.colors.primary
  },
  statLabel: {
    fontSize: moderateScale(7),
    fontWeight: '700',
    color: Theme.colors.textLight,
    textTransform: 'uppercase'
  },
  heroPetal: {
    width: scale(45),
    height: scale(45),
    backgroundColor: '#FEF3C7',
    borderTopLeftRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(5),
    borderBottomLeftRadius: moderateScale(5),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A'
  },
  heroEmoji: { fontSize: moderateScale(22) },
  heroTitle: {
    fontSize: moderateScale(15),
    fontWeight: '900',
    color: Theme.colors.primary,
    marginTop: verticalScale(1)
  },
  heroSubtitle: {
    fontSize: moderateScale(10),
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginTop: verticalScale(1),
    paddingHorizontal: scale(20),
  },
  filterRow: {
    flexDirection: 'row',
    width: '100%',
    gap: scale(5),
    marginVertical: verticalScale(5),
    paddingHorizontal: scale(15),
    alignItems: 'flex-end'
  },
  filterItem: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  dropdownText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: Theme.colors.primary,
    flex: 1,
    marginRight: 2
  },
  filterLabel: {
    fontSize: moderateScale(8),
    fontWeight: '900',
    color: Theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: scale(4),
    marginBottom: verticalScale(4)
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20)
  },
  pickerCardSmall: {
    width: '90%',
    backgroundColor: '#FFFDF6',
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    borderWidth: 2,
    borderColor: '#FDE68A',
    maxHeight: verticalScale(400),
    ...Theme.shadows.soft
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
    justifyContent: 'center'
  },
  optionItem: {
    width: '30%',
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A50'
  },
  optionItemActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary
  },
  optionText: {
    fontSize: moderateScale(12),
    color: Theme.colors.primary,
    fontWeight: '700'
  },
  optionTextActive: {
    color: Theme.colors.white,
    fontWeight: '900'
  },
  pickerCardLarge: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    borderRadius: moderateScale(32),
    padding: moderateScale(20),
    borderWidth: 2,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    justifyContent: 'center'
  },
  dateItem: {
    width: '12%',
    aspectRatio: 1,
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A50'
  },
  dateItemText: {
    fontSize: moderateScale(10),
    color: Theme.colors.primary,
    fontWeight: '700'
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: Theme.colors.primary,
    marginBottom: verticalScale(15),
    textAlign: 'center'
  },
  daySection: {
    marginBottom: verticalScale(20)
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(15),
    paddingHorizontal: scale(5)
  },
  dayHeaderText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: Theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  dayLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FDE68A',
    opacity: 0.5
  },
  historyCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(24),
    padding: moderateScale(18),
    marginBottom: verticalScale(16),
    borderWidth: 1.5,
    borderColor: '#FDE68A50',
    ...Theme.shadows.soft
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardBody: {
    flex: 1,
    marginRight: scale(10)
  },
  domainText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: Theme.colors.textLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  activityName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
    marginBottom: verticalScale(4)
  },
  modernTimeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(80)
  },
  modernTimeText: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  missedCard: {
    backgroundColor: '#FFF1F250',
    borderColor: '#FECDD3',
    borderStyle: 'dashed',
  },
  missedText: {
    color: '#E11D48',
    fontStyle: 'italic',
    fontWeight: '600'
  },
  missedTimeText: {
    fontSize: moderateScale(12),
    color: '#FDA4AF',
    letterSpacing: 1
  },
  loadingArea: {
    alignItems: 'center',
    paddingVertical: verticalScale(60)
  },
  loadingText: {
    marginTop: verticalScale(12),
    color: Theme.colors.textLight,
    fontSize: moderateScale(14),
    fontStyle: 'italic'
  },
  emptyArea: {
    alignItems: 'center',
    paddingVertical: verticalScale(60),
    opacity: 0.6
  },
  emptyEmoji: { fontSize: moderateScale(50), marginBottom: verticalScale(15) },
  emptyText: {
    fontSize: moderateScale(15),
    color: Theme.colors.primary,
    textAlign: 'center',
    fontWeight: '600'
  },
  statsRowSmall: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: verticalScale(4)
  },
  smallStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4)
  },
  smallStatText: {
    fontSize: moderateScale(11),
    color: Theme.colors.text,
    fontWeight: '600'
  }
});
