import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../../constants/Theme';
import { LineChart } from "react-native-gifted-charts";
import { useAIStore } from '../../../store/useAIStore';
import { useAuth } from '../../contexts/AuthContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from '../../../utils/responsive';

const MilestoneItem = ({ title, completed, type }: { title: string; completed: boolean; date?: string; type?: string }) => (
  <View style={styles.milestoneItem}>
    <View style={[styles.milestoneCheck, completed && styles.milestoneCheckActive]}>
      {completed && <Ionicons name="checkmark" size={moderateScale(14)} color={Theme.colors.white} />}
    </View>
    <View style={styles.milestoneTextContainer}>
      <Text style={[styles.milestoneTitle, !completed && styles.milestoneTitlePending]}>
        {title}
      </Text>
      {type && <Text style={styles.milestoneType}>{type}</Text>}
    </View>
  </View>
);

export default function Insights() {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { guidanceData, isLoading, fetchGuidance, fetchChildren } = useAIStore();
  const [refreshing, setRefreshing] = useState(false);

  const chartData = [
    { value: 20 }, { value: 45 }, { value: 38 }, { value: 65 }, { value: 75 }, { value: 90 }
  ];

  const buildChildProfile = (prof: any) => {
    const firstChild = prof?.children?.[0] || null;
    return {
      full_name: prof?.full_name || null,
      relationship_type: prof?.relationship_type || null,
      stage: prof?.stage || 'parenting',
      child_name: firstChild?.name || null,
      child_dob: firstChild?.dob ? new Date(firstChild.dob).toISOString().split('T')[0] : null,
      child_sex: firstChild?.sex || null,
      diet_preference: firstChild?.diet_preference || null,
      current_week: prof?.pregnancy_info?.current_week || null,
      mood_logs: [],
      health_records: [],
      task_completions: [],
    };
  };

  const loadData = async () => {
    if (!user?.id || !token) return;
    const userId = user.id.toString();

    try {
      await fetchChildren(userId);
      const profile = buildChildProfile(user);
      await fetchGuidance(userId, profile);
    } catch (error) {
      console.error("Insights Load Data Error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isPregnancy = user?.stage === 'pregnancy';
  const insightLabel = isPregnancy ? "This week for you" : "Where your child is right now";
  const tasksLabel = isPregnancy ? "Weekly Pregnancy Activities" : "Daily Focus Tasks";

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Development Intelligence</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.secondary} />}
      >
        {!isPregnancy && (
          <Animated.View entering={FadeInUp.duration(600)} style={[styles.card, styles.chartCard, {backgroundColor: Theme.colors.white, borderColor: Theme.colors.accent}]}>
            <Text style={styles.cardLabel}>Growth Trajectory</Text>
            <View style={styles.chartWrapper}>
              <LineChart
                data={chartData}
                height={verticalScale(160)}
                width={SCREEN_WIDTH - scale(100)}
                initialSpacing={scale(10)}
                color={Theme.colors.primary}
                thickness={3}
                hideRules
                hideYAxisText
                yAxisThickness={0}
                xAxisThickness={0}
                areaChart
                startFillColor={Theme.colors.secondary}
                endFillColor={Theme.colors.background}
                startOpacity={0.3}
                endOpacity={0.05}
                curved
              />
            </View>
            <Text style={styles.chartFooter}>Milestones achieved over the last 6 weeks</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(200)} style={[styles.card, styles.aiInsightCard, {backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.softGreenBorder}]}>
          <View style={styles.aiInsightHeader}>
            <Ionicons name="sparkles" size={moderateScale(20)} color={Theme.colors.primary} />
            <Text style={styles.aiInsightTitle}>AI Analysis</Text>
            {isLoading && <ActivityIndicator size="small" color={Theme.colors.primary} style={{marginLeft: scale(10)}} />}
          </View>
          <Text style={styles.labelSub}>{insightLabel}</Text>
          <Text style={styles.aiInsightText}>
            {guidanceData?.insight || (isLoading ? "Analyzing..." : "No data available.")}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{isPregnancy ? "Healthy Pregnancy" : "Healthy Progress"}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={[styles.card, styles.actionCard, {backgroundColor: Theme.colors.white, borderColor: Theme.colors.accent}]}>
          <Text style={styles.actionLabel}>AI Recommendation</Text>
          <Text style={styles.actionText}>
            {guidanceData?.recommendation || (isLoading ? "Loading..." : "Check back later.")}
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.primary}]}
            onPress={() => navigation.navigate('Plan')}
          >
            <Text style={styles.actionBtnText}>Explore Recommended Tasks</Text>
            <Ionicons name="arrow-forward" size={moderateScale(16)} color={Theme.colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tasksLabel}</Text>
          <View style={[styles.card, styles.milestoneList, {backgroundColor: Theme.colors.white, borderColor: Theme.colors.accent}]}>
            {guidanceData?.daily_tasks && guidanceData.daily_tasks.length > 0 ? (
              guidanceData.daily_tasks.map((task: any, index: number) => (
                <MilestoneItem
                  key={index}
                  title={task.title}
                  completed={false}
                  type={task.priority}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>{isLoading ? "Fetching tasks..." : "No tasks for today."}</Text>
            )}
          </View>
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
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: Theme.colors.primary,
    flex: 1,
    textAlign: 'center',
    marginRight: scale(10)
  },
  scrollContent: { padding: scale(24) },
  card: { borderRadius: moderateScale(25), padding: moderateScale(20), marginBottom: verticalScale(24), borderWidth: 1.5, ...Theme.shadows.soft },
  chartCard: {},
  cardLabel: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(20) },
  chartWrapper: { alignItems: 'center', marginLeft: -scale(20) },
  chartFooter: { fontSize: moderateScale(12), color: Theme.colors.textLight, textAlign: 'center', marginTop: verticalScale(16) },
  aiInsightCard: {},
  aiInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: verticalScale(4) },
  aiInsightTitle: { fontSize: moderateScale(14), fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase' },
  labelSub: { fontSize: moderateScale(12), color: Theme.colors.textLight, marginBottom: verticalScale(12), fontWeight: '600' },
  aiInsightText: { fontSize: moderateScale(16), color: Theme.colors.primary, lineHeight: moderateScale(24) },
  statusBadge: { backgroundColor: Theme.colors.softGreen, alignSelf: 'flex-start', paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: moderateScale(12), marginTop: verticalScale(16), borderWidth: 1, borderColor: Theme.colors.primary },
  statusText: { fontSize: moderateScale(12), fontWeight: '700', color: Theme.colors.primary },
  actionCard: {},
  actionLabel: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.textLight, textTransform: 'uppercase', marginBottom: verticalScale(8) },
  actionText: { fontSize: moderateScale(15), color: Theme.colors.primary, lineHeight: moderateScale(22), marginBottom: verticalScale(20) },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(14), borderRadius: moderateScale(25), gap: scale(10), borderWidth: 1.5 },
  actionBtnText: { color: Theme.colors.primary, fontSize: moderateScale(15), fontWeight: '700' },
  section: { marginBottom: verticalScale(24) },
  sectionTitle: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(16) },
  milestoneList: {},
  milestoneItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(12), borderBottomWidth: 1, borderBottomColor: Theme.colors.background },
  milestoneCheck: { width: scale(24), height: scale(24), borderRadius: scale(12), borderWidth: 2, borderColor: Theme.colors.accent, justifyContent: 'center', alignItems: 'center', marginRight: scale(16) },
  milestoneCheckActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  milestoneTextContainer: { flex: 1 },
  milestoneTitle: { fontSize: moderateScale(15), fontWeight: '600', color: Theme.colors.primary },
  milestoneTitlePending: { color: Theme.colors.textLight },
  milestoneType: { fontSize: moderateScale(10), color: Theme.colors.textLight, fontWeight: '700', textTransform: 'uppercase' },
  footerSpacer: { height: verticalScale(40) },
  emptyText: { color: Theme.colors.textLight, textAlign: 'center', fontSize: moderateScale(14) }
});
