import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Theme } from '../constants/Theme';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

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
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);
  const [selectedDayTens, setSelectedDayTens] = useState<number | null>(null);

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
      if (selectedDayTens === null) {
        return ["0s", "10s", "20s", "30s"];
      } else {
        const days = [];
        for (let i = 0; i < 10; i++) {
          const d = selectedDayTens + i;
          if (d >= 1 && d <= 31) {
            days.push(d.toString());
          }
        }
        return days;
      }
    }
    if (activePicker === 'month') {
      return MONTHS;
    }
    if (activePicker === 'year') {
      if (selectedDecade === null) {
        const currentYear = new Date().getFullYear();
        const startDecade = Math.floor(currentYear / 10) * 10;
        const decades = [];
        for (let d = startDecade; d >= 1900; d -= 10) {
          decades.push(`${d}s`);
        }
        return decades;
      } else {
        const years = [];
        // Show years in descending order within the decade
        for (let y = selectedDecade + 9; y >= selectedDecade; y--) {
          if (y <= new Date().getFullYear()) {
            years.push(y.toString());
          }
        }
        return years;
      }
    }
    return [];
  };

  const handleSelect = (val: string) => {
    if (activePicker === 'year' && selectedDecade === null) {
      setSelectedDecade(parseInt(val.replace('s', '')));
      return;
    }

    if (activePicker === 'day' && selectedDayTens === null) {
      setSelectedDayTens(parseInt(val.replace('s', '')));
      return;
    }

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
    setSelectedDecade(null);
    setSelectedDayTens(null);
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
          onPress={() => {
            setModalVisible(false);
            setSelectedDecade(null);
            setSelectedDayTens(null);
          }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {(selectedDecade !== null || selectedDayTens !== null) && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDecade(null);
                    setSelectedDayTens(null);
                  }}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {activePicker === 'year' && selectedDecade === null ? 'Select Decade' :
                 activePicker === 'day' && selectedDayTens === null ? 'Select Tens' :
                 `Select ${activePicker}`}
              </Text>
              {(selectedDecade !== null || selectedDayTens !== null) && <View style={{ width: 60 }} />}
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
  container: { gap: verticalScale(8) },
  label: { fontSize: moderateScale(14), fontWeight: '700', color: Theme.colors.primary },
  row: { flexDirection: 'row', gap: scale(8) },
  selector: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
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
