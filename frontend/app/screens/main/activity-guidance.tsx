import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAIStore } from '../../../store/useAIStore';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressLabelRow}>
      <Text style={styles.progressLabel}>Daily Completion</Text>
      <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
    </View>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
    </View>
  </View>
);

export default function ActivityGuidance() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { guidanceData, isLoading, fetchNurturePath, toggleTaskCompletion } = useAIStore();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchNurturePath(user.id.toString());
    }
  }, [user?.id]);

  const tasks = guidanceData?.daily_tasks || [];
  const completedCount = guidanceData?.completed_count || 0;
  const progress = tasks.length > 0 ? completedCount / tasks.length : 0;
  const currentWeek = guidanceData?.week || 1;

  const handleToggleTask = async (taskTitle: string) => {
    if (user?.id) {
      await toggleTaskCompletion(user.id.toString(), taskTitle, currentWeek);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nurture Path</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProgressBar progress={progress} />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today's Activities</Text>
            <Text style={styles.weekTag}>Week {currentWeek} • {guidanceData?.mode || 'Personalized'}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{completedCount}/{tasks.length} Done</Text>
        </View>

        {isLoading && tasks.length === 0 ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your path...</Text>
          </View>
        ) : (
          tasks.map((task: any, index: number) => {
            const isCompleted = task.completed;
            const isExpanded = expandedTask === task.title;

            return (
              <Animated.View
                key={index}
                layout={Layout.springify()}
                style={[
                  styles.taskCard,
                  isCompleted && styles.taskCardCompleted,
                  isExpanded && styles.taskCardExpanded
                ]}
              >
                <TouchableOpacity
                  style={styles.taskHeader}
                  onPress={() => setExpandedTask(isExpanded ? null : task.title)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    style={styles.taskCheckbox}
                    onPress={() => handleToggleTask(task.title)}
                  >
                    <Ionicons
                      name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
                      size={scale(26)}
                      color={isCompleted ? Theme.colors.softGreenBorder : Theme.colors.softAmberBorder}
                    />
                  </TouchableOpacity>

                  <View style={styles.taskMainInfo}>
                    <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    {task.domain && <Text style={styles.domainTag}>{task.domain}</Text>}
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
                      <Ionicons name="information-circle-outline" size={scale(18)} color={Theme.colors.primary} />
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
                      </View>
                    )}

                    <View style={styles.timeInfo}>
                      <Ionicons name="time-outline" size={scale(16)} color={Theme.colors.textLight} />
                      <Text style={styles.timeText}>
                        Recommended: {task.session_min || 10}-{task.session_max || 20} mins
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.miniCompleteBtn, isCompleted && styles.miniCompleteBtnActive]}
                      onPress={() => handleToggleTask(task.title)}
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

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.doneButtonText}>Complete for Today</Text>
        </TouchableOpacity>
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
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
    flex: 1,
    textAlign: 'center',
    marginRight: scale(10)
  },
  content: { padding: scale(20) },

  progressContainer: { marginBottom: verticalScale(30) },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: verticalScale(8),
  },
  progressLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: Theme.colors.textLight,
  },
  progressValue: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  progressTrack: {
    height: verticalScale(8),
    backgroundColor: Theme.colors.softAmber,
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: moderateScale(4),
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  weekTag: {
    fontSize: moderateScale(13),
    color: Theme.colors.textLight,
    fontWeight: '600',
    marginTop: verticalScale(2)
  },
  sectionSubtitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.softGreen,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(10),
    overflow: 'hidden'
  },

  // Task Card
  taskCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(24),
    marginBottom: verticalScale(16),
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Theme.shadows.soft,
    overflow: 'hidden'
  },
  taskCardCompleted: {
    backgroundColor: '#F8FAF8',
    borderColor: Theme.colors.softGreenBorder,
  },
  taskCardExpanded: {
    borderColor: Theme.colors.softAmberBorder,
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