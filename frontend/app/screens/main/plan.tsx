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
import { Theme } from '../../../constants/Theme';
import { useAIStore } from '../../../store/useAIStore';
import { useAuth } from '../../contexts/AuthContext';
import Animated, { FadeInRight } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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
      childProfile: { stage: user?.stage }
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
          <Ionicons name={getIcon()} size={height * 0.035} color={Theme.colors.primary} />
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
        <Ionicons name="chevron-forward" size={height * 0.02} color={Theme.colors.primary} />
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
          <Ionicons name="arrow-back" size={height * 0.03} color={Theme.colors.primary} />
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
          <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 40 }} />
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
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.02,
    backgroundColor: Theme.colors.background,
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: height * 0.03, fontWeight: '700', color: Theme.colors.primary },
  headerSubtitle: { fontSize: height * 0.018, color: Theme.colors.textLight, marginTop: 2 },
  scrollContent: { padding: width * 0.06 },
  progressSection: { marginBottom: height * 0.04 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  progressLabel: { fontSize: height * 0.022, fontWeight: '700', color: Theme.colors.primary },
  progressValue: { fontSize: height * 0.016, color: Theme.colors.primary, fontWeight: '600' },
  progressBarBg: { height: height * 0.012, backgroundColor: Theme.colors.accent, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Theme.colors.secondary, borderRadius: 6 },
  sectionTitle: { fontSize: height * 0.026, fontWeight: '700', color: Theme.colors.primary, marginBottom: height * 0.02 },
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: 25,
    padding: height * 0.022,
    marginBottom: height * 0.022,
    ...Theme.shadows.soft,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent
  },
  recommendedBadge: {
    backgroundColor: Theme.colors.softGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Theme.colors.softGreenBorder
  },
  recommendedText: { fontSize: height * 0.013, fontWeight: '800', color: Theme.colors.primary },
  cardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: {
    width: height * 0.07,
    height: height * 0.07,
    borderRadius: 18,
    backgroundColor: Theme.colors.softSlate,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder
  },
  textContainer: { flex: 1 },
  activityTitle: { fontSize: height * 0.022, fontWeight: '700', color: Theme.colors.primary },
  benefitText: { fontSize: height * 0.016, color: Theme.colors.textLight, marginTop: 4, lineHeight: height * 0.022 },
  actionButton: {
    backgroundColor: Theme.colors.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.016,
    borderRadius: 15,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary
  },
  actionButtonText: { color: Theme.colors.primary, fontSize: height * 0.018, fontWeight: '700' },
  footerSpacer: { height: height * 0.05 },
});
