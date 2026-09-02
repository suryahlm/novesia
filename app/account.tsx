import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar, 
  Modal, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../lib/i18n';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 0;

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const YEARS = Array.from({ length: 80 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function AccountScreen() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  
  const [birthDate, setBirthDate] = useState({ day: '1', month: '1', year: '2000' });
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user_birth_date').then((saved: string | null) => {
      if (saved) {
        const parsed = JSON.parse(saved);
        handleCalculateAge(parsed.day, parsed.month, parsed.year);
      }
    });
  }, []);

  const handleCalculateAge = (d: string, m: string, y: string) => {
    const today = new Date();
    const birth = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    setCalculatedAge(calculatedAge);
    setBirthDate({ day: d, month: m, year: y });
    AsyncStorage.setItem('user_birth_date', JSON.stringify({ day: d, month: m, year: y }));
  };

  const SettingRow = ({ icon, label, value, onPress }: any) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#d4a843" />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.value}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color="#475569" />
      </View>
    </TouchableOpacity>
  );

  const BirthDatePickerModal = ({ visible, onClose, onSave, initialData }: any) => {
    const [tempDate, setTempDate] = useState(initialData);
    const months = lang === 'en' ? MONTHS_EN : MONTHS_ID;

    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.select_birth_date}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerColDay}>
                <Text style={styles.pickerLabel}>{t.day}</Text>
                <FlatList
                  data={DAYS}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, tempDate.day === item && styles.pickerItemActive]}
                      onPress={() => setTempDate({ ...tempDate, day: item })}
                    >
                      <Text style={[styles.pickerText, tempDate.day === item && styles.pickerTextActive]} numberOfLines={1}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              <View style={styles.pickerColMonth}>
                <Text style={styles.pickerLabel}>{t.month}</Text>
                <FlatList
                  data={months}
                  keyExtractor={(_, i) => i.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, tempDate.month === (index + 1).toString() && styles.pickerItemActive]}
                      onPress={() => setTempDate({ ...tempDate, month: (index + 1).toString() })}
                    >
                      <Text style={[styles.pickerText, tempDate.month === (index + 1).toString() && styles.pickerTextActive]} numberOfLines={1}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              <View style={styles.pickerColYear}>
                <Text style={styles.pickerLabel}>{t.year}</Text>
                <FlatList
                  data={YEARS}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, tempDate.year === item && styles.pickerItemActive]}
                      onPress={() => setTempDate({ ...tempDate, year: item })}
                    >
                      <Text style={[styles.pickerText, tempDate.year === item && styles.pickerTextActive]} numberOfLines={1}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                onSave(tempDate.day, tempDate.month, tempDate.year);
                onClose();
              }}
            >
              <Text style={styles.saveBtnText}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t.account}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t.account}</Text>
          <View style={styles.card}>
            <SettingRow 
              icon="calendar-outline" 
              label={t.birth_date} 
              value={calculatedAge !== null ? `${birthDate.day}/${birthDate.month}/${birthDate.year} (${calculatedAge} ${t.years_old})` : t.select_age}
              onPress={() => setDatePickerVisible(true)}
            />
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#d4a843" />
          <Text style={styles.infoText}>
            Personal information is stored locally on your device to enhance your reading experience.
          </Text>
        </View>
      </ScrollView>

      <BirthDatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        initialData={birthDate}
        onSave={handleCalculateAge}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { 
    paddingTop: STATUSBAR_HEIGHT + 20, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#0a0a0f',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  section: { marginBottom: 24 },
  sectionHeader: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#d4a843', 
    marginBottom: 10, 
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#111118',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 168, 67, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 16, color: '#e2e8f0', marginLeft: 14, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  value: { fontSize: 14, color: '#64748b', marginRight: 8, fontWeight: '500' },
  
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 168, 67, 0.05)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 67, 0.15)',
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: '#94a3b8', fontSize: 12, marginLeft: 10, lineHeight: 18 },

  // Modal Styles same as Settings for consistency
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#111118',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  pickerRow: { flexDirection: 'row', height: 250, paddingHorizontal: 5 },
  pickerColDay: { flex: 0.8, alignItems: 'center' },
  pickerColMonth: { flex: 1.4, alignItems: 'center' },
  pickerColYear: { flex: 1.2, alignItems: 'center' },
  pickerLabel: { fontSize: 10, fontWeight: '800', color: '#d4a843', marginBottom: 12, letterSpacing: 1 },
  pickerItem: { paddingVertical: 12, width: '100%', alignItems: 'center', borderRadius: 10 },
  pickerItemActive: { backgroundColor: 'rgba(212, 168, 67, 0.15)' },
  pickerText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  pickerTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#d4a843',
    margin: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#0a0a0f', fontWeight: '800', fontSize: 15 },
});
