import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../../utils/responsive';
import AppEmoji from '../../../components/AppEmoji';
import NeevModal from '../../../components/NeevModal';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate
} from 'react-native-reanimated';

const ROLE_EMOJIS: { [key: string]: string } = {
  'mother': '👩', 'father': '👨', 'grandmother': '👵', 'grandfather': '👴',
  'guardian': '🛡️', 'caregiver': '🤗', 'aunt': '👩‍🦰', 'uncle': '👨‍🦰',
  'foster parent': '🏠', 'adoptive parent': '💝', 'stepmother': '👩‍🦱', 'stepfather': '👨‍🦱',
  'parent': '👤'
};

// --- UNIQUE ANIMATION: Falling Petals (Top to Bottom) ---
const FallingPetal = React.memo(({ delay, startX, targetX, color }: any) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 12000 + Math.random() * 5000, easing: Easing.linear }), -1, false)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const ty = interpolate(progress.value, [0, 1], [-100, SCREEN_HEIGHT + 100]);
    const tx = interpolate(progress.value, [0, 1], [startX, targetX]);
    const swing = Math.sin(progress.value * 12) * 40;
    const rotate = interpolate(progress.value, [0, 1], [0, 720]);
    const opacity = interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 0.5, 0.5, 0]);

    return {
      position: 'absolute',
      transform: [{ translateY: ty }, { translateX: tx + swing }, { rotate: `${rotate}deg` }],
      opacity
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="flower-outline" size={scale(18)} color={color} />
    </Animated.View>
  );
});

export const ProfileBackground = () => {
  const petals = useMemo(() => [...Array(20)].map((_, i) => (
    <FallingPetal
      key={i}
      delay={i * 800}
      startX={SCREEN_WIDTH * Math.random()}
      targetX={SCREEN_WIDTH * Math.random()}
      color={Theme.colors.secondary}
    />
  )), []);
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{petals}</View>;
};

// --- MAIN HUB ---
export default function Profile() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigation.replace('Landing');
  };

  const sections = [
    {
      label: 'JOURNEY',
      items: [
        { title: "Parent Profile", icon: "person", route: "PersonalInfo", emoji: "🌿", color: '#A8D5BA' },
        { title: "Little Ones", icon: "paw", route: "ChildProfile", emoji: "🐣", color: '#FDE68A' },
        { title: "Rhythm", icon: "notifications", route: "Notifications", emoji: "⏰", color: '#94A3B8' },
      ]
    },
    {
      label: 'NEST',
      items: [
        { title: "Neev Premium", icon: "star", route: "Subscription", emoji: "✨", color: '#F59E0B' },
        { title: "Safety", icon: "shield-checkmark", route: "PrivacySecurity", emoji: "🔐", color: '#2D5F3F' },
      ]
    },
    {
      label: 'SUPPORT',
      items: [
        { title: "Help", icon: "help-circle", route: "HelpCenter", emoji: "🤝", color: '#6B7F71' },
        { title: "Our Story", icon: "heart", route: "AboutNeev", emoji: "📖", color: '#E07A5F' },
      ]
    }
  ];

  const username = user?.full_name || 'Parent';
  const relationshipType = (user?.relationship_type || '').toLowerCase();
  const roleEmoji = ROLE_EMOJIS[relationshipType] || '👤';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProfileBackground />

      <NeevModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Take a breather?"
        icon="🚪"
        confirmText="Logout"
        cancelText="Stay"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        type="danger"
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={scale(28)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journey Hub</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
          <Ionicons name="exit-outline" size={scale(26)} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify().damping(12)} style={styles.heroNest}>
          <View style={styles.petalAvatar}>
             <AppEmoji style={styles.avatarEmoji}>{roleEmoji}</AppEmoji>
             <View style={styles.nBadge}><Text style={styles.nBadgeText}>N</Text></View>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.userName}>{username}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </Animated.View>

        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, iIdx) => (
                <Animated.View
                  key={iIdx}
                  entering={FadeInUp.delay(300 + (sIdx * 3 + iIdx) * 50).springify()}
                >
                  <TouchableOpacity
                    style={[styles.menuItem, iIdx !== section.items.length - 1 && styles.divider]}
                    onPress={() => item.route && navigation.navigate(item.route)}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: item.color + '15' }]}>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>NEEV v1.0 • FOUNDATION</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(15), height: verticalScale(60) },
  iconBtn: { width: scale(44), height: scale(44), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: moderateScale(22), fontWeight: '900', color: Theme.colors.primary, letterSpacing: -0.5 },
  content: { paddingHorizontal: scale(20), paddingTop: verticalScale(5), paddingBottom: verticalScale(40) },
  heroNest: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(32),
    padding: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    borderWidth: 2,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  petalAvatar: {
    width: scale(75),
    height: scale(75),
    backgroundColor: '#FEF3C7',
    borderTopLeftRadius: moderateScale(30),
    borderBottomRightRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A'
  },
  avatarEmoji: { fontSize: moderateScale(36) },
  nBadge: { position: 'absolute', bottom: -scale(2), right: -scale(2), backgroundColor: Theme.colors.primary, width: scale(22), height: scale(22), borderRadius: scale(11), borderWidth: 2, borderColor: Theme.colors.white, justifyContent: 'center', alignItems: 'center' },
  nBadgeText: { color: Theme.colors.white, fontSize: moderateScale(10), fontWeight: '900' },
  heroInfo: { marginLeft: scale(15), flex: 1 },
  userName: { fontSize: moderateScale(20), fontWeight: '900', color: Theme.colors.primary },
  userEmail: { fontSize: moderateScale(13), color: Theme.colors.textLight, marginTop: verticalScale(2) },
  section: { marginBottom: verticalScale(20) },
  sectionLabel: { fontSize: moderateScale(11), fontWeight: '900', color: Theme.colors.textLight, letterSpacing: 1.5, marginBottom: verticalScale(10), marginLeft: scale(10) },
  menuCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(5),
    borderWidth: 1.5,
    borderColor: '#FDE68A50',
    ...Theme.shadows.soft
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(14), paddingHorizontal: scale(12) },
  divider: { borderBottomWidth: 1, borderBottomColor: '#FDE68A30', borderStyle: 'dashed' },
  itemIcon: { width: scale(40), height: scale(40), borderRadius: moderateScale(12), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  itemTitle: { flex: 1, fontSize: moderateScale(16), fontWeight: '700', color: Theme.colors.primary },
  itemEmoji: { fontSize: moderateScale(18), marginRight: scale(8) },
  footer: { marginTop: verticalScale(10), alignItems: 'center', opacity: 0.4 },
  footerText: { fontSize: moderateScale(10), fontWeight: '900', letterSpacing: 1 }
});
