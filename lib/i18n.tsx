import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'id';

const translations = {
  en: {
    // Tabs
    home: 'Home',
    all: 'All',
    library: 'Library',
    discovery: 'Discovery',
    profile: 'Profile',

    // Home
    continue_reading: 'CONTINUE READING',
    latest_update: 'LATEST UPDATE',
    latest_novels: 'LATEST NOVELS',
    featured_now: 'FEATURED NOW',
    trending_today: 'TRENDING TODAY',
    for_you: 'FOR YOU',
    see_all: 'See All',
    ongoing: 'Ongoing',
    completed: 'Completed',
    coming_soon: 'Coming Soon',
    novels_count: 'novels',
    your_library: 'Your Library',
    library_desc: 'Bookmarked novels and reading history will appear here.',
    search_placeholder: 'Search novel title...',
    no_novels_found: 'No novels found',

    // Profile
    guest_user: 'Guest User',
    login: 'Login',
    sign_out: 'Sign Out',
    buy_me_coffee: 'Buy Me a Coffee ☕',
    buy_me_coffee_desc: 'Support our development',
    recent_reads: 'Recent Reads',
    downloads: 'Downloads',
    reading_preferences: 'Reading Preferences',
    account: 'Account',
    settings: 'Settings',
    no_history: 'No reading history yet',
    forum: 'Forum',

    // Rewards
    rewards: 'Rewards',
    daily_checkin: 'Daily Check-in',
    checkin_week: 'This week',
    checkin_days: 'days',
    checkin_done: 'Already checked in today ✅',
    checkin_btn: 'Check In Now',
    referral_code: 'Referral Code',
    referral_friend_code: "Friend's Referral Code",
    referral_claim: 'Claim',
    referral_copied: 'Copied!',
    watch_ads: 'Watch Ads',
    rewards_vip_hint: 'Collect your coins now — VIP features with exclusive benefits are coming soon!',
    coins: 'Coins',
    referral_own_code: 'Cannot use your own code',
    referral_already_claimed: 'You have already claimed a referral code',
    watch_ads_btn: 'Watch Ad Now',
    watch_ads_cooldown: 'Available again in',

    // Settings
    preferences: 'PREFERENCES',
    language: 'Language',
    age: 'Age',
    notifications: 'Notifications',
    about: 'ABOUT',
    check_updates: 'Check for Updates',
    privacy_policy: 'Privacy Policy',
    terms: 'Terms of Service',
    close: 'Close',
    select_language: 'Select Language',
    select_age: 'Select Age',
    app_is_up_to_date: 'Application is up to date',
    birth_date: 'Birth Date',
    day: 'Day',
    month: 'Month',
    year: 'Year',
    years_old: 'years old',
    select_birth_date: 'Select Birth Date',
    save: 'Save',

    // Settings - Reading
    reading_section: 'READING',
    text_size: 'Text Size',
    text_size_desc: 'Adjust the font size for reading chapters',
    text_size_small: 'Small',
    text_size_medium: 'Medium',
    text_size_large: 'Large',

    // Novel / Read
    synopsis: 'Synopsis',
    chapter_list: 'Chapter List',
    read_now: 'Read Now',
    font_size: 'Font Size',
    theme: 'Theme',
    line_spacing: 'Line Spacing',
    chapter_not_found: 'Chapter not found',
    back: 'Back',
    all_chapters: 'All Chapters',
    close_all: 'Close All',
    no_chapters: 'No chapters yet',
    continue_reading_btn: 'Continue Reading',
    translate_admin: 'Translate via Admin Portal',
    novel_not_found: 'Novel not found',

    // Clear Cache Modal
    clear_cache: 'Clear Cache',
    clear_cache_desc: 'All cached data will be deleted including reading history, saved library, and local preferences.',
    clear_cache_items: 'items stored',
    clear_cache_cancel: 'Cancel',
    clear_cache_delete: 'Delete',
    clear_cache_success: 'Success!',
    clear_cache_success_desc: 'cache items have been deleted. App is fresh again.',
    clear_cache_error: 'Failed',
    clear_cache_error_desc: 'An error occurred while clearing cache. Please try again.',
    clear_cache_ok: 'OK',
    clear_cache_close: 'Close',
  },
  id: {
    // Tabs
    home: 'Beranda',
    all: 'Semua',
    library: 'Pustaka',
    discovery: 'Jelajah',
    profile: 'Profil',

    // Home
    continue_reading: 'LANJUT BACA',
    latest_update: 'UPDATE TERBARU',
    latest_novels: 'NOVEL TERBARU',
    featured_now: 'UNGGULAN',
    trending_today: 'TREN HARI INI',
    for_you: 'UNTUKMU',
    see_all: 'Lihat Semua',
    ongoing: 'Berjalan',
    completed: 'Tamat',
    coming_soon: 'Segera',
    novels_count: 'novel',
    your_library: 'Pustaka Kamu',
    library_desc: 'Novel yang ditandai dan riwayat baca akan muncul di sini.',
    search_placeholder: 'Cari judul novel...',
    no_novels_found: 'Novel tidak ditemukan',

    // Profile
    guest_user: 'Pengguna Tamu',
    login: 'Masuk',
    sign_out: 'Keluar Akun',
    buy_me_coffee: 'Traktir Kopi ☕',
    buy_me_coffee_desc: 'Dukung pengembangan kami',
    recent_reads: 'Bacaan Terakhir',
    downloads: 'Unduhan',
    reading_preferences: 'Preferensi Baca',
    account: 'Akun',
    settings: 'Pengaturan',
    no_history: 'Belum ada riwayat baca',
    forum: 'Forum',

    // Rewards
    rewards: 'Hadiah',
    daily_checkin: 'Absen Harian',
    checkin_week: 'Minggu ini',
    checkin_days: 'hari',
    checkin_done: 'Sudah Absen Hari Ini ✅',
    checkin_btn: 'Absen Sekarang',
    referral_code: 'Kode Referral',
    referral_friend_code: 'Kode Referral Teman',
    referral_claim: 'Klaim',
    referral_copied: 'Tersalin!',
    watch_ads: 'Tonton Iklan',
    rewards_vip_hint: 'Kumpulkan koinmu dari sekarang — fitur VIP dengan keuntungan eksklusif akan segera hadir!',
    coins: 'Koin',
    referral_own_code: 'Tidak bisa pakai kode sendiri',
    referral_already_claimed: 'Kamu sudah pernah klaim kode referral',
    watch_ads_btn: 'Tonton Iklan Sekarang',
    watch_ads_cooldown: 'Tersedia lagi dalam',

    // Settings
    preferences: 'PREFERENSI',
    language: 'Bahasa',
    age: 'Umur',
    notifications: 'Notifikasi',
    about: 'TENTANG',
    check_updates: 'Periksa Pembaharuan',
    privacy_policy: 'Kebijakan Privasi',
    terms: 'Ketentuan Layanan',
    close: 'Tutup',
    select_language: 'Pilih Bahasa',
    select_age: 'Pilih Umur',
    app_is_up_to_date: 'Aplikasi sudah versi terbaru',
    birth_date: 'Tanggal Lahir',
    day: 'Hari',
    month: 'Bulan',
    year: 'Tahun',
    years_old: 'tahun',
    select_birth_date: 'Pilih Tanggal Lahir',
    save: 'Simpan',

    // Settings - Reading
    reading_section: 'BACAAN',
    text_size: 'Ukuran Teks',
    text_size_desc: 'Atur ukuran font untuk membaca chapter',
    text_size_small: 'Kecil',
    text_size_medium: 'Sedang',
    text_size_large: 'Besar',

    // Novel / Read
    synopsis: 'Sinopsis',
    chapter_list: 'Daftar Bab',
    read_now: 'Baca Sekarang',
    font_size: 'Ukuran Font',
    theme: 'Tema',
    line_spacing: 'Spasi Baris',
    chapter_not_found: 'Bab tidak ditemukan',
    back: 'Kembali',
    all_chapters: 'Semua Bab',
    close_all: 'Tutup Semua',
    no_chapters: 'Belum ada bab',
    continue_reading_btn: 'Lanjut Baca',
    translate_admin: 'Terjemahkan via Admin Portal',
    novel_not_found: 'Novel tidak ditemukan',

    // Clear Cache Modal
    clear_cache: 'Hapus Cache',
    clear_cache_desc: 'Semua data cache akan dihapus termasuk riwayat baca, library tersimpan, dan preferensi lokal.',
    clear_cache_items: 'item tersimpan',
    clear_cache_cancel: 'Batal',
    clear_cache_delete: 'Hapus',
    clear_cache_success: 'Berhasil!',
    clear_cache_success_desc: 'item cache telah dihapus. Aplikasi kembali segar.',
    clear_cache_error: 'Gagal',
    clear_cache_error_desc: 'Terjadi kesalahan saat menghapus cache. Silakan coba lagi.',
    clear_cache_ok: 'OK',
    clear_cache_close: 'Tutup',
  }
};

interface LanguageContextType {
  lang: Language;
  t: typeof translations.en;
  changeLang: (newLang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem('app_lang').then((saved) => {
      if (saved) setLang(saved as Language);
    });
  }, []);

  const changeLang = async (newLang: Language) => {
    setLang(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
