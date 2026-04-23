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
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
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
import NeevModal from '../../../components/NeevModal';

import * as directusService from '../../../services/DirectusApiClient';
import { format } from 'date-fns';

const DBM_PATTERNS = [
  { label: 'neh', meaning: 'Hunger', description: "It sounds like a rhythmic 'neh'—this is often a reflex for 'I'm hungry.' Would you like to log a feed?", emoji: '🍼', icon: 'restaurant-outline' },
  { label: 'owh', meaning: 'Sleepy', description: "It sounds like 'owh'—this is often a reflex for 'I'm sleepy.' Would you like to log a sleep session?", emoji: '😴', icon: 'moon-outline' },
  { label: 'heh', meaning: 'Discomfort', description: "It sounds like 'heh'—this is often a reflex for 'I'm uncomfortable' (full diaper or cold).", emoji: '🌡️', icon: 'alert-circle-outline' },
  { label: 'eair', meaning: 'Lower Gas', description: "It sounds like 'eair'—this is often a reflex for 'I have lower gas.' Try some bicycle legs!", emoji: '💨', icon: 'bandage-outline' },
  { label: 'eh', meaning: 'Burp', description: "It sounds like 'eh'—this is often a reflex for 'I need to burp.'", emoji: '💨', icon: 'sunny-outline' },
];

const ROLE_EMOJIS: { [key: string]: string } = {
  'mother': '👩', 'father': '👨', 'grandmother': '👵', 'grandfather': '👴',
  'guardian': '🛡️', 'caregiver': '🤗', 'aunt': '👩‍🦰', 'uncle': '👨‍🦰',
  'foster parent': '🏠', 'adoptive parent': '💝', 'stepmother': '👩‍🦱', 'stepfather': '👨‍🦱',
  'parent': '👤'
};

const LiveAgeCounter = React.memo(({ dob, timeOfBirth, childName }: { dob: string, timeOfBirth?: string | null, childName: string }) => {
  const [ageDetails, setAgeDetails] = useState<any>(null);

  useEffect(() => {
    const updateAge = () => {
      setAgeDetails(calculateAge(dob, timeOfBirth));
    };
    updateAge();
    // Update every second to show live progress
    const timer = setInterval(updateAge, 1000);
    return () => clearInterval(timer);
  }, [dob, timeOfBirth]);

  if (!ageDetails) return null;
  const { months, days, hours, minutes, seconds } = ageDetails.details;

  return (
    <View>
      <Text style={styles.ageText}>{childName} is</Text>
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
    </View>
  );
});

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
  const { fetchChildren, fetchGuidance, guidanceData, children } = useAIStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(user);
  const [sweetSpot, setSweetSpot] = useState<any>(null);
  const isInitialMount = useRef(true);

  // Cry Translator State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [translatorResult, setTranslatorResult] = useState<any>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const translatorPulse = useSharedValue(1);

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const startTranslation = async () => {
    navigation.navigate('CryTranslator');
  };

  const handleFeedback = (isCorrect: boolean) => {
    setFeedbackGiven(true);
    // In a real app, we'd send this to the backend to improve the model
    console.log(`User feedback: ${isCorrect ? 'Correct' : 'Incorrect'} for ${translatorResult?.label}`);
  };

  const handleConfirmAndLog = async () => {
    console.log('Neev Cry Translator: handleConfirmAndLog called');
    if (!translatorResult || !user?.id) {
      console.log('Neev Cry Translator: Missing result or user ID', { translatorResult, userId: user?.id });
      return;
    }

    try {
      const activeChild = profile?.children?.[0] || children?.[0];
      console.log('Neev Cry Translator: Logging for child:', activeChild?.id);

      const record = {
        user_id: Number(user.id),
        child_id: activeChild?.id ? Number(activeChild.id) : undefined,
        record_type: 'Cry Analysis',
        value: translatorResult.meaning,
        unit: 'cue',
        sub_value: translatorResult.label,
        date: new Date().toISOString(),
        notes: `Detected ${translatorResult.label} pattern (${translatorResult.meaning}) via Neev Cry Translator.`
      };

      console.log('Neev Cry Translator: Saving health record...', JSON.stringify(record, null, 2));
      const saved = await directusService.saveHealthRecord(record);
      console.log('Neev Cry Translator: Saved successfully:', saved);

      setIsModalVisible(false);
      Alert.alert('Success', 'Cry insight logged to health records!');
      setTranslatorResult(null);
    } catch (error: any) {
      console.error('Neev Cry Translator: Failed to log cry record:', error);
      Alert.alert('Error', `Failed to save log: ${error.message || 'Unknown error'}`);
    }
  };

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

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${neevRotation.value}deg` }],
  }));

  const animatedCelestialStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celestialScale.value }],
  }));

  const translatorPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: translatorPulse.value }],
    opacity: isRecording ? 0.6 : 0,
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

  const [todayMorningLog, setTodayMorningLog] = useState<any>(null);

  const loadAll = async (isRefresh = false) => {
    if (!token || !user) return;
    if (loading && !isRefresh) return;

    try {
      // Parallelize independent data fetches to prevent waterfall lag
      const [_, ss, logs] = await Promise.all([
        fetchChildren(user.id.toString(), isRefresh),
        directusService.calculateSweetSpot(Number(user.id)),
        directusService.fetchCheckIns(Number(user.id), new Date().toISOString().split('T')[0])
      ]);

      setProfile(user);
      setSweetSpot(ss);

      const morning = logs.find((l: any) => l.type === 'morning');
      if (morning) setTodayMorningLog(morning);

      // Use standard fetch instead of stream for reliability and speed
      setTimeout(() => {
        const childProfile = buildChildProfile(user);
        fetchGuidance(user.id.toString(), childProfile);
      }, 2000);

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
  const fullName = user?.full_name || 'Parent';
  const firstName = fullName.split(' ')[0];
  const relationshipType = (user?.relationship_type || '').toLowerCase();
  const roleEmoji = ROLE_EMOJIS[relationshipType] || '👤';
  const timeCtx = getTimeContext();
  const childName = activeChild?.name || 'Baby';

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
            <Ionicons name="color-wand-outline" size={scale(20)} color={Theme.colors.primary} />
            <Text style={styles.bridgeLabel}>Discovery</Text>
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
          <TouchableOpacity style={styles.bridgeButton} onPress={() => navigation.navigate('Pulse')}>
            <Ionicons name="heart-half-outline" size={scale(20)} color={Theme.colors.primary} />
            <Text style={styles.bridgeLabel}>The Pulse</Text>
          </TouchableOpacity>
        </View>

        <DailyCheckin />

        <TouchableOpacity
          style={styles.translatorCard}
          onPress={startTranslation}
          activeOpacity={0.7}
        >
          <View style={styles.pulseIconContainer}>
             <Ionicons name="mic-outline" size={scale(14)} color={Theme.colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.translatorTitle}>Neev Cry Translator</Text>
            <Text style={styles.focusLabel}>Understand your baby's DBM cues</Text>
          </View>
          <Ionicons name="chevron-forward" size={scale(18)} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.pulseCard}>
          <View style={styles.pulseHeader}>
            <View style={styles.pulseIconContainer}>
               <Ionicons name="pulse" size={scale(14)} color={Theme.colors.white} />
            </View>
            <Text style={styles.pulseTitle}>THE NURTURE PULSE</Text>
            <TouchableOpacity
              style={styles.premiumTag}
              onPress={() => navigation.navigate('Health', { screen: 'Health', params: { viewMode: 'hub' } })}
            >
               <Ionicons name="sparkles" size={scale(10)} color="#B45309" />
               <Text style={styles.premiumText}>HUB</Text>
            </TouchableOpacity>
          </View>

          {activeChild?.dob && (
            <LiveAgeCounter
              dob={activeChild.dob}
              timeOfBirth={activeChild.time_of_birth}
              childName={childName}
            />
          )}

          <View style={styles.pulseDivider} />

          <View style={styles.observationHeader}>
            <Ionicons name="leaf-outline" size={scale(16)} color={Theme.colors.primary} />
            <Text style={styles.focusLabel}>EMPATHETIC OBSERVATION</Text>
          </View>

          {guidanceData?.insight ? (
            <View>
              <Text style={styles.observationMainText}>
                {guidanceData.insight}
              </Text>
              {guidanceData.recommendation && (
                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionLabel}>AI SUGGESTION:</Text>
                  <Text style={styles.suggestionText}>
                    {guidanceData.recommendation}
                  </Text>
                </View>
              )}
            </View>
          ) : todayMorningLog ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
               <ActivityIndicator size="small" color={Theme.colors.primary} />
               <Text style={styles.focusText}>Neev is analyzing your morning rhythm...</Text>
            </View>
          ) : (
            <Text style={styles.focusText}>
              Complete your morning check-in to unlock personalised AI observations.
            </Text>
          )}
        </View>

        <View style={styles.neevCard}>
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
        </View>

        <View style={{ height: verticalScale(30) }} />
      </ScrollView>

      <NeevModal
        visible={isModalVisible}
        onCancel={() => {
          console.log('Neev Cry Translator: Modal Cancelled');
          setIsModalVisible(false);
        }}
        title="Neev Cry Translator"
      >
        <View style={styles.modalContent}>
          {!showResult ? (
            <>
              <Text style={styles.modalSub}>
                {isRecording ? "Listening to your baby's cry patterns..." : "Analyzing acoustic frequencies..."}
              </Text>

              <View style={styles.micContainer}>
                <Animated.View style={[styles.pulseCircle, translatorPulseStyle]} />
                <View style={styles.micBtn}>
                  <Ionicons
                    name={isRecording ? "mic" : "sparkles"}
                    size={scale(40)}
                    color={Theme.colors.white}
                  />
                </View>
              </View>

              <Text style={styles.micStatus}>
                {isRecording ? "RECORDING LIVE" : "PROCESSING..."}
              </Text>
            </>
          ) : (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <AppEmoji style={{ fontSize: scale(24) }}>{translatorResult?.emoji}</AppEmoji>
                <Text style={styles.resultPattern}>Detected: {translatorResult?.label}</Text>
              </View>

              <Text style={styles.resultMeaning}>{translatorResult?.meaning} Reflex</Text>
              <Text style={styles.resultDesc}>{translatorResult?.description}</Text>

              <TouchableOpacity
                style={styles.confirmLogButton}
                onPress={handleConfirmAndLog}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmLogText}>Confirm & Log Insight</Text>
              </TouchableOpacity>

              <View style={styles.feedbackRow}>
                <Text style={styles.feedbackAsk}>WAS THIS ACCURATE?</Text>
                {!feedbackGiven ? (
                  <View style={styles.feedbackBtns}>
                    <TouchableOpacity
                      style={styles.feedbackBtn}
                      onPress={() => {
                        console.log('Neev Cry Translator: Thumbs Up Pressed');
                        handleFeedback(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="thumbs-up-outline" size={scale(24)} color={Theme.colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.feedbackBtn}
                      onPress={() => {
                        console.log('Neev Cry Translator: Thumbs Down Pressed');
                        handleFeedback(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="thumbs-down-outline" size={scale(24)} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.feedbackThanks}>Thank you for your feedback!</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </NeevModal>
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
    zIndex: 0, // Ensure it doesn't block children
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
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4)
  },
  premiumText: {
    fontSize: moderateScale(9),
    fontWeight: '900',
    color: '#B45309',
  },
  observationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(8)
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
  neevCard: { marginHorizontal: scale(20), marginBottom: verticalScale(12), backgroundColor: Theme.colors.white, borderRadius: moderateScale(30), borderWidth: 1.5, borderColor: '#FDE68A', ...Theme.shadows.soft, overflow: 'hidden' },
  translatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: moderateScale(16),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: scale(10),
    zIndex: 10, // Higher priority for touches
    ...Theme.shadows.soft
  },
  listeningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: moderateScale(12),
    borderRadius: moderateScale(20),
    gap: scale(10),
    ...Theme.shadows.soft
  },
  listeningText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.white,
  },
  analyzingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: moderateScale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: scale(10),
    ...Theme.shadows.soft
  },
  analyzingText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  resultCard: {
    backgroundColor: Theme.colors.white,
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: moderateScale(16),
    borderRadius: moderateScale(28),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  resultTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: Theme.colors.primary
  },
  resultBodyText: {
    fontSize: moderateScale(13),
    color: Theme.colors.primary,
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12),
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  confirmLogButton: {
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(14),
    borderRadius: scale(16),
    backgroundColor: Theme.colors.primary,
    marginTop: verticalScale(10),
  },
  confirmLogText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: Theme.colors.white,
    textAlign: 'center',
  },
  translatorTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  sweetspotCard: {
    backgroundColor: Theme.colors.white,
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: moderateScale(16),
    borderRadius: moderateScale(28),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(8)
  },
  cardSectionTitle: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: Theme.colors.textLight,
    letterSpacing: 1
  },
  sweetspotTime: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: verticalScale(4)
  },
  sweetspotSub: {
    fontSize: moderateScale(12),
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: verticalScale(12)
  },
  correctionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  correctionText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: Theme.colors.primary
  },
  observationCard: {
    backgroundColor: Theme.colors.white,
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: moderateScale(16),
    borderRadius: moderateScale(28),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft
  },
  observationTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: Theme.colors.primary
  },
  observationMainText: {
    fontSize: moderateScale(13),
    color: Theme.colors.primary,
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12)
  },
  suggestionBox: {
    borderLeftWidth: 2,
    borderLeftColor: Theme.colors.primary,
    paddingLeft: scale(12),
    marginBottom: verticalScale(12)
  },
  suggestionLabel: {
    fontSize: moderateScale(9),
    fontWeight: '900',
    color: Theme.colors.textLight,
    marginBottom: verticalScale(2)
  },
  suggestionText: {
    fontSize: moderateScale(12),
    color: Theme.colors.primary,
    fontStyle: 'italic'
  },
  guidanceLink: {
    marginTop: verticalScale(4)
  },
  guidanceLinkText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: Theme.colors.primary
  },
  neevButton: { flexDirection: 'row', alignItems: 'center', padding: moderateScale(14), gap: scale(14) },
  neevLogoContainer: { width: scale(50), height: scale(50), borderRadius: scale(25), backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  neevLogo: { width: scale(50), height: scale(50) },
  neevContent: { flex: 1 },
  neevTitle: { fontSize: moderateScale(18), fontWeight: '800', color: Theme.colors.primary },
  neevSubtitle: { fontSize: moderateScale(13), color: Theme.colors.textLight },

  // Modal Styles
  modalContent: {
    paddingVertical: verticalScale(10),
    alignItems: 'center',
  },
  modalSub: {
    fontSize: moderateScale(14),
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(30),
  },
  micContainer: {
    width: scale(140),
    height: scale(140),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  micBtn: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...Theme.shadows.medium,
  },
  pulseCircle: {
    position: 'absolute',
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: Theme.colors.primary,
    zIndex: 1,
  },
  micStatus: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
    marginBottom: verticalScale(30),
  },
  resultBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(10),
  },
  resultPattern: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  resultMeaning: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.secondary,
    marginBottom: verticalScale(6),
  },
  resultDesc: {
    fontSize: moderateScale(13),
    color: Theme.colors.textLight,
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(20),
  },
  feedbackRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: verticalScale(15),
    alignItems: 'center',
  },
  feedbackAsk: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: Theme.colors.textLight,
    marginBottom: verticalScale(10),
  },
  feedbackBtns: {
    flexDirection: 'row',
    gap: scale(24),
  },
  feedbackBtn: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    ...Theme.shadows.soft,
  },
  feedbackThanks: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: Theme.colors.primary,
    fontStyle: 'italic',
  },
});
