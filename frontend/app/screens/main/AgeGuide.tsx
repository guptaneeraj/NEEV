import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAIStore } from '../../../store/useAIStore';
import axios from 'axios';
import { Theme } from '../../../constants/Theme';

const API_URL = 'https://api.neevios.com';

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
    try {
      const res = await axios.get(`${API_URL}/api/schedules/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(res.data.tasks || [
        { title: "Tummy Time Pro", description: "Advanced neck strength exercises" },
        { title: "Object Tracking", description: "Follow the bright ball" }
      ]);
    } catch (e) {}
  };

  const handleActivityPress = (act: any) => {
    // FIX: Navigate to ActivityGuidance instead of AIChat
    navigation.navigate('ActivityGuidance', {
      activity: {
        title: act.title,
        description: act.description,
        type: 'Extra Activity'
      },
      childProfile: { stage: user?.stage, child_name: child?.name }
    });
  };

  const handlePlanPress = (duration: number) => {
    // FIX: Open ActivityGuidance for the plan
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>For {child?.name || 'Baby'} at {ageMonths} months</Text>
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
            <View>
              <Text style={styles.actTitle}>{act.title}</Text>
              <Text style={styles.actDesc} numberOfLines={1}>{act.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.secondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.primary },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.primary, marginTop: 25, marginBottom: 15 },
  aiCard: { backgroundColor: Theme.colors.white, borderRadius: 20, padding: 20, ...Theme.shadows.soft, borderWidth: 1.5, borderColor: Theme.colors.accent },
  aiText: { fontSize: 16, color: Theme.colors.textLight, lineHeight: 24 },
  plansRow: { flexDirection: 'row', gap: 10 },
  planCard: { flex: 1, backgroundColor: Theme.colors.secondary, borderRadius: 15, padding: 15, alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  planTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary },
  planSubtitle: { fontSize: 12, color: Theme.colors.primary, opacity: 0.7 },
  activityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Theme.colors.white, borderRadius: 15, padding: 18, marginBottom: 10, ...Theme.shadows.soft, borderWidth: 1.5, borderColor: Theme.colors.accent },
  actTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary },
  actDesc: { fontSize: 14, color: Theme.colors.textLight, marginTop: 2, width: '90%' }
});
