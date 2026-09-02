import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Platform, 
  StatusBar, 
  Modal, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 0;

const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'id', label: 'Indonesia', flag: '🇮🇩' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { lang, t, changeLang } = useLanguage();
  
  const [notifications, setNotifications] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [textSize, setTextSize] = useState(16);

  const SETTINGS_KEY = 'novesia_reading_settings';

  useEffect(() => {
    loadTextSize();
  }, []);

  const loadTextSize = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const s = JSON.parse(stored);
        if (s.fontSize) setTextSize(s.fontSize);
      }
    } catch {}
  };

  const updateTextSize = async (newSize: number) => {
    setTextSize(newSize);
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      const s = stored ? JSON.parse(stored) : {};
      s.fontSize = newSize;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {}
  };

  const handleCheckUpdates = () => {
    setUpdateModalVisible(true);
  };

  const PremiumModal = ({ visible, onClose, title, data, onSelect, selectedValue }: any) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={data}
            keyExtractor={(item: any) => typeof item === 'string' ? item : item.id}
            renderItem={({ item }) => {
              const isObj = typeof item !== 'string';
              const label = isObj ? item.label : item;
              const id = isObj ? item.id : item;
              const isSelected = selectedValue === id;
              
              return (
                <TouchableOpacity 
                  style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                  onPress={() => {
                    onSelect(id);
                    onClose();
                  }}
                >
                  <View style={styles.optionLeft}>
                    {isObj && <Text style={styles.optionFlag}>{item.flag}</Text>}
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                      {label}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#d4a843" />}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const PremiumInfoModal = ({ visible, onClose, title, message, icon }: any) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.infoModalOverlay}>
        <View style={styles.infoModalContainer}>
          <View style={styles.infoIconCircle}>
            <Ionicons name={icon} size={40} color="#d4a843" />
          </View>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoMessage}>{message}</Text>
          <TouchableOpacity style={styles.infoButton} onPress={onClose}>
            <Text style={styles.infoButtonText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SettingRow = ({ icon, label, value, onPress, isSwitch, switchValue, onSwitchChange }: any) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#d4a843" />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {isSwitch ? (
          <Switch 
            value={switchValue} 
            onValueChange={onSwitchChange}
            trackColor={{ false: '#1e1e2e', true: '#d4a843' }}
            thumbColor="#fff"
          />
        ) : (
          <>
            <Text style={styles.value}>{value}</Text>
            <Ionicons name="chevron-forward" size={16} color="#475569" />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t.preferences}</Text>
          <View style={styles.card}>
            <SettingRow 
              icon="language-outline" 
              label={t.language} 
              value={lang === 'en' ? 'English' : 'Indonesia'}
              onPress={() => setLangModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="notifications-outline" 
              label={t.notifications} 
              isSwitch
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
          </View>
        </View>

        {/* Reading Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t.reading_section}</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="text-outline" size={20} color="#d4a843" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={styles.label}>{t.text_size}</Text>
                  <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{t.text_size_desc}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  style={styles.sizeBtn}
                  onPress={() => updateTextSize(Math.max(12, textSize - 1))}
                >
                  <Text style={styles.sizeBtnText}>A-</Text>
                </TouchableOpacity>
                <View style={styles.sizeSliderTrack}>
                  <View style={[styles.sizeSliderFill, { width: `${((textSize - 12) / 16) * 100}%` }]} />
                </View>
                <TouchableOpacity
                  style={styles.sizeBtn}
                  onPress={() => updateTextSize(Math.min(28, textSize + 1))}
                >
                  <Text style={styles.sizeBtnText}>A+</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 10, color: '#475569' }}>{t.text_size_small}</Text>
                <Text style={{ fontSize: 12, color: '#d4a843', fontWeight: '700' }}>{textSize}px</Text>
                <Text style={{ fontSize: 10, color: '#475569' }}>{t.text_size_large}</Text>
              </View>
              <Text style={{ fontSize: textSize, color: '#94a3b8', marginTop: 12, lineHeight: textSize * 1.6 }}>
                The quick brown fox jumps over the lazy dog.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t.about}</Text>
          <View style={styles.card}>
            <SettingRow 
              icon="cloud-download-outline" 
              label={t.check_updates} 
              value="v1.0.26"
              onPress={handleCheckUpdates}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="shield-checkmark-outline" 
              label={t.privacy_policy} 
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="document-text-outline" 
              label={t.terms} 
              onPress={() => {}}
            />
          </View>
        </View>

        <Text style={styles.footerText}>Novesia App v1.0.26 Build 2026</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Modal */}
      <PremiumModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
        title={t.select_language}
        data={LANGUAGES}
        selectedValue={lang}
        onSelect={(id: any) => changeLang(id)}
      />

      {/* Update info modal */}
      <PremiumInfoModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
        title={t.check_updates}
        message={t.app_is_up_to_date + " (v1.0.26)"}
        icon="cloud-done-outline"
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
  divider: { height: 1, backgroundColor: '#1e1e2e', marginLeft: 68 },
  footerText: { 
    textAlign: 'center', 
    color: '#334155', 
    fontSize: 12, 
    marginTop: 20,
    fontWeight: '600'
  },
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
  modalList: { paddingHorizontal: 16, paddingTop: 10 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    marginBottom: 8,
  },
  modalOptionActive: { backgroundColor: 'rgba(212, 168, 67, 0.1)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionFlag: { fontSize: 20, marginRight: 14 },
  optionText: { fontSize: 16, color: '#94a3b8', fontWeight: '600' },
  optionTextActive: { color: '#fff' },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  infoModalContainer: {
    width: '100%',
    backgroundColor: '#111118',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  infoIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 168, 67, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoButton: {
    backgroundColor: '#d4a843',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#0a0a0f',
    fontWeight: '800',
    fontSize: 15,
  },
  sizeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 168, 67, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeBtnText: { fontSize: 16, fontWeight: '700', color: '#d4a843' },
  sizeSliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#1e1e2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sizeSliderFill: { height: '100%', backgroundColor: '#d4a843', borderRadius: 3 },
});
