import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAIStore } from '../../store/useAIStore';
import Animated, { FadeInUp, SlideInBottom, SlideOutBottom } from 'react-native-reanimated';

const API_URL = "https://api.neevios.com";
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export default function Scheduler() {
  const { token, user } = useAuth();
  const { processChat, selectedChildId, getStoredSessionId } = useAIStore();
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState('');
  const [isCelebLoading, setIsCelebLoading] = useState(false);
  const celebTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadSchedule = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/schedules/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScheduleData(response.data);
    } catch (error: any) {
      console.error('Error loading schedule:', error.response?.data || error.message);
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

  const buildChildProfile = async (newCompletedTask?: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prof = res.data;
      const firstChild = prof?.children?.[0] || null;

      const completedTasks = scheduleData?.tasks
        ?.filter((t: any) => t.completed)
        ?.map((t: any) => t.title) || [];

      if (newCompletedTask && !completedTasks.includes(newCompletedTask)) {
        completedTasks.push(newCompletedTask);
      }

      return {
        full_name: prof?.full_name || null,
        relationship_type: prof?.relationship_type || null,
        stage: prof?.stage || 'parenting',
        child_name: firstChild?.name || null,
        child_dob: firstChild?.dob ? new Date(firstChild.dob).toISOString().split('T')[0] : null,
        child_sex: firstChild?.sex || null,
        diet_preference: firstChild?.diet_preference || null,
        mood_logs: [],
        health_records: [],
        task_completions: completedTasks.slice(-10),
      };
    } catch {
      return {};
    }
  };

  const fireCelebration = async (taskTitle: string) => {
    if (!user?.id) return;
    const userId = user.id.toString();
    const childId = selectedChildId || userId;

    setShowCelebration(true);
    setIsCelebLoading(true);
    setCelebrationText('');

    if (celebTimeoutRef.current) clearTimeout(celebTimeoutRef.current);

    try {
      const childProfile = await buildChildProfile(taskTitle);
      const sessionId = await getStoredSessionId(userId, childId);
      const question = `We just completed: ${taskTitle}. How did we do and what should we know?`;

      let fullText = '';
      await processChat(userId, question, childProfile, (token) => {
        fullText += token;
        setCelebrationText(fullText);
      });

      // Auto-dismiss after 8 seconds
      celebTimeoutRef.current = setTimeout(() => {
        setShowCelebration(false);
      }, 8000);

    } catch (error) {
      console.error("Celebration error:", error);
      setShowCelebration(false);
    } finally {
      setIsCelebLoading(false);
    }
  };

  const handleTaskToggle = async (task: Task) => {
    const turningComplete = !task.completed;
    try {
      await axios.post(
        `${API_URL}/api/tasks/toggle`,
        {
          activity_name: task.title,
          week: scheduleData.week
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScheduleData((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) =>
          t.title === task.title ? { ...t, completed: !t.completed } : t
        )
      }));

      if (turningComplete) {
        fireCelebration(task.title);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  const hasTasks = scheduleData?.tasks && scheduleData.tasks.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Planner</Text>
        {scheduleData && (
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>
              Week {scheduleData.week} • {scheduleData.plan_type}
            </Text>
            <Text style={styles.timePreference}>
              Preferred Time: {scheduleData.time_preference}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A8D5BA" />}
      >
        {scheduleData?.needs_plan ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="settings-outline" size={64} color="#E0E9E3" />
            <Text style={styles.emptyText}>Plan Not Configured</Text>
            <Text style={styles.emptySubtext}>Please go to Profile and set your preferred activity time to generate a plan.</Text>
          </View>
        ) : hasTasks ? (
          scheduleData.tasks.map((task: Task, index: number) => (
            <TouchableOpacity
              key={index}
              style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
              onPress={() => handleTaskToggle(task)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {task.completed ? (
                  <Ionicons name="checkmark-circle" size={28} color="#A8D5BA" />
                ) : (
                  <Ionicons name="ellipse-outline" size={28} color="#B0BDB5" />
                )}
              </View>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#E0E9E3" />
            <Text style={styles.emptyText}>No tasks for this week</Text>
            <Text style={styles.emptySubtext}>We're still preparing your activities. Please check back later.</Text>
          </View>
        )}
      </ScrollView>

      {/* Celebration Bottom Sheet */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="none"
        onRequestClose={() => setShowCelebration(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCelebration(false)}
        >
          <Animated.View
            entering={SlideInBottom}
            exiting={SlideOutBottom}
            style={styles.celebSheet}
          >
            <View style={styles.celebHeader}>
              <View style={styles.celebIconContainer}>
                <Ionicons name="sparkles" size={24} color="#FFF" />
              </View>
              <Text style={styles.celebTitle}>✦ Great work!</Text>
              <TouchableOpacity onPress={() => setShowCelebration(false)}>
                <Ionicons name="close" size={24} color="#6B7F71" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.celebScroll}>
              {isCelebLoading && !celebrationText ? (
                <View style={styles.celebLoading}>
                  <ActivityIndicator color="#A8D5BA" />
                  <Text style={styles.celebLoadingText}>AI is celebrating with you...</Text>
                </View>
              ) : (
                <Text style={styles.celebText}>{celebrationText}</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.celebDoneBtn}
              onPress={() => setShowCelebration(false)}
            >
              <Text style={styles.celebDoneBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  subtitleContainer: {
    marginTop: 4,
    gap: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7F71',
    fontWeight: '600',
  },
  timePreference: {
    fontSize: 14,
    color: '#B0BDB5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E0E9E3',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardCompleted: {
    backgroundColor: '#F0F8F4',
    borderColor: '#A8D5BA',
  },
  checkbox: {
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5F3F',
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7F71',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    lineHeight: 20,
  },
  // Celebration Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  celebSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.5,
    paddingBottom: 40,
  },
  celebHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  celebIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A8D5BA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  celebTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  celebScroll: {
    marginBottom: 20,
  },
  celebText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2D5F3F',
  },
  celebLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  celebLoadingText: {
    marginTop: 10,
    color: '#6B7F71',
  },
  celebDoneBtn: {
    backgroundColor: '#F0F8F4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A8D5BA',
  },
  celebDoneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5F3F',
  }
});
