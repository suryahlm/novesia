import React, { createContext, useContext, useMemo } from 'react';

import { ACCENT_REGISTRY, AccentId, isAccentFree } from './accents';
import { ColorScheme, darkColors, lightColors } from './colors';
import { useThemeStore, ThemeMode } from './useThemeStore';

export interface Theme {
  colors: ColorScheme;
  isDark: boolean;
  accentId: AccentId;
  mode: ThemeMode;
}

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(accentId: AccentId, mode: ThemeMode): Theme {
  const accent = ACCENT_REGISTRY[accentId] || ACCENT_REGISTRY.peridot;
  const base = mode === 'light' ? lightColors : darkColors;
  const isLightAccent = ['gold', 'silver', 'peridot', 'sakura'].includes(accentId);
  return {
    colors: {
      ...base,
      primary: accent.primary,
      primaryMuted: accent.primaryMuted,
      primaryPressed: accent.primaryPressed,
      gradientLight: accent.gradientLight,
      gradientDark: accent.gradientDark,
      textOnPrimary: isLightAccent ? '#0D1012' : '#FFFFFF',
    },
    isDark: mode === 'dark',
    accentId,
    mode,
  };
}

interface ThemeProviderProps {
  children: React.ReactNode;
  isVip?: boolean;
}

export function ThemeProvider({ children, isVip = false }: ThemeProviderProps) {
  const accentId = useThemeStore((s) => s.accentId);
  const mode = useThemeStore((s) => s.mode);

  // Gating in render: if not VIP and accent is VIP-only, fallback to peridot
  const effectiveAccentId = isVip || isAccentFree(accentId) ? accentId : 'peridot';
  const theme = useMemo(() => buildTheme(effectiveAccentId, mode), [effectiveAccentId, mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Return fallback dark theme if used outside provider
    return buildTheme('peridot', 'dark');
  }
  return ctx;
}
