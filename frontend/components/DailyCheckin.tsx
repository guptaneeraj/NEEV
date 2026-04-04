import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../constants/Theme';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

export default function DailyCheckin() {
  const [morningData, setMorningData] = useState<any>(null);
  const [eveningData, setEveningData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      const dateStr = new Date().toISOString().split('T')[0];
      const mData = await AsyncStorage.getItem(`pulse_intent_${dateStr}`);
      const eData = await AsyncStorage.getItem(`pulse_review_${dateStr}`);
      if (mData) setMorningData(JSON.parse(mData));
      if (eData) setEveningData(JSON.parse(eData));
    };
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const isMorningMissed = hour >= 10 && !morningData;
  const isEveningWindow = hour >= 18 && hour < 24;
  const isEveningMissed = hour < 5 && !eveningData && hour > 0; // Check for previous night in a real app, here we simplify for current date

  return (
    <View style={styles.card}>
      {/* 1. Header with Pulse Icon */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="heart-half" size={scale(20)} color={Theme.colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>The Pulse Status</Text>
          <Text style={styles.headerSubtitle}>Daily Tracking & Rhythm</Text>
        </View>
      </View>

      {/* 2. Status Indicators (Timing + Missed/Done) */}
      <View style={styles.statusRow}>
        <View style={styles.statusBox}>
          <View style={styles.labelLine}>
            <Text style={styles.statusLabel}>Morning</Text>
            <Text style={styles.timingText}>5-10AM</Text>
          </View>
          {morningData ? (
             <View style={[styles.miniBadge, styles.doneBadge]}>
                <Ionicons name="checkmark" size={10} color={Theme.colors.primary} />
                <Text style={styles.badgeTextDone}>LOGGED</Text>
             </View>
          ) : isMorningMissed ? (
            <View style={[styles.miniBadge, styles.missedBadge]}>
                <Ionicons name="close" size={10} color={Theme.colors.error} />
                <Text style={styles.badgeTextMissed}>MISSED</Text>
             </View>
          ) : (
            <Text style={styles.pendingText}>Pending...</Text>
          )}
        </View>

        <View style={styles.vertDivider} />

        <View style={styles.statusBox}>
          <View style={styles.labelLine}>
            <Text style={styles.statusLabel}>Evening</Text>
            <Text style={styles.timingText}>6PM-12AM</Text>
          </View>
          {eveningData ? (
             <View style={[styles.miniBadge, styles.doneBadge]}>
                <Ionicons name="checkmark" size={10} color={Theme.colors.primary} />
                <Text style={styles.badgeTextDone}>LOGGED</Text>
             </View>
          ) : isEveningWindow ? (
            <View style={[styles.miniBadge, styles.activeBadge]}>
                <Text style={styles.badgeTextActive}>ACTIVE</Text>
             </View>
          ) : (
            <Text style={styles.pendingText}>Upcoming</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* 3. Modular Data Section (Intent, Battery, Meals) */}
      <View style={styles.dataGrid}>
        {/* Intent Preview */}
        <View style={styles.dataTile}>
          <Text style={styles.tileLabel}>INTENT</Text>
          <Text style={styles.tileValue} numberOfLines={1}>
            {morningData?.intentFocus || "---"}
          </Text>
        </View>

        {/* Parental Battery */}
        <View style={styles.dataTile}>
          <Text style={styles.tileLabel}>ENERGY</Text>
          <View style={styles.batteryRow}>
             <Ionicons name="battery-charging" size={scale(14)} color={Theme.colors.primary} />
             <Text style={styles.tileValue}>{eveningData?.energyLevel || "---"}/5</Text>
          </View>
        </View>

        {/* Meal Count */}
        <View style={styles.dataTile}>
          <Text style={styles.tileLabel}>MEALS</Text>
          <Text style={styles.tileValue}>
            {eveningData?.meals?.length || 0} feeds
          </Text>
        </View>
      </View>

      {/* 4. AI Insight Snippet */}
      <View style={styles.insightBox}>
        <View style={styles.insightHeader}>
           <Ionicons name="sparkles" size={scale(12)} color={Theme.colors.primary} />
           <Text style={styles.insightTitle}>DAILY INSIGHT</Text>
        </View>
        <Text style={styles.insightText}>
          {morningData
            ? `Targeting ${morningData.intentFocus} today? Try 10 mins of sensory play during the next wake window.`
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
    marginBottom: verticalScale(8),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(12)
  },
  iconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Theme.colors.softGreen,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { fontSize: moderateScale(18), fontWeight: '800', color: Theme.colors.primary },
  headerSubtitle: { fontSize: moderateScale(11), color: Theme.colors.textLight, fontWeight: '600' },

  statusRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.softSlate,
    borderRadius: scale(14),
    padding: scale(10),
    marginBottom: verticalScale(14)
  },
  statusBox: { flex: 1, alignItems: 'center' },
  labelLine: { flexDirection: 'row', alignItems: 'center', gap: scale(5), marginBottom: verticalScale(4) },
  statusLabel: { fontSize: moderateScale(12), fontWeight: '700', color: Theme.colors.primary },
  timingText: { fontSize: moderateScale(9), color: Theme.colors.textLight },

  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(6)
  },
  doneBadge: { backgroundColor: Theme.colors.softGreenBorder },
  missedBadge: { backgroundColor: '#FFF1F2' },
  activeBadge: { backgroundColor: '#FEF3C7' },
  badgeTextDone: { color: Theme.colors.primary, fontSize: moderateScale(9), fontWeight: '900' },
  badgeTextMissed: { color: Theme.colors.error, fontSize: moderateScale(9), fontWeight: '900' },
  badgeTextActive: { color: '#B45309', fontSize: moderateScale(9), fontWeight: '900' },
  pendingText: { fontSize: moderateScale(10), color: Theme.colors.textLight, fontStyle: 'italic' },
  vertDivider: { width: 1, backgroundColor: '#E2E8F0', height: '100%' },

  divider: { height: 1, backgroundColor: '#FDE68A', opacity: 0.2, marginBottom: verticalScale(12) },

  dataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(14)
  },
  dataTile: { flex: 1, alignItems: 'center' },
  tileLabel: { fontSize: moderateScale(9), fontWeight: '800', color: Theme.colors.textLight, letterSpacing: 0.5, marginBottom: verticalScale(4) },
  tileValue: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.primary },
  batteryRow: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },

  insightBox: {
    backgroundColor: '#FDF7E2',
    borderRadius: scale(10),
    padding: scale(10),
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: verticalScale(2) },
  insightTitle: { fontSize: moderateScale(9), fontWeight: '900', color: Theme.colors.primary, letterSpacing: 0.8 },
  insightText: { fontSize: moderateScale(11), color: Theme.colors.primary, lineHeight: moderateScale(16), fontStyle: 'italic' }
});
