import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const RELATIONSHIP_OPTIONS = [
  { label: 'Mother', emoji: '👩' },
  { label: 'Father', emoji: '👨' },
  { label: 'Grandmother', emoji: '👵' },
  { label: 'Grandfather', emoji: '👴' },
  { label: 'Guardian', emoji: '🛡️' },
  { label: 'Caregiver', emoji: '🤗' },
  { label: 'Aunt', emoji: '👩‍🦰' },
  { label: 'Uncle', emoji: '👨‍🦰' },
  { label: 'Foster Parent', emoji: '🏠' },
  { label: 'Adoptive Parent', emoji: '💝' },
  { label: 'Stepmother', emoji: '👩‍👧' },
  { label: 'Stepfather', emoji: '👨‍👦' },
  { label: 'Myself', emoji: '👤' },
];

const DIET_OPTIONS = [
  { label: 'Vegetarian', emoji: '🥗' },
  { label: 'Eggetarian', emoji: '🥚' },
  { label: 'Non-vegetarian', emoji: '🍖' },
];

const ACTIVITY_TIME_OPTIONS = [
  { label: 'Morning', emoji: '🌅' },
  { label: 'Afternoon', emoji: '☀️' },
  { label: 'Evening', emoji: '🌆' },
  { label: 'Custom time', emoji: '⏰' },
];

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Relationship
  const [relationship, setRelationship] = useState('');

  // Step 3: Stage
  const [stage, setStage] = useState<'pregnancy' | 'child' | ''>('');

  // Step 4: Pregnancy details
  const [pregnantPersonName, setPregnantPersonName] = useState('');
  const [isUserPregnant, setIsUserPregnant] = useState<boolean | null>(null);
  const [relationshipToPregnant, setRelationshipToPregnant] = useState('');
  const [pregnancyWeek, setPregnancyWeek] = useState('');
  const [pregnancyDiet, setPregnancyDiet] = useState('');

  // Step 5: Child details
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState('');
  const [childSex, setChildSex] = useState('');
  const [childDiet, setChildDiet] = useState('');

  // Step 6: Activity time
  const [activityTime, setActivityTime] = useState('');

  const totalSteps = stage === 'pregnancy' ? 6 : 6;

  const handleNext = () => {
    if (step === 1) {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter email and password');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!relationship) {
        Alert.alert('Error', 'Please select your relationship');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!stage) {
        Alert.alert('Error', 'Please select a stage');
        return;
      }
      setStep(4);
    } else if (step === 4 && stage === 'pregnancy') {
      if (!pregnantPersonName || isUserPregnant === null || (!isUserPregnant && !relationshipToPregnant) || !pregnancyWeek) {
        Alert.alert('Error', 'Please fill in all pregnancy details');
        return;
      }
      setStep(5);
    } else if (step === 4 && stage === 'child') {
      if (!childName || !childDOB) {
        Alert.alert('Error', 'Please fill in child details');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      if (stage === 'pregnancy' && !pregnancyDiet) {
        Alert.alert('Error', 'Please select diet preference');
        return;
      }
      if (stage === 'child' && !childSex) {
        Alert.alert('Error', 'Please select child sex');
        return;
      }
      setStep(6);
    } else if (step === 6) {
      if (stage === 'child' && !childDiet) {
        Alert.alert('Error', 'Please select diet preference');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!activityTime) {
      Alert.alert('Error', 'Please select preferred activity time');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register user
      await register(email, password, stage);
      
      // Wait a moment for token to be set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Get the stored token
      let authToken;
      try {
        authToken = await AsyncStorage.getItem('authToken');
      } catch (error) {
        console.log('Could not get token from storage');
        return;
      }

      if (!authToken) {
        throw new Error('No auth token available');
      }

      // Step 3: Save additional user info
      await axios.patch(
        `${API_URL}/api/user/update`,
        {
          relationship_type: relationship,
          preferred_activity_time: activityTime,
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Step 4: Save stage-specific data
      if (stage === 'pregnancy') {
        await axios.post(
          `${API_URL}/api/user/pregnancy`,
          {
            pregnant_person_name: pregnantPersonName,
            is_user_pregnant: isUserPregnant,
            relationship_to_pregnant: relationshipToPregnant,
            current_week: parseInt(pregnancyWeek),
            diet_preference: pregnancyDiet,
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/user/child`,
          {
            name: childName,
            dob: childDOB,
            sex: childSex,
            diet_preference: childDiet,
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      }

      // Step 5: Navigate to dashboard
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[...Array(totalSteps)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index < step ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#2D5F3F" />
          </TouchableOpacity>

          {renderProgressBar()}

          {/* Step 1: Account */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Create Your Account</Text>
              <Text style={styles.stepSubtitle}>Let's get started</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#B0BDB5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    placeholderTextColor="#B0BDB5"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6B7F71"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Relationship */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Your Relationship</Text>
              <Text style={styles.stepSubtitle}>Who are you?</Text>

              <View style={styles.optionsGrid}>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionCard,
                      relationship === option.label && styles.optionCardActive,
                    ]}
                    onPress={() => setRelationship(option.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.optionLabel,
                      relationship === option.label && styles.optionLabelActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 3: Stage Selection */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Your Journey</Text>
              <Text style={styles.stepSubtitle}>What describes you best?</Text>

              <View style={styles.stageContainer}>
                <TouchableOpacity
                  style={[styles.stageCard, stage === 'pregnancy' && styles.stageCardActive]}
                  onPress={() => setStage('pregnancy')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stageEmoji}>🤰</Text>
                  <Text style={[styles.stageTitle2, stage === 'pregnancy' && styles.stageTitleActive]}>
                    Pregnancy
                  </Text>
                  <Text style={styles.stageDesc}>Track your pregnancy journey</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stageCard, stage === 'child' && styles.stageCardActive]}
                  onPress={() => setStage('child')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stageEmoji}>👶</Text>
                  <Text style={[styles.stageTitle2, stage === 'child' && styles.stageTitleActive]}>
                    Parenting
                  </Text>
                  <Text style={styles.stageDesc}>Track your child's growth</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 4: Pregnancy Details */}
          {step === 4 && stage === 'pregnancy' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Pregnancy Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pregnant person's name</Text>
                <TextInput
                  style={styles.input}
                  value={pregnantPersonName}
                  onChangeText={setPregnantPersonName}
                  placeholder="Enter name"
                  placeholderTextColor="#B0BDB5"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Are you the pregnant person?</Text>
                <View style={styles.yesNoContainer}>
                  <TouchableOpacity
                    style={[styles.yesNoButton, isUserPregnant === true && styles.yesNoActive]}
                    onPress={() => setIsUserPregnant(true)}
                  >
                    <Text style={[styles.yesNoText, isUserPregnant === true && styles.yesNoTextActive]}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.yesNoButton, isUserPregnant === false && styles.yesNoActive]}
                    onPress={() => setIsUserPregnant(false)}
                  >
                    <Text style={[styles.yesNoText, isUserPregnant === false && styles.yesNoTextActive]}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isUserPregnant === false && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Your relationship to pregnant person</Text>
                  <TextInput
                    style={styles.input}
                    value={relationshipToPregnant}
                    onChangeText={setRelationshipToPregnant}
                    placeholder="e.g., Husband, Partner"
                    placeholderTextColor="#B0BDB5"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Current pregnancy week (1-42)</Text>
                <TextInput
                  style={styles.input}
                  value={pregnancyWeek}
                  onChangeText={setPregnancyWeek}
                  placeholder="e.g., 12"
                  placeholderTextColor="#B0BDB5"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
          )}

          {/* Step 4: Child Details */}
          {step === 4 && stage === 'child' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Child Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Child's name</Text>
                <TextInput
                  style={styles.input}
                  value={childName}
                  onChangeText={setChildName}
                  placeholder="Enter child's name"
                  placeholderTextColor="#B0BDB5"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of birth</Text>
                <TextInput
                  style={styles.input}
                  value={childDOB}
                  onChangeText={setChildDOB}
                  placeholder="YYYY-MM-DD (e.g., 2023-06-15)"
                  placeholderTextColor="#B0BDB5"
                />
              </View>
            </View>
          )}

          {/* Step 5: Pregnancy Diet */}
          {step === 5 && stage === 'pregnancy' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Diet Preference</Text>
              <Text style={styles.stepSubtitle}>What's your diet preference?</Text>

              <View style={styles.dietContainer}>
                {DIET_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.dietCard,
                      pregnancyDiet === option.label && styles.dietCardActive,
                    ]}
                    onPress={() => setPregnancyDiet(option.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dietEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.dietLabel,
                      pregnancyDiet === option.label && styles.dietLabelActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 5: Child Sex */}
          {step === 5 && stage === 'child' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Child's Sex</Text>
              
              <View style={styles.sexContainer}>
                {['Male', 'Female', 'Prefer not to say'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sexButton,
                      childSex === option && styles.sexButtonActive,
                    ]}
                    onPress={() => setChildSex(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.sexText,
                      childSex === option && styles.sexTextActive,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 6: Child Diet & Activity Time */}
          {step === 6 && stage === 'child' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Diet Preference</Text>
              
              <View style={styles.dietContainer}>
                {DIET_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.dietCard,
                      childDiet === option.label && styles.dietCardActive,
                    ]}
                    onPress={() => setChildDiet(option.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dietEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.dietLabel,
                      childDiet === option.label && styles.dietLabelActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 6: Activity Time (Pregnancy) */}
          {step === 6 && stage === 'pregnancy' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Preferred Activity Time</Text>
              <Text style={styles.stepSubtitle}>When do you prefer to do activities?</Text>

              <View style={styles.activityContainer}>
                {ACTIVITY_TIME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.activityCard,
                      activityTime === option.label && styles.activityCardActive,
                    ]}
                    onPress={() => setActivityTime(option.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activityEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.activityLabel,
                      activityTime === option.label && styles.activityLabelActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#2D5F3F" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === totalSteps ? 'Complete' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>

          {step === 1 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#A8D5BA',
  },
  progressDotInactive: {
    backgroundColor: '#E0E9E3',
  },
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7F71',
    marginTop: -16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D5F3F',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E9E3',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D5F3F',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '30%',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  optionCardActive: {
    borderColor: '#A8D5BA',
    backgroundColor: '#F0F8F4',
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    fontSize: 12,
    color: '#6B7F71',
    textAlign: 'center',
  },
  optionLabelActive: {
    color: '#2D5F3F',
    fontWeight: '600',
  },
  stageContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stageCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E9E3',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  stageCardActive: {
    borderColor: '#A8D5BA',
    backgroundColor: '#F0F8F4',
  },
  stageEmoji: {
    fontSize: 48,
  },
  stageTitle2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7F71',
  },
  stageTitleActive: {
    color: '#2D5F3F',
  },
  stageDesc: {
    fontSize: 12,
    color: '#B0BDB5',
    textAlign: 'center',
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  yesNoActive: {
    borderColor: '#A8D5BA',
    backgroundColor: '#F0F8F4',
  },
  yesNoText: {
    fontSize: 16,
    color: '#6B7F71',
  },
  yesNoTextActive: {
    color: '#2D5F3F',
    fontWeight: '600',
  },
  dietContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dietCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  dietCardActive: {
    borderColor: '#A8D5BA',
    backgroundColor: '#F0F8F4',
  },
  dietEmoji: {
    fontSize: 40,
  },
  dietLabel: {
    fontSize: 14,
    color: '#6B7F71',
    textAlign: 'center',
  },
  dietLabelActive: {
    color: '#2D5F3F',
    fontWeight: '600',
  },
  sexContainer: {
    gap: 12,
  },
  sexButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sexButtonActive: {
    borderColor: '#A8D5BA',
    backgroundColor: '#F0F8F4',
  },
  sexText: {
    fontSize: 16,
    color: '#6B7F71',
  },
  sexTextActive: {
    color: '#2D5F3F',
    fontWeight: '600',
  },
  activityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E9E3',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  activityCardActive: {
    borderColor: '#A8D5BA',
    backgroundColor: '#F0F8F4',
  },
  activityEmoji: {
    fontSize: 40,
  },
  activityLabel: {
    fontSize: 14,
    color: '#6B7F71',
    textAlign: 'center',
  },
  activityLabelActive: {
    color: '#2D5F3F',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7F71',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8D5BA',
  },
});
