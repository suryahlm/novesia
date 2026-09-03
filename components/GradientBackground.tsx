import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/ThemeProvider';

export function GradientBackground() {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

