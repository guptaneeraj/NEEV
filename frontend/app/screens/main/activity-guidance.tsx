import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, {
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { fetchActivities, fetchRecentHistory, saveActivityToHistory } from '../../../services/DirectusApiClient';
import { generateDailyPlan } from '../../../utils/planGenerator';
import { Activity } from '../../../types/activities';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../../utils/responsive';

const PLAY_ICONS = [
  'book-outline', 'cube-outline', 'star-outline', 'brush-outline',
  'musical-notes-outline', 'extension-puzzle-outline', 'heart-outline', 'planet-outline'
];

const FallingIcon = React.memo(({ delay, startX, targetX, icon }: any) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 18000 + Math.random() * 5000, easing: Easing.linear }), -1, false)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const ty = interpolate(progress.value, [0, 1], [-100, SCREEN_HEIGHT + 100]);
    const tx = interpolate(progress.value, [0, 1], [startX, targetX]);
    const swing = Math.sin(progress.value * 10) * 30; // Added premium swing
    const rotate = interpolate(progress.value, [0, 1], [0, 360]);
    const opacity = interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 0.2, 0.2, 0]);

    return {
      position: 'absolute',
      transform: [
        { translateY: ty },
        { translateX: tx + swing },
        { rotate: `${rotate}deg` }
      ],
      opacity
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={icon} size={scale(18)} color={Theme.colors.primary} />
    </Animated.View>
  );
});

const NurtureBackground = () => {
  const icons = useMemo(() => [...Array(40)].map((_, i) => (
    <FallingIcon
      key={i}
      delay={i * 400}
      startX={SCREEN_WIDTH * Math.random()}
      targetX={SCREEN_WIDTH * Math.random()}
      icon={PLAY_ICONS[i % PLAY_ICONS.length]}
    />
  )), []);
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{icons}</View>;
};

export default function ActivityGuidance() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const [dailyActivities, setDailyActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const selectedDuration = route.params?.duration || 20;

  const getAgeGroup = (dob: string): string => {
    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(dob).getTime()) /
      (1000 * 60 * 60 * 24 * 30.44)
    );
    if (ageInMonths <= 12) return 'Infant';
    if (ageInMonths <= 36) return 'Toddler';
    return 'Early Preschooler';
  };

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setIsLoading(true);
        if (!user || !user.id || !user.children?.[0]?.dob) return;

        const child = user.children[0];
        const ageGroup = getAgeGroup(child.dob);

        const [activities, history] = await Promise.all([
          fetchActivities(ageGroup),
          fetchRecentHistory(user.id.toString())
        ]);

        // 1. Separate history into "Today" and "Before Today"
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const historyBeforeToday = history.filter(
          h => new Date(h.completed_at) < startOfToday
        );
        const historyToday = history.filter(h => new Date(h.completed_at) >= startOfToday);
        const historyTodayIds = historyToday.map(h => h.activity_id);

        const recentIds = historyBeforeToday.map((h) => h.activity_id);

        // 2. Map history to domains for diversity check (using history before today)
        const recentDomains = historyBeforeToday
          .map((h) => {
             const act = activities.find(a => a.id === h.activity_id);
             return act?.domain;
          })
          .filter((d): d is string => !!d)
          .slice(0, 10);

        // 3. Generate the plan based on "Past" history
        const plan = generateDailyPlan(
          activities,
          ageGroup,
          selectedDuration,
          recentIds,
          recentDomains
        );

        // 4. Mark activities as completed if they are in today's history
        setDailyActivities(plan.map((a) => {
          const historyItem = historyToday.find(h => String(h.activity_id) === String(a.id));
          return {
            ...a,
            completed: !!historyItem,
            historyId: historyItem?.id
          };
        }));
      } catch (error) {
        console.error('Failed to load daily plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, [user, selectedDuration]);

  const tasks = dailyActivities;
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? completedCount / tasks.length : 0;

  const handleToggleTask = async (activityId: string) => {
    const taskIndex = dailyActivities.findIndex(t => t.id === activityId);
    if (taskIndex === -1) return;

    const task = dailyActivities[taskIndex];
    const isNowCompleted = !task.completed;

    const newActivities = [...dailyActivities];
    newActivities[taskIndex] = { ...task, completed: isNowCompleted };
    setDailyActivities(newActivities);

    if (isNowCompleted && user?.id) {
      try {
        const result = await saveActivityToHistory(user.id.toString(), activityId, 'Nurture Hub');
        if (result && result.id) {
          newActivities[taskIndex] = { ...newActivities[taskIndex], historyId: result.id };
          setDailyActivities([...newActivities]);
        }
      } catch (error) {
        console.error('Failed to save activity history:', error);
      }
    } else if (!isNowCompleted && user?.id && task.historyId) {
      try {
        const { deleteActivityFromHistory } = require('../../../services/DirectusApiClient');
        await deleteActivityFromHistory(task.historyId, user.id.toString());
        newActivities[taskIndex] = { ...newActivities[taskIndex], historyId: null };
        setDailyActivities([...newActivities]);
      } catch (error) {
        console.error('Failed to delete activity history:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NurtureBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nurture Path</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ActivityHistory')} style={styles.premiumHistoryBtn}>
          <Ionicons name="journal" size={moderateScale(18)} color={Theme.colors.primary} />
          <Text style={styles.historyBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.personalizedHero}>
           <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroTitle}>{user?.children?.[0]?.name || 'Baby'}'s Growth</Text>
                <Text style={styles.heroSubtitle}>Your daily bond, beautifully tracked.</Text>
              </View>
              <View style={styles.progressCircle}>
                 <Text style={styles.progressCircleText}>{Math.round(progress * 100)}%</Text>
              </View>
           </View>
           <View style={styles.modernProgressTrack}>
              <View style={[styles.modernProgressFill, { width: `${progress * 100}%` }]} />
           </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today's Activities</Text>
            <Text style={styles.weekTag}>{selectedDuration} Minute Plan • Personalized</Text>
          </View>
          <View style={styles.elegantDoneBadge}>
             <Text style={styles.doneCount}>{completedCount}/{tasks.length}</Text>
             <Text style={styles.doneLabel}>DONE</Text>
          </View>
        </View>

        {isLoading && tasks.length === 0 ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your path...</Text>
          </View>
        ) : (
          tasks.map((task: any, index: number) => {
            const isCompleted = task.completed;
            const taskName = task.activity || task.name || task.title;
            const isExpanded = expandedTask === taskName;

            return (
              <Animated.View
                key={task.id || index}
                layout={Layout.springify()}
                style={[
                  styles.taskCard,
                  isCompleted && styles.taskCardCompleted,
                  isExpanded && styles.taskCardExpanded
                ]}
              >
                <TouchableOpacity
                  style={styles.taskHeader}
                  onPress={() => setExpandedTask(isExpanded ? null : taskName)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    style={styles.taskCheckbox}
                    onPress={() => handleToggleTask(task.id)}
                  >
                    <Ionicons
                      name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
                      size={scale(26)}
                      color={isCompleted ? Theme.colors.softGreenBorder : Theme.colors.softAmberBorder}
                    />
                  </TouchableOpacity>

                    <View style={styles.taskMainInfo}>
                      {task.domain && <Text style={styles.domainTag}>{task.domain}</Text>}
                      <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                        {task.activity || task.name || task.title}
                      </Text>
                    </View>

                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={scale(20)}
                    color={Theme.colors.primary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <Animated.View entering={FadeInDown.duration(300)} style={styles.taskDetails}>
                    <View style={styles.detailRow}>
                      <View style={{ flex: 1 }}>
                        {task.description ? (
                          task.description.split(/Step-\d:?\s*/).filter(Boolean).length > 1 ? (
                            task.description.split(/(?=Step-\d)/).map((step: string, i: number) => (
                              <View key={i} style={styles.stepContainer}>
                                <Text style={styles.stepText}>{step.trim()}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.detailText}>{task.description}</Text>
                          )
                        ) : (
                          <Text style={styles.detailText}>No description available.</Text>
                        )}
                      </View>
                    </View>

                    {task.tools && (
                      <View style={styles.toolsContainer}>
                        <Text style={styles.toolsLabel}>Tools / Toys needed:</Text>
                        <View style={styles.toolBadge}>
                          <Ionicons name="extension-puzzle-outline" size={scale(14)} color={Theme.colors.primary} />
                          <Text style={styles.toolText}>{task.tools}</Text>
                        </View>

                        {task.energy_level && (
                          <View style={[styles.toolBadge, { marginTop: scale(8), backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="flash-outline" size={scale(14)} color="#00796B" />
                            <Text style={[styles.toolText, { color: '#00796B' }]}>{task.energy_level}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.timeInfo}>
                      <Ionicons name="time-outline" size={scale(16)} color={Theme.colors.textLight} />
                      <Text style={styles.timeText}>
                        Duration: {task.duration_mins || 5} mins
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.miniCompleteBtn, isCompleted && styles.miniCompleteBtnActive]}
                      onPress={() => handleToggleTask(task.id)}
                    >
                      <Text style={[styles.miniCompleteBtnText, isCompleted && styles.miniCompleteBtnTextActive]}>
                        {isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
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
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
    flex: 1,
    textAlign: 'center',
    marginRight: scale(10)
  },
  premiumHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: scale(6)
  },
  historyBtnText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: Theme.colors.primary,
    textTransform: 'uppercase'
  },
  content: { padding: scale(20) },

  personalizedHero: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(15),
    marginBottom: verticalScale(15),
    borderWidth: 2,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10)
  },
  heroTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  heroSubtitle: {
    fontSize: moderateScale(12),
    color: Theme.colors.textLight,
    fontWeight: '600',
    marginTop: verticalScale(1)
  },
  progressCircle: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressCircleText: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: Theme.colors.primary
  },
  modernProgressTrack: {
    height: verticalScale(8),
    backgroundColor: '#F8F8F8',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  modernProgressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: moderateScale(6),
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(5)
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  weekTag: {
    fontSize: moderateScale(12),
    color: Theme.colors.textLight,
    fontWeight: '700',
    marginTop: verticalScale(2)
  },
  elegantDoneBadge: {
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: '#FDE68A',
    minWidth: scale(70),
    ...Theme.shadows.soft
  },
  doneCount: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: Theme.colors.primary
  },
  doneLabel: {
    fontSize: moderateScale(8),
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
    marginTop: -2
  },

  // Task Card
  taskCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(24),
    marginBottom: verticalScale(16),
    borderWidth: 1.5,
    borderColor: '#FDE68A50',
    ...Theme.shadows.soft,
    overflow: 'hidden'
  },
  taskCardCompleted: {
    backgroundColor: '#FFFEF9',
    borderColor: '#FDE68A',
  },
  taskCardExpanded: {
    borderColor: '#FDE68A',
    borderWidth: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(20),
  },
  taskCheckbox: { marginRight: scale(15) },
  taskMainInfo: { flex: 1 },
  taskTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  taskTitleCompleted: {
    color: Theme.colors.textLight,
    textDecorationLine: 'line-through'
  },
  domainTag: {
    fontSize: moderateScale(11),
    color: Theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: verticalScale(4),
    opacity: 0.7
  },

  taskDetails: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: scale(15)
  },
  detailRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: verticalScale(15)
  },
  detailText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: Theme.colors.primary,
    lineHeight: moderateScale(20),
  },
  stepContainer: {
    marginBottom: verticalScale(10),
    backgroundColor: '#FDF7E2',
    padding: scale(10),
    borderRadius: scale(12),
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.softAmberBorder,
  },
  stepText: {
    fontSize: moderateScale(14),
    color: Theme.colors.primary,
    lineHeight: moderateScale(20),
    fontWeight: '500',
  },
  toolsContainer: {
    marginBottom: verticalScale(15)
  },
  toolsLabel: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: Theme.colors.textLight,
    marginBottom: verticalScale(6)
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.softAmber,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    alignSelf: 'flex-start',
    gap: scale(6)
  },
  toolText: {
    fontSize: moderateScale(13),
    color: Theme.colors.primary,
    fontWeight: '600'
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(20)
  },
  timeText: {
    fontSize: moderateScale(12),
    color: Theme.colors.textLight,
    fontWeight: '600'
  },
  miniCompleteBtn: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    borderRadius: scale(15),
    paddingVertical: verticalScale(10),
    alignItems: 'center'
  },
  miniCompleteBtnActive: {
    backgroundColor: Theme.colors.softGreen,
    borderColor: Theme.colors.softGreenBorder
  },
  miniCompleteBtnText: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: Theme.colors.primary
  },
  miniCompleteBtnTextActive: {
    color: Theme.colors.primary
  },

  loadingArea: { alignItems: 'center', paddingVertical: verticalScale(50) },
  loadingText: {
    marginTop: verticalScale(12),
    color: Theme.colors.textLight,
    fontSize: moderateScale(14)
  },
  doneButton: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.borderRadius.xl,
    paddingVertical: verticalScale(18),
    alignItems: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(30),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
  },
  doneButtonText: {
    color: Theme.colors.primary,
    fontSize: moderateScale(16),
    fontWeight: '800'
  }
});