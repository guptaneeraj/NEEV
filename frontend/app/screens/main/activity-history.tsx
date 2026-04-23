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
import { fetchRecentHistory, fetchActivities } from '../../../services/DirectusApiClient';
import AppEmoji from '../../../components/AppEmoji';
import { ProfileBackground } from '../tabs/Profile';

const getDomainEmoji = (domain: string) => {
  const d = domain.toLowerCase();
  if (d.includes('gross motor')) return '🧗';
  if (d.includes('fine motor')) return '🎨';
  if (d.includes('sensory')) return '🌈';
  if (d.includes('cognitive')) return '💡';
  if (d.includes('language') || d.includes('literacy')) return '📚';
  if (d.includes('social')) return '🧸';
  if (d.includes('emotional') || d.includes('self-regulation')) return '🎭';
  if (d.includes('visual')) return '👁️';
  if (d.includes('oral motor')) return '👅';
  if (d.includes('proprioception')) return '🧘';
  if (d.includes('cause')) return '🔄';
  if (d.includes('vestibular')) return '🎢';
  if (d.includes('midline')) return '↔️';
  if (d.includes('bilateral')) return '👐';
  if (d.includes('problem solving')) return '🧐';
  if (d.includes('communication')) return '📢';
  if (d.includes('auditory')) return '👂';
  return '🎯';
};

export default function ActivityHistory() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showDomainPicker, setShowDomainPicker] = useState(false);
  const [allDomains, setAllDomains] = useState<string[]>([]);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(today.toLocaleString('en-IN', { month: 'short' }));
  const [selectedYear, setSelectedYear] = useState<string>(today.getFullYear().toString());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 5 }, (_, i) => (today.getFullYear() - i).toString());
  const days = ['All', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const [historyData, allActivities] = await Promise.all([
        fetchRecentHistory(user.id.toString(), 200),
        fetchActivities('Infant')
      ]);

      const domains = Array.from(new Set(allActivities.map(a => a.domain).filter(Boolean)));
      setAllDomains(domains as string[]);

      const enriched = historyData.map((h: any) => {
        const ts = h.completed_at;
        const dt = new Date(ts.endsWith('Z') ? ts : ts + 'Z');
        const details = allActivities.find(a => String(a.id) === String(h.activity_id));

        // Ensure the history ID is preserved and doesn't get overwritten by activity ID
        return {
          ...details,
          ...h,
          history_id: h.id, // Keep a unique reference
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
            minute: '2-digit',
            hour12: true
          })
        };
      });

      enriched.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
      setHistory(enriched);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and Inject "No Activity" placeholders
  const filteredHistory = useMemo(() => {
    const monthIdx = months.indexOf(selectedMonth);
    const year = parseInt(selectedYear);
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const currentDay = now.getDate();

    let slots: any[] = [];

    let startDayNum = 1;
    let endDayNum = daysInMonth;

    if (selectedDay) {
        startDayNum = parseInt(selectedDay);
        endDayNum = parseInt(selectedDay);
    }

    // Don't show future dates
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

        const dayRecords = history.filter(h =>
            h.day === dayStr &&
            h.month === selectedMonth &&
            h.year === selectedYear
        );

        if (dayRecords.length > 0) {
            // Apply focus filter if selected
            const matched = dayRecords.filter(r => !selectedDomain || r.domain === selectedDomain);

            // REMOVE DUPLICATE RECORDS
            const uniqueRecords = matched.filter((v, i, a) =>
                a.findIndex(t => (t.id === v.id)) === i
            );

            slots.push(...uniqueRecords);
        } else if (!selectedDomain || selectedDomain === 'All') {
            // Only show "No Activity" if no domain filter is active or "All" is selected
            slots.push({
                id: `empty-${d}-${selectedMonth}-${year}`,
                status: 'empty',
                day: dayStr,
                month: selectedMonth,
                year: selectedYear,
                dayName: dayName,
                completed_at: new Date(year, monthIdx, d).toISOString(),
                completed_at_time: 'NONE'
            });
        }
    }

    return slots.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  }, [history, selectedMonth, selectedYear, selectedDay, selectedDomain]);

  // Group filtered history by Date
  const groupedHistory = useMemo(() => {
    return filteredHistory.reduce((acc: any, item) => {
      if (!acc[item.dayName]) acc[item.dayName] = [];
      acc[item.dayName].push(item);
      return acc;
    }, {});
  }, [filteredHistory]);

  const currentMonthMins = useMemo(() => {
    return history
      .filter(h => h.month === selectedMonth && h.year === selectedYear)
      .reduce((acc, curr) => acc + (curr.duration_mins || 0), 0);
  }, [history, selectedMonth, selectedYear]);

  const childName = user?.children?.[0]?.name || 'your little one';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProfileBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journey Log</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <View style={styles.stickySection}>
        <Animated.View entering={FadeInUp.springify()} style={styles.heroSection}>
          <View style={styles.heroRow}>
            <View style={styles.heroPetal}>
              <AppEmoji style={styles.heroEmoji}>📜</AppEmoji>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {user?.created_at ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : '0'}
                </Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{currentMonthMins}</Text>
                <Text style={styles.statLabel}>Month Mins</Text>
              </View>
            </View>
          </View>

          {/* Filter Row */}
          <View style={styles.filterRow}>
            {/* Date */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Date</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowDayPicker(true)}>
                <Text style={styles.dropdownText}>{selectedDay || 'All'}</Text>
                <Ionicons name="chevron-down" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Month */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Month</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowMonthPicker(true)}>
                <Text style={styles.dropdownText}>{selectedMonth}</Text>
                <Ionicons name="chevron-down" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Year */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Year</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowYearPicker(true)}>
                <Text style={styles.dropdownText}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Focus */}
            <View style={[styles.filterItem, { flex: 1.2 }]}>
              <Text style={styles.filterLabel}>Focus</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowDomainPicker(true)}>
                <Text style={styles.dropdownText} numberOfLines={1}>{selectedDomain || 'All'}</Text>
                <Ionicons name="funnel" size={moderateScale(12)} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.heroTitle}>Nurture Achievements</Text>
          <Text style={styles.heroSubtitle}>Your growth story with {childName} in {selectedMonth} {selectedYear}.</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>


        {/* Month Picker */}
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

        {/* Year Picker */}
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

        {/* Date Picker */}
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
                  style={[styles.historyCard, item.status === 'empty' && styles.emptyCard]}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardBody}>
                      <Text style={styles.domainText}>{item.status === 'empty' ? 'STILLNESS' : item.domain}</Text>
                      <Text style={[styles.activityName, item.status === 'empty' && styles.emptyActivityName]}>
                        {item.status === 'empty' ? 'No activities logged' : (item.activity || item.title || 'Personalized Activity')}
                      </Text>
                      {item.energy_level && (
                        <View style={styles.tagRow}>
                          <View style={styles.energyBadge}>
                            <Ionicons name="flash-outline" size={scale(12)} color="#00796B" />
                            <Text style={styles.energyText}>{item.energy_level}</Text>
                          </View>

                          {item.category && (
                            <View style={[
                              styles.categoryTag,
                              item.category === 'Discovery Hub' ? styles.discoveryTag : styles.nurtureTag
                            ]}>
                              <Ionicons
                                name={item.category === 'Discovery Hub' ? "color-wand" : "compass"}
                                size={scale(10)}
                                color={item.category === 'Discovery Hub' ? "#6366F1" : "#059669"}
                              />
                              <Text style={[
                                styles.categoryText,
                                { color: item.category === 'Discovery Hub' ? "#6366F1" : "#059669" }
                              ]}>
                                {item.category.toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      {item.status === 'empty' && (
                         <Text style={styles.emptySubtitle}>A day for rest and natural discovery.</Text>
                      )}
                    </View>

                    <View style={styles.modernTimeBox}>
                      <Text style={[styles.modernTimeText, item.status === 'empty' && styles.emptyTimeText]}>
                        {item.status === 'empty' ? '--:--' : item.completed_at_time.toLowerCase()}
                      </Text>
                      {item.duration_mins ? (
                        <View style={styles.durationBadge}>
                           <Text style={styles.durationValue}>{item.duration_mins}</Text>
                           <Text style={styles.durationLabel}>mins</Text>
                        </View>
                      ) : item.status === 'empty' && (
                        <Ionicons name="leaf-outline" size={scale(24)} color="#E2E8F0" />
                      )}
                    </View>
                  </View>
                </Animated.View>
               ))}
            </View>
          ))
        )}

        {/* Domain Selection Modal (Grid Layout) */}
        <Modal visible={showDomainPicker} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDomainPicker(false)}
          >
            <Animated.View entering={FadeIn.duration(200)} style={styles.pickerCard}>
              <Text style={styles.modalTitle}>Filter by Focus</Text>
              <View style={styles.domainGrid}>
                {/* "All" Option */}
                <TouchableOpacity
                  style={[styles.gridItem, !selectedDomain && styles.gridItemActive]}
                  onPress={() => {
                    setSelectedDomain(null);
                    setShowDomainPicker(false);
                  }}
                >
                  <AppEmoji style={styles.gridEmoji}>🌟</AppEmoji>
                  <Text style={[styles.gridItemText, !selectedDomain && styles.gridItemTextActive]}>All Focus</Text>
                </TouchableOpacity>

                {allDomains.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.gridItem, selectedDomain === d && styles.gridItemActive]}
                    onPress={() => {
                      setSelectedDomain(d);
                      setShowDomainPicker(false);
                    }}
                  >
                    <AppEmoji style={styles.gridEmoji}>{getDomainEmoji(d)}</AppEmoji>
                    <Text
                      style={[styles.gridItemText, selectedDomain === d && styles.gridItemTextActive]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
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
    minWidth: scale(50)
  },
  statDivider: {
    width: 1,
    height: verticalScale(14),
    backgroundColor: '#FDE68A',
    marginHorizontal: scale(6)
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
  filterSection: {
    width: '100%',
    marginBottom: verticalScale(10)
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
  pickerCard: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    borderRadius: moderateScale(32),
    padding: moderateScale(15),
    borderWidth: 2,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
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
  domainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    justifyContent: 'center'
  },
  gridItem: {
    width: '30%',
    height: verticalScale(90),
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(16),
    padding: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A30',
    marginBottom: verticalScale(8),
    ...Theme.shadows.soft
  },
  gridEmoji: {
    fontSize: moderateScale(24),
    marginBottom: verticalScale(4)
  },
  gridItemActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  gridItemText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    lineHeight: moderateScale(11)
  },
  gridItemTextActive: {
    color: Theme.colors.white,
    fontWeight: '900'
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
  dateText: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: 4
  },
  timeContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAF8',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: Theme.colors.softGreenBorder
  },
  bigTimeText: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: Theme.colors.primary
  },
  timePeriodText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: Theme.colors.textLight,
    textTransform: 'uppercase',
    marginTop: -4
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
    marginBottom: verticalScale(8)
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
    gap: scale(4)
  },
  energyText: {
    fontSize: moderateScale(11),
    color: '#00796B',
    fontWeight: '700'
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
    gap: scale(4),
    marginLeft: scale(8),
    borderWidth: 1,
  },
  discoveryTag: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  nurtureTag: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  categoryText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    letterSpacing: 0.5
  },
  modernTimeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(100)
  },
  modernTimeText: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: Theme.colors.primary,
    marginBottom: verticalScale(10)
  },
  emptyCard: {
    backgroundColor: '#F8FAFC50',
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyActivityName: {
    color: Theme.colors.textLight,
    fontSize: moderateScale(14),
    fontWeight: '600',
    fontStyle: 'italic'
  },
  emptySubtitle: {
    fontSize: moderateScale(10),
    color: Theme.colors.textLight,
    marginTop: verticalScale(2),
    opacity: 0.8
  },
  emptyTimeText: {
    color: '#CBD5E1',
    fontSize: moderateScale(18)
  },
  durationBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    minWidth: scale(80),
    ...Theme.shadows.soft
  },
  durationValue: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    color: Theme.colors.white,
  },
  durationLabel: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: Theme.colors.white,
    textTransform: 'uppercase',
    marginTop: -4,
    opacity: 0.9
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
  }
});

