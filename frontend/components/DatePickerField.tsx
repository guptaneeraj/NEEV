import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, TextInput } from 'react-native';

interface Props {
  label?: string;
  value?: string;
  onChange?: (date: string) => void;
}

export default function DatePickerField({ label, value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#B0BDB5"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#2D5F3F' },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0E9E3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#2D5F3F' },
});