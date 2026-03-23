import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../constants/Theme';
import { useAIStore } from '../../store/useAIStore';
import { useAuth } from '../contexts/AuthContext';
import Animated, { FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ActivityCard = ({ activity, index, navigation, user }: { activity: any; index: number; navigation: any; user: any }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'Play': return 'tennisball-outline';
      case 'Explore': return 'compass-outline';
      case 'Read': return 'book-outline';
      case 'View': return 'medkit-outline';
      default: return 'sparkles-outline';
    }
  };

  const getActionLabel = () => {
    return activity.type || 'Explore';
  };

  const handlePress = () => {
    navigation.navigate("ActivityGuidance", {
      activity: activity,
      childProfile: { stage: user?.stage } // Pass minimal profile if needed
    });
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(500)}
      style={styles.card}
    >
      {activity.isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>RECOMMENDED FOR TODAY</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon()} size={28} color="#2D5F3F" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.benefitText}>{activity.description}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handlePress}
      >
        <Text style={styles.actionButtonText}>{getActionLabel()} </Text>
        <Ionicons name="chevron-forward" size={16} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Plan() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { guidanceData, isLoading } = useAIStore();

  const activities = guidanceData?.daily_tasks?.length > 0 ? guidanceData.daily_tasks : [
    { title: "Mirror Play", description: "Develops self-recognition & social skills", type: "Play", isRecommended: true, completed: true },
    { title: "Texture Discovery", description: "Enhances tactile sensory processing", type: "Explore", isRecommended: true, completed: true },
    { title: "Bedtime Rhythms", description: "Improves language acquisition", type: "Read", completed: true },
    { title: "Outdoor Breeze", description: "Calms nervous system", type: "Explore", completed: false },
    { title: "Vitamin D Check", description: "Ensures bone health", type: "View", completed: false },
  ];

  const completedCount = activities.filter(a => a.completed).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D5F3F" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Weekly Journey</Text>
          <Text style={styles.headerSubtitle}>Week 12 • Sensory Discovery</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Your Progress</Text>
            <Text style={styles.progressValue}>{completedCount}/{activities.length} completed</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completedCount / activities.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>This Week's Journey</Text>

        {isLoading && guidanceData?.daily_tasks?.length === 0 ? (
          <ActivityIndicator color="#2D5F3F" style={{ marginTop: 40 }} />
        ) : (
          activities.map((activity, index) => (
            <ActivityCard key={index} activity={activity} index={index} navigation={navigation} user={user} />
          ))
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFF9F0',
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#2D5F3F' },
  headerSubtitle: { fontSize: 16, color: '#6B7F71', marginTop: 2 },
  scrollContent: { padding: 24 },
  progressSection: { marginBottom: 32 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  progressLabel: { fontSize: 18, fontWeight: '700', color: '#2D5F3F' },
  progressValue: { fontSize: 14, color: '#2D5F3F', fontWeight: '600' },
  progressBarBg: { height: 10, backgroundColor: '#E0E9E3', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#A8D5BA', borderRadius: 5 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#2D5F3F', marginBottom: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadows.soft,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  recommendedBadge: {
    backgroundColor: '#A8D5BA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15
  },
  recommendedText: { fontSize: 11, fontWeight: '800', color: '#2D5F3F' },
  cardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E0E9E3'
  },
  textContainer: { flex: 1 },
  activityTitle: { fontSize: 19, fontWeight: '700', color: '#2D5F3F' },
  benefitText: { fontSize: 14, color: '#6B7F71', marginTop: 4, lineHeight: 20 },
  actionButton: {
    backgroundColor: '#2D5F3F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 15,
    gap: 8
  },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footerSpacer: { height: 40 },
});
