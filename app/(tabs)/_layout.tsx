import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ShimmerIcon } from '../../components/ShimmerIcon';
import { ShimmerText } from '../../components/ShimmerText';
import { useTheme } from '../../lib/ThemeProvider';

const TAB_LABEL_STYLE = { fontSize: 11, fontWeight: '600' as const };

function TabIcon({
  name,
  focused,
  color,
  size,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  color: string;
  size: number;
  badge?: number;
}) {
  return focused ? (
    <ShimmerIcon name={name} size={size} baseColor={color} />
  ) : (
    <Ionicons name={name} color={color} size={size} />
  );
}

function TabLabel({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  return focused ? (
    <ShimmerText style={TAB_LABEL_STYLE} baseColor={color} shineColor="rgba(255,250,230,0.95)">
      {label}
    </ShimmerText>
  ) : (
    <Text style={[TAB_LABEL_STYLE, { color }]}>{label}</Text>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="home" focused={focused} color={color} size={size} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Beranda" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Jelajah',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="compass" focused={focused} color={color} size={size} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Jelajah" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="bookmark" focused={focused} color={color} size={size} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Library" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="chatbubbles" focused={focused} color={color} size={size} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Forum" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="person" focused={focused} color={color} size={size} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel label="Profil" focused={focused} color={color} />
          ),
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen name="semua" options={{ href: null }} />
    </Tabs>
  );
}
