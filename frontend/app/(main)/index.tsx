import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useAIStore } from '../../store/useAIStore';
import { Theme } from '../../constants/Theme';

const { width } = Dimensions.get('window');

export default function Home() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    children,
    selectedChildId,
    setSelectedChildId,
    fetchChildren,
    guidanceData,
    fetchGuidance,
    isLoading,
    processChat,
  } = useAIStore();

  useEffect(() => {
    if (user?.id) {
      fetchChildren(user.id.toString());
    }
  }, [user]);

  useEffect(() => {
    if (selectedChildId && user?.id) {
      const selectedChild = children.find(c => c.session_id === selectedChildId || c.id?.toString() === selectedChildId);

      const profile = {
        full_name: user.full_name,
        relationship_type: user.relationship_type,
        child_name: selectedChild?.child_name || selectedChild?.name,
        child_dob: selectedChild?.dob,
        child_sex: selectedChild?.sex,
        diet_preference: selectedChild?.diet_preference,
        stage: user.stage
      };

      fetchGuidance(user.id.toString(), profile);
    }
  }, [selectedChildId, children]);

  // Handle mode: "onboarding" redirect
  useEffect(() => {
    if (guidanceData?.mode === 'onboarding') {
      navigation.navigate('AIChat', { startOnboarding: true });
    }
  }, [guidanceData]);

  const handleTaskClick = async (task: any) => {
    const selectedChild = children.find(c => c.session_id === selectedChildId || c.id?.toString() === selectedChildId);

    const profile = {
      full_name: user?.full_name,
      relationship_type: user?.relationship_type,
      child_name: selectedChild?.child_name || selectedChild?.name,
      child_dob: selectedChild?.dob,
      child_sex: selectedChild?.sex,
      diet_preference: selectedChild?.diet_preference,
      stage: user?.stage
    };

    // Part 1.4: Explain how to do the task
    navigation.navigate('AIChat', {
      initialQuestion: `Explain how to do: ${task.title}`,
      childProfile: profile
    });
  };

  const username = user?.full_name || user?.email?.split('@')[0] || 'Parent';
  const selectedChild = children.find(c => c.session_id === selectedChildId || c.id?.toString() === selectedChildId);

  const renderChildItem = ({ item }: { item: any }) => {
    const isSelected = selectedChildId === (item.session_id || item.id?.toString());
    return (
      <TouchableOpacity
        style={[styles.childItem, isSelected && styles.childItemActive]}
        onPress={() => setSelectedChildId(user!.id.toString(), item.session_id || item.id?.toString())}
      >
        <View style={[styles.childAvatar, isSelected && styles.childAvatarActive]}>
          <Text style={styles.childEmoji}>{item.sex?.toLowerCase() === 'male' || item.child_sex?.toLowerCase() === 'male' ? '👦' : '👧'}</Text>
        </View>
        <Text style={[styles.childName, isSelected && styles.childNameActive]} numberOfLines={1}>
          {item.child_name || item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Part 1.1: Horizontal Child Selector */}
      <View style={styles.topSelector}>
        <View style={styles.selectorHeader}>
           <FlatList
            horizontal
            data={children}
            renderItem={renderChildItem}
            keyExtractor={(item) => (item.session_id || item.id?.toString())}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childSliderContent}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addChildBtn}
                onPress={() => navigation.navigate('AIChat', { isNewChild: true })}
              >
                <View style={styles.addChildAvatar}>
                  <Ionicons name="add" size={24} color="#2D5F3F" />
                </View>
                <Text style={styles.addChildText}>Another Child</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Part 4: Alert Banner */}
        {guidanceData?.alert && (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle" size={20} color="#FFF" />
            <Text style={styles.alertText}>Important update regarding development milestones.</Text>
          </View>
        )}

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {username}</Text>
            {selectedChild && (
              <Text style={styles.subGreeting}>Guiding {selectedChild.child_name || selectedChild.name}'s journey</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={40} color="#2D5F3F" />
          </TouchableOpacity>
        </View>

        {/* AI Access Button (Neev Logo) */}
        <View style={styles.aiCard}>
          <TouchableOpacity
            style={styles.neevAccessBtn}
            onPress={() => {
              const profile = {
                full_name: user?.full_name,
                relationship_type: user?.relationship_type,
                child_name: selectedChild?.child_name || selectedChild?.name,
                child_dob: selectedChild?.dob,
                child_sex: selectedChild?.sex,
                diet_preference: selectedChild?.diet_preference,
                stage: user?.stage
              };
              navigation.navigate('AIChat', { childProfile: profile });
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

        {/* Part 1.3: Today's Focus (Daily Tasks) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Focus</Text>

          {isLoading && !guidanceData ? (
            <ActivityIndicator color="#2D5F3F" style={{ marginTop: 20 }} />
          ) : (
            guidanceData?.daily_tasks?.map((task: any, index: number) => (
              <View key={index} style={styles.taskCard}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDesc} numberOfLines={2}>{task.reason}</Text>
                </View>
                <TouchableOpacity style={styles.startButton} onPress={() => handleTaskClick(task)}>
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Part 2.2: AI Summary on Home (Quick Insight) */}
        {guidanceData && (
          <TouchableOpacity
            style={styles.statusCard}
            onPress={() => navigation.navigate('Insights')}
          >
            <View style={styles.statusContent}>
              <View style={styles.statusIndicator} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>{guidanceData.insight}</Text>
                <Text style={styles.statusSub} numberOfLines={1}>{guidanceData.recommendation}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.journeyButton}
          onPress={() => navigation.navigate('Plan')}
        >
          <Text style={styles.journeyButtonText}>Continue Weekly Journey</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  topSelector: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E9E3' },
  selectorHeader: { flexDirection: 'row', alignItems: 'center' },
  childSliderContent: { paddingHorizontal: 20, gap: 20 },
  childItem: { alignItems: 'center', width: 70 },
  childAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF9F0', justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: 'transparent' },
  childAvatarActive: { borderColor: '#2D5F3F', backgroundColor: '#A8D5BA' },
  childEmoji: { fontSize: 22 },
  childName: { fontSize: 11, fontWeight: '600', color: '#6B7F71' },
  childNameActive: { color: '#2D5F3F', fontWeight: '800' },
  addChildBtn: { alignItems: 'center', width: 80, marginLeft: 10 },
  addChildAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderStyle: 'dashed', borderWidth: 1, borderColor: '#B0BDB5' },
  addChildText: { fontSize: 11, fontWeight: '600', color: '#6B7F71', textAlign: 'center' },
  alertBanner: { backgroundColor: '#E07A5F', padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  alertText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#2D5F3F' },
  subGreeting: { fontSize: 14, color: '#6B7F71', marginTop: 2 },
  aiCard: { marginHorizontal: 24, marginBottom: 30 },
  neevAccessBtn: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, alignItems: 'center', ...Theme.shadows.soft },
  neevLogo: { width: 80, height: 80, borderRadius: 40, marginBottom: 15 },
  neevName: { fontSize: 22, fontWeight: '700', color: '#2D5F3F' },
  neevTagline: { fontSize: 14, color: '#6B7F71', marginTop: 4 },
  section: { paddingHorizontal: 24, marginBottom: 30 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#2D5F3F', marginBottom: 20 },
  taskCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15, ...Theme.shadows.soft },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 18, fontWeight: '700', color: '#2D5F3F' },
  taskDesc: { fontSize: 14, color: '#6B7F71', marginTop: 4 },
  startButton: { backgroundColor: '#A8D5BA', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  startButtonText: { color: '#2D5F3F', fontWeight: '700', fontSize: 15 },
  statusCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    ...Theme.shadows.soft,
  },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#A8D5BA' },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#2D5F3F' },
  statusSub: { fontSize: 13, color: '#6B7F71', marginTop: 2 },
  journeyButton: { backgroundColor: '#2D5F3F', marginHorizontal: 24, borderRadius: 25, paddingVertical: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, ...Theme.shadows.soft },
  journeyButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});
