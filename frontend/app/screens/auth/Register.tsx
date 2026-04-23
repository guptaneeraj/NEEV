import React, { useState, memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Vibration,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as directusService from '../../../services/DirectusApiClient';
import { Theme } from '../../../constants/Theme';
import DatePickerField from '../../../components/DatePickerField';
import AppEmoji from '../../../components/AppEmoji';
import TimePickerField from '../../../components/TimePickerField';
import LinearGradient from 'react-native-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';
import Animated, {
  FadeInUp,
  FadeInRight,
  FadeInLeft,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

const RELATIONSHIP_OPTIONS = [
  { label: 'Mother', emoji: '👩' }, { label: 'Father', emoji: '👨' },
  { label: 'Grandmother', emoji: '👵' }, { label: 'Grandfather', emoji: '👴' },
  { label: 'Guardian', emoji: '🛡️' }, { label: 'Caregiver', emoji: '🤗' },
  { label: 'Aunt', emoji: '👩‍🦰' }, { label: 'Uncle', emoji: '👨‍🦰' },
  { label: 'Foster Parent', emoji: '🏠' }, { label: 'Adoptive Parent', emoji: '💝' },
  { label: 'Stepmother', emoji: '👩‍🦱' }, { label: 'Stepfather', emoji: '👨‍🦱' },
];

const DIET_OPTIONS = [
  { label: 'Vegetarian', emoji: '🥗', subLabel: 'Wholesome plant-based meals.' },
  { label: 'Eggetarian', emoji: '🥚', subLabel: 'Plant-based with eggs.' },
  { label: 'Non-vegetarian', emoji: '🍖', subLabel: 'Complete diet with diverse proteins.' },
];

const SUB_DIET_OPTIONS: any = {
  'Vegetarian': [
    { label: 'Standard Veg', emoji: '🥦', subLabel: 'Vegetarian meals for wellness.' },
    { label: 'Vegan', emoji: '🌱', subLabel: 'Purely plant-based nutrition.' },
    { label: 'Jain Veg', emoji: '🧘', subLabel: 'Prepared without root vegetables.' },
  ],
  'Eggetarian': [
    { label: 'Standard Egg', emoji: '🍳', subLabel: 'Vegetarian meals with eggs.' },
    { label: 'Dairy-Free Egg', emoji: '🥚', subLabel: 'Egg-based protein, no milk.' },
  ],
  'Non-vegetarian': [
    { label: 'Standard Non-Veg', emoji: '🍗', subLabel: 'Poultry, meat, and seafood.' },
    { label: 'No Red Meat', emoji: '🍤', subLabel: 'Protein choice excluding red meat.' },
    { label: 'Pescatarian', emoji: '🐟', subLabel: 'Vegetarian diet with seafood.' },
  ],
};

const MARITAL_STATUS_OPTIONS = [
  { label: 'Single' },
  { label: 'Married' },
  { label: 'Partnered' },
  { label: 'Divorced' },
  { label: 'Widowed' },
  { label: 'Separated' },
];

const PLAN_OPTIONS = [
  { label: 'Quick Pulse', duration: 20, value: '20_min_plan', icon: '⏱️', subLabel: 'Impactful sessions.' },
  { label: 'Steady Flow', duration: 40, value: '40_min_plan', icon: '⏲️', subLabel: 'Balanced daily growth.' },
  { label: 'Deep Immersion', duration: 60, value: '60_min_plan', icon: '⏰', subLabel: 'Total presence.' },
];

const TIME_WINDOW_OPTIONS = [
  { label: 'Morning', value: 'morning', icon: '🌅', range: { start: 5, end: 11 }, subLabel: 'Start with intent.' },
  { label: 'Afternoon', value: 'afternoon', icon: '☀️', range: { start: 12, end: 17 }, subLabel: 'Reconnect mid-day.' },
  { label: 'Night', value: 'night', icon: '🌙', range: { start: 18, end: 23 }, subLabel: 'Calm before rest.' },
];

const CircularWeekDial = ({ currentWeek, onWeekChange }: { currentWeek: number, onWeekChange: (week: number) => void }) => {
  const rotation = useSharedValue(0);
  const trackSize = SCREEN_WIDTH * 0.85;
  const RADIUS = (trackSize / 2) - 15;
  const CENTER = trackSize / 2;

  useEffect(() => {
    const angle = ((currentWeek - 1) / 41) * 300 - 150;
    rotation.value = angle;
  }, []);

  const gesture = Gesture.Pan().onUpdate((e) => {
    'worklet';
    const angle = Math.atan2(e.y - CENTER, e.x - CENTER) * (180 / Math.PI);
    let normalizedAngle = angle + 90;
    while (normalizedAngle > 180) normalizedAngle -= 360;
    while (normalizedAngle < -180) normalizedAngle += 360;
    if (normalizedAngle < -150) normalizedAngle = -150;
    if (normalizedAngle > 150) normalizedAngle = 150;
    rotation.value = normalizedAngle;
    const week = Math.round(((normalizedAngle + 150) / 300) * 41) + 1;
    if (week >= 1 && week <= 42) {
      runOnJS(onWeekChange)(week);
      runOnJS(Vibration.vibrate)(1);
    }
  });

  const animatedHandleStyle = useAnimatedStyle(() => {
    const angleRad = (rotation.value - 90) * (Math.PI / 180);
    return {
      transform: [
        { translateX: RADIUS * Math.cos(angleRad) },
        { translateY: RADIUS * Math.sin(angleRad) },
      ],
    };
  });

  return (
    <View style={[styles.circularDialContainer, { height: trackSize + scale(40) }]}>
      <GestureDetector gesture={gesture}>
        <View style={[styles.circularTrack, { width: trackSize, height: trackSize, borderRadius: trackSize / 2 }]}>
          <View style={[styles.circularGlow, { width: trackSize + scale(20), height: trackSize + scale(20), borderRadius: (trackSize + scale(20)) / 2 }]} />
          <View style={[styles.ringWrapperLarge, { width: trackSize * 0.7, height: trackSize * 0.7, borderRadius: (trackSize * 0.7) / 2 }]}>
            <View style={styles.glowRingInnerLarge}>
              <Text style={styles.dialWeekNumLarge}>{currentWeek}</Text>
              <Text style={styles.dialWeekLabelLarge}>WEEK</Text>
            </View>
          </View>
          <Animated.View style={[styles.dialHandle, animatedHandleStyle]} />
        </View>
      </GestureDetector>
      <View style={[styles.dialScaleContainer, { width: trackSize }]}>
        <Text style={styles.scaleText}>1</Text>
        <Text style={styles.scaleText}>42</Text>
      </View>
    </View>
  );
};

const ChronosStrip = ({ range, duration, selectedTime, onTimeChange }: { range: { start: number, end: number }, duration: number, selectedTime: string, onTimeChange: (time: string) => void }) => {
  const scrollX = useSharedValue(0);
  const glowValue = useSharedValue(1);

  const generateTimes = () => {
    const t = [];
    for (let h = range.start; h <= range.end; h++) {
      for (let m = 0; m < 60; m += 15) {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const timeStr = `${displayH < 10 ? '0' + displayH : displayH}:${m === 0 ? '00' : m} ${period}`;
        t.push(timeStr);
      }
    }
    return t;
  };

  const times = generateTimes();

  const calculateEndTime = (startTimeStr: string) => {
    if (!startTimeStr) return "--:--";
    const [time, period] = startTimeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    const date = new Date();
    date.setHours(h, m + duration, 0);

    let endH = date.getHours();
    const endM = date.getMinutes();
    const endPeriod = endH >= 12 ? 'PM' : 'AM';
    endH = endH % 12 || 12;

    return `${endH < 10 ? '0' + endH : endH}:${endM < 10 ? '0' + endM : endM} ${endPeriod}`;
  };

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowValue.value }],
    opacity: interpolate(glowValue.value, [1, 1.2], [1, 0.7])
  }));

  const StripItem = ({ time, index }: { time: string, index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const distance = Math.abs(scrollX.value - index * scale(100));
      const scaleVal = interpolate(distance, [0, scale(100)], [2.2, 0.7], Extrapolate.CLAMP);
      const opacity = interpolate(distance, [0, scale(150)], [1, 0.1], Extrapolate.CLAMP);

      return { transform: [{ scale: scaleVal }], opacity };
    });

    return (
      <View style={styles.stripItem}>
        <View style={styles.stripTick} />
        <Animated.Text style={[styles.stripText, animatedStyle]}>{time}</Animated.Text>
      </View>
    );
  };

  return (
    <View style={styles.chronosContainer}>
      <View style={styles.chronosHeader}>
        <View style={styles.timeLabelBox}>
          <Text style={styles.timeLabelText}>START</Text>
          <Text style={styles.timeValueText}>{selectedTime || '--:--'}</Text>
        </View>
        <View style={styles.durationIndicator}>
          <View style={styles.durationLine} />
          <Text style={styles.durationText}>{duration} MIN</Text>
          <View style={styles.durationLine} />
        </View>
        <Animated.View style={[styles.timeLabelBox, animatedGlowStyle]}>
          <Text style={styles.timeLabelText}>END</Text>
          <Text style={styles.timeValueTextActive}>{calculateEndTime(selectedTime)}</Text>
        </Animated.View>
      </View>

      <View style={styles.stripOuterWrapper}>
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.25, y: 0 }}
          style={styles.edgeGradientLeft}
          pointerEvents="none"
        />
        <View style={styles.stripWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={scale(100)}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SCREEN_WIDTH / 2 - scale(50) }}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              scrollX.value = x;
              const index = Math.round(x / scale(100));

              if (index >= 0 && index < times.length && times[index] !== selectedTime) {
                onTimeChange(times[index]);
                Vibration.vibrate(10);
                glowValue.value = withSequence(
                  withTiming(1.2, { duration: 100 }),
                  withTiming(1, { duration: 200 })
                );
              }
            }}
            scrollEventThrottle={16}
          >
            {times.map((t, i) => (
              <StripItem key={t} time={t} index={i} />
            ))}
          </ScrollView>
          <View style={styles.stripPointer} pointerEvents="none" />
        </View>
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#FFFFFF']}
          start={{ x: 0.75, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.edgeGradientRight}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

const StepHeader = memo(({ title, subtitle }: { title: string, subtitle: string }) => (
  <Animated.View entering={FadeInUp.duration(600)} style={styles.stepHeader}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </Animated.View>
));

export default function Register() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { isEditMode, prefill } = (route.params as any) || {};

  const { user, fetchProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [step, isEditMode]);

  // Registration State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userSex, setUserSex] = useState('');
  const [userDOB, setUserDOB] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [relationship, setRelationship] = useState('');
  const [stage, setStage] = useState<'pregnancy' | 'child' | ''>('');
  const [pregnancyWeek, setPregnancyWeek] = useState(1);
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childDOB, setChildDOB] = useState('');
  const [childTimeOfBirth, setChildTimeOfBirth] = useState('');
  const [childSex, setChildSex] = useState('');
  const [diet, setDiet] = useState('');
  const [subDiet, setSubDiet] = useState('');
  const [planType, setPlanType] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [specificTime, setSpecificTime] = useState('');

  useEffect(() => {
    if (isEditMode && prefill) {
      if (prefill.firstName) setFirstName(prefill.firstName);
      if (prefill.lastName) setLastName(prefill.lastName);
      if (prefill.userSex) setUserSex(prefill.userSex);

      // Sanitize DOB to YYYY-MM-DD
      if (prefill.userDOB) {
        const dobStr = prefill.userDOB.split('T')[0];
        setUserDOB(dobStr);
      }

      if (prefill.maritalStatus) setMaritalStatus(prefill.maritalStatus);
      if (prefill.relationship) setRelationship(prefill.relationship);
      if (prefill.stage) setStage(prefill.stage);
      if (prefill.pregnancyWeek) setPregnancyWeek(prefill.pregnancyWeek);
      if (prefill.childFirstName) setChildFirstName(prefill.childFirstName);
      if (prefill.childLastName) setChildLastName(prefill.childLastName);

      if (prefill.childDOB) {
        const cDobStr = prefill.childDOB.split('T')[0];
        setChildDOB(cDobStr);
      }

      if (prefill.childTimeOfBirth) setChildTimeOfBirth(prefill.childTimeOfBirth);
      if (prefill.childSex) setChildSex(prefill.childSex);

      // Handle Food Philosophy parsing (e.g., "Vegetarian - Standard Veg")
      if (prefill.diet_preference) {
        const parts = prefill.diet_preference.split(' - ');
        if (parts.length === 2) {
          setDiet(parts[0]);
          setSubDiet(parts[1]);
        } else {
          setDiet(prefill.diet_preference);
        }
      }

      if (prefill.planType) setPlanType(prefill.planType);
      if (prefill.timeOfDay) setTimeOfDay(prefill.timeOfDay);
      if (prefill.specificTime) setSpecificTime(prefill.specificTime);
    }
  }, [prefill, isEditMode]);

  const showAlert = (title: string, message: string, icon: string = '⚠️') => {
    setModalConfig({ title, message, icon });
    setModalVisible(true);
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', icon: '' });

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !userSex || !userDOB || !maritalStatus)
        return showAlert('Wait', 'Please complete your profile details', '👤');
    }
    if (step === 2 && !relationship) return showAlert('Wait', 'Select your role', '🤝');
    if (step === 3 && !stage) return showAlert('Wait', 'Select your stage', '🌱');
    if (step === 4) {
      if (stage === 'child') {
        if (!childFirstName || !childLastName || !childDOB || !childTimeOfBirth) return showAlert('Wait', 'Enter child details including time of birth', '👶');
      }
    }
    if (step === 5 && (!diet || !subDiet)) return showAlert('Wait', 'Select your food philosophy', '🥗');
    if (step === 6 && !planType) return showAlert('Wait', 'Complete your daily commitment', '⏰');

    if (step === 6) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const finalDiet = `${diet} - ${subDiet}`;

      await directusService.updateUser(user.id, {
        first_name: firstName,
        last_name: lastName,
        sex: userSex,
        dob: userDOB,
        marital_status: maritalStatus,
        full_name: `${firstName} ${lastName}`.trim() || relationship,
        role: relationship,
        current_week: stage === 'pregnancy' ? pregnancyWeek : null,
        stage: stage,
        onboarding_complete: true
      });

      if (stage === 'pregnancy') {
        const pregInfo = {
          user_id: user.id,
          diet_preference: finalDiet
        };

        if (isEditMode && user?.pregnancy_info?.id) {
          await directusService.updatePregnancyInfo(user.pregnancy_info.id, pregInfo);
        } else {
          await directusService.savePregnancyInfo(pregInfo);
        }
      } else {
        const childInfo = {
          user_id: user.id,
          name: `${childFirstName} ${childLastName}`,
          dob: childDOB,
          time_of_birth: childTimeOfBirth,
          sex: childSex,
          diet_preference: finalDiet,
          preferred_plan: planType,
          time_of_day: timeOfDay,
          base_wake_window_minutes: PLAN_OPTIONS.find(o => o.value === planType)?.duration || 20
        };

        if (isEditMode && user?.children?.[0]?.id) {
          await directusService.updateChild(user.children[0].id, childInfo);
        } else {
          await directusService.createChild(childInfo);
        }
      }

      await fetchProfile();
      isEditMode ? navigation.goBack() : navigation.replace('Home');
    } catch (error: any) {
      showAlert('Setup Failed', 'We couldn\'t save your preferences. Please check your connection.', '❌');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (isEditMode) {
        navigation.goBack();
      } else {
        setShowExitModal(true);
      }
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <NeevModal
          visible={showExitModal}
          title="Pause Your Journey?"
          message="Your personalized path is almost ready. If you leave now, you'll need to start your profile setup again. Stay and continue?"
          icon="🌱"
          confirmText="Stay & Continue"
          cancelText="Leave"
          onConfirm={() => setShowExitModal(false)}
          onCancel={() => {
            setShowExitModal(false);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={moderateScale(28)} color={Theme.colors.primary} />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
              </View>
              <Text style={styles.stepIndicator}>Step {step} of 6</Text>
            </View>

            {step === 1 && (
              <View style={styles.stepOneContainer}>
                <StepHeader title={isEditMode ? 'Update Your Profile' : 'Tell Us About You'} subtitle="Let's start by getting to know you better" />
                <View style={[styles.form, { gap: verticalScale(14) }]}>
                  <View style={styles.row}>
                    <View style={styles.inputGroupFull}>
                      <Text style={styles.fieldLabel}>First Name</Text>
                      <TextInput
                        style={styles.inputSmall}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First Name"
                        placeholderTextColor="#B0BDB5"
                      />
                    </View>
                    <View style={styles.inputGroupFull}>
                      <Text style={styles.fieldLabel}>Last Name</Text>
                      <TextInput
                        style={styles.inputSmall}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last Name"
                        placeholderTextColor="#B0BDB5"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>Sex</Text>
                    <View style={styles.row}>
                      {[
                        { label: 'Male' },
                        { label: 'Female' },
                        { label: 'Other' }
                      ].map(s => (
                        <TouchableOpacity
                          key={s.label}
                          style={[styles.sexBtnNoEmoji, userSex === s.label && styles.cardActive]}
                          onPress={() => setUserSex(s.label)}
                        >
                          <Text style={[styles.label, userSex === s.label && styles.labelActive]}>{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <DatePickerField label="Your Birth Date" value={userDOB} onChange={setUserDOB} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>Marital Status</Text>
                    <View style={styles.gridStep1Compact}>
                      {MARITAL_STATUS_OPTIONS.map((o, i) => (
                        <Animated.View key={o.label} entering={FadeInRight.delay(i * 30)} style={styles.gridItemStep1Compact}>
                          <TouchableOpacity
                            style={[styles.cardStep1NoEmoji, maritalStatus === o.label && styles.cardActive]}
                            onPress={() => setMaritalStatus(o.label)}
                          >
                            <Text style={styles.labelStep1} numberOfLines={1}>{o.label}</Text>
                          </TouchableOpacity>
                        </Animated.View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <StepHeader title="Your Special Connection" subtitle="We'd love to know your role in the child's life" />
                <View style={styles.gridStep1}>
                  {RELATIONSHIP_OPTIONS.map((o, i) => (
                    <Animated.View key={o.label} entering={FadeInRight.delay(i * 30)} style={styles.gridItemStep1}>
                      <TouchableOpacity
                        style={[styles.cardStep1, relationship === o.label && styles.cardActive]}
                        onPress={() => setRelationship(o.label)}
                      >
                        <AppEmoji style={styles.emojiStep1}>{o.emoji}</AppEmoji>
                        <Text style={styles.labelStep1} numberOfLines={1}>{o.label}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <StepHeader title="Your Current Chapter" subtitle="Tell us which beautiful path you are currently on" />
                <View style={styles.verticalStack}>
                  <Animated.View entering={FadeInUp.delay(100)}>
                    <TouchableOpacity
                      style={[styles.stageCardFull, stage === 'pregnancy' && styles.cardActive]}
                      onPress={() => setStage('pregnancy')}
                    >
                      <View style={styles.stageIconContainerLarge}>
                        <AppEmoji style={styles.emojiExtraLarge}>🤰</AppEmoji>
                      </View>
                      <View style={styles.stageTextContainer}>
                        <Text style={styles.labelExtraLarge}>Expecting a Baby</Text>
                        <Text style={styles.stageSubtextLarge}>I'm on my wonderful pregnancy journey</Text>
                      </View>
                      {stage === 'pregnancy' && (
                        <View style={styles.checkBadge}>
                           <Ionicons name="checkmark-circle" size={moderateScale(28)} color={Theme.colors.secondary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(300)}>
                    <TouchableOpacity
                      style={[styles.stageCardFull, stage === 'child' && styles.cardActive]}
                      onPress={() => setStage('child')}
                    >
                      <View style={styles.stageIconContainerLarge}>
                        <AppEmoji style={styles.emojiExtraLarge}>👶</AppEmoji>
                      </View>
                      <View style={styles.stageTextContainer}>
                        <Text style={styles.labelExtraLarge}>Parenting</Text>
                        <Text style={styles.stageSubtextLarge}>My child is already here and exploring the world</Text>
                      </View>
                      {stage === 'child' && (
                        <View style={styles.checkBadge}>
                           <Ionicons name="checkmark-circle" size={moderateScale(28)} color={Theme.colors.secondary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            )}

            {step === 4 && (
              <View>
                <StepHeader
                  title={stage === 'pregnancy' ? "Your Amazing Journey" : "Little One's Identity"}
                  subtitle={stage === 'pregnancy' ? "Which week of pregnancy are you currently in?" : "Let's capture the basics of your child's beautiful world."}
                />
                {stage === 'pregnancy' ? (
                  <CircularWeekDial currentWeek={pregnancyWeek} onWeekChange={setPregnancyWeek} />
                ) : (
                  <View style={styles.form}>
                    <View style={styles.nameInputWrapper}>
                      <AppEmoji style={styles.bigBabyEmoji}>👶</AppEmoji>
                      <View style={{ flex: 1, gap: verticalScale(14) }}>
                        <View style={styles.inputGroupFull}>
                          <Text style={styles.fieldLabel}>First Name ✍️</Text>
                          <TextInput
                            style={styles.input}
                            value={childFirstName}
                            onChangeText={setChildFirstName}
                            placeholder="First Name"
                            placeholderTextColor="#B0BDB5"
                          />
                        </View>
                        <View style={styles.inputGroupFull}>
                          <Text style={styles.fieldLabel}>Last Name ✍️</Text>
                          <TextInput
                            style={styles.input}
                            value={childLastName}
                            onChangeText={setChildLastName}
                            placeholder="Last Name"
                            placeholderTextColor="#B0BDB5"
                          />
                        </View>
                      </View>
                    </View>

                    <DatePickerField label="Birth Date 🎂" value={childDOB} onChange={setChildDOB} />
                    <TimePickerField label="Time of Birth 🕒" value={childTimeOfBirth} onChange={setChildTimeOfBirth} />

                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>Gender 🦋</Text>
                      <View style={styles.row}>
                        {[
                          { label: 'Male', emoji: '👦' },
                          { label: 'Female', emoji: '👧' },
                          { label: 'Other', emoji: '✨' }
                        ].map(s => (
                          <TouchableOpacity
                            key={s.label}
                            style={[styles.sexBtn, childSex === s.label && styles.cardActive]}
                            onPress={() => setChildSex(s.label)}
                          >
                            <AppEmoji style={styles.sexEmoji}>{s.emoji}</AppEmoji>
                            <Text style={[styles.label, childSex === s.label && styles.labelActive]}>{s.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {step === 5 && (
              <View>
                <StepHeader title="Your Food Philosophy" subtitle="Every family has a unique rhythm. What's yours?" />
                <View style={diet ? styles.splitLayout : styles.gridVertical}>
                  <View style={diet ? styles.leftCol : { width: '100%' }}>
                    {DIET_OPTIONS.map((o, i) => (
                      <Animated.View
                        key={o.label}
                        layout={Layout.springify()}
                        entering={FadeInLeft.delay(i * 100)}
                        style={diet ? styles.compactWrapper : { width: '100%', marginBottom: verticalScale(16) }}
                      >
                        <TouchableOpacity
                          style={[
                            diet ? styles.compactCard : styles.listItem,
                            diet === o.label && styles.cardActive
                          ]}
                          onPress={() => {
                            setDiet(o.label);
                            setSubDiet('');
                          }}
                        >
                          <View style={diet ? styles.compactContent : styles.listItemLeading}>
                            <AppEmoji style={diet ? styles.emojiMedium : styles.emojiExtraLarge}>{o.emoji}</AppEmoji>
                            <View style={diet ? { alignItems: 'center' } : { flex: 1 }}>
                              <Text style={diet ? styles.labelMedium : styles.labelExtraLarge}>{o.label}</Text>
                              <Text style={diet ? styles.labelSubLargeResponsive : styles.labelSubLarge}>{o.subLabel}</Text>
                            </View>
                          </View>
                          {!diet && diet === o.label && <Ionicons name="checkmark-circle" size={moderateScale(24)} color={Theme.colors.secondary} />}
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>

                  {diet && (
                    <Animated.View entering={FadeInRight.duration(400)} style={styles.rightCol}>
                      {SUB_DIET_OPTIONS[diet].map((sub: any) => (
                        <TouchableOpacity
                          key={sub.label}
                          style={[styles.subOptionSideItem, subDiet === sub.label && styles.subOptionActive]}
                          onPress={() => setSubDiet(sub.label)}
                        >
                          <AppEmoji style={styles.emojiLarge}>{sub.emoji}</AppEmoji>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.subOptionSideLabel}>{sub.label}</Text>
                            <Text style={styles.subOptionSideSubLabel} numberOfLines={3}>{sub.subLabel}</Text>
                          </View>
                          {subDiet === sub.label && <Ionicons name="checkmark-circle" size={moderateScale(20)} color={Theme.colors.secondary} />}
                        </TouchableOpacity>
                      ))}
                    </Animated.View>
                  )}
                </View>
              </View>
            )}

            {step === 6 && (
              <View>
                <StepHeader title="Daily Commitment" subtitle="Design a pace that flows naturally with your lifestyle." />
                <View style={styles.gridStep1}>
                  {PLAN_OPTIONS.map((p, i) => (
                    <Animated.View key={p.value} entering={FadeInRight.delay(i * 100)} style={styles.gridItemStep1}>
                      <TouchableOpacity
                        style={[styles.cardStep1, planType === p.value && styles.cardActive]}
                        onPress={() => setPlanType(p.value)}
                      >
                        <Text style={{ fontSize: scale(32), marginBottom: 8 }}>{p.icon}</Text>
                        <Text style={styles.labelStep1}>{p.label}</Text>
                        <Text style={{ fontSize: scale(10), color: Theme.colors.textLight, textAlign: 'center' }}>{p.subLabel}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.disabled]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Theme.colors.primary} /> : <Text style={styles.nextBtnTxt}>{step === 6 ? 'Complete Profile' : 'Next Step'}</Text>}
            </TouchableOpacity>

            <View style={{ height: verticalScale(30) }} />
          </ScrollView>
        </KeyboardAvoidingView>

        <NeevModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          icon={modalConfig.icon}
          onConfirm={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: scale(24), paddingTop: verticalScale(10) },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    borderRadius: scale(20),
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    marginBottom: verticalScale(12),
    ...Theme.shadows.soft
  },
  progressContainer: { marginBottom: verticalScale(12) },
  progressBar: {
    height: verticalScale(6),
    backgroundColor: Theme.colors.accent,
    borderRadius: moderateScale(3),
    overflow: 'hidden',
    marginBottom: verticalScale(8)
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.secondary,
    borderRadius: moderateScale(3)
  },
  stepIndicator: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  stepHeader: { marginBottom: verticalScale(12), alignItems: 'center' },
  title: { fontSize: moderateScale(28), fontWeight: '800', color: Theme.colors.primary, marginBottom: verticalScale(2), textAlign: 'center' },
  subtitle: { fontSize: moderateScale(14), color: Theme.colors.textLight, lineHeight: moderateScale(20), fontWeight: '500', textAlign: 'center' },
  gridStep1: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -scale(6) },
  gridItemStep1: { width: '33.33%', padding: scale(6) },
  cardStep1: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    aspectRatio: 1,
    justifyContent: 'center',
    ...Theme.shadows.soft
  },
  cardActive: {
    borderColor: Theme.colors.secondary,
    backgroundColor: Theme.colors.softGreen
  },
  emojiStep1: { fontSize: moderateScale(32), marginBottom: verticalScale(6) },
  emojiStep1Small: { fontSize: moderateScale(24), marginBottom: verticalScale(4) },
  labelStep1: { fontSize: moderateScale(12), color: Theme.colors.primary, textAlign: 'center', fontWeight: '800' },
  label: { fontSize: moderateScale(13), color: Theme.colors.primary, textAlign: 'center', fontWeight: '700' },
  labelActive: { color: Theme.colors.primary },
  checkBadge: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    zIndex: 10,
  },
  row: { flexDirection: 'row', gap: scale(12) },

  stepOneContainer: {
    flex: 1,
    minHeight: verticalScale(500),
  },
  gridStep1Compact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scale(4)
  },
  gridItemStep1Compact: {
    width: '33.33%',
    padding: scale(4)
  },
  cardStep1NoEmoji: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(15),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    justifyContent: 'center',
    ...Theme.shadows.soft
  },
  sexBtnNoEmoji: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: moderateScale(15),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  inputSmall: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: moderateScale(15),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(15),
    color: Theme.colors.primary,
    fontWeight: '600'
  },

  verticalStack: { gap: verticalScale(16), marginTop: verticalScale(10) },
  stageCardFull: {
    width: '100%',
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(24),
    padding: moderateScale(32),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: verticalScale(160)
  },
  stageIconContainerLarge: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: Theme.colors.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(24)
  },
  emojiExtraLarge: { fontSize: moderateScale(50) },
  stageTextContainer: { flex: 1 },
  labelExtraLarge: { fontSize: moderateScale(28), fontWeight: '800', color: Theme.colors.primary, marginBottom: verticalScale(6) },
  stageSubtextLarge: { fontSize: moderateScale(18), color: Theme.colors.textLight, fontWeight: '600' },

  circularDialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(30),
    width: '100%',
  },
  circularTrack: {
    borderWidth: 4,
    borderColor: Theme.colors.softGreenBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  circularGlow: {
    position: 'absolute',
    backgroundColor: Theme.colors.secondary,
    opacity: 0.05
  },
  ringWrapperLarge: {
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft,
    elevation: 12,
    borderWidth: 1,
    borderColor: Theme.colors.softGreenBorder,
  },
  glowRingInnerLarge: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  dialWeekNumLarge: {
    fontSize: moderateScale(90),
    fontWeight: '900',
    color: Theme.colors.primary,
    lineHeight: moderateScale(98)
  },
  dialWeekLabelLarge: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.textLight,
    letterSpacing: 2
  },
  dialHandle: {
    position: 'absolute',
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: Theme.colors.secondary,
    borderWidth: 4,
    borderColor: Theme.colors.white,
    ...Theme.shadows.soft,
    elevation: 15,
    zIndex: 20
  },
  dialScaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    marginTop: verticalScale(10)
  },
  scaleText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: Theme.colors.textLight
  },

  fieldLabel: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.primary, marginBottom: verticalScale(6), textAlign: 'center' },
  form: { gap: verticalScale(14) },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    marginBottom: -verticalScale(4)
  },
  bigBabyEmoji: {
    fontSize: moderateScale(50),
    marginTop: verticalScale(10)
  },
  inputGroupFull: {
    flex: 1,
    gap: verticalScale(4)
  },
  input: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: moderateScale(15),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
    color: Theme.colors.primary,
    fontWeight: '600'
  },
  sexBtn: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: moderateScale(15),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  sexEmoji: {
    fontSize: moderateScale(24),
    marginBottom: verticalScale(4)
  },
  gridVertical: { gap: verticalScale(16) },
  listItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.white,
    padding: moderateScale(32),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: verticalScale(140)
  },
  listItemLeading: { flexDirection: 'row', alignItems: 'center', gap: scale(20) },
  labelLarge: { fontSize: moderateScale(28), fontWeight: '800', color: Theme.colors.primary },
  labelSubLarge: { fontSize: moderateScale(18), color: Theme.colors.textLight, fontWeight: '600', marginTop: verticalScale(4) },
  emojiExtraLarge: { fontSize: moderateScale(50) },
  emojiLarge: { fontSize: moderateScale(50) },
  emojiMedium: { fontSize: moderateScale(34), marginRight: scale(12) },

  splitLayout: { flexDirection: 'row', gap: scale(12), marginTop: verticalScale(8) },
  leftCol: { width: '38%' },
  rightCol: { flex: 1, gap: scale(12) },
  compactWrapper: { width: '100%', marginBottom: verticalScale(8) },
  compactCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: verticalScale(140)
  },
  compactCardSmall: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: verticalScale(100)
  },
  compactContent: { alignItems: 'center', justifyContent: 'center', gap: verticalScale(2) },
  labelMedium: { fontSize: moderateScale(12), fontWeight: '900', color: Theme.colors.primary, textAlign: 'center' },
  labelSubLargeResponsive: { fontSize: moderateScale(14), color: Theme.colors.textLight, fontWeight: '700', textAlign: 'center', marginTop: verticalScale(2), lineHeight: moderateScale(14) },
  subOptionSideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: moderateScale(18),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: verticalScale(120)
  },
  subOptionSideItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: moderateScale(10),
    borderRadius: moderateScale(18),
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: verticalScale(80)
  },
  subOptionActive: {
    borderColor: Theme.colors.secondary,
    backgroundColor: Theme.colors.softGreen
  },
  subOptionSideLabel: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: verticalScale(4)
  },
  subOptionSideSubLabel: {
    fontSize: moderateScale(13),
    color: Theme.colors.textLight,
    fontWeight: '600',
    lineHeight: moderateScale(16)
  },

  sectionLabelSmall: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: verticalScale(6),
    marginTop: verticalScale(4),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center'
  },

  chronosContainer: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(10),
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft
  },
  chronosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10)
  },
  timeLabelBox: { alignItems: 'center' },
  timeLabelText: { fontSize: moderateScale(8), fontWeight: '800', color: Theme.colors.textLight, letterSpacing: 1, marginBottom: verticalScale(2) },
  timeValueText: { fontSize: moderateScale(14), fontWeight: '800', color: Theme.colors.primary },
  timeValueTextActive: { fontSize: moderateScale(14), fontWeight: '900', color: Theme.colors.secondary },
  durationIndicator: { alignItems: 'center', flex: 1 },
  durationLine: { height: 1, backgroundColor: Theme.colors.softGreenBorder, width: '30%' },
  durationText: { fontSize: moderateScale(9), fontWeight: '900', color: Theme.colors.secondary, marginVertical: verticalScale(2) },

  stripOuterWrapper: {
    height: verticalScale(55),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  stripWrapper: {
    height: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  stripItem: { width: scale(100), alignItems: 'center', justifyContent: 'center' },
  stripTick: { width: scale(2), height: verticalScale(10), backgroundColor: Theme.colors.accent, borderRadius: moderateScale(1), marginBottom: verticalScale(6) },
  stripText: { fontSize: moderateScale(11), fontWeight: '700' },
  stripPointer: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    width: scale(4),
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: scale(2),
    opacity: 0.8,
    zIndex: 10
  },
  edgeGradientLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: scale(60),
    zIndex: 5
  },
  edgeGradientRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: scale(60),
    zIndex: 5
  },

  nextBtn: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(30),
    alignItems: 'center',
    marginTop: verticalScale(12),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.soft
  },
  nextBtnTxt: { fontSize: moderateScale(18), fontWeight: '900', color: Theme.colors.primary, letterSpacing: 1 },
  disabled: { opacity: 0.5 }
});
