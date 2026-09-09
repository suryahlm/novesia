import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { LanguageProvider } from '../lib/i18n';
import { ThemeProvider, useTheme } from '../lib/ThemeProvider';
import { QueryProvider } from '../lib/QueryProvider';
import { FirstLaunchDisclaimer } from '../components/FirstLaunchDisclaimer';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { AD_TEST_DEVICE_IDS, isAdMobSupported } from '../lib/ads';

// Hindari splash screen menutup mendadak sebelum root layout siap
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (!isAdMobSupported()) return;
    import('react-native-google-mobile-ads')
      .then(async ({ default: mobileAds }) => {
        try {
          await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: AD_TEST_DEVICE_IDS });
          mobileAds().initialize().catch(() => {});
        } catch {}
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Sembunyikan native splash screen seketika saat root stack mount (0ms delay)
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    if (typeof (NavigationBar as any).setButtonStyleAsync === 'function') {
      (NavigationBar as any).setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
    }
  }, [colors.background, isDark]);



  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.textPrimary,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.surface, colors.textPrimary, colors.background]
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="novel/[slug]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="read/[chapterId]" options={{ animation: 'fade' }} />
        <Stack.Screen name="forum" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="forum/[categorySlug]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="forum/thread/[threadId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="latest-updates" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="akun" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="search" options={{ animation: 'fade' }} />
        <Stack.Screen name="rewards" options={{ animation: 'slide_from_right' }} />
      </Stack>

      {/* Disclaimer muncul sekali seumur hidup device pada peluncuran pertama */}
      <FirstLaunchDisclaimer />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <QueryProvider>
              <RootStack />
            </QueryProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
