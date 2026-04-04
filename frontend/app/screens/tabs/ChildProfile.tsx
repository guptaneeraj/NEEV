import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import AppEmoji from '../../../components/AppEmoji';

const calculateAge = (dobString: string | null) => {
  if (!dobString) return '0m 0w';
  const dob = new Date(dobString);
  const now = new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months--;
  const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  let days = now.getDate() - dob.getDate();
  if (days < 0) days += lastMonth.getDate();
  const weeks = Math.floor(days / 7);
  return `${months}m ${weeks}w`;
};

export default function ChildProfile() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const children = user?.children || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(24)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Child's Profile</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children.length > 0 ? (
          children.map((child: any, index: number) => (
            <View key={index} style={styles.childCard}>
              <View style={styles.petalCard}>
                <AppEmoji style={styles.petalEmoji}>👶</AppEmoji>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childAge}>{calculateAge(child.dob)} old</Text>

                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{child.sex}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: '#E0F2E9' }]}>
                    <Text style={[styles.tagText, { color: Theme.colors.primary }]}>{child.diet_preference}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No child profiles found.</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddChild')}
        >
          <Ionicons name="add-circle-outline" size={scale(24)} color={Theme.colors.white} />
          <Text style={styles.addBtnText}>Add Another Child</Text>
        </TouchableOpacity>
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
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(30),
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: moderateScale(20),
    borderRadius: moderateScale(32),
    marginBottom: verticalScale(16),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft,
  },
  petalCard: {
    width: scale(70),
    height: scale(70),
    backgroundColor: '#FEF3C7',
    borderTopLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(10),
    borderBottomLeftRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  petalEmoji: {
    fontSize: moderateScale(38),
  },
  childInfo: {
    flex: 1,
    marginLeft: scale(16),
  },
  childName: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  childAge: {
    fontSize: moderateScale(14),
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: verticalScale(8),
  },
  tagRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  tag: {
    backgroundColor: Theme.colors.softSlate,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: Theme.colors.softSlateBorder,
  },
  tagText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: Theme.colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: Theme.colors.textLight,
    fontStyle: 'italic',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(10),
    backgroundColor: Theme.colors.primary,
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(25),
    marginTop: verticalScale(10),
    ...Theme.shadows.soft,
  },
  addBtnText: {
    color: Theme.colors.white,
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
});
