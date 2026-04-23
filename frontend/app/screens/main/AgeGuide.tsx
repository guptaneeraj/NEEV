import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAIStore } from '../../../store/useAIStore';
import * as directusService from '../../../services/DirectusApiClient';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';

export default function AgeGuide() {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { processChat } = useAIStore();

  const [bestPractices, setBestPractices] = useState('');
  const [loadingAI, setLoadingAI] = useState(true);
  const [activities, setActivities] = useState([]);

  const child = user?.children?.[0];
  const ageMonths = child?.age_months || 0;

  useEffect(() => {
    fetchAIAdvice();
    fetchActivities();
  }, []);

  const fetchAIAdvice = async () => {
    const question = `What are the top 5 best practices for parenting a ${ageMonths} month old ${child?.sex || 'baby'}?`;
    const profile = { stage: user?.stage, child_name: child?.name };

    try {
      await processChat(user?.id.toString() || "", question, profile, (token) => {
        setBestPractices(prev => prev + token);
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const fetchActivities = async () => {
    if (!user?.id) return;
    try {
      const data = await directusService.fetchCurrentSchedule(user.id);
      setActivities(data || []);
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  const handleActivityPress = (act: any) => {
    // Navigate to ActivityGuidance instead of AIChat
    navigation.navigate('ActivityGuidance', {
      activity: {
        id: act.id,
        name: act.name,
        description: act.description,
        type: 'Extra Activity'
      },
      childProfile: { stage: user?.stage, child_name: child?.name }
    });
  };

  const handlePlanPress = (duration: number) => {
    // Open ActivityGuidance for the plan
    navigation.navigate('ActivityGuidance', {
      activity: {
        title: `${duration} Minute Daily Plan`,
        description: `Your personalized ${duration} minute development routine.`,
        type: 'Plan'
      },
      duration: duration
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPetal}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>For {child?.name || 'Baby'} at {ageMonths} months</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Best Practices</Text>
        <View style={styles.aiCard}>
          {loadingAI && !bestPractices ? (
            <ActivityIndicator color={Theme.colors.primary} />
          ) : (
            <Text style={styles.aiText}>{bestPractices}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        <View style={styles.plansRow}>
          {[20, 40, 60].map(duration => (
            <TouchableOpacity
              key={duration}
              style={styles.planCard}
              onPress={() => handlePlanPress(duration)}
            >
              <Text style={styles.planTitle}>{duration} Min</Text>
              <Text style={styles.planSubtitle}>Daily Plan</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Extra Activities</Text>
        {activities.map((act: any, i) => (
          <TouchableOpacity
            key={i}
            style={styles.activityCard}
            onPress={() => handleActivityPress(act)}
          >
            <View style={{flex: 1}}>
              <Text style={styles.actTitle}>{act.name}</Text>
              <Text style={styles.actDesc} numberOfLines={1}>{act.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={moderateScale(20)} color={Theme.colors.secondary} />
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: Theme.colors.primary,
    flex: 1,
    textAlign: 'center',
    marginRight: scale(10)
  },
  content: { paddingHorizontal: scale(20), paddingBottom: verticalScale(40) },
  sectionTitle: { fontSize: moderateScale(20), fontWeight: '700', color: Theme.colors.primary, marginTop: verticalScale(25), marginBottom: verticalScale(15) },
  aiCard: { backgroundColor: Theme.colors.white, borderRadius: moderateScale(20), padding: moderateScale(20), ...Theme.shadows.soft, borderWidth: 1.5, borderColor: Theme.colors.accent },
  aiText: { fontSize: moderateScale(16), color: Theme.colors.textLight, lineHeight: moderateScale(24) },
  plansRow: { flexDirection: 'row', gap: scale(10) },
  planCard: { flex: 1, backgroundColor: Theme.colors.secondary, borderRadius: moderateScale(15), padding: moderateScale(15), alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  planTitle: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary },
  planSubtitle: { fontSize: moderateScale(12), color: Theme.colors.primary, opacity: 0.7 },
  activityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Theme.colors.white, borderRadius: moderateScale(15), padding: moderateScale(18), marginBottom: verticalScale(10), ...Theme.shadows.soft, borderWidth: 1.5, borderColor: Theme.colors.accent },
  actTitle: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary },
  actDesc: { fontSize: moderateScale(14), color: Theme.colors.textLight, marginTop: verticalScale(2) }
});
