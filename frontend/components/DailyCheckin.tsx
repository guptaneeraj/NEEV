import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../constants/Theme';
import { scale, verticalScale, moderateScale, getISTDateString, formatIST } from '../utils/responsive';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../app/contexts/AuthContext';
import * as directusService from '../services/DirectusApiClient';

export default function DailyCheckin() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [morningData, setMorningData] = useState<any>(null);
  const [eveningData, setEveningData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const morningMood = morningData?.morningMood || morningData?.baby_mood;
  const morningIntention = morningData?.morningIntention || morningData?.intentFocus || morningData?.cry_label;
  const morningEnergy = morningData?.morningEnergy || morningData?.sleep_hours;

  const eveningMood = eveningData?.eveningMood || eveningData?.baby_mood;
  const eveningOutcome = eveningData?.eveningReflection || eveningData?.cry_label;
  const eveningEnergy = eveningData?.eveningEnergy || eveningData?.sleep_hours;

  useEffect(() => {
    const fetchData = async () => {
      // Use IST date string (YYYY-MM-DD) to fix midnight rollover issue
      const dateStr = getISTDateString();

      // 1. Try to get from Directus first if user is logged in
      if (user?.id) {
        try {
          const checkIns = await directusService.fetchCheckIns(user.id, dateStr);
          const morning = checkIns.find((c: any) => c.type === 'morning');
          const evening = checkIns.find((c: any) => c.type === 'evening');

          if (morning) setMorningData(morning);
          else setMorningData(null); // Reset if not found for today

          if (evening) setEveningData(evening);
          else setEveningData(null);

          // Sync back to local storage
          if (morning) await AsyncStorage.setItem(`pulse_intent_${dateStr}`, JSON.stringify(morning));
          if (evening) await AsyncStorage.setItem(`pulse_review_${dateStr}`, JSON.stringify(evening));
        } catch (error) {
          console.error('Error fetching from Directus, falling back to local:', error);
          loadFromLocal(dateStr);
        }
      } else {
        loadFromLocal(dateStr);
      }
    };

    const loadFromLocal = async (dateStr: string) => {
      const mData = await AsyncStorage.getItem(`pulse_intent_${dateStr}`);
      const eData = await AsyncStorage.getItem(`pulse_review_${dateStr}`);
      setMorningData(mData ? JSON.parse(mData) : null);
      setEveningData(eData ? JSON.parse(eData) : null);
    };

    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [user?.id, isFocused]);

  const hour = currentTime.getHours();
  const isMorningMissed = hour >= 10 && !morningData;
  const isEveningWindow = hour >= 18 && hour < 24;

  const navigateToPulse = (forcedMode?: 'morning' | 'evening') => {
    navigation.navigate('Pulse', { forcedMode });
  };

  const navigateToPulseHistory = () => {
    navigation.navigate('PulseHistory');
  };

  return (
    <View style={styles.card}>
      {/* 1. Header with Pulse Icon */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="heart" size={scale(20)} color={Theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>The Pulse</Text>
          <Text style={styles.headerSubtitle}>Daily Tracking & Rhythm</Text>
        </View>
      </View>

      {/* 2. Status Indicators */}
      <View style={styles.statusRow}>
        <TouchableOpacity style={styles.statusBox} onPress={navigateToPulseHistory}>
          <View style={styles.labelLine}>
            <Text style={styles.statusLabel}>Morning</Text>
            <Text style={styles.timingText}>5-10AM</Text>
          </View>
          {morningData ? (
             <TouchableOpacity style={[styles.miniBadge, styles.doneBadge]} onPress={() => navigateToPulse('morning')}>
                <Ionicons name="checkmark" size={10} color="#166534" />
                <Text style={styles.badgeTextDone}>LOGGED</Text>
                {morningData.is_perfect_timing === false && (
                    <View style={styles.lateTag}>
                        <Text style={styles.lateTagText}>LATE</Text>
                    </View>
                )}
             </TouchableOpacity>
          ) : isMorningMissed ? (
            <View style={[styles.miniBadge, styles.missedBadge]}>
                <Ionicons name="close" size={10} color="#991B1B" />
                <Text style={styles.badgeTextMissed}>MISSED</Text>
             </View>
          ) : (
            <TouchableOpacity style={[styles.miniBadge, styles.activeBadge]} onPress={(e) => { e.stopPropagation(); navigateToPulse(); }}>
                <Text style={styles.badgeTextActive}>LOG NOW</Text>
             </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.vertDividerStatus} />

        <TouchableOpacity style={styles.statusBox} onPress={navigateToPulseHistory}>
          <View style={styles.labelLine}>
            <Text style={styles.statusLabel}>Evening</Text>
            <Text style={styles.timingText}>6PM-12AM</Text>
          </View>
          {eveningData ? (
             <TouchableOpacity style={[styles.miniBadge, styles.doneBadge]} onPress={() => navigateToPulse('evening')}>
                <Ionicons name="checkmark" size={10} color="#166534" />
                <Text style={styles.badgeTextDone}>LOGGED</Text>
                {eveningData.is_perfect_timing === false && (
                    <View style={styles.lateTag}>
                        <Text style={styles.lateTagText}>LATE</Text>
                    </View>
                )}
             </TouchableOpacity>
          ) : isEveningWindow ? (
            <TouchableOpacity style={[styles.miniBadge, styles.activeBadge]} onPress={(e) => { e.stopPropagation(); navigateToPulse(); }}>
                <Text style={styles.badgeTextActive}>LOG NOW</Text>
             </TouchableOpacity>
          ) : (
            <Text style={styles.pendingText}>Upcoming</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Modular Data Section (Morning vs Evening) */}
      <View style={styles.dataGrid}>
        <View style={styles.dataCol}>
          <Text style={styles.tileLabel}>MORNING</Text>
          <Text style={styles.tileValueMain} numberOfLines={1}>
            {morningMood || "—"}
          </Text>
          <Text style={styles.tileSubText} numberOfLines={1}>
            {morningIntention || "No intent"}
          </Text>
        </View>

        <View style={styles.vertDividerLarge} />

        <View style={styles.dataCol}>
          <Text style={styles.tileLabel}>EVENING</Text>
          <Text style={styles.tileValueMain} numberOfLines={1}>
            {eveningMood || "—"}
          </Text>
          <Text style={styles.tileSubText} numberOfLines={1}>
            {eveningOutcome || "No review"}
          </Text>
        </View>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
         <View style={styles.summaryItem}>
            <Ionicons name="flash" size={scale(12)} color={Theme.colors.primary} />
            <Text style={styles.summaryText}>Energy: {morningEnergy || '—'} → {eveningEnergy || '—'}</Text>
         </View>
         <View style={styles.summaryItem}>
            <Ionicons name="restaurant" size={scale(12)} color={Theme.colors.primary} />
            <Text style={styles.summaryText}>{eveningData?.meals?.length || 0} feeds</Text>
         </View>
      </View>

      {morningData && eveningData && (
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>
            {eveningOutcome?.toLowerCase().includes('yes') || eveningOutcome?.toLowerCase().includes('perfectly')
              ? '🌟 Intention Achieved!'
              : '📊 Rhythm Comparison'}
          </Text>
          <Text style={styles.comparisonText}>
            {(() => {
              const mEnergy = morningEnergy || 3;
              const eEnergy = eveningEnergy || 3;
              const diff = eEnergy - mEnergy;
              let energyTrend = diff >= 1 ? '📈 Energy improved!' : diff <= -1 ? '📉 Energy dipped.' : '➡️ Steady energy.';

              if (eveningOutcome?.toLowerCase().includes('yes') || eveningOutcome?.toLowerCase().includes('perfectly')) {
                return `Great job! You stuck to your "${morningIntention}" intent. ${energyTrend}`;
              }
              return `You focused on "${morningIntention}" today. ${energyTrend}`;
            })()}
          </Text>
        </View>
      )}

      {/* 4. AI Insight Snippet */}

      <View style={styles.insightBox}>
        <View style={styles.insightHeader}>
           <Ionicons name="sparkles" size={scale(12)} color={Theme.colors.primary} />
           <Text style={styles.insightTitle}>DAILY INSIGHT</Text>
        </View>
        <Text style={styles.insightText} numberOfLines={2}>
          {morningData
            ? `Targeting ${morningData.intentFocus || morningData.cry_label} today? Try 10 mins of sensory play during the next wake window.`
            : "Complete your check-in to unlock personalized AI parenting insights."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(16),
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(16)
  },
  iconCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#E0F2E9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { fontSize: moderateScale(18), fontWeight: '800', color: Theme.colors.primary },
  headerSubtitle: { fontSize: moderateScale(11), color: Theme.colors.textLight, fontWeight: '600' },

  statusRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: scale(14),
    padding: scale(12),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  statusBox: { flex: 1, alignItems: 'center' },
  labelLine: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: verticalScale(6) },
  statusLabel: { fontSize: moderateScale(13), fontWeight: '700', color: Theme.colors.primary },
  timingText: { fontSize: moderateScale(10), color: Theme.colors.textLight },

  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(6)
  },
  doneBadge: { backgroundColor: '#DCFCE7' },
  missedBadge: { backgroundColor: '#FEE2E2' },
  activeBadge: { backgroundColor: '#FEF3C7' },
  badgeTextDone: { color: '#166534', fontSize: moderateScale(9), fontWeight: '900' },
  badgeTextMissed: { color: '#991B1B', fontSize: moderateScale(9), fontWeight: '900' },
  badgeTextActive: { color: '#B45309', fontSize: moderateScale(9), fontWeight: '900' },
  lateTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4
  },
  lateTagText: {
    color: '#991B1B',
    fontSize: moderateScale(7),
    fontWeight: '900'
  },
  pendingText: { fontSize: moderateScale(11), color: Theme.colors.textLight, fontStyle: 'italic' },
  vertDividerStatus: { width: 1, backgroundColor: '#E2E8F0', height: '60%', alignSelf: 'center' },

  dataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(4)
  },
  dataCol: { flex: 1, alignItems: 'center' },
  tileLabel: { fontSize: moderateScale(9), fontWeight: '800', color: Theme.colors.textLight, letterSpacing: 0.5, marginBottom: verticalScale(4) },
  tileValueMain: { fontSize: moderateScale(15), fontWeight: '700', color: Theme.colors.primary, marginBottom: 2 },
  tileSubText: { fontSize: moderateScale(10), color: Theme.colors.textLight, fontWeight: '600', textAlign: 'center' },
  vertDividerLarge: { width: 1, backgroundColor: '#FDE68A', height: '80%', alignSelf: 'center', opacity: 0.4 },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(20),
    marginBottom: verticalScale(16),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
  summaryText: { fontSize: moderateScale(11), color: Theme.colors.textLight, fontWeight: '700' },

  insightBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: verticalScale(4) },
  insightTitle: { fontSize: moderateScale(9), fontWeight: '900', color: Theme.colors.primary, letterSpacing: 0.8 },
  insightText: { fontSize: moderateScale(11), color: Theme.colors.primary, lineHeight: moderateScale(16), fontStyle: 'italic' },
  comparisonBox: {
    marginTop: 4,
    padding: scale(12),
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: verticalScale(12)
  },
  comparisonTitle: { fontSize: moderateScale(12), fontWeight: '800', color: Theme.colors.primary, marginBottom: 4 },
  comparisonText: { fontSize: moderateScale(11), color: Theme.colors.textLight, lineHeight: 16, fontWeight: '600' },
});
