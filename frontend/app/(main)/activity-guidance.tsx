import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAIStore } from '../../store/useAIStore';
import { useAuth } from '../contexts/AuthContext';
import { Theme } from '../../constants/Theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ActivityGuidance() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { activity, childProfile } = route.params || {};
  const { processChat, isLoading } = useAIStore();
  const [explanation, setExplanation] = useState<string>('');

  const parsedActivity = typeof activity === 'string' ? JSON.parse(activity) : activity;
  const parsedProfile = typeof childProfile === 'string' ? JSON.parse(childProfile) : childProfile;

  useEffect(() => {
    const fetchExplanation = async () => {
      if (parsedActivity?.title && user?.id) {
        setExplanation('');
        const prompt = `You are NEEV, an AI Parenting Assistant.
The user is asking about the task: '${parsedActivity.title}'.
Based on the child's profile, provide:
1. The developmental benefits of this activity.
2. A step-by-step guide on how to do it.
3. Safety tips or variations.

Tone: Calm, spiritual, and encouraging.
STRICT RULES:
- No medical advice.
- Do not suggest external software or screens.
- Focus only on the parenting activity and bonding.`;

        await processChat(
          user.id.toString(),
          prompt,
          parsedProfile || {},
          (token) => {
            setExplanation((prev) => prev + token);
          }
        );
      }
    };
    fetchExplanation();
  }, [parsedActivity?.title, user?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Guidance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.activityCard}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{parsedActivity?.type || 'Activity'}</Text>
          </View>
          <Text style={styles.title}>{parsedActivity?.title}</Text>
          <Text style={styles.description}>{parsedActivity?.reason || parsedActivity?.description}</Text>
        </View>

        <View style={styles.guidanceSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>NEEV's Guide</Text>
          </View>

          {isLoading && explanation === '' ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Generating personalized instructions...</Text>
            </View>
          ) : (
            explanation !== '' && (
              <Animated.View entering={FadeInDown} style={styles.explanationCard}>
                <Text style={styles.explanationText}>{explanation}</Text>
              </Animated.View>
            )
          )}
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>I've Completed This</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Theme.colors.accent },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.primary },
  content: { padding: 24 },
  activityCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 24, marginBottom: 24, ...Theme.shadows.soft },
  typeBadge: { backgroundColor: Theme.colors.secondary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  typeText: { fontSize: 12, fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.primary, marginBottom: 8 },
  description: { fontSize: 16, color: Theme.colors.textLight, lineHeight: 24 },
  guidanceSection: { marginTop: 10, marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.primary },
  explanationCard: { backgroundColor: Theme.colors.accent, borderRadius: 20, padding: 20 },
  explanationText: { fontSize: 15, color: Theme.colors.primary, lineHeight: 24 },
  loadingArea: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: Theme.colors.textLight, fontSize: 14 },
  doneButton: { backgroundColor: Theme.colors.primary, borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  doneButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
