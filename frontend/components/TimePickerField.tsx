import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Theme } from '../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

interface Props {
  label?: string;
  value?: string; // Expecting HH:MM AM/PM
  onChange?: (time: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ["AM", "PM"];

export default function TimePickerField({ label, value, onChange }: Props) {
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'hour' | 'minute' | 'period' | null>(null);
  const [selectedTens, setSelectedTens] = useState<number | null>(null);

  useEffect(() => {
    if (value && value.includes(':')) {
      const [time, p] = value.split(' ');
      const [h, m] = time.split(':');
      setHour(h);
      setMinute(m);
      setPeriod(p);
    }
  }, [value]);

  const updateParent = (h: string, m: string, p: string) => {
    if (h && m && p && onChange) {
      onChange(`${h}:${m} ${p}`);
    }
  };

  const getOptions = () => {
    if (activePicker === 'hour') return HOURS;
    if (activePicker === 'minute') {
      if (selectedTens === null) {
        return ["0s", "10s", "20s", "30s", "40s", "50s"];
      } else {
        return Array.from({ length: 10 }, (_, i) => (selectedTens + i).toString().padStart(2, '0'));
      }
    }
    if (activePicker === 'period') return PERIODS;
    return [];
  };

  const handleSelect = (val: string) => {
    if (activePicker === 'minute' && selectedTens === null) {
      setSelectedTens(parseInt(val.replace('s', '')));
      return;
    }

    let newHour = hour;
    let newMinute = minute;
    let newPeriod = period;

    if (activePicker === 'hour') {
      newHour = val;
      setHour(val);
    } else if (activePicker === 'minute') {
      newMinute = val;
      setMinute(val);
    } else if (activePicker === 'period') {
      newPeriod = val;
      setPeriod(val);
    }

    setModalVisible(false);
    setSelectedTens(null);
    updateParent(newHour, newMinute, newPeriod);
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
        <View style={{ flex: 1 }}>
          <Selector val={hour} placeholder="HH" type="hour" />
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={{ flex: 1 }}>
          <Selector val={minute} placeholder="MM" type="minute" />
        </View>
        <View style={{ flex: 1 }}>
          <Selector val={period} placeholder="AM/PM" type="period" />
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setModalVisible(false);
            setSelectedTens(null);
          }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {selectedTens !== null && (
                <TouchableOpacity
                  onPress={() => setSelectedTens(null)}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {activePicker === 'minute' && selectedTens === null ? 'Select Tens' : `Select ${activePicker}`}
              </Text>
              {selectedTens !== null && <View style={{ width: 60 }} />}
            </View>
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
                    (item === hour || item === minute || item === period) && styles.optionTextActive
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
  container: { gap: verticalScale(8) },
  label: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.primary },
  row: { flexDirection: 'row', gap: scale(8), alignItems: 'center' },
  selector: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: verticalScale(52),
  },
  selectorText: {
    fontSize: moderateScale(14),
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  separator: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: Theme.colors.primary,
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
    width: SCREEN_WIDTH * 0.8,
    maxHeight: SCREEN_HEIGHT * 0.5,
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: Theme.colors.primary,
    textAlign: 'center',
    textTransform: 'capitalize',
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(15),
  },
  backButton: {
    padding: scale(5),
    width: 60
  },
  backButtonText: {
    color: Theme.colors.secondary,
    fontWeight: '700',
    fontSize: moderateScale(14)
  },
  optionItem: {
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.accent,
    alignItems: 'center'
  },
  optionText: {
    fontSize: moderateScale(16),
    color: Theme.colors.textLight,
  },
  optionTextActive: {
    color: Theme.colors.secondary,
    fontWeight: '700'
  }
});
