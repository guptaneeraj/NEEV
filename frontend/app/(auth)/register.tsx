import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Theme } from '../../constants/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Register() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Registration Failed', 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
      </TouchableOpacity>

      <Text style={styles.title}>Create Account</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Join Neev</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 24 },
  title: { fontSize: 32, fontWeight: '700', color: Theme.colors.primary, marginBottom: 40 },
  inputContainer: { gap: 16, marginBottom: 32 },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 15, borderWidth: 1, borderColor: Theme.colors.accent },
  button: { backgroundColor: Theme.colors.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' }
});
