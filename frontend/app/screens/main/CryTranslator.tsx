import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, PermissionsAndroid,
  Platform, ScrollView, Animated
} from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import axios from 'axios';
import RNFS from 'react-native-fs';
import { BACKEND_URL } from '@env';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { saveCryAnalysis, saveHealthRecord } from '../../../services/DirectusApiClient';

const CryTranslator = ({ navigation }: any) => {
  const { user } = useAuth();
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3, duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1, duration: 600,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const activeChild = user?.children?.[0];
  const childName = activeChild?.name || "your baby";

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: `Neev needs microphone access to analyze ${childName}'s cry`,
          buttonPositive: 'Allow',
          buttonNegative: 'Not Now'
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startListening = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required',
        'Please allow microphone access in Settings');
      return;
    }
    setResult(null);
    setError('');
    setRecordingTime(0);
    setIsListening(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 10) {
          stopAndAnalyze();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    await audioRecorderPlayer.startRecorder(undefined, {
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    });
  };

  const stopAndAnalyze = async () => {
    if (!isListening) return;
    setIsListening(false);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const uri = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsAnalyzing(true);

      // Upload as FormData instead of base64
      const formData = new FormData();
      formData.append('audio', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: 'audio/mp4',
        name: 'cry_recording.mp4'
      } as any);
      formData.append('child_age_months', '6');

      const response = await axios.post(
        `${BACKEND_URL}/ai/analyze-cry`,
        formData,
        {
          timeout: 30000,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setResult(response.data);

      // Save recording and health record
      await saveRecordingToDirectus(response.data);

    } catch (e: any) {
      setError('Analysis failed. Please try again.');
      console.error('Cry analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveRecordingToDirectus = async (
    analysisResult: any
  ) => {
    if (!user?.id) return;
    try {
      const activeChild = user.children?.[0];

      // 1. Save to cry_recordings collection
      await saveCryAnalysis({
        user_id: Number(user.id),
        child_id: activeChild?.id ? Number(activeChild.id) : undefined,
        recorded_at: new Date().toISOString(),
        analysis_result: analysisResult.meaning,
        cry_type: analysisResult.cry_type,
        confidence: analysisResult.confidence
      });

      // 2. Also log as a Health Record for the timeline
      await saveHealthRecord({
        user_id: Number(user.id),
        child_id: activeChild?.id ? Number(activeChild.id) : undefined,
        record_type: 'Cry Analysis',
        value: analysisResult.meaning,
        unit: 'cue',
        sub_value: analysisResult.label,
        date: new Date().toISOString(),
        notes: `Detected ${analysisResult.label} pattern (${analysisResult.meaning}). ${analysisResult.description}`
      });
    } catch (e) {
      console.error('Error saving cry analysis records:', e);
    }
  };

  const urgencyColor = {
    high: '#E53E3E',
    medium: '#DD6B20',
    low: '#38A169'
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(24)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cry Translator</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Cry Translator</Text>
        <Text style={styles.subtitle}>
          Hold up to 10 seconds of {childName}'s cry
        </Text>

        <Animated.View style={[
          styles.micWrapper,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <TouchableOpacity
            style={[styles.micButton,
              isListening && styles.micActive,
              isAnalyzing && styles.micAnalyzing
            ]}
            onPress={isListening ? stopAndAnalyze : startListening}
            disabled={isAnalyzing}>
            <Text style={styles.micIcon}>
              {isAnalyzing ? '⚡' : isListening ? '⏹' : '🎙'}
            </Text>
            <Text style={[styles.micLabel,
              isListening && { color: '#fff' }]}>
              {isAnalyzing ? 'Analyzing...' :
               isListening ? `Stop (${recordingTime}s)` :
               'Tap to Listen'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isListening && (
          <Text style={styles.recordingHint}>
            Recording... tap stop when ready
          </Text>
        )}

        {isAnalyzing && (
          <View style={styles.analyzingRow}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.analyzingText}>
              Analyzing {childName}'s cry...
            </Text>
          </View>
        )}

        {result && !isAnalyzing && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultEmoji}>{result.emoji}</Text>
              <View>
                <Text style={styles.resultMeaning}>
                  {result.meaning}
                </Text>
                <View style={[styles.confidenceBadge, {
                  backgroundColor: urgencyColor[
                    result.urgency as keyof typeof urgencyColor
                  ] + '20'
                }]}>
                  <Text style={[styles.confidenceText, {
                    color: urgencyColor[
                      result.urgency as keyof typeof urgencyColor
                    ]
                  }]}>
                    {result.confidence}% confidence
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.resultDescription}>
              {result.description}
            </Text>

            <View style={styles.actionBox}>
              <Text style={styles.actionLabel}>What to do:</Text>
              <Text style={styles.actionText}>{result.action}</Text>
            </View>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setResult(null);
                setRecordingTime(0);
              }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Text style={styles.retryText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  content: { alignItems: 'center', padding: 24, paddingTop: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#2D2D2D',
    marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center',
    marginBottom: 40, lineHeight: 20 },
  micWrapper: { marginBottom: 32 },
  micButton: { width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#F0EBFF', alignItems: 'center',
    justifyContent: 'center', borderWidth: 3,
    borderColor: Theme.colors.primary },
  micActive: { backgroundColor: Theme.colors.primary, borderColor: '#4B2ECC' },
  micAnalyzing: { backgroundColor: '#FFF3E0', borderColor: '#FF9800' },
  micIcon: { fontSize: 48 },
  micLabel: { fontSize: 12, color: Theme.colors.primary,
    marginTop: 6, fontWeight: '600' },
  recordingHint: { color: '#E53E3E', fontSize: 13, marginBottom: 16 },
  analyzingRow: { flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16 },
  analyzingText: { color: '#666', fontSize: 14 },
  resultCard: { width: '100%', backgroundColor: '#fff',
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 12, elevation: 4 },
  resultHeader: { flexDirection: 'row', alignItems: 'center',
    gap: 16, marginBottom: 16 },
  resultEmoji: { fontSize: 52 },
  resultMeaning: { fontSize: 22, fontWeight: '700',
    color: '#2D2D2D' },
  confidenceBadge: { marginTop: 4, paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  confidenceText: { fontSize: 12, fontWeight: '600' },
  resultDescription: { fontSize: 14, color: '#555',
    lineHeight: 22, marginBottom: 16 },
  actionBox: { backgroundColor: '#F0EBFF', borderRadius: 12,
    padding: 14, marginBottom: 16 },
  actionLabel: { fontSize: 12, fontWeight: '700',
    color: Theme.colors.primary, marginBottom: 4 },
  actionText: { fontSize: 14, color: '#2D2D2D', lineHeight: 20 },
  retryButton: { alignItems: 'center', padding: 12 },
  retryText: { color: Theme.colors.primary, fontWeight: '600', fontSize: 14 },
  errorCard: { backgroundColor: '#FFF5F5', borderRadius: 12,
    padding: 16, alignItems: 'center', width: '100%' },
  errorText: { color: '#E53E3E', fontSize: 14,
    marginBottom: 8, textAlign: 'center' }
});

export default CryTranslator;
