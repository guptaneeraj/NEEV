import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ProfileBackground } from './Profile';

export default function Subscription() {
  const navigation = useNavigation<any>();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const currentPlan = 'Free';

  const plans = [
    {
      name: 'Free', price: '$0', period: '', icon: 'leaf-outline',
      features: ['Daily check-ins', 'Basic tracking', 'Limited AI'],
      isCurrent: currentPlan === 'Free', color: '#A8D5BA'
    },
    {
      name: 'Premium', price: billingCycle === 'yearly' ? '$4.99' : '$7.99',
      period: '/month', icon: 'sparkles-outline',
      features: ['Unlimited AI Chat', 'Advanced Analysis', 'Personalized Tasks', 'Ad-free'],
      isCurrent: currentPlan === 'Premium', highlight: true, color: '#F59E0B'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProfileBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={scale(28)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neev Premium</Text>
        <View style={{ width: scale(44) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toggleContainer}>
          {['monthly', 'yearly'].map((cycle: any) => (
            <TouchableOpacity
              key={cycle}
              style={[styles.toggleBtn, billingCycle === cycle && styles.toggleBtnActive]}
              onPress={() => setBillingCycle(cycle)}
            >
              <Text style={[styles.toggleText, billingCycle === cycle && styles.toggleTextActive]}>
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {plans.map((plan, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.delay(200 + index * 150).springify()}
            style={[styles.planCard, plan.highlight && styles.premiumCard]}
          >
            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
                <Ionicons name={plan.icon as any} size={scale(24)} color={plan.color} />
              </View>
              {plan.isCurrent && (
                <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>ACTIVE</Text></View>
              )}
            </View>

            <Text style={[styles.planName, plan.highlight && { color: Theme.colors.white }]}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, plan.highlight && { color: Theme.colors.white }]}>{plan.price}</Text>
              <Text style={[styles.planPeriod, plan.highlight && { color: 'rgba(255,255,255,0.7)' }]}>{plan.period}</Text>
            </View>

            <View style={styles.featureList}>
              {plan.features.map((feat, fi) => (
                <View key={fi} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={scale(18)} color={plan.highlight ? '#FDE68A' : plan.color} />
                  <Text style={[styles.featureText, plan.highlight && { color: Theme.colors.white }]}>{feat}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.actionBtn, plan.highlight ? styles.premiumBtn : styles.freeBtn]}>
              <Text style={[styles.actionText, plan.highlight && { color: Theme.colors.primary }]}>
                {plan.isCurrent ? 'Current Plan' : 'Select Plan'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
  content: { paddingHorizontal: scale(20), paddingBottom: verticalScale(40) },
  toggleContainer: { flexDirection: 'row', backgroundColor: Theme.colors.white, padding: scale(5), borderRadius: moderateScale(20), marginBottom: verticalScale(25), borderWidth: 1.5, borderColor: '#FDE68A' },
  toggleBtn: { flex: 1, paddingVertical: verticalScale(10), alignItems: 'center', borderRadius: moderateScale(15) },
  toggleBtnActive: { backgroundColor: Theme.colors.secondary },
  toggleText: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.textLight },
  toggleTextActive: { color: Theme.colors.primary },
  planCard: { backgroundColor: Theme.colors.white, borderRadius: moderateScale(32), padding: moderateScale(24), marginBottom: verticalScale(20), borderWidth: 1.5, borderColor: '#FDE68A', ...Theme.shadows.soft },
  premiumCard: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(15) },
  planIcon: { width: scale(50), height: scale(50), borderRadius: moderateScale(15), justifyContent: 'center', alignItems: 'center' },
  currentBadge: { backgroundColor: Theme.colors.secondary, paddingHorizontal: scale(12), paddingVertical: verticalScale(4), borderRadius: moderateScale(10) },
  currentBadgeText: { fontSize: moderateScale(10), fontWeight: '900', color: Theme.colors.primary },
  planName: { fontSize: moderateScale(18), fontWeight: '800', color: Theme.colors.textLight, textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: verticalScale(5), marginBottom: verticalScale(20) },
  planPrice: { fontSize: moderateScale(36), fontWeight: '900', color: Theme.colors.primary },
  planPeriod: { fontSize: moderateScale(16), color: Theme.colors.textLight, marginLeft: scale(4) },
  featureList: { gap: verticalScale(12), marginBottom: verticalScale(25) },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  featureText: { fontSize: moderateScale(14), fontWeight: '600', color: Theme.colors.primary },
  actionBtn: { paddingVertical: verticalScale(16), borderRadius: moderateScale(20), alignItems: 'center', borderWidth: 1.5 },
  premiumBtn: { backgroundColor: '#FDE68A', borderColor: '#FDE68A' },
  freeBtn: { backgroundColor: 'transparent', borderColor: Theme.colors.primary },
  actionText: { fontSize: moderateScale(16), fontWeight: '800', color: Theme.colors.primary },
});
