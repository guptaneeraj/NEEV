import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { ProfileBackground } from './Profile';
import AppEmoji from '../../../components/AppEmoji';

const ROLE_EMOJIS: { [key: string]: string } = {
  'Mother': '👩', 'Father': '👨', 'Grandmother': '👵', 'Grandfather': '👴',
  'Guardian': '🛡️', 'Caregiver': '🤗', 'Aunt': '👩‍🦰', 'Uncle': '👨‍🦰',
  'Foster Parent': '🏠', 'Adoptive Parent': '💝', 'Stepmother': '👩‍🦱', 'Stepfather': '👨‍🦱',
};

export default function PersonalInfo() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const sections = [
    {
      label: 'IDENTITY',
      items: [
        { label: 'Full Name', value: user?.full_name || 'Not set', icon: 'person', emoji: '📛', color: '#A8D5BA' },
        { label: 'Email Address', value: user?.email || 'Not set', icon: 'mail', emoji: '📧', color: '#94A3B8' },
      ]
    },
    {
      label: 'JOURNEY ROLE',
      items: [
        { label: 'Your Role', value: user?.relationship_type || 'Parent', icon: 'people', emoji: ROLE_EMOJIS[user?.relationship_type || ''] || '👤', color: '#FDE68A' },
        { label: 'Preferred Stage', value: user?.stage === 'pregnancy' ? 'Pregnancy' : 'Parenting', icon: 'leaf', emoji: user?.stage === 'pregnancy' ? '🤰' : '🏡', color: '#2D5F3F' },
        { label: 'Activity Reminder', value: user?.preferred_activity_time || 'Not set', icon: 'time', emoji: '⏰', color: '#E07A5F' },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProfileBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={scale(28)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
          <Ionicons name="create-outline" size={scale(20)} color={Theme.colors.white} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify()} style={styles.heroSection}>
          <View style={styles.heroPetal}>
            <AppEmoji style={styles.heroEmoji}>{ROLE_EMOJIS[user?.relationship_type || ''] || '👤'}</AppEmoji>
          </View>
          <Text style={styles.heroName}>{user?.full_name}</Text>
          <View style={styles.heroSubRow}>
            <Text style={styles.heroSubText}>
              {user?.stage === 'pregnancy' ? 'On the way ' : 'Nurturing now '}
            </Text>
            <AppEmoji style={styles.heroSubEmoji}>
              {user?.stage === 'pregnancy' ? '👶' : '🏡'}
            </AppEmoji>
          </View>
        </Animated.View>

        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <View style={styles.card}>
              {section.items.map((item, iIdx) => (
                <Animated.View
                  key={iIdx}
                  entering={FadeInRight.delay(200 + (sIdx * 2 + iIdx) * 100).springify()}
                  style={[styles.infoItem, iIdx !== section.items.length - 1 && styles.divider]}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={scale(18)} color={item.color} />
                  </View>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <View style={styles.itemValueRow}>
                      <AppEmoji style={styles.itemEmoji}>{item.emoji}</AppEmoji>
                      <Text style={styles.itemValue}>{item.value}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(15), height: verticalScale(60) },
  iconBtn: { width: scale(44), height: scale(44), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: moderateScale(20), fontWeight: '900', color: Theme.colors.primary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(6), backgroundColor: Theme.colors.primary, paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: moderateScale(12) },
  editBtnText: { color: Theme.colors.white, fontWeight: '800', fontSize: moderateScale(13) },
  scrollContent: { paddingHorizontal: scale(20), paddingTop: verticalScale(10), paddingBottom: verticalScale(40) },
  heroSection: { alignItems: 'center', marginBottom: verticalScale(30) },
  heroPetal: { width: scale(90), height: scale(90), backgroundColor: '#FEF3C7', borderTopLeftRadius: moderateScale(35), borderBottomRightRadius: moderateScale(35), borderTopRightRadius: moderateScale(12), borderBottomLeftRadius: moderateScale(12), justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FDE68A', marginBottom: verticalScale(15) },
  heroEmoji: { fontSize: moderateScale(42) },
  heroName: { fontSize: moderateScale(24), fontWeight: '900', color: Theme.colors.primary },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(4) },
  heroSubText: { fontSize: moderateScale(14), color: Theme.colors.textLight, fontStyle: 'italic' },
  heroSubEmoji: { fontSize: moderateScale(16) },
  section: { marginBottom: verticalScale(25) },
  sectionLabel: { fontSize: moderateScale(12), fontWeight: '900', color: Theme.colors.textLight, letterSpacing: 1.5, marginBottom: verticalScale(12), marginLeft: scale(10) },
  card: { backgroundColor: Theme.colors.white, borderRadius: moderateScale(30), padding: moderateScale(10), borderWidth: 1.5, borderColor: '#FDE68A', ...Theme.shadows.soft },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(15), paddingHorizontal: scale(12) },
  divider: { borderBottomWidth: 1, borderBottomColor: '#FDE68A', borderStyle: 'dashed' },
  iconBox: { width: scale(40), height: scale(40), borderRadius: moderateScale(12), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  itemMeta: { flex: 1 },
  itemLabel: { fontSize: moderateScale(11), fontWeight: '800', color: Theme.colors.textLight, letterSpacing: 1, marginBottom: 2 },
  itemValueRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  itemEmoji: { fontSize: moderateScale(18) },
  itemValue: { fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary },
});
