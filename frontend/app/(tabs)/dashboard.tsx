import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Dashboard() {
  const { user, token, fetchProfile } = useAuth();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);

  const loadSchedule = async () => {
    try {
      const [scheduleRes, profileRes, streakRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules/current`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/milestones/streak`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { current_streak: 0, best_streak: 0 } }))
      ]);
      setSchedule(scheduleRes.data);
      setProfile(profileRes.data);
      setStreak(streakRes.data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleChildSwitch = async (childId: number) => {
    try {
      await axios.post(
        `${API_URL}/api/user/set-active-child/${childId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadSchedule();
    } catch (error) {
      console.error('Error switching child:', error);
    }
  };

  useEffect(() => {
    if (token) {
      loadSchedule();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    loadSchedule();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A8D5BA" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={40} color="#A8D5BA" />
          </View>
        </View>

        <View style={styles.stageCard}>
          <Ionicons
            name={user?.stage === 'pregnancy' ? 'heart' : 'happy'}
            size={32}
            color="#2D5F3F"
          />
          <View style={styles.stageInfo}>
            <Text style={styles.stageTitle}>
              {user?.stage === 'pregnancy' ? 'Pregnancy Journey' : 'Parenting Journey'}
            </Text>
            {schedule?.stage_info && (
              <Text style={styles.stageDetail}>
                {schedule.stage_info.type === 'pregnancy'
                  ? `Week ${schedule.stage_info.week}`
                  : `${schedule.stage_info.name} - ${schedule.stage_info.age_months} months`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          {schedule?.tasks && schedule.tasks.length > 0 ? (
            schedule.tasks.slice(0, 3).map((task: any, index: number) => (
              <View key={task.id || index} style={styles.taskCard}>
                <Ionicons name="checkbox-outline" size={24} color="#A8D5BA" />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskFrequency}>{task.frequency}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tasks available. Update your profile to get started!</Text>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="calendar" size={28} color="#2D5F3F" />
              <Text style={styles.actionText}>View Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="stats-chart" size={28} color="#2D5F3F" />
              <Text style={styles.actionText}>See Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  email: {
    fontSize: 14,
    color: '#6B7F71',
    marginTop: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F8F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F4',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginBottom: 24,
  },
  stageInfo: {
    flex: 1,
    gap: 4,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  stageDetail: {
    fontSize: 14,
    color: '#6B7F71',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D5F3F',
    marginBottom: 16,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  taskInfo: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  taskFrequency: {
    fontSize: 14,
    color: '#6B7F71',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7F71',
    textAlign: 'center',
    padding: 24,
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5F3F',
    textAlign: 'center',
  },
});