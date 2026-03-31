import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAIStore } from '../../../store/useAIStore';
import LoadingLogo from '../../../components/LoadingLogo';
import { Theme } from '../../../constants/Theme';
import DailyCheckin from '../../../components/DailyCheckin';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const PREMIUM_CARD_WIDTH = (width - 48 - 24) / 3;

const API_URL = 'https://api.neevios.com';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const AITaskCard = ({ task, onPress }: { task: any, onPress: (task: any) => void }) => {
  const scale = useSharedValue(1);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97); };
  const handlePressOut = () => { scale.value = withSpring(1.0); };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(task)}
      style={[styles.aiTaskCard, animatedCardStyle]}
    >
      <View style={styles.aiTaskContent}>
        <Text style={styles.aiTaskTitle}>{task.title}</Text>
        <Text style={styles.aiTaskReason} numberOfLines={2}>
          {task.reason}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color={Theme.colors.primary} />
    </AnimatedTouchableOpacity>
  );
};

export default function Dashboard() {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { fetchChildren, streamGuidance, guidanceData, isLoading: aiLoading, children } = useAIStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(user);
  const isInitialMount = useRef(true);

  // Animation values for Ask NEEV Logo
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glow.value, [0, 1], [0.1, 0.4]);
    const scale = interpolate(glow.value, [0, 1], [1, 1.15]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const buildChildProfile = (prof: any) => {
    const firstChild = (prof?.children && prof.children.length > 0)
      ? prof.children[0]
      : (children && children.length > 0 ? children[0] : {});

    return {
      full_name: prof?.full_name || user?.full_name || 'Parent',
      relationship_type: prof?.relationship_type || 'parent',
      stage: prof?.stage || 'parenting',
      child_name: firstChild?.name || 'my baby',
      child_dob: firstChild?.dob ? new Date(firstChild.dob).toISOString().split('T')[0] : null,
      child_sex: firstChild?.sex || 'not specified',
      diet_preference: firstChild?.diet_preference || 'none',
      current_week: prof?.pregnancy_info?.current_week || null,
      mood_logs: [],
      health_records: [],
      task_completions: [],
    };
  };

  const loadAll = async (isRefresh = false) => {
    if (!token || !user) return;

    // Safety guard to prevent multiple simultaneous calls
    if (loading && !isRefresh) return;

    try {
      // 1. UI LOADS FIRST: Using user data from context immediately (setProfile(user) in initial state)

      // 2. FETCH CHILDREN AFTER:
      await fetchChildren(user.id.toString(), isRefresh);
      setProfile(user);

      // 3. STREAM GUIDANCE LAST: Delayed to prevent blocking main UI load
      setTimeout(() => {
        const childProfile = buildChildProfile(user);
        streamGuidance(user.id.toString(), childProfile, () => {});
      }, 1500);

    } catch (error) {
      console.error('Dashboard Data Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && user && isInitialMount.current) {
      loadAll();
      isInitialMount.current = false;
    }
  }, [token, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll(true);
  };

  const handleTaskTap = (task: any) => {
    // FIX: Navigate to ActivityGuidance instead of AIChat
    navigation.navigate('ActivityGuidance', {
      activity: {
        title: task.title,
        description: task.reason,
        type: 'AI Task'
      },
      childProfile: buildChildProfile(user)
    });
  };

  // NO BLOCKING LOADERS: UI renders with partial data (user from context) immediately
  const activeChild = profile?.children?.[0] || children?.[0];
  const username = profile?.full_name || user?.full_name || 'Parent';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.secondary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {username}!</Text>
            <Text style={styles.email}>{profile?.email || user?.email}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle" size={50} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.premiumCardsRow}>
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => navigation.navigate('Insights')}
          >
            <Ionicons name="sparkles-outline" size={16} color={Theme.colors.primary} />
            <Text style={styles.premiumCardLabel} numberOfLines={1}>Insights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => navigation.navigate('ActivityGuidance', {
              activity: {
                title: "Daily Focus",
                description: `Focus on today's development for ${activeChild?.name || 'your baby'}.`,
                type: 'Focus'
              },
              childProfile: buildChildProfile(user)
            })}
          >
            <Ionicons name="locate-outline" size={16} color={Theme.colors.primary} />
            <Text style={styles.premiumCardLabel} numberOfLines={1}>Focus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => navigation.navigate('AgeGuide')}
          >
            <Ionicons name="book-outline" size={16} color={Theme.colors.primary} />
            <Text style={styles.premiumCardLabel} numberOfLines={1}>Guide</Text>
          </TouchableOpacity>
        </View>

        <DailyCheckin />

        <View style={styles.aiContentContainer}>
          <Animated.View entering={FadeInUp.duration(500)} style={styles.insightBanner}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb-outline" size={18} color={Theme.colors.primary} />
              <Text style={styles.insightLabel}>Current Insight</Text>
              {aiLoading && !guidanceData?.insight && <ActivityIndicator size="small" color={Theme.colors.primary} style={{marginLeft: 10}} />}
            </View>
            {guidanceData?.insight ? (
              <Text style={styles.insightText}>{guidanceData.insight}</Text>
            ) : (
              <Text style={[styles.insightText, {color: Theme.colors.textLight}]}>
                {aiLoading ? 'Analyzing your journey...' : 'No insights available right now. Keep recording your daily check-ins!'}
              </Text>
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="star-outline" size={18} color={Theme.colors.primary} />
              <Text style={styles.recommendationLabel}>Today's focus</Text>
              {aiLoading && !guidanceData?.recommendation && <ActivityIndicator size="small" color={Theme.colors.primary} style={{marginLeft: 10}} />}
            </View>
            {guidanceData?.recommendation ? (
              <Text style={styles.recommendationText}>{guidanceData.recommendation}</Text>
            ) : (
              <Text style={[styles.recommendationText, {color: Theme.colors.textLight}]}>
                {aiLoading ? 'Preparing your daily focus...' : 'Ask NEEV what to focus on today with your baby.'}
              </Text>
            )}
          </Animated.View>
        </View>

        {guidanceData?.daily_tasks && guidanceData.daily_tasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Daily Tasks</Text>
              <View style={styles.aiPill}><Text style={styles.aiPillText}>✦ AI</Text></View>
            </View>
            {guidanceData.daily_tasks.map((task, index) => (
              <AITaskCard
                key={index}
                task={task}
                onPress={handleTaskTap}
              />
            ))}
          </View>
        )}

        <View style={styles.aiCard}>
          <TouchableOpacity
            style={styles.neevAccessBtn}
            onPress={() => navigation.navigate('AIChat', { childProfile: buildChildProfile(profile) })}
          >
            <View style={styles.logoWrapper}>
              <Animated.View style={[styles.glowRing, animatedGlowStyle]} />
              <Animated.View style={animatedLogoStyle}>
                <Image
                  source={require('../../../assets/images/neuron_avatar.jpeg')}
                  style={styles.neevLogo}
                />
              </Animated.View>
            </View>
            <Text style={styles.neevName}>Ask NEEV</Text>
            <Text style={styles.neevTagline}>AI Parenting Assistant</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.premiumActionButton}
            onPress={() => navigation.navigate('Plan')}
          >
            <Ionicons name="calendar-outline" size={20} color={Theme.colors.primary} />
            <Text style={styles.premiumActionButtonText}>Continue Weekly Journey</Text>
            <Ionicons name="arrow-forward" size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  greeting: { fontSize: 24, fontWeight: '700', color: Theme.colors.primary },
  email: { fontSize: 14, color: Theme.colors.textLight, marginTop: 2 },

  premiumCardsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
  premiumCard: {
    width: PREMIUM_CARD_WIDTH,
    height: 80,
    borderRadius: 24,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft
  },
  premiumCardLabel: { fontSize: 13, fontWeight: '700', color: Theme.colors.primary, marginTop: 8 },

  aiContentContainer: { minHeight: 20 },
  insightBanner: { backgroundColor: Theme.colors.softGreen, marginHorizontal: 24, marginBottom: 12, padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: Theme.colors.softGreenBorder },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  insightLabel: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { fontSize: 15, color: Theme.colors.primary, lineHeight: 22 },

  recommendationCard: { backgroundColor: Theme.colors.softGreen, marginHorizontal: 24, marginBottom: 20, padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: Theme.colors.softGreenBorder },
  recommendationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  recommendationLabel: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  recommendationText: { fontSize: 15, color: Theme.colors.primary, lineHeight: 22 },

  aiCard: { marginHorizontal: 24, marginBottom: 30 },
  neevAccessBtn: { backgroundColor: Theme.colors.white, borderRadius: 24, padding: 25, alignItems: 'center', ...Theme.shadows.soft, borderWidth: 1.5, borderColor: Theme.colors.softGreenBorder },
  logoWrapper: { width: 84, height: 84, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  glowRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: Theme.colors.secondary, zIndex: 0 },
  neevLogo: { width: 80, height: 80, borderRadius: 40, zIndex: 1 },
  neevName: { fontSize: 22, fontWeight: '700', color: Theme.colors.primary },
  neevTagline: { fontSize: 14, color: Theme.colors.textLight },

  buttonContainer: { alignItems: 'center', paddingHorizontal: 24 },
  premiumActionButton: {
    backgroundColor: Theme.colors.white,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    gap: 12,
    ...Theme.shadows.soft,
    width: '100%'
  },
  premiumActionButtonText: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary },

  section: { paddingHorizontal: 24, marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.primary },
  aiPill: { backgroundColor: Theme.colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  aiPillText: { color: Theme.colors.white, fontSize: 10, fontWeight: '800' },
  aiTaskCard: { backgroundColor: Theme.colors.softGreen, borderRadius: 24, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: Theme.colors.softGreenBorder, ...Theme.shadows.soft },
  aiTaskContent: { flex: 1, marginRight: 15 },
  aiTaskTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary, marginBottom: 4 },
  aiTaskReason: { fontSize: 13, color: Theme.colors.textLight, lineHeight: 18 },
});
