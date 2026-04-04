import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { ProfileBackground } from './Profile';
import AppEmoji from '../../../components/AppEmoji';
import NeevModal from '../../../components/NeevModal';

export default function PrivacySecurity() {
  const navigation = useNavigation<any>();

  // Alert Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', icon: '', onConfirm: () => {} });

  const showAlert = (title: string, message: string, icon: string = '✨', onConfirm: () => void = () => setModalVisible(false)) => {
    setModalConfig({ title, message, icon, onConfirm });
    setModalVisible(true);
  };

  const handleAction = (title: string) => {
    showAlert(title, "Coming soon in our next foundation update! ✨", '🚀');
  };

  const handleDeleteAccount = () => {
    showAlert(
      "Delete Account",
      "This action is permanent. All your child's milestones and memories will be lost forever. Are you sure?",
      '⚠️',
      () => {
        // Implementation for delete would go here
        setModalVisible(false);
      }
    );
  };

  const sections = [
    {
      label: 'ACCOUNT SECURITY',
      items: [
        { title: 'Change Password', icon: 'key', emoji: '🔑', color: '#A8D5BA' },
        { title: 'Two-Factor Auth', icon: 'shield-checkmark', emoji: '🔐', color: '#94A3B8' },
      ]
    },
    {
      label: 'DATA PRIVACY',
      items: [
        { title: 'Privacy Policy', icon: 'document-text', emoji: '📜', color: '#FDE68A' },
        { title: 'Manage Data Sharing', icon: 'share-social', emoji: '🤝', color: '#2D5F3F' },
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
        <Text style={styles.headerTitle}>Safety & Trust</Text>
        <View style={{ width: scale(44) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify()} style={styles.heroSection}>
          <View style={styles.heroCircle}>
            <Ionicons name="lock-closed-outline" size={scale(40)} color={Theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Your Family's Safety</Text>
          <Text style={styles.heroSub}>Your data is end-to-end encrypted and remains yours alone.</Text>
        </Animated.View>

        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <View style={styles.card}>
              {section.items.map((item, iIdx) => (
                <Animated.View
                  key={iIdx}
                  entering={FadeInRight.delay(200 + (sIdx * 2 + iIdx) * 100).springify()}
                  style={[styles.item, iIdx !== section.items.length - 1 && styles.divider]}
                >
                  <TouchableOpacity
                    style={styles.itemTouch}
                    onPress={() => handleAction(item.title)}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon as any} size={scale(20)} color={item.color} />
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <AppEmoji style={styles.itemEmoji}>{item.emoji}</AppEmoji>
                    <Ionicons name="chevron-forward" size={scale(18)} color={Theme.colors.textLight} opacity={0.3} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Theme.colors.error }]}>DANGER ZONE</Text>
          <Animated.View entering={FadeInUp.delay(600).springify()} style={[styles.card, { borderColor: Theme.colors.error + '40' }]}>
            <TouchableOpacity style={styles.itemTouch} onPress={handleDeleteAccount}>
              <View style={[styles.iconBox, { backgroundColor: Theme.colors.error + '15' }]}>
                <Ionicons name="trash" size={scale(20)} color={Theme.colors.error} />
              </View>
              <Text style={[styles.itemTitle, { color: Theme.colors.error }]}>Delete Account</Text>
              <AppEmoji style={styles.itemEmoji}>⚠️</AppEmoji>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
      <NeevModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalVisible(false)}
        showCancel={modalConfig.title === "Delete Account"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(15), height: verticalScale(60) },
  iconBtn: { width: scale(44), height: scale(44), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: moderateScale(20), fontWeight: '900', color: Theme.colors.primary },
  scrollContent: { paddingHorizontal: scale(20), paddingTop: verticalScale(10), paddingBottom: verticalScale(40) },
  heroSection: { alignItems: 'center', marginBottom: verticalScale(30) },
  heroCircle: { width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FDE68A', marginBottom: verticalScale(15) },
  heroTitle: { fontSize: moderateScale(22), fontWeight: '900', color: Theme.colors.primary },
  heroSub: { fontSize: moderateScale(14), color: Theme.colors.textLight, marginTop: verticalScale(4), textAlign: 'center' },
  section: { marginBottom: verticalScale(25) },
  sectionLabel: { fontSize: moderateScale(12), fontWeight: '900', color: Theme.colors.textLight, letterSpacing: 1.5, marginBottom: verticalScale(12), marginLeft: scale(10) },
  card: { backgroundColor: Theme.colors.white, borderRadius: moderateScale(30), padding: moderateScale(10), borderWidth: 1.5, borderColor: '#FDE68A', ...Theme.shadows.soft },
  item: { paddingHorizontal: scale(12) },
  itemTouch: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(16) },
  divider: { borderBottomWidth: 1, borderBottomColor: '#FDE68A', borderStyle: 'dashed' },
  iconBox: { width: scale(44), height: scale(44), borderRadius: moderateScale(12), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  itemTitle: { flex: 1, fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary },
  itemEmoji: { fontSize: moderateScale(18), marginRight: scale(10) },
});
