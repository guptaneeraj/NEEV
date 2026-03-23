import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAIStore } from '../../store/useAIStore';
import LoadingLogo from '../../components/LoadingLogo';
import { Theme } from '../../constants/Theme';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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
      <Ionicons name="chevron-forward" size={20} color="#A8D5BA" />
    </AnimatedTouchableOpacity>
  );
};

export default function Dashboard() {
  const navigation = useNavigation<any>();
  const { user, token, fetchProfile } = useAuth();
  const { fetchGuidance, fetchChildren, guidanceData, isLoading: aiLoading, error: aiError } = useAIStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);

  const buildChildProfile = (prof: any, childList: any[]) => {
    const firstChild = childList?.[0] || null;
    return {
      full_name: prof?.full_name || null,
      relationship_type: prof?.relationship_type || null,
      stage: prof?.stage || 'parenting',
      child_name: firstChild?.name || null,
      child_dob: firstChild?.dob ? new Date(firstChild.dob).toISOString().split('T')[0] : null,
      child_sex: firstChild?.sex || null,
      diet_preference: firstChild?.diet_preference || null,
      current_week: prof?.pregnancy_info?.current_week || null,
      mood_logs: [],
      health_records: [],
      task_completions: [],
    };
  };

  const loadAll = async () => {
    if (!token || !user) return;
    try {
      setLoading(true);
      const profileRes = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const prof = profileRes.data;
      setProfile(prof);
      const childList = prof?.children || [];
      setChildren(childList);

      if (user?.id) {
        const userId = user.id.toString();
        await fetchChildren(userId);
        const childProfile = buildChildProfile(prof, childList);
        await fetchGuidance(userId, childProfile);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      loadAll();
    }
  }, [token, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile().then(() => loadAll());
  };

  const handleTaskTap = (task: any) => {
    const childProfile = buildChildProfile(profile, children);
    navigation.navigate('ActivityGuidance', {
      activity: task,
      childProfile: childProfile
    });
  };

  if (loading) return <View style={styles.loadingContainer}><LoadingLogo size={80} /></View>;

  const username = profile?.full_name || user?.email?.split('@')[0] || 'Parent';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A8D5BA" />}
      >
        {/* 1. Header: Hello Username */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {username}!</Text>
            <Text style={styles.email}>{profile?.email || user?.email}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle" size={50} color="#A8D5BA" />
          </TouchableOpacity>
        </View>

        {/* 2. Current Insight Section */}
        {guidanceData?.insight && (
          <Animated.View entering={FadeInUp.delay(0).duration(500).springify()} style={styles.insightBanner}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb-outline" size={18} color="#2D5F3F" />
              <Text style={styles.insightLabel}>Current Insight</Text>
            </View>
            <Text style={styles.insightText}>{guidanceData.insight}</Text>
          </Animated.View>
        )}

        {/* 3. Today's Focus Section */}
        {guidanceData?.recommendation && (
          <Animated.View entering={FadeInUp.delay(100).duration(500).springify()} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="star-outline" size={18} color="#EF6C00" />
              <Text style={styles.recommendationLabel}>Today's focus</Text>
            </View>
            <Text style={styles.recommendationText}>{guidanceData.recommendation}</Text>
          </Animated.View>
        )}

        {/* 4. Ask NEEV Logo Button */}
        <View style={styles.aiCard}>
          <TouchableOpacity
            style={styles.neevAccessBtn}
            onPress={() => {
              const childProfile = buildChildProfile(profile, children);
              navigation.navigate('AIChat', { childProfile: childProfile });
            }}
          >
            <Image
              source={require('../../assets/images/neuron_avatar.jpeg')}
              style={styles.neevLogo}
            />
            <Text style={styles.neevName}>Ask NEEV</Text>
            <Text style={styles.neevTagline}>AI Parenting Assistant</Text>
          </TouchableOpacity>
        </View>

        {/* 5. AI Daily Tasks Section */}
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

        {/* 6. Continue Weekly Journey */}
        <TouchableOpacity
          style={styles.journeyButton}
          onPress={() => navigation.navigate('Plan')}
        >
          <Text style={styles.journeyButtonText}>Continue Weekly Journey</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#2D5F3F' },
  email: { fontSize: 14, color: '#6B7F71', marginTop: 2 },
  insightBanner: { backgroundColor: '#F0F8F4', marginHorizontal: 24, marginBottom: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#A8D5BA' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  insightLabel: { fontSize: 12, fontWeight: '700', color: '#2D5F3F', textTransform: 'uppercase' },
  insightText: { fontSize: 15, color: '#2D5F3F', lineHeight: 22 },
  recommendationCard: { backgroundColor: '#FFF8F0', marginHorizontal: 24, marginBottom: 20, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#F5C98A' },
  recommendationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  recommendationLabel: { fontSize: 12, fontWeight: '700', color: '#EF6C00', textTransform: 'uppercase' },
  recommendationText: { fontSize: 15, color: '#5C3D00', lineHeight: 22 },
  aiCard: { marginHorizontal: 24, marginBottom: 30 },
  neevAccessBtn: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, alignItems: 'center', ...Theme.shadows.soft, borderWidth: 1, borderColor: '#E0E9E3' },
  neevLogo: { width: 80, height: 80, borderRadius: 40, marginBottom: 15 },
  neevName: { fontSize: 22, fontWeight: '700', color: '#2D5F3F' },
  neevTagline: { fontSize: 14, color: '#6B7F71', marginTop: 4 },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#2D5F3F' },
  aiPill: { backgroundColor: '#E0F2F1', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  aiPillText: { fontSize: 11, fontWeight: '700', color: '#2D5F3F' },
  aiTaskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E0E9E3', elevation: 1 },
  aiTaskContent: { flex: 1 },
  aiTaskTitle: { fontSize: 15, fontWeight: '600', color: '#2D5F3F' },
  aiTaskReason: { fontSize: 13, color: '#6B7F71', marginTop: 3 },
  journeyButton: { backgroundColor: '#2D5F3F', marginHorizontal: 24, borderRadius: 25, paddingVertical: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, ...Theme.shadows.soft },
  journeyButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  emptyDashboard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#2D5F3F', textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#6B7F71', textAlign: 'center', lineHeight: 24 },
  setupButton: { backgroundColor: '#A8D5BA', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, elevation: 2 },
  setupButtonText: { fontSize: 18, fontWeight: '600', color: '#2D5F3F' },
});
