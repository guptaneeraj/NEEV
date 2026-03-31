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
  Dimensions,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { Theme } from '../../../constants/Theme';
import DatePickerField from '../../../components/DatePickerField';
import LinearGradient from 'react-native-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
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

const { width, height } = Dimensions.get('window');

// Responsive utility
const hp = (percentage: number) => height * (percentage / 100);

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

const API_URL = "https://api.neevios.com";

const CircularWeekDial = ({ currentWeek, onWeekChange }: { currentWeek: number, onWeekChange: (week: number) => void }) => {
  const rotation = useSharedValue(0);
  const trackSize = width * 0.85;
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
    <View style={[styles.circularDialContainer, { height: trackSize + 40 }]}>
      <GestureDetector gesture={gesture}>
        <View style={[styles.circularTrack, { width: trackSize, height: trackSize, borderRadius: trackSize / 2 }]}>
          <View style={[styles.circularGlow, { width: trackSize + 20, height: trackSize + 20, borderRadius: (trackSize + 20) / 2 }]} />
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
      const distance = Math.abs(scrollX.value - index * 100);
      const scale = interpolate(distance, [0, 100], [2.2, 0.7], Extrapolate.CLAMP);
      const opacity = interpolate(distance, [0, 150], [1, 0.1], Extrapolate.CLAMP);
      const color = distance < 50 ? Theme.colors.secondary : Theme.colors.textLight;

      return { transform: [{ scale }], opacity, color };
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
            snapToInterval={100}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: width / 2 - 50 }}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              scrollX.value = x;
              const index = Math.round(x / 100);

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
  const { token, fetchProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Registration State
  const [relationship, setRelationship] = useState('');
  const [stage, setStage] = useState<'pregnancy' | 'child' | ''>('');
  const [pregnancyWeek, setPregnancyWeek] = useState(1);
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState('');
  const [childSex, setChildSex] = useState('');
  const [diet, setDiet] = useState('');
  const [subDiet, setSubDiet] = useState('');
  const [planType, setPlanType] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [specificTime, setSpecificTime] = useState('');

  const handleNext = () => {
    if (step === 1 && !relationship) return Alert.alert('Wait', 'Select your role');
    if (step === 2 && !stage) return Alert.alert('Wait', 'Select your stage');
    if (step === 3) {
      if (stage === 'child') {
        if (!childName || !childDOB) return Alert.alert('Wait', 'Enter child details');
      }
    }
    if (step === 4 && (!diet || !subDiet)) return Alert.alert('Wait', 'Select your food philosophy');
    if (step === 5 && (!planType || !timeOfDay || !specificTime)) return Alert.alert('Wait', 'Complete your daily commitment');

    if (step === 5) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalDiet = `${diet} - ${subDiet}`;

      await axios.patch(`${API_URL}/api/user/update`, {
        relationship_type: relationship,
        preferred_plan_type: planType,
        preferred_time_of_day: timeOfDay,
        preferred_activity_time: specificTime,
        stage: stage,
        onboarding_complete: true
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (stage === 'pregnancy') {
        await axios.post(`${API_URL}/api/user/pregnancy`, {
          pregnant_person_name: 'Self',
          is_user_pregnant: true,
          relationship_to_pregnant: 'Self',
          current_week: pregnancyWeek,
          diet_preference: finalDiet
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/user/child`, {
          name: childName,
          dob: childDOB,
          sex: childSex,
          diet_preference: finalDiet
        }, { headers: { Authorization: `Bearer ${token}` } });
      }

      await fetchProfile();
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert('Setup Failed', 'We couldn\'t save your preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
              <Ionicons name="arrow-back" size={28} color={Theme.colors.primary} />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
              </View>
              <Text style={styles.stepIndicator}>Step {step} of 5</Text>
            </View>

            {step === 1 && (
              <View>
                <StepHeader title="Your Special Connection" subtitle="We'd love to know your role in the child's life" />
                <View style={styles.gridStep1}>
                  {RELATIONSHIP_OPTIONS.map((o, i) => (
                    <Animated.View key={o.label} entering={FadeInRight.delay(i * 30)} style={styles.gridItemStep1}>
                      <TouchableOpacity
                        style={[styles.cardStep1, relationship === o.label && styles.cardActive]}
                        onPress={() => setRelationship(o.label)}
                      >
                        <Text style={styles.emojiStep1}>{o.emoji}</Text>
                        <Text style={styles.labelStep1} numberOfLines={1}>{o.label}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <StepHeader title="Your Current Chapter" subtitle="Tell us which beautiful path you are currently on" />
                <View style={styles.verticalStack}>
                  <Animated.View entering={FadeInUp.delay(100)}>
                    <TouchableOpacity
                      style={[styles.stageCardFull, stage === 'pregnancy' && styles.cardActive]}
                      onPress={() => setStage('pregnancy')}
                    >
                      <View style={styles.stageIconContainerLarge}>
                        <Text style={styles.emojiExtraLarge}>🤰</Text>
                      </View>
                      <View style={styles.stageTextContainer}>
                        <Text style={styles.labelExtraLarge}>Expecting a Baby</Text>
                        <Text style={styles.stageSubtextLarge}>I'm on my wonderful pregnancy journey</Text>
                      </View>
                      {stage === 'pregnancy' && (
                        <Ionicons name="checkmark-circle" size={28} color={Theme.colors.secondary} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(300)}>
                    <TouchableOpacity
                      style={[styles.stageCardFull, stage === 'child' && styles.cardActive]}
                      onPress={() => setStage('child')}
                    >
                      <View style={styles.stageIconContainerLarge}>
                        <Text style={styles.emojiExtraLarge}>👶</Text>
                      </View>
                      <View style={styles.stageTextContainer}>
                        <Text style={styles.labelExtraLarge}>Parenting</Text>
                        <Text style={styles.stageSubtextLarge}>My child is already here and exploring the world</Text>
                      </View>
                      {stage === 'child' && (
                        <Ionicons name="checkmark-circle" size={28} color={Theme.colors.secondary} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            )}

            {step === 3 && (
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
                      <Text style={styles.bigBabyEmoji}>👶</Text>
                      <View style={styles.inputGroupFull}>
                        <Text style={styles.fieldLabel}>Child's Name ✍️</Text>
                        <TextInput
                          style={styles.input}
                          value={childName}
                          onChangeText={setChildName}
                          placeholder="Enter name"
                          placeholderTextColor="#B0BDB5"
                        />
                      </View>
                    </View>

                    <DatePickerField label="Birth Date 🎂" value={childDOB} onChange={setChildDOB} />

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
                            <Text style={styles.sexEmoji}>{s.emoji}</Text>
                            <Text style={[styles.label, childSex === s.label && styles.labelActive]}>{s.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {step === 4 && (
              <View>
                <StepHeader title="Your Food Philosophy" subtitle="Every family has a unique rhythm. What's yours?" />
                <View style={diet ? styles.splitLayout : styles.gridVertical}>
                  <View style={diet ? styles.leftCol : { width: '100%' }}>
                    {DIET_OPTIONS.map((o, i) => (
                      <Animated.View
                        key={o.label}
                        layout={Layout.springify()}
                        entering={FadeInLeft.delay(i * 100)}
                        style={diet ? styles.compactWrapper : { width: '100%', marginBottom: 16 }}
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
                            <Text style={diet ? styles.emojiMedium : styles.emojiExtraLarge}>{o.emoji}</Text>
                            <View style={diet ? { alignItems: 'center' } : { flex: 1 }}>
                              <Text style={diet ? styles.labelMedium : styles.labelExtraLarge}>{o.label}</Text>
                              <Text style={diet ? styles.labelSubLargeResponsive : styles.labelSubLarge}>{o.subLabel}</Text>
                            </View>
                          </View>
                          {!diet && diet === o.label && <Ionicons name="checkmark-circle" size={24} color={Theme.colors.secondary} />}
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
                          <Text style={styles.emojiLarge}>{sub.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.subOptionSideLabel}>{sub.label}</Text>
                            <Text style={styles.subOptionSideSubLabel} numberOfLines={3}>{sub.subLabel}</Text>
                          </View>
                          {subDiet === sub.label && <Ionicons name="checkmark-circle" size={20} color={Theme.colors.secondary} />}
                        </TouchableOpacity>
                      ))}
                    </Animated.View>
                  )}
                </View>
              </View>
            )}

            {step === 5 && (
              <View>
                <StepHeader title="Daily Commitment" subtitle="Design a pace that flows naturally with your lifestyle." />
                <View style={styles.splitLayout}>
                  <View style={styles.leftCol}>
                    {PLAN_OPTIONS.map((p, i) => (
                      <Animated.View
                        key={p.value}
                        layout={Layout.springify()}
                        style={styles.compactWrapper}
                      >
                        <TouchableOpacity
                          style={[styles.compactCardSmall, planType === p.value && styles.cardActive]}
                          onPress={() => setPlanType(p.value)}
                        >
                          <View style={styles.compactContent}>
                            <Text style={styles.emojiMedium}>{p.icon}</Text>
                            <View style={{ alignItems: 'center' }}>
                              <Text style={styles.labelMedium}>{p.label}</Text>
                              <Text style={styles.labelSubLargeResponsive}>{p.subLabel}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>

                  <View style={styles.rightCol}>
                    {TIME_WINDOW_OPTIONS.map((t, i) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.subOptionSideItemSmall, timeOfDay === t.value && styles.subOptionActive]}
                        onPress={() => { setTimeOfDay(t.value); setSpecificTime(''); }}
                      >
                        <Text style={styles.emojiLarge}>{t.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subOptionSideLabel}>{t.label}</Text>
                          <Text style={styles.subOptionSideSubLabel}>{t.subLabel}</Text>
                        </View>
                        {timeOfDay === t.value && <Ionicons name="checkmark-circle" size={20} color={Theme.colors.secondary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {timeOfDay && planType && (
                  <Animated.View entering={FadeInUp} style={{ marginTop: 8 }}>
                    <Text style={styles.sectionLabelSmall}>Set Your Moment</Text>
                    <ChronosStrip
                      range={TIME_WINDOW_OPTIONS.find(o => o.value === timeOfDay)!.range}
                      duration={PLAN_OPTIONS.find(o => o.value === planType)!.duration}
                      selectedTime={specificTime}
                      onTimeChange={setSpecificTime}
                    />
                  </Animated.View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.disabled]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Theme.colors.primary} /> : <Text style={styles.nextBtnTxt}>{step === 5 ? 'Complete Profile' : 'Next Step'}</Text>}
            </TouchableOpacity>

            <View style={{ height: hp(4) }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: hp(2) },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    marginBottom: hp(1.5),
    ...Theme.shadows.soft
  },
  progressContainer: { marginBottom: hp(1.5) },
  progressBar: {
    height: 6,
    backgroundColor: Theme.colors.accent,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.secondary,
    borderRadius: 3
  },
  stepIndicator: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  stepHeader: { marginBottom: hp(1.5), alignItems: 'center' },
  title: { fontSize: hp(3.8), fontWeight: '800', color: Theme.colors.primary, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: hp(1.8), color: Theme.colors.textLight, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
  gridStep1: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItemStep1: { width: '33.33%', padding: 6 },
  cardStep1: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    aspectRatio: 1,
    justifyContent: 'center',
    ...Theme.shadows.soft
  },
  card: {
    width: (width - 48 - 24) / 3,
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft
  },
  cardActive: {
    borderColor: Theme.colors.secondary,
    backgroundColor: Theme.colors.softGreen
  },
  emojiStep1: { fontSize: 32, marginBottom: 6 },
  emoji: { fontSize: 24, marginBottom: 4 },
  labelStep1: { fontSize: 12, color: Theme.colors.primary, textAlign: 'center', fontWeight: '800' },
  label: { fontSize: 13, color: Theme.colors.primary, textAlign: 'center', fontWeight: '700' },
  labelActive: { color: Theme.colors.primary },
  row: { flexDirection: 'row', gap: 16 },

  verticalStack: { gap: 16, marginTop: 10 },
  stageCardFull: {
    width: '100%',
    backgroundColor: Theme.colors.white,
    borderRadius: 24,
    padding: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: hp(20)
  },
  stageIconContainerLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Theme.colors.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24
  },
  emojiExtraLarge: { fontSize: 50 },
  stageTextContainer: { flex: 1 },
  labelExtraLarge: { fontSize: 28, fontWeight: '800', color: Theme.colors.primary, marginBottom: 6 },
  stageSubtextLarge: { fontSize: 18, color: Theme.colors.textLight, fontWeight: '600' },

  circularDialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp(4),
    width: '100%',
    height: width * 0.9
  },
  circularTrack: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    borderWidth: 4,
    borderColor: Theme.colors.softGreenBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  circularGlow: {
    position: 'absolute',
    width: (width * 0.85) + 20,
    height: (width * 0.85) + 20,
    borderRadius: ((width * 0.85) + 20) / 2,
    backgroundColor: Theme.colors.secondary,
    opacity: 0.05
  },
  ringWrapperLarge: {
    width: (width * 0.85) * 0.7,
    height: (width * 0.85) * 0.7,
    borderRadius: ((width * 0.85) * 0.7) / 2,
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
    fontSize: 90,
    fontWeight: '900',
    color: Theme.colors.primary,
    lineHeight: 98
  },
  dialWeekLabelLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textLight,
    letterSpacing: 2
  },
  dialHandle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.secondary,
    borderWidth: 4,
    borderColor: Theme.colors.white,
    ...Theme.shadows.soft,
    elevation: 15,
    zIndex: 20
  },
  dialScaleContainer: {
    flexDirection: 'row',
    width: width * 0.85,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10
  },
  scaleText: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textLight
  },

  fieldLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.primary, marginBottom: 6, textAlign: 'center' },
  form: { gap: 20 },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  bigBabyEmoji: {
    fontSize: 60,
    marginTop: 10
  },
  inputGroupFull: {
    flex: 1,
    gap: 4
  },
  input: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Theme.colors.primary,
    fontWeight: '600'
  },
  sexBtn: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  sexEmoji: {
    fontSize: 24,
    marginBottom: 4
  },
  gridVertical: { gap: 16 },
  listItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.white,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: hp(18)
  },
  listItemLeading: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  labelLarge: { fontSize: 28, fontWeight: '800', color: Theme.colors.primary },
  labelSubLarge: { fontSize: 18, color: Theme.colors.textLight, fontWeight: '600', marginTop: 4 },
  emojiLarge: { fontSize: 54 },
  emojiMedium: { fontSize: 34, marginRight: 12 },
  labelExtraLarge: { fontSize: 28, fontWeight: '800', color: Theme.colors.primary },

  splitLayout: { flexDirection: 'row', gap: 12, marginTop: hp(1) },
  leftCol: { width: '38%' },
  rightCol: { flex: 1, gap: 12 },
  compactWrapper: { width: '100%', marginBottom: hp(1) },
  compactCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: hp(18)
  },
  compactCardSmall: {
    backgroundColor: Theme.colors.white,
    borderRadius: 18,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: hp(12)
  },
  compactContent: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  emojiSmall: { fontSize: 34 },
  labelMedium: { fontSize: 12, fontWeight: '900', color: Theme.colors.primary, textAlign: 'center' },
  labelSubSmall: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '700', textAlign: 'center', marginTop: 2, lineHeight: 10 },
  labelSubLargeResponsive: { fontSize: 14, color: Theme.colors.textLight, fontWeight: '700', textAlign: 'center', marginTop: 2, lineHeight: 14 },
  subOptionSideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: hp(16)
  },
  subOptionSideItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
    minHeight: hp(10)
  },
  subOptionActive: {
    borderColor: Theme.colors.secondary,
    backgroundColor: Theme.colors.softGreen
  },
  subOptionSideLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: 4
  },
  subOptionSideSubLabel: {
    fontSize: 13,
    color: Theme.colors.textLight,
    fontWeight: '600',
    lineHeight: 16
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: 8,
    marginTop: hp(2),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  sectionLabelSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: 6,
    marginTop: hp(0.5),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center'
  },

  chronosContainer: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft
  },
  chronosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  timeLabelBox: { alignItems: 'center' },
  timeLabelText: { fontSize: 8, fontWeight: '800', color: Theme.colors.textLight, letterSpacing: 1, marginBottom: 2 },
  timeValueText: { fontSize: 14, fontWeight: '800', color: Theme.colors.primary },
  timeValueTextActive: { fontSize: 14, fontWeight: '900', color: Theme.colors.secondary },
  durationIndicator: { alignItems: 'center', flex: 1 },
  durationLine: { height: 1, backgroundColor: Theme.colors.softGreenBorder, width: '30%' },
  durationText: { fontSize: 9, fontWeight: '900', color: Theme.colors.secondary, marginVertical: 2 },

  stripOuterWrapper: {
    height: 55,
    borderRadius: 12,
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
  stripItem: { width: 100, alignItems: 'center', justifyContent: 'center' },
  stripTick: { width: 2, height: 10, backgroundColor: Theme.colors.accent, borderRadius: 1, marginBottom: 6 },
  stripText: { fontSize: 11, fontWeight: '700' },
  stripPointer: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    width: 4,
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
    opacity: 0.8,
    zIndex: 10
  },
  edgeGradientLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 5
  },
  edgeGradientRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 5
  },

  nextBtn: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: hp(1.6),
    borderRadius: 30,
    alignItems: 'center',
    marginTop: hp(1.5),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.soft
  },
  nextBtnTxt: { fontSize: hp(2.2), fontWeight: '900', color: Theme.colors.primary, letterSpacing: 1 },
  disabled: { opacity: 0.5 }
});
