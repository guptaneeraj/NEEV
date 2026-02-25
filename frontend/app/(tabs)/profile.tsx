import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Profile() {
  const { user, logout, token, fetchProfile } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleAddChild = () => {
    Alert.alert(
      'Add Child',
      'This feature allows you to add multiple children to your profile.',
      [
        { text: 'OK' },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing will be available soon.',
      [
        { text: 'OK' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A8D5BA" />}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#A8D5BA" />
          </View>
          <Text style={styles.name}>{profile?.email || user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {profile?.stage === 'pregnancy' ? 'Pregnancy Journey' : 'Parenting Journey'}
            </Text>
          </View>
        </View>

        {/* Children List */}
        {profile?.children && profile.children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children</Text>
            {profile.children.map((child: any) => (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childAge}>{child.age_months} months old</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
              </View>
            ))}
          </View>
        )}

        {/* Pregnancy Info */}
        {profile?.pregnancy_info && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pregnancy</Text>
            <View style={styles.infoCard}>
              <Ionicons name="heart" size={24} color="#A8D5BA" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Current Week</Text>
                <Text style={styles.infoValue}>Week {profile.pregnancy_info.current_week}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={handleEditProfile}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={24} color="#2D5F3F" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
          </TouchableOpacity>

          {user?.stage === 'child' && (
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={handleAddChild}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="add-circle-outline" size={24} color="#2D5F3F" />
                <Text style={styles.menuItemText}>Add Another Child</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifications', 'Notification settings coming soon')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={24} color="#2D5F3F" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('Help Center', 'Help documentation coming soon')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#2D5F3F" />
              <Text style={styles.menuItemText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('Terms & Privacy', 'Legal information coming soon')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color="#2D5F3F" />
              <Text style={styles.menuItemText}>Terms & Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('About NEEV', 'NEEV - Mother & Child Wellness\nVersion 1.0.0\n\nBuilt with ❤️ for parents')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#2D5F3F" />
              <Text style={styles.menuItemText}>About NEEV</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B0BDB5" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5F3F',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F8F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D5F3F',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#A8D5BA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7F71',
    marginBottom: 12,
  },
  childCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5F3F',
  },
  childAge: {
    fontSize: 14,
    color: '#6B7F71',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7F71',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E9E3',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D5F3F',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#D88F8F',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  version: {
    fontSize: 12,
    color: '#B0BDB5',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
});
