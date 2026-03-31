import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { Theme } from '../constants/Theme';

const { height, width } = Dimensions.get('window');

interface Props {
  label?: string;
  value?: string; // Expecting YYYY-MM-DD
  onChange?: (date: string) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function DatePickerField({ label, value, onChange }: Props) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'day' | 'month' | 'year' | null>(null);

  // Initialize from value prop
  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      setYear(parts[0]);
      setMonth(MONTHS[parseInt(parts[1]) - 1]);
      setDay(parseInt(parts[2]).toString());
    }
  }, [value]);

  const updateParent = (d: string, m: string, y: string) => {
    if (d && m && y && onChange) {
      const monthIdx = (MONTHS.indexOf(m) + 1).toString().padStart(2, '0');
      const dayStr = d.padStart(2, '0');
      onChange(`${y}-${monthIdx}-${dayStr}`);
    }
  };

  const getOptions = () => {
    if (activePicker === 'day') {
      return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    }
    if (activePicker === 'month') {
      return MONTHS;
    }
    if (activePicker === 'year') {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());
    }
    return [];
  };

  const handleSelect = (val: string) => {
    let newDay = day;
    let newMonth = month;
    let newYear = year;

    if (activePicker === 'day') {
      newDay = val;
      setDay(val);
    } else if (activePicker === 'month') {
      newMonth = val;
      setMonth(val);
    } else if (activePicker === 'year') {
      newYear = val;
      setYear(val);
    }

    setModalVisible(false);
    updateParent(newDay, newMonth, newYear);
  };

  const Selector = ({ val, placeholder, type }: any) => (
    <TouchableOpacity
      style={styles.selector}
      onPress={() => {
        setActivePicker(type);
        setModalVisible(true);
      }}
    >
      <Text style={[styles.selectorText, !val && styles.placeholder]}>
        {val || placeholder}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.row}>
        <View style={{ flex: 1.5 }}>
          <Selector val={day} placeholder="Day" type="day" />
        </View>
        <View style={{ flex: 2.5 }}>
          <Selector val={month} placeholder="Month" type="month" />
        </View>
        <View style={{ flex: 2 }}>
          <Selector val={year} placeholder="Year" type="year" />
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {activePicker}</Text>
            <FlatList
              data={getOptions()}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[
                    styles.optionText,
                    (item === day || item === month || item === year) && styles.optionTextActive
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.colors.primary },
  row: { flexDirection: 'row', gap: 8 },
  selector: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
  },
  selectorText: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  placeholder: {
    color: '#B0BDB5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Theme.colors.white,
    width: width * 0.8,
    maxHeight: height * 0.5,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'capitalize'
  },
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.accent,
    alignItems: 'center'
  },
  optionText: {
    fontSize: 16,
    color: Theme.colors.textLight,
  },
  optionTextActive: {
    color: Theme.colors.secondary,
    fontWeight: '700'
  }
});
