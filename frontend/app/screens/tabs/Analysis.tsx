import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LazyBarChart as BarChart, LazyPieChart as PieChart } from '../../../components/LazyCharts';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from '../../../utils/responsive';
import * as directusService from '../../../services/DirectusApiClient';

export default function Analysis() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const [activities, history] = await Promise.all([
        directusService.fetchCurrentSchedule(user.id),
        directusService.fetchCompletedTasks(user.id),
      ]);

      const totalTasks = activities.length;
      const completedTasks = history.length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Group history by date
      const completionByDate: Record<string, number> = {};
      history.forEach((h: any) => {
        const date = h.completed_at?.split('T')[0];
        if (date) {
          completionByDate[date] = (completionByDate[date] || 0) + 1;
        }
      });

      const formattedHistory = Object.keys(completionByDate).map(date => ({
        date,
        count: completionByDate[date]
      })).sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        completion_percentage: percentage,
        weekly_adherence: percentage, // Simplified for now
        completion_by_date: formattedHistory
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.secondary} />
      </View>
    );
  }

  const completionData = [
    {
      value: stats?.completed_tasks || 0,
      color: Theme.colors.secondary,
      label: 'Done',
    },
    {
      value: (stats?.total_tasks || 0) - (stats?.completed_tasks || 0),
      color: Theme.colors.accent,
      label: 'Pending',
    },
  ];

  const weeklyData = stats?.completion_by_date?.slice(-7).map((item: any) => ({
    value: item.count,
    label: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    frontColor: Theme.colors.secondary,
  })) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.secondary} />}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={moderateScale(32)} color={Theme.colors.secondary} />
            <Text style={styles.statValue}>{stats?.completed_tasks || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="list" size={moderateScale(32)} color={Theme.colors.textLight} />
            <Text style={styles.statValue}>{stats?.total_tasks || 0}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={moderateScale(32)} color={Theme.colors.secondary} />
            <Text style={styles.statValue}>{stats?.completion_percentage || 0}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={moderateScale(32)} color={Theme.colors.textLight} />
            <Text style={styles.statValue}>{stats?.weekly_adherence || 0}%</Text>
            <Text style={styles.statLabel}>Adherence</Text>
          </View>
        </View>

        {completionData[0].value > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Task Completion</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={completionData}
                donut
                radius={moderateScale(80)}
                innerRadius={moderateScale(50)}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelValue}>
                      {stats?.completion_percentage || 0}%
                    </Text>
                    <Text style={styles.centerLabelText}>Done</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: Theme.colors.secondary }]} />
                <Text style={styles.legendText}>Completed: {stats?.completed_tasks || 0}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: Theme.colors.accent }]} />
                <Text style={styles.legendText}>
                  Pending: {(stats?.total_tasks || 0) - (stats?.completed_tasks || 0)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {weeklyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            <View style={styles.barChartContainer}>
              <BarChart
                data={weeklyData}
                width={SCREEN_WIDTH - scale(80)}
                height={verticalScale(200)}
                barWidth={scale(32)}
                spacing={scale(24)}
                roundedTop
                barBorderRadius={moderateScale(8)}
                yAxisThickness={0}
                xAxisThickness={0}
                noOfSections={4}
                yAxisTextStyle={{ color: Theme.colors.textLight, fontSize: moderateScale(12) }}
                xAxisLabelTextStyle={{ color: Theme.colors.textLight, fontSize: moderateScale(12) }}
              />
            </View>
          </View>
        )}

        {!stats || (stats.completed_tasks === 0 && stats.total_tasks === 0) ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="stats-chart-outline" size={moderateScale(64)} color={Theme.colors.accent} />
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>Complete tasks to see your progress</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  scrollView: { flex: 1, paddingTop: verticalScale(10) },
  statsGrid: { flexDirection: 'row', gap: scale(16), paddingHorizontal: scale(24), marginBottom: verticalScale(16) },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    gap: verticalScale(8),
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    ...Theme.shadows.soft
  },
  statValue: { fontSize: moderateScale(24), fontWeight: '700', color: Theme.colors.primary },
  statLabel: { fontSize: moderateScale(12), color: Theme.colors.textLight, fontWeight: '600' },
  chartCard: {
    backgroundColor: Theme.colors.white,
    marginHorizontal: scale(24),
    marginBottom: verticalScale(24),
    padding: moderateScale(20),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    ...Theme.shadows.soft
  },
  chartTitle: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(16) },
  chartContainer: { alignItems: 'center', marginVertical: verticalScale(16) },
  centerLabel: { alignItems: 'center' },
  centerLabelValue: { fontSize: moderateScale(20), fontWeight: '700', color: Theme.colors.primary },
  centerLabelText: { fontSize: moderateScale(12), color: Theme.colors.textLight },
  legend: { gap: verticalScale(8), marginTop: verticalScale(16) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  legendColor: { width: scale(16), height: scale(16), borderRadius: moderateScale(4) },
  legendText: { fontSize: moderateScale(14), color: Theme.colors.textLight, fontWeight: '600' },
  barChartContainer: { alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(64), gap: verticalScale(16) },
  emptyText: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary },
  emptySubtext: { fontSize: moderateScale(14), color: Theme.colors.textLight, textAlign: 'center', paddingHorizontal: scale(32) },
});
