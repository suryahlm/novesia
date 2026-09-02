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

// Hindari splash screen menutup mendadak sebelum root layout siap
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Sembunyikan native splash screen seketika saat root stack mount (0ms delay)
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
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
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="akun" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="search" options={{ animation: 'fade' }} />
        <Stack.Screen name="rewards" options={{ animation: 'slide_from_right' }} />
      </Stack>


    </>
  );
}

export default function RootLayout() {
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
