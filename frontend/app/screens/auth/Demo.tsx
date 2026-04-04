import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import NeevModal from '../../../components/NeevModal';

const API_URL = 'https://api.neevios.com';

export default function Demo() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [queriesLeft, setQueriesLeft] = useState(3);

  // Alert Modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    icon: '',
    confirmText: 'Continue',
    onConfirm: () => setAlertVisible(false),
    showCancel: false
  });

  const showAlert = (title: string, message: string, icon: string = '⚠️', confirmText: string = 'Continue', onConfirm?: () => void, showCancel: boolean = false) => {
    setAlertConfig({
      title,
      message,
      icon,
      confirmText,
      onConfirm: onConfirm || (() => setAlertVisible(false)),
      showCancel
    });
    setAlertVisible(true);
  };

  const checkQueriesLeft = async () => {
    const count = await AsyncStorage.getItem('demoQueryCount');
    const used = count ? parseInt(count) : 0;
    setQueriesLeft(3 - used);
    return 3 - used;
  };

  React.useEffect(() => {
    checkQueriesLeft();
  }, []);

  const handleAsk = async () => {
    if (!query.trim()) {
      showAlert('Error', 'Please enter a question', '❓');
      return;
    }

    const left = await checkQueriesLeft();
    if (left <= 0) {
      showAlert(
        'Demo Limit Reached',
        'You have used all 3 demo queries. Please register to continue.',
        '🛑',
        'Register',
        () => {
          setAlertVisible(false);
          navigation.navigate('Register');
        },
        true
      );
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/ask`, { query });
      setResponse(res.data.response);

      const count = await AsyncStorage.getItem('demoQueryCount');
      const newCount = count ? parseInt(count) + 1 : 1;
      await AsyncStorage.setItem('demoQueryCount', newCount.toString());
      setQueriesLeft(3 - newCount);

      if (newCount >= 3) {
        setTimeout(() => {
          showAlert(
            'Demo Limit Reached',
            'Register now to continue using NEEV!',
            '✨',
            'Register',
            () => {
              setAlertVisible(false);
              navigation.navigate('Register');
            }
          );
        }, 1000);
      }
    } catch (error) {
      showAlert('Error', 'Failed to get AI response. Please try again.', '❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="chatbubbles" size={moderateScale(48)} color={Theme.colors.secondary} />
          <Text style={styles.title}>Demo Mode</Text>
          <Text style={styles.subtitle}>Try our AI assistant (3 queries left: {queriesLeft})</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ask a Question</Text>
            <TextInput
              style={styles.textArea}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g., What exercises are safe during pregnancy?"
              placeholderTextColor="#B0BDB5"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.askButton, loading && styles.askButtonDisabled]}
            onPress={handleAsk}
            disabled={loading || queriesLeft <= 0}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.white} />
            ) : (
              <Text style={styles.askButtonText}>Ask AI</Text>
            )}
          </TouchableOpacity>

          {response ? (
            <View style={styles.responseContainer}>
              <Text style={styles.responseLabel}>Response:</Text>
              <Text style={styles.responseText}>{response}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.registerPrompt}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerPromptText}>
            Want unlimited access? Register now!
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <NeevModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.showCancel ? () => setAlertVisible(false) : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(16),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
    gap: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  form: {
    gap: verticalScale(20),
  },
  inputContainer: {
    gap: verticalScale(8),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  textArea: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    fontSize: moderateScale(16),
    color: Theme.colors.primary,
    minHeight: verticalScale(120),
  },
  askButton: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.soft
  },
  askButtonDisabled: {
    opacity: 0.6,
  },
  askButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  responseContainer: {
    backgroundColor: Theme.colors.softGreen,
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    gap: verticalScale(8),
    borderWidth: 1.5,
    borderColor: Theme.colors.softGreenBorder,
  },
  responseLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  responseText: {
    fontSize: moderateScale(15),
    color: Theme.colors.primary,
    lineHeight: moderateScale(22),
  },
  registerPrompt: {
    backgroundColor: Theme.colors.primary,
    padding: moderateScale(18),
    borderRadius: moderateScale(25),
    marginTop: verticalScale(30),
    marginBottom: verticalScale(24),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.soft
  },
  registerPromptText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.white,
    textAlign: 'center',
  },
});
