import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Theme } from '../../../constants/Theme';

export default function Profile() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: async () => {
        await logout();
        navigation.replace('Landing');
      }}
    ]);
  };

  const settings = [
    { title: "Personal Info", icon: "person-outline", route: null },
    { title: "Child's Profile", icon: "paw-outline", route: null },
    { title: "Notifications", icon: "notifications-outline", route: null },
    { title: "Subscription", icon: "star-outline", route: null },
    { title: "Help Center", icon: "HelpCenter", route: "HelpCenter" },
  ];

  const username = user?.full_name || user?.email?.split('@')[0] || 'Parent';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={Theme.colors.white} />
          </View>
          <Text style={styles.userName}>{username}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        <View style={styles.menu}>
          {settings.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index === settings.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color={Theme.colors.primary} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.accent} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20
  },
  title: { fontSize: 22, fontWeight: '700', color: Theme.colors.primary },
  content: { padding: 24 },
  profileSection: { alignItems: 'center', marginBottom: 40 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary
  },
  userName: { fontSize: 24, fontWeight: '700', color: Theme.colors.primary },
  userEmail: { fontSize: 16, color: Theme.colors.textLight, marginTop: 4 },
  menu: {
    backgroundColor: Theme.colors.white,
    borderRadius: 25,
    padding: 10,
    ...Theme.shadows.soft,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.background
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.softSlate,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.softSlateBorder
  },
  menuText: { flex: 1, fontSize: 18, fontWeight: '600', color: Theme.colors.primary }
});
