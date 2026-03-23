import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../constants/Theme';

export default function Health() {
  const navigation = useNavigation<any>();

  const records = [
    { title: "3-Month Checkup", date: "Oct 12, 2024", type: "Vaccination" },
    { title: "Growth Assessment", date: "Sep 05, 2024", type: "Pediatrician" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Medical Timeline</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {records.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={styles.dot} />
              {index !== records.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.recordDate}>{item.date}</Text>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text style={styles.recordType}>{item.type}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: Theme.colors.primary },
  content: { padding: 24 },
  timelineItem: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  timelineLine: { alignItems: 'center', width: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Theme.colors.secondary, marginTop: 6 },
  line: { width: 2, flex: 1, backgroundColor: Theme.colors.accent, marginVertical: 4 },
  healthCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 24, ...Theme.shadows.soft },
  recordDate: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '600', marginBottom: 4 },
  recordTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary },
  recordType: { fontSize: 14, color: Theme.colors.secondary, marginTop: 4 }
});
