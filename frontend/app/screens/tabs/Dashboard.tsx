import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAIStore } from '../../../store/useAIStore';
import { Theme } from '../../../constants/Theme';
import DailyCheckin from '../../../components/DailyCheckin';
import AppEmoji from '../../../components/AppEmoji';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LeavesLayer } from '../../components/LeavesLayer';

const ROLE_EMOJIS: { [key: string]: string } = {
  'Mother': '👩',
  'Father': '👨',
  'Grandmother': '👵',
  'Grandfather': '👴',
  'Guardian': '🛡️',
  'Caregiver': '🤗',
  'Aunt': '👩‍🦰',
  'Uncle': '👨‍🦰',
  'Foster Parent': '🏠',
  'Adoptive Parent': '💝',
  'Stepmother': '👩‍🦱',
  'Stepfather': '👨‍🦱',
};

// Centralized Asset Helper Logic (Moved from assetHelpers.ts for direct access)
const getMountainAsset = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return require('../../../assets/images/Mountain1.png');
  if (hour >= 12 && hour < 17) return require('../../../assets/images/Mountain2.png');
  if (hour >= 17 && hour < 20) return require('../../../assets/images/Mountain3.png');
  return require('../../../assets/images/Mountain4.png');
};

const getTimeContext = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return {
    greeting: 'Good morning',
    icon: '🌞',
    leafColor: '#A8D5BA',
    mtnOpacity: 1
  };
  if (hour >= 12 && hour < 17) return {
    greeting: 'Good afternoon',
    icon: '☀️',
    leafColor: '#2D5F3F',
    mtnOpacity: 1
  };
  if (hour >= 17 && hour < 20) return {
    greeting: 'Good evening',
    icon: '🌚',
    leafColor: '#F59E0B',
    mtnOpacity: 1
  };
  return {
    greeting: 'Good night',
    icon: '🌙',
    leafColor: '#94A3B8',
    mtnOpacity: 0.9
  };
};

const calculateAge = (dobString: string | null, timeOfBirth: string | null = null) => {
  if (!dobString) return { text: '0m 0w', details: { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 } };

  // Combine DOB and Time of Birth
  let birthDateTime = new Date(dobString);
  if (timeOfBirth) {
    const [time, period] = timeOfBirth.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    birthDateTime.setHours(hours, minutes, 0, 0);
  }

  const now = new Date();
  const diffMs = now.getTime() - birthDateTime.getTime();

  if (diffMs < 0) return { text: 'Just born', details: { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 } };

  // Months/Weeks for the static display
  let months = (now.getFullYear() - birthDateTime.getFullYear()) * 12 + (now.getMonth() - birthDateTime.getMonth());
  if (now.getDate() < birthDateTime.getDate()) {
    months--;
  }
  const daysTotal = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor((daysTotal % 30.44) / 7); // Approximate

  // Detailed breakdown for the live counter
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutesTotal = Math.floor(totalSeconds / 60);
  const hoursTotal = Math.floor(minutesTotal / 60);

  const seconds = totalSeconds % 60;
  const minutesDetail = minutesTotal % 60;
  const hoursDetail = hoursTotal % 24;
  const daysDetail = daysTotal % 30; // Rough month

  return {
    text: `${months}m ${weeks}w`,
    details: {
      months,
      days: daysDetail,
      hours: hoursDetail,
      minutes: minutesDetail,
      seconds
    }
  };
};

export default function Dashboard() {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { fetchChildren, streamGuidance, guidanceData, children } = useAIStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(user);
  const [ageDetails, setAgeDetails] = useState<any>(null);
  const isInitialMount = useRef(true);

  const neevRotation = useSharedValue(0);
  const celestialScale = useSharedValue(1);

  useEffect(() => {
    neevRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    celestialScale.value = withRepeat(
      withTiming(1.3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    const activeChild = profile?.children?.[0] || children?.[0];
    const updateAge = () => {
      if (activeChild?.dob) {
        const age = calculateAge(activeChild.dob, activeChild.time_of_birth);
        setAgeDetails(age);
      }
    };

    updateAge();
    const timer = setInterval(updateAge, 1000);
    return () => clearInterval(timer);
  }, [profile, children]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${neevRotation.value}deg` }],
  }));

  const animatedCelestialStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celestialScale.value }],
  }));

  const buildChildProfile = (prof: any) => {
    const firstChild = (prof?.children && prof.children.length > 0)
      ? prof.children[0]
      : (children && children.length > 0 ? children[0] : {});

    return {
      full_name: prof?.full_name || user?.full_name || 'Parent',
      relationship_type: prof?.relationship_type || 'parent',
      stage: prof?.stage || 'parenting',
      child_name: firstChild?.name || 'my baby',
      child_dob: firstChild?.dob ? new Date(firstChild.dob).toISOString().split('T')[0] : null,
      child_sex: firstChild?.sex || 'not specified',
      diet_preference: firstChild?.diet_preference || 'none',
      current_week: prof?.pregnancy_info?.current_week || null,
      mood_logs: [],
      health_records: [],
      task_completions: [],
    };
  };

  const loadAll = async (isRefresh = false) => {
    if (!token || !user) return;
    if (loading && !isRefresh) return;

    try {
      await fetchChildren(user.id.toString(), isRefresh);
      setProfile(user);

      setTimeout(() => {
        const childProfile = buildChildProfile(user);
        streamGuidance(user.id.toString(), childProfile, () => {});
      }, 1500);

    } catch (error) {
      console.error('Dashboard Data Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && user && isInitialMount.current) {
      loadAll();
      isInitialMount.current = false;
    }
  }, [token, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll(true);
  };

  const activeChild = profile?.children?.[0] || children?.[0];
  const fullName = profile?.full_name || user?.full_name || 'Parent';
  const firstName = fullName.split(' ')[0];
  const userRole = profile?.relationship_type || user?.relationship_type || 'Parent';
  const roleEmoji = ROLE_EMOJIS[userRole] || '👤';
  const timeCtx = getTimeContext();
  const childName = activeChild?.name || 'Baby';

  const renderLiveAge = () => {
    if (!ageDetails) return null;
    const { months, days, hours, minutes, seconds } = ageDetails.details;

    return (
      <View style={styles.liveAgeContainer}>
        <View style={styles.liveAgeBit}>
          <Text style={styles.liveAgeValue}>{months}</Text>
          <Text style={styles.liveAgeLabel}>MON</Text>
        </View>
        <View style={styles.liveAgeDivider} />
        <View style={styles.liveAgeBit}>
          <Text style={styles.liveAgeValue}>{days}</Text>
          <Text style={styles.liveAgeLabel}>DAYS</Text>
        </View>
        <View style={styles.liveAgeDivider} />
        <View style={styles.liveAgeBit}>
          <Text style={styles.liveAgeValue}>{hours}</Text>
          <Text style={styles.liveAgeLabel}>HRS</Text>
        </View>
        <View style={styles.liveAgeDivider} />
        <View style={styles.liveAgeBit}>
          <Text style={styles.liveAgeValue}>{minutes}</Text>
          <Text style={styles.liveAgeLabel}>MIN</Text>
        </View>
        <View style={styles.liveAgeDivider} />
        <View style={styles.liveAgeBit}>
          <Text style={[styles.liveAgeValue, { color: Theme.colors.secondary }]}>{seconds}</Text>
          <Text style={styles.liveAgeLabel}>SEC</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.secondary} />}
      >
        <View style={styles.topSection}>
          <LeavesLayer color={timeCtx.leafColor} />

          {/* Layer 3: Mountain Image */}
          <View style={[styles.mountainContainer, { opacity: timeCtx.mtnOpacity }]} pointerEvents="none">
            <Image
              source={getMountainAsset()}
              style={styles.mountainImage}
            />
          </View>

          <View style={styles.header}>
            <View style={styles.animationColumn}>
              <Animated.View style={animatedCelestialStyle}>
                <AppEmoji style={styles.celestialEmojiPlain}>
                  {timeCtx.icon}
                </AppEmoji>
              </Animated.View>
            </View>

            <View style={styles.greetingContainer}>
              <Text style={styles.greetingSmall}>{timeCtx.greeting}</Text>
              <Text style={styles.greetingBig} numberOfLines={1} adjustsFontSizeToFit>{firstName}</Text>
            </View>

            <View style={{ width: scale(120) }} />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.profilePetalWrapper}
          >
            <View style={styles.petalCard}>
              <AppEmoji style={styles.petalEmoji}>{roleEmoji}</AppEmoji>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.journeyBridge}>
          <TouchableOpacity style={styles.bridgeButton} onPress={() => navigation.navigate('Insights')}>
            <Ionicons name="sparkles-outline" size={scale(20)} color={Theme.colors.primary} />
            <Text style={styles.bridgeLabel}>Insights</Text>
          </TouchableOpacity>
          <View style={styles.bridgeDivider} />
          <TouchableOpacity style={styles.bridgeButton} onPress={() => navigation.navigate('ActivityGuidance', { activity: { title: "Nurture Path", description: `Focus on today's development for ${activeChild?.name || 'your baby'}.`, type: 'Focus' }, childProfile: buildChildProfile(user) })}>
            <View style={{ width: scale(20), height: scale(20), justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={require('../../../assets/images/nurturepath.png')}
                style={{ width: scale(80), height: scale(80), resizeMode: 'contain', position: 'absolute' }}
              />
            </View>
            <Text style={styles.bridgeLabel}>Nurture Path</Text>
          </TouchableOpacity>
          <View style={styles.bridgeDivider} />
          <TouchableOpacity style={styles.bridgeButton} onPress={() => navigation.navigate('PulseScreen')}>
            <Ionicons name="heart-half-outline" size={scale(20)} color={Theme.colors.primary} />
            <Text style={styles.bridgeLabel}>The Pulse</Text>
          </TouchableOpacity>
        </View>

        <DailyCheckin />

        <Animated.View entering={FadeInUp.delay(200)} style={styles.pulseCard}>
          <View style={styles.pulseHeader}>
            <View style={styles.pulseIconContainer}>
               <Ionicons name="pulse" size={scale(14)} color={Theme.colors.white} />
            </View>
            <Text style={styles.pulseTitle}>THE NURTURE PULSE</Text>
            <View style={styles.premiumTag}>
               <Text style={styles.premiumText}>LIVE</Text>
            </View>
          </View>

          <Text style={styles.ageText}>{childName} is</Text>
          {renderLiveAge()}

          <View style={styles.pulseDivider} />
          <Text style={styles.focusLabel}>CURRENT FOCUS</Text>
          <Text style={styles.focusText}>{guidanceData?.recommendation || 'Analyzing developmental milestones...'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.neevCard}>
          <TouchableOpacity style={styles.neevButton} onPress={() => navigation.navigate('AIChat', { childProfile: buildChildProfile(user) })}>
            <View style={styles.neevLogoContainer}>
               <Animated.View style={animatedLogoStyle}>
                <Image source={require('../../../assets/images/neuron_avatar.jpeg')} style={styles.neevLogo} />
              </Animated.View>
            </View>
            <View style={styles.neevContent}>
              <Text style={styles.neevTitle}>Ask NEEV</Text>
              <Text style={styles.neevSubtitle}>AI Parenting Assistant</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: verticalScale(30) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollView: { flex: 1 },
  topSection: {
    height: verticalScale(140),
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(0),
    paddingTop: verticalScale(5),
    zIndex: 5,
  },
  animationColumn: {
    width: scale(120),
    alignItems: 'center',
    justifyContent: 'center',
  },
  celestialEmojiPlain: {
    fontSize: moderateScale(22),
    textAlign: 'center',
    includeFontPadding: false,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSmall: {
    fontSize: moderateScale(18),
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginBottom: verticalScale(1)
  },
  greetingBig: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    letterSpacing: 1.2
  },
  mountainContainer: {
    position: 'absolute',
    bottom: verticalScale(10),
    left: scale(5),
    width: scale(120),
    height: scale(120),
    justifyContent: 'flex-end',
    zIndex: 7,
  },
  mountainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  profilePetalWrapper: {
    position: 'absolute',
    bottom: verticalScale(45),
    right: scale(20),
    zIndex: 10,
  },
  petalCard: {
    width: scale(50),
    height: scale(50),
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(12),
    borderBottomLeftRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  petalEmoji: {
    fontSize: moderateScale(28),
    marginBottom: -verticalScale(0),
    marginBottom: -verticalScale(0),
    includeFontPadding: false,
  },
  journeyBridge: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.white,
    marginHorizontal: scale(20),
    marginBottom: verticalScale(8),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    height: verticalScale(75),
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  bridgeButton: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center' },
  bridgeLabel: { fontSize: moderateScale(13), fontWeight: '700', color: Theme.colors.primary, marginTop: verticalScale(6) },
  bridgeDivider: { width: 1.5, height: '40%', backgroundColor: '#FDE68A', opacity: 0.6 },
  pulseCard: {
    backgroundColor: Theme.colors.white,
    marginHorizontal: scale(20),
    marginBottom: verticalScale(8),
    padding: moderateScale(16),
    borderRadius: moderateScale(30),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(12)
  },
  pulseIconContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseTitle: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: 1.5
  },
  premiumTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginLeft: 'auto'
  },
  premiumText: {
    fontSize: moderateScale(8),
    fontWeight: '900',
    color: '#B45309',
  },
  ageText: {
    fontSize: moderateScale(14),
    color: Theme.colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    marginBottom: verticalScale(8)
  },
  liveAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(5),
  },
  liveAgeBit: {
    alignItems: 'center',
    flex: 1,
  },
  liveAgeValue: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  liveAgeLabel: {
    fontSize: moderateScale(8),
    fontWeight: '800',
    color: Theme.colors.textLight,
    marginTop: verticalScale(2),
  },
  liveAgeDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#FDE68A',
    opacity: 0.5,
  },
  ageHighlight: { fontWeight: '800' },
  pulseDivider: { height: 1, backgroundColor: '#FDE68A', marginVertical: verticalScale(10), opacity: 0.5 },
  focusLabel: { fontSize: moderateScale(10), fontWeight: '800', color: Theme.colors.textLight, marginBottom: verticalScale(6) },
  focusText: { fontSize: moderateScale(14), color: Theme.colors.primary, lineHeight: moderateScale(20) },
  neevCard: { marginHorizontal: scale(20), marginBottom: verticalScale(8), backgroundColor: Theme.colors.white, borderRadius: moderateScale(30), borderWidth: 1.5, borderColor: '#FDE68A', ...Theme.shadows.soft, overflow: 'hidden' },
  neevButton: { flexDirection: 'row', alignItems: 'center', padding: moderateScale(14), gap: scale(14) },
  neevLogoContainer: { width: scale(50), height: scale(50), borderRadius: scale(25), backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  neevLogo: { width: scale(50), height: scale(50) },
  neevContent: { flex: 1 },
  neevTitle: { fontSize: moderateScale(18), fontWeight: '800', color: Theme.colors.primary },
  neevSubtitle: { fontSize: moderateScale(13), color: Theme.colors.textLight },
});
