import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
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
import axios from 'axios';
import LoadingLogo from '../../../components/LoadingLogo';

const { width } = Dimensions.get('window');
const API_URL = 'https://api.neevios.com';

const MilestoneItem = ({ title, completed, date, type }: { title: string; completed: boolean; date?: string; type?: string }) => (
  <View style={styles.milestoneItem}>
    <View style={[styles.milestoneCheck, completed && styles.milestoneCheckActive]}>
      {completed && <Ionicons name="checkmark" size={14} color={Theme.colors.white} />}
    </View>
    <View style={styles.milestoneTextContainer}>
      <Text style={[styles.milestoneTitle, !completed && styles.milestoneTitlePending]}>
        {title}
      </Text>
      {type && <Text style={styles.milestoneType}>{type}</Text>}
      {date && <Text style={styles.milestoneDate}>{date}</Text>}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Development Intelligence</Text>
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
                height={160}
                width={width - 100}
                initialSpacing={10}
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
            <Ionicons name="sparkles" size={20} color={Theme.colors.primary} />
            <Text style={styles.aiInsightTitle}>AI Analysis</Text>
            {isLoading && <ActivityIndicator size="small" color={Theme.colors.primary} style={{marginLeft: 10}} />}
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
            <Ionicons name="arrow-forward" size={16} color={Theme.colors.primary} />
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.primary },
  scrollContent: { padding: 24 },
  card: { borderRadius: 25, padding: 20, marginBottom: 24, borderWidth: 1.5, ...Theme.shadows.soft },
  chartCard: {},
  cardLabel: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary, marginBottom: 20 },
  chartWrapper: { alignItems: 'center', marginLeft: -20 },
  chartFooter: { fontSize: 12, color: Theme.colors.textLight, textAlign: 'center', marginTop: 16 },
  aiInsightCard: {},
  aiInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  aiInsightTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase' },
  labelSub: { fontSize: 12, color: Theme.colors.textLight, marginBottom: 12, fontWeight: '600' },
  aiInsightText: { fontSize: 16, color: Theme.colors.primary, lineHeight: 24 },
  statusBadge: { backgroundColor: Theme.colors.softGreen, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: Theme.colors.primary },
  statusText: { fontSize: 12, fontWeight: '700', color: Theme.colors.primary },
  actionCard: {},
  actionLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.textLight, textTransform: 'uppercase', marginBottom: 8 },
  actionText: { fontSize: 15, color: Theme.colors.primary, lineHeight: 22, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 25, gap: 10, borderWidth: 1.5 },
  actionBtnText: { color: Theme.colors.primary, fontSize: 15, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.primary, marginBottom: 16 },
  milestoneList: {},
  milestoneItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.background },
  milestoneCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Theme.colors.accent, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  milestoneCheckActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  milestoneTextContainer: { flex: 1 },
  milestoneTitle: { fontSize: 15, fontWeight: '600', color: Theme.colors.primary },
  milestoneTitlePending: { color: Theme.colors.textLight },
  milestoneDate: { fontSize: 12, color: Theme.colors.textLight, marginTop: 2 },
  milestoneType: { fontSize: 10, color: Theme.colors.textLight, fontWeight: '700', textTransform: 'uppercase' },
  footerSpacer: { height: 40 },
  emptyText: { color: Theme.colors.textLight, textAlign: 'center' }
});
