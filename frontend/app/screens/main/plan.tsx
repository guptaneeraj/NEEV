import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../../constants/Theme';
import { useAIStore } from '../../../store/useAIStore';
import { useAuth } from '../../contexts/AuthContext';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from '../../../utils/responsive';
import Animated, { FadeInRight } from 'react-native-reanimated';

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
          <Ionicons name={getIcon()} size={moderateScale(28)} color={Theme.colors.primary} />
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
        <Ionicons name="chevron-forward" size={moderateScale(16)} color={Theme.colors.primary} />
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Weekly Journey</Text>
          <Text style={styles.headerSubtitle}>Week 12 • Sensory Discovery</Text>
        </View>
        <View style={{ width: scale(40) }} />
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
          <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: verticalScale(40) }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    backgroundColor: Theme.colors.background,
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: scale(10)
  },
  headerTitle: { fontSize: moderateScale(22), fontWeight: '800', color: Theme.colors.primary },
  headerSubtitle: { fontSize: moderateScale(13), color: Theme.colors.textLight, marginTop: verticalScale(1), fontWeight: '600' },
  scrollContent: { padding: scale(24) },
  progressSection: { marginBottom: verticalScale(30) },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: verticalScale(12) },
  progressLabel: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary },
  progressValue: { fontSize: moderateScale(13), color: Theme.colors.primary, fontWeight: '600' },
  progressBarBg: { height: verticalScale(10), backgroundColor: Theme.colors.accent, borderRadius: moderateScale(6), overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Theme.colors.secondary, borderRadius: moderateScale(6) },
  sectionTitle: { fontSize: moderateScale(22), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(16) },
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(25),
    padding: moderateScale(18),
    marginBottom: verticalScale(18),
    ...Theme.shadows.soft,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent
  },
  recommendedBadge: {
    backgroundColor: Theme.colors.softGreen,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: Theme.colors.softGreenBorder
  },
  recommendedText: { fontSize: moderateScale(11), fontWeight: '800', color: Theme.colors.primary },
  cardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(16) },
  iconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(18),
    backgroundColor: Theme.colors.softSlate,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder
  },
  textContainer: { flex: 1 },
  activityTitle: { fontSize: moderateScale(18), fontWeight: '700', color: Theme.colors.primary },
  benefitText: { fontSize: moderateScale(13), color: Theme.colors.textLight, marginTop: verticalScale(4), lineHeight: moderateScale(18) },
  actionButton: {
    backgroundColor: Theme.colors.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(15),
    gap: scale(8),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary
  },
  actionButtonText: { color: Theme.colors.primary, fontSize: moderateScale(14), fontWeight: '700' },
  footerSpacer: { height: verticalScale(40) },
});
