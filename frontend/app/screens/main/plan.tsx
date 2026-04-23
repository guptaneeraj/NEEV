import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../../constants/Theme';
import { useAIStore } from '../../../store/useAIStore';
import { useAuth } from '../../contexts/AuthContext';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
  fetchActivities,
  fetchRecentHistory,
  generateDailyPlan,
  getAgeGroup,
  saveActivityToHistory,
  fetchActivityLog
} from '../../../services/DirectusApiClient';

const ActivityCard = ({ activity, index, navigation, user }: { activity: any; index: number; navigation: any; user: any }) => {
  const getIcon = () => {
    switch (activity.domain) {
      case 'Gross Motor': return 'tennisball-outline';
      case 'Cognitive': return 'compass-outline';
      case 'Language': return 'book-outline';
      case 'Sensory': return 'medkit-outline';
      default: return 'sparkles-outline';
    }
  };

  const getActionLabel = () => {
    return activity.domain || 'Explore';
  };

  const handlePress = () => {
    navigation.navigate("ActivityGuidance", {
      activity: activity,
      childProfile: { stage: user?.stage }
    });
  };

  const [completed, setCompleted] = useState(false);

  const handleComplete = async () => {
    try {
      const userId = user?.id || user?.user_id;
      await saveActivityToHistory(String(userId), String(activity.id), 'Nurture Hub');
      setCompleted(true);
    } catch (e) {
      console.error("Failed to save activity history", e);
    }
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(500)}
      style={[styles.card, completed && { opacity: 0.6 }]}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon()} size={moderateScale(28)} color={Theme.colors.primary} />
        </View>

        <View style={styles.textContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
             <Text style={styles.activityTitle}>{activity.activity}</Text>
             {completed && <Ionicons name="checkmark-circle" size={20} color={Theme.colors.secondary} />}
          </View>
          <Text style={styles.benefitText}>{activity.description}</Text>
          <Text style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 4 }}>
            {activity.duration_mins} mins • {activity.energy_level}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          style={[styles.actionButton, { flex: 1 }]}
          onPress={handlePress}
        >
          <Text style={styles.actionButtonText}>{getActionLabel()} </Text>
          <Ionicons name="chevron-forward" size={moderateScale(16)} color={Theme.colors.primary} />
        </TouchableOpacity>

        {!completed && (
          <TouchableOpacity
            style={[styles.actionButton, { width: scale(50), backgroundColor: Theme.colors.accent }]}
            onPress={handleComplete}
          >
            <Ionicons name="checkmark" size={moderateScale(20)} color={Theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default function Plan() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [dailyActivities, setDailyActivities] = useState<any[]>([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const loadActivityLog = async () => {
    setLogLoading(true);
    try {
      const userId = user?.id || user?.user_id;
      const log = await fetchActivityLog(userId, 7);
      setActivityLog(log);
    } catch (e) {} finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setPlanLoading(true);

        const CACHE_KEY = 'daily_plan_cache';
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { plan, timestamp, ageGroup: cachedAgeGroup } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < CACHE_DURATION) {
            setDailyActivities(plan);
            setPlanLoading(false);
            loadActivityLog();
            return;
          }
        }

        // Get child data from store
        const state = useAIStore.getState();
        const selectedChildId = state.selectedChildId;
        const childData = state.children.find(c => String(c.id) === String(selectedChildId)) || state.children[0];
        const userData = user;

        if (!childData?.dob && !childData?.date_of_birth) {
          setPlanLoading(false);
          return;
        }

        const dob = childData.dob || childData.date_of_birth;
        const ageGroup = getAgeGroup(dob);

        // Log previous plan activities as missed if not completed
        if (cached) {
          const { plan: oldPlan } = JSON.parse(cached);
          const userId = user?.id || user?.user_id;
          const completedIds = await fetchRecentHistory(userId)
            .then(h => h
              .filter((i: any) => i.status === 'completed')
              .map((i: any) => String(i.activity_id))
            )
            .catch(() => []);

          for (const activity of oldPlan) {
            if (!completedIds.includes(String(activity.id))) {
              await saveActivityToHistory(
                userId,
                String(activity.id),
                'missed'
              ).catch(() => {});
            }
          }
        }

        // Get plan duration from user preference
        const planDurationMap: Record<string, number> = {
          '20_min_plan': 20,
          '40_min_plan': 40,
          '60_min_plan': 60
        };
        const planDuration = planDurationMap[userData?.preferred_plan_type] || 40;

        // Fetch from Directus
        const userId = userData?.id || userData?.user_id;
        const [activities, history] = await Promise.all([
          fetchActivities(ageGroup),
          fetchRecentHistory(String(userId))
        ]);

        const recentIds = history.map((h: any) => String(h.activity_id));
        const recentDomains = history
          .slice(0, 10)
          .map((h: any) => h.domain)
          .filter(Boolean);

        const plan = generateDailyPlan(
          activities,
          ageGroup,
          planDuration,
          recentIds,
          recentDomains
        );

        // After generating new plan, save to cache:
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          plan: plan,
          timestamp: Date.now(),
          ageGroup: ageGroup
        }));

        setDailyActivities(plan);
        loadActivityLog();
      } catch (error) {
        console.error('Failed to load daily plan:', error);
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlan();
  }, [user]);

  const completedCount = dailyActivities.filter(a => a.completed).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Weekly Journey</Text>
          <Text style={styles.headerSubtitle}>Daily Curated Plan</Text>
        </View>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's Goals</Text>
            <Text style={styles.progressValue}>{dailyActivities.length} activities</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: '100%' }
              ]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Daily Plan</Text>

        {planLoading ? (
          <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: verticalScale(40) }} />
        ) : (
          dailyActivities.map((activity, index) => (
            <ActivityCard key={index} activity={activity} index={index} navigation={navigation} user={user} />
          ))
        )}

        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          {logLoading ? (
            <ActivityIndicator color={Theme.colors.primary} />
          ) : (
            activityLog.map((item, idx) => (
              <View key={idx} style={styles.logItem}>
                <View style={styles.logInfo}>
                  <Text style={styles.logId}>Activity #{item.activity_id}</Text>
                  <Text style={styles.logDate}>
                    {new Date(item.completed_at).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.logStatusContainer}>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'completed' ? styles.statusGreen :
                    item.status === 'missed' ? styles.statusRed : styles.statusGrey
                  ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                  {item.status === 'missed' && (
                    <TouchableOpacity
                      onPress={async () => {
                        const userId = user?.id || user?.user_id;
                        await saveActivityToHistory(userId, item.activity_id, 'Nurture Hub');
                        loadActivityLog();
                      }}
                      style={styles.markCompleteBtn}
                    >
                      <Text style={styles.markCompleteText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    backgroundColor: Theme.colors.background,
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: scale(10)
  },
  headerTitle: { fontSize: moderateScale(22), fontWeight: '800', color: Theme.colors.primary },
  headerSubtitle: { fontSize: moderateScale(13), color: Theme.colors.textLight, marginTop: verticalScale(1), fontWeight: '600' },
  scrollContent: { padding: scale(24) },
  progressSection: { marginBottom: verticalScale(30) },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: verticalScale(12) },
  progressLabel: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary },
  progressValue: { fontSize: moderateScale(13), color: Theme.colors.primary, fontWeight: '600' },
  progressBarBg: { height: verticalScale(10), backgroundColor: Theme.colors.accent, borderRadius: moderateScale(6), overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Theme.colors.secondary, borderRadius: moderateScale(6) },
  sectionTitle: { fontSize: moderateScale(22), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(16) },
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(25),
    padding: moderateScale(18),
    marginBottom: verticalScale(18),
    ...Theme.shadows.soft,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(16) },
  iconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(18),
    backgroundColor: Theme.colors.softSlate,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder
  },
  textContainer: { flex: 1 },
  activityTitle: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary },
  benefitText: { fontSize: moderateScale(13), color: Theme.colors.textLight, marginTop: verticalScale(4), lineHeight: moderateScale(18) },
  actionButton: {
    backgroundColor: Theme.colors.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(15),
    gap: scale(8),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary
  },
  actionButtonText: { color: Theme.colors.primary, fontSize: moderateScale(14), fontWeight: '700' },
  footerSpacer: { height: verticalScale(40) },
  logSection: { marginTop: verticalScale(30) },
  logItem: {
    backgroundColor: Theme.colors.white,
    padding: moderateScale(15),
    borderRadius: moderateScale(15),
    marginBottom: verticalScale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  logInfo: { flex: 1 },
  logId: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.primary },
  logDate: { fontSize: moderateScale(12), color: Theme.colors.textLight },
  logStatusContainer: { alignItems: 'flex-end' },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(4)
  },
  statusGreen: { backgroundColor: '#D1FAE5' },
  statusRed: { backgroundColor: '#FEE2E2' },
  statusGrey: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: moderateScale(10), fontWeight: '700', textTransform: 'capitalize' },
  markCompleteBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6)
  },
  markCompleteText: { color: 'white', fontSize: moderateScale(10), fontWeight: '700' }
});
