import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

const API_URL = "https://api.neevios.com";

export default function Dashboard() {
  const { user, token, fetchProfile } = useAuth();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState<any>({ current_streak: 0, best_streak: 0 });
  const [stats, setStats] = useState<any>(null);

  const loadDashboardData = async () => {
    try {
      const [scheduleRes, streakRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules/current`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/milestones/streak`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { current_streak: 0, best_streak: 0 } })),
        axios.get(`${API_URL}/api/analysis/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: null }))
      ]);
      setSchedule(scheduleRes.data);
      setStreak(streakRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Dashboard Load Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePlanSelection = async (plan: string) => {
    try {
      await axios.patch(`${API_URL}/api/user/update`, { preferred_activity_time: plan }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update plan.');
    }
  };

  const toggleTask = async (activityName: string, week: number) => {
    try {
      await axios.post(`${API_URL}/api/tasks/toggle`, { activity_name: activityName, week: week }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  useEffect(() => {
    if (token) loadDashboardData();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  const displayName = user?.full_name || user?.relationship_type || 'Parent';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A8D5BA" />}
      >
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.photoContainer}>
              <Image
                source={user?.profile_image ? { uri: `${API_URL}${user.profile_image}` } : require('../../../assets/images/neuron_avatar.jpeg')}
                style={styles.profileThumb}
              />
              <TouchableOpacity style={styles.cameraIcon} onPress={() => Alert.alert('Photos', 'Upload feature coming in next update.')}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View>
              <Text style={styles.greeting}>Hi, {displayName}!</Text>
              <Text style={styles.stageToggleText}>
                Mode: {user?.stage === 'pregnancy' ? 'Pregnancy' : 'Parenting'}
              </Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak.current_streak}</Text>
          </View>
        </View>

        {schedule?.needs_plan ? (
          <View style={styles.planPickerSection}>
            <Text style={styles.pickerTitle}>Set up your Daily Plan:</Text>
            <View style={styles.pickerRow}>
              {['20_min_plan', '40_min_plan', '60_min_plan'].map((plan) => (
                <TouchableOpacity key={plan} style={styles.planChip} onPress={() => handlePlanSelection(plan)}>
                  <Text style={styles.planChipText}>{plan.split('_')[0]} Mins</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{schedule?.plan_type}</Text>
                <Text style={styles.timeTag}>{schedule?.time_preference}</Text>
              </View>
              <Text style={styles.weekTag}>Week {schedule?.week}</Text>
            </View>

            {schedule?.tasks && schedule.tasks.length > 0 ? (
              schedule.tasks.map((task: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.taskCard, task.completed && styles.taskCardDone]}
                  onPress={() => toggleTask(task.title, schedule.week)}
                >
                  <Ionicons
                    name={task.completed ? "checkbox" : "square-outline"}
                    size={26}
                    color={task.completed ? "#FFF" : "#A8D5BA"}
                  />
                  <Text style={[styles.taskTitle, task.completed && styles.taskTextDone]}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No activities found for this week.</Text>
            )}
          </View>
        )}

        <View style={styles.infoCards}>
          <TouchableOpacity style={styles.statsCard} onPress={() => Alert.alert('Analytics', stats?.diagnostics || 'Keep tracking to see insights!')}>
            <Ionicons name="trending-up" size={24} color="#2D5F3F" />
            <Text style={styles.cardValue}>Analytics</Text>
            <Text style={styles.cardLabel}>Progress: {stats?.percentage || 0}%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statsCard} onPress={() => Alert.alert('Diagnosis', 'Diagnostic data is being generated based on your activity logs.')}>
            <Ionicons name="medkit" size={24} color="#2D5F3F" />
            <Text style={styles.cardValue}>Diagnosis</Text>
            <Text style={styles.cardLabel}>View Insights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F0' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoContainer: { position: 'relative' },
  profileThumb: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#A8D5BA' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2D5F3F', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#2D5F3F' },
  stageToggleText: { fontSize: 13, color: '#6B7F71', fontWeight: '600' },
  streakBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 2 },
  streakText: { fontWeight: 'bold', color: '#2D5F3F' },
  section: { paddingHorizontal: 24, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D5F3F', letterSpacing: 1 },
  timeTag: { fontSize: 12, color: '#6B7F71', fontWeight: 'bold' },
  weekTag: { backgroundColor: '#A8D5BA', color: '#2D5F3F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: 'bold' },
  taskCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 12, gap: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E0E9E3' },
  taskCardDone: { backgroundColor: '#A8D5BA', borderColor: '#A8D5BA' },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#2D5F3F' },
  taskTextDone: { color: '#FFF', textDecorationLine: 'line-through' },
  emptyText: { textAlign: 'center', color: '#6B7F71', marginTop: 20 },
  planPickerSection: { padding: 24, backgroundColor: '#F0F8F4', marginHorizontal: 24, borderRadius: 20, marginBottom: 24 },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: '#2D5F3F', marginBottom: 15 },
  pickerRow: { flexDirection: 'row', gap: 10 },
  planChip: { flex: 1, backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#A8D5BA' },
  planChipText: { fontSize: 14, fontWeight: '700', color: '#2D5F3F' },
  infoCards: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 30 },
  statsCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E0E9E3' },
  cardLabel: { fontSize: 11, color: '#6B7F71', marginTop: 4, textAlign: 'center' },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#2D5F3F' }
});
