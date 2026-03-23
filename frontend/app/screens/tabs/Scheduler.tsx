import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

// Use hardcoded host IP for Android emulator
const API_URL = 'http://10.0.2.2:8001';

interface Task {
  id: string;
  title: string;
  frequency: string;
}

export default function Scheduler() {
  const { token } = useAuth();
  const [schedule, setSchedule] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedule = async () => {
    try {
      const [scheduleRes, completedRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules/current`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/tasks/completed`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSchedule(scheduleRes.data);

      // Get today's completed tasks
      const today = new Date().toISOString().split('T')[0];
      const todayCompleted = new Set(
        completedRes.data
          .filter((t: any) => t.completed_at.startsWith(today))
          .map((t: any) => t.task_id)
      );
      setCompletedTasks(todayCompleted);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSchedule();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSchedule();
  };

  const handleTaskToggle = async (task: Task) => {
    const isCompleted = completedTasks.has(task.id);

    if (isCompleted) {
      Alert.alert('Info', 'Task already completed today!');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/tasks/complete`,
        { task_id: task.id, template_id: schedule.template_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCompletedTasks(new Set(completedTasks).add(task.id));
      Alert.alert('Success', 'Task marked as complete!');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
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
        {schedule?.tasks && schedule.tasks.length > 0 ? (
          schedule.tasks.map((task: Task, index: number) => {
            const isCompleted = completedTasks.has(task.id);
            return (
              <TouchableOpacity
                key={task.id || index}
                style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}
                onPress={() => handleTaskToggle(task)}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={28} color="#A8D5BA" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={28} color="#B0BDB5" />
                  )}
                </View>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskFrequency}>{task.frequency}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#E0E9E3" />
            <Text style={styles.emptyText}>No tasks available</Text>
            <Text style={styles.emptySubtext}>Complete your profile to get personalized tasks</Text>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  taskCardCompleted: {
    backgroundColor: '#F0F8F4',
  },
  checkbox: {
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7F71',
  },
  taskFrequency: {
    fontSize: 14,
    color: '#6B7F71',
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
