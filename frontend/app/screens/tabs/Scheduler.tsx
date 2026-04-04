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
import { useAIStore } from '../../../store/useAIStore';
import LoadingLogo from '../../../components/LoadingLogo';
import Animated, { FadeInUp, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_HEIGHT } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';

const API_URL = 'https://api.neevios.com';

interface Task {
  id: string;
  title: string;
  frequency: string;
}

export default function Scheduler() {
  const { token, user } = useAuth();
  const { processChat } = useAIStore();

  const [schedule, setSchedule] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', icon: '' });

  const showAlert = (title: string, message: string, icon: string = 'ℹ️') => {
    setModalConfig({ title, message, icon });
    setModalVisible(true);
  };

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

      const today = new Date().toISOString().split('T')[0];
      const todayCompleted = new Set(
        (completedRes.data || [])
          .filter((t: any) => t.completed_at && t.completed_at.startsWith(today))
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

  const triggerCelebration = async (taskTitle: string) => {
    setShowCelebration(true);
    setAiLoading(true);
    setCelebrationText("");

    try {
      const question = `We just completed: ${taskTitle}. How did we do and what should we know?`;
      const profile = {
        full_name: user?.full_name,
        stage: user?.stage || 'parenting'
      };

      await processChat(user?.id.toString() || "", question, profile, (token) => {
        setCelebrationText(prev => prev + token);
      });

      setTimeout(() => {
        setShowCelebration(false);
      }, 8000);
    } catch (e) {
      console.error("Celebration Error:", e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleTaskToggle = async (task: Task) => {
    const isCompleted = completedTasks.has(task.id);

    if (isCompleted) {
      showAlert('Task Completed', 'You\'ve already crushed this task for today! Keep up the great momentum.', '🌟');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/tasks/toggle`,
        { activity_name: task.title, week: schedule.week },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCompletedTasks(new Set(completedTasks).add(task.id));
      triggerCelebration(task.title);
    } catch (error) {
      showAlert('Error', 'We couldn\'t update your task status. Please check your connection.', '❌');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingLogo size={moderateScale(80)} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.secondary} />}
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
                    <Ionicons name="checkmark-circle" size={moderateScale(28)} color={Theme.colors.secondary} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={moderateScale(28)} color={Theme.colors.accent} />
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
            <Ionicons name="calendar-outline" size={moderateScale(64)} color={Theme.colors.accent} />
            <Text style={styles.emptyText}>No tasks available</Text>
            <Text style={styles.emptySubtext}>Complete your profile to get personalized tasks</Text>
          </View>
        )}
      </ScrollView>

      {showCelebration && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowCelebration(false)}
          />
          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown}
            style={styles.bottomSheet}
          >
            <View style={styles.sheetHeader}>
               <View style={styles.indicator} />
               <Text style={styles.celebrationTitle}>Great work!</Text>
               <TouchableOpacity onPress={() => setShowCelebration(false)}>
                 <Ionicons name="close-circle" size={moderateScale(24)} color={Theme.colors.white} />
               </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetContent}>
              {aiLoading && !celebrationText ? (
                <View style={{ padding: moderateScale(20), alignItems: 'center' }}>
                  <LoadingLogo size={moderateScale(50)} />
                </View>
              ) : (
                <Text style={styles.celebrationText}>{celebrationText}</Text>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      <NeevModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        onConfirm={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  scrollView: { flex: 1, paddingHorizontal: scale(24), paddingTop: verticalScale(10) },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.white,
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(12),
    gap: scale(16),
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    ...Theme.shadows.soft
  },
  taskCardCompleted: { backgroundColor: Theme.colors.softGreen, borderColor: Theme.colors.secondary },
  checkbox: { justifyContent: 'center' },
  taskContent: { flex: 1, gap: verticalScale(4) },
  taskTitle: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: Theme.colors.textLight },
  taskFrequency: { fontSize: moderateScale(14), color: Theme.colors.textLight },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(64), gap: verticalScale(16) },
  emptyText: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary },
  emptySubtext: { fontSize: moderateScale(14), color: Theme.colors.textLight, textAlign: 'center', paddingHorizontal: scale(32) },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 1000 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  bottomSheet: { backgroundColor: Theme.colors.primary, borderTopLeftRadius: moderateScale(30), borderTopRightRadius: moderateScale(30), paddingBottom: verticalScale(40), maxHeight: SCREEN_HEIGHT * 0.5, borderWidth: 1.5, borderColor: Theme.colors.primary },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(24), paddingVertical: verticalScale(20) },
  indicator: { width: scale(40), height: verticalScale(4), backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: moderateScale(2), position: 'absolute', top: verticalScale(10), left: '50%', marginLeft: -scale(20) },
  celebrationTitle: { fontSize: moderateScale(22), fontWeight: '700', color: Theme.colors.white },
  sheetContent: { paddingHorizontal: scale(24), maxHeight: verticalScale(300) },
  celebrationText: { fontSize: moderateScale(16), color: Theme.colors.white, lineHeight: moderateScale(24), paddingBottom: verticalScale(20) },
});
