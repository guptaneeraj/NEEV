import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import axios from 'axios';

// Use host IP for Android emulator
const API_URL = 'http://10.0.2.2:8001';
const screenWidth = Dimensions.get('window').width;

export default function Analysis() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/analysis/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStats();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  const completionData = [
    {
      value: stats?.completed_tasks || 0,
      color: '#A8D5BA',
      label: 'Done',
    },
    {
      value: (stats?.total_tasks || 0) - (stats?.completed_tasks || 0),
      color: '#E0E9E3',
      label: 'Pending',
    },
  ];

  const weeklyData = stats?.completion_by_date?.slice(-7).map((item: any) => ({
    value: item.count,
    label: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    frontColor: '#A8D5BA',
  })) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A8D5BA" />}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#A8D5BA" />
            <Text style={styles.statValue}>{stats?.completed_tasks || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="list" size={32} color="#6B7F71" />
            <Text style={styles.statValue}>{stats?.total_tasks || 0}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={32} color="#A8D5BA" />
            <Text style={styles.statValue}>{stats?.completion_percentage || 0}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#6B7F71" />
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
                radius={80}
                innerRadius={50}
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
                <View style={[styles.legendColor, { backgroundColor: '#A8D5BA' }]} />
                <Text style={styles.legendText}>Completed: {stats?.completed_tasks || 0}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#E0E9E3' }]} />
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
                width={screenWidth - 80}
                height={200}
                barWidth={32}
                spacing={24}
                roundedTop
                barBorderRadius={8}
                yAxisThickness={0}
                xAxisThickness={0}
                noOfSections={4}
                yAxisTextStyle={{ color: '#6B7F71', fontSize: 12 }}
                xAxisLabelTextStyle={{ color: '#6B7F71', fontSize: 12 }}
              />
            </View>
          </View>
        )}

        {!stats || (stats.completed_tasks === 0 && stats.total_tasks === 0) ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="stats-chart-outline" size={64} color="#E0E9E3" />
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>Complete tasks to see your progress</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  scrollView: {
    flex: 1,
    paddingTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7F71',
  },
  chartCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  centerLabelText: {
    fontSize: 12,
    color: '#6B7F71',
  },
  legend: {
    gap: 8,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7F71',
  },
  barChartContainer: {
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7F71',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0BDB5',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
