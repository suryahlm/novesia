export const gold = {
  50: '#FDF4D9',
  100: '#F8E095',
  200: '#F0C240',
  300: '#D4940C',
  400: '#B87808',
  500: '#9A6206',
  600: '#7C4E05',
  700: '#5E3A04',
  800: '#3F2703',
  900: '#261802',
} as const;

export const graphite = {
  50: '#F4F4F1',
  100: '#A9ADAF',
  200: '#73787B',
  300: '#555B5E',
  400: '#3A3F42',
  500: '#262B2F',
  600: '#1D2225',
  700: '#171B1E',
  800: '#121619',
  900: '#0D1012',
  950: '#070809',
} as const;

export const semantic = {
  success: '#66C47A',
  warning: '#E5A94B',
  danger: '#D86666',
  info: '#6F9FC8',
} as const;

export interface ColorScheme {
  background: string;
  backgroundGradient: [string, string];
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  primary: string;
  primaryMuted: string;
  primaryPressed: string;
  gradientLight: string;
  gradientDark: string;
  skeletonBase: string;
  skeletonHighlight: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

const sharedBrandColors = {
  primary: gold[300],
  primaryMuted: 'rgba(212,148,12,0.14)',
  primaryPressed: gold[200],
  textOnPrimary: '#17130D',
  gradientLight: gold[200],
  gradientDark: gold[300],
  ...semantic,
};

export const darkColors: ColorScheme = {
  ...sharedBrandColors,
  background: graphite[900],
  backgroundGradient: [graphite[900], graphite[800]],
  surface: graphite[700],
  surfaceElevated: graphite[600],
  border: 'rgba(255,255,255,0.08)',
  textPrimary: graphite[50],
  textSecondary: graphite[100],
  textMuted: graphite[200],
  skeletonBase: graphite[700],
  skeletonHighlight: graphite[500],
};

export const lightColors: ColorScheme = {
  ...sharedBrandColors,
  background: '#FAF7F2',
  backgroundGradient: ['#FAF7F2', '#F0EBE1'],
  surface: '#FFFFFF',
  surfaceElevated: '#F3EEE5',
  border: 'rgba(23,19,13,0.09)',
  textPrimary: '#211D17',
  textSecondary: '#57524A',
  textMuted: '#8C867B',
  skeletonBase: '#EDE7DC',
  skeletonHighlight: '#F7F3EA',
};
