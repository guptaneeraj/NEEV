import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';

export default function Notifications() {
  const navigation = useNavigation<any>();

  // Mock states for settings - In a real app, these would be synced with a backend/local storage
  const [morningCheckin, setMorningCheckin] = useState(true);
  const [eveningCheckin, setEveningCheckin] = useState(true);
  const [activityReminder, setActivityReminder] = useState(true);
  const [weeklyInsights, setWeeklyInsights] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);

  const toggleSwitch = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(previousState => !previousState);
  };

  const notificationItems = [
    {
      title: 'Morning Check-in',
      description: 'Start your day with a quick update on sleep and mood.',
      state: morningCheckin,
      setter: setMorningCheckin,
      icon: 'sunny-outline'
    },
    {
      title: 'Evening Check-in',
      description: 'Reflect on feeds, tummy time, and milestones.',
      state: eveningCheckin,
      setter: setEveningCheckin,
      icon: 'moon-outline'
    },
    {
      title: 'Daily Activity Focus',
      description: 'Reminders for your child\'s personalized development tasks.',
      state: activityReminder,
      setter: setActivityReminder,
      icon: 'rocket-outline'
    },
    {
      title: 'Weekly Insights',
      description: 'A summary of your child\'s growth and patterns.',
      state: weeklyInsights,
      setter: setWeeklyInsights,
      icon: 'analytics-outline'
    },
    {
      title: 'AI Smart Suggestions',
      description: 'Personalized tips from NEEV based on your logs.',
      state: aiSuggestions,
      setter: setAiSuggestions,
      icon: 'sparkles-outline'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(24)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Stay connected with your child's journey. Choose how you'd like to be reminded.
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          {notificationItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                index !== notificationItems.length - 1 && styles.divider
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={scale(20)} color={Theme.colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDescription}>{item.description}</Text>
              </View>
              <Switch
                trackColor={{ false: '#E2E8F0', true: Theme.colors.secondary }}
                thumbColor={item.state ? Theme.colors.primary : '#f4f3f4'}
                ios_backgroundColor="#E2E8F0"
                onValueChange={() => toggleSwitch(item.setter)}
                value={item.state}
              />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Ionicons name="notifications-circle-outline" size={scale(40)} color={Theme.colors.primary} opacity={0.2} />
          <Text style={styles.footerNote}>
            Notifications are scheduled according to your preferred activity time in Personal Info.
          </Text>
        </View>
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
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(30),
  },
  infoSection: {
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(10),
  },
  infoText: {
    fontSize: moderateScale(15),
    color: Theme.colors.textLight,
    lineHeight: moderateScale(22),
    fontStyle: 'italic',
  },
  settingsContainer: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(32),
    padding: moderateScale(15),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  textContainer: {
    flex: 1,
    marginRight: scale(10),
  },
  settingTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
    marginBottom: verticalScale(2),
  },
  settingDescription: {
    fontSize: moderateScale(12),
    color: Theme.colors.textLight,
    lineHeight: moderateScale(16),
  },
  footer: {
    marginTop: verticalScale(30),
    alignItems: 'center',
    paddingHorizontal: scale(30),
  },
  footerNote: {
    fontSize: moderateScale(12),
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginTop: verticalScale(10),
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
