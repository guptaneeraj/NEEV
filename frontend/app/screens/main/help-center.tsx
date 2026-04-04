import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { ProfileBackground } from '../tabs/Profile';

export default function HelpCenter() {
  const navigation = useNavigation<any>();

  const faqItems = [
    { q: 'How does NEEV track growth?', a: 'NEEV uses developmental milestones and your daily check-ins to map patterns.', icon: 'analytics', color: '#A8D5BA' },
    { q: 'Is my data secure?', a: 'Yes, all family data is encrypted and never shared with third parties.', icon: 'shield-checkmark', color: '#2D5F3F' },
    { q: 'Can I add multiple children?', a: 'Absolutely. Go to Settings > Little Ones to add more children.', icon: 'people', color: '#FDE68A' },
    { q: 'How do I change my reminders?', a: 'You can adjust your check-in times in Settings > Parent Profile.', icon: 'time', color: '#E07A5F' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProfileBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={scale(28)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Center</Text>
        <View style={{ width: scale(44) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify()} style={styles.heroCard}>
          <View style={styles.heroCircle}>
            <Ionicons name="help-buoy" size={scale(40)} color={Theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>We're here for you</Text>
          <Text style={styles.heroSub}>Find answers to common questions about your parenting journey with NEEV.</Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMMON QUESTIONS</Text>
          {faqItems.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInRight.delay(200 + index * 100).springify()}
              style={styles.faqPetalCard}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={scale(20)} color={item.color} />
              </View>
              <View style={styles.faqContent}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Text style={styles.faqA}>{item.a}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(600)} style={styles.contactSection}>
          <Text style={styles.contactText}>Still have questions?</Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => navigation.navigate('AboutNeev')}
          >
            <Ionicons name="mail-open-outline" size={scale(20)} color={Theme.colors.white} />
            <Text style={styles.contactBtnText}>Message Us</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(15), height: verticalScale(60) },
  iconBtn: { width: scale(44), height: scale(44), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: moderateScale(20), fontWeight: '900', color: Theme.colors.primary },
  content: { paddingHorizontal: scale(20), paddingTop: verticalScale(10), paddingBottom: verticalScale(40) },
  heroCard: { backgroundColor: Theme.colors.secondary, borderRadius: moderateScale(35), padding: moderateScale(24), alignItems: 'center', marginBottom: verticalScale(30), borderWidth: 2, borderColor: Theme.colors.primary, ...Theme.shadows.soft },
  heroCircle: { width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: verticalScale(15) },
  heroTitle: { fontSize: moderateScale(22), fontWeight: '900', color: Theme.colors.primary },
  heroSub: { fontSize: moderateScale(14), color: Theme.colors.primary, textAlign: 'center', marginTop: 4, lineHeight: moderateScale(20), opacity: 0.8 },
  section: { marginBottom: verticalScale(25) },
  sectionLabel: { fontSize: moderateScale(12), fontWeight: '900', color: Theme.colors.textLight, letterSpacing: 1.5, marginBottom: verticalScale(15), marginLeft: scale(10) },
  faqPetalCard: { backgroundColor: Theme.colors.white, borderRadius: moderateScale(22), padding: moderateScale(15), flexDirection: 'row', alignItems: 'flex-start', marginBottom: verticalScale(12), borderWidth: 1.5, borderColor: '#FDE68A50', ...Theme.shadows.soft },
  iconBox: { width: scale(44), height: scale(44), borderRadius: moderateScale(12), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  faqContent: { flex: 1 },
  faqQ: { fontSize: moderateScale(15), fontWeight: '800', color: Theme.colors.primary, marginBottom: 4 },
  faqA: { fontSize: moderateScale(13), color: Theme.colors.textLight, lineHeight: moderateScale(18) },
  contactSection: { alignItems: 'center', marginTop: verticalScale(10) },
  contactText: { fontSize: moderateScale(14), color: Theme.colors.textLight, marginBottom: verticalScale(12), fontStyle: 'italic' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(10), backgroundColor: Theme.colors.primary, paddingHorizontal: scale(30), paddingVertical: verticalScale(16), borderRadius: moderateScale(22), ...Theme.shadows.soft },
  contactBtnText: { color: Theme.colors.white, fontSize: moderateScale(16), fontWeight: '800' },
});
