import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDisclaimerStore } from '../lib/useDisclaimerStore';
import { useTheme } from '../lib/ThemeProvider';
import { GradientBackground } from './GradientBackground';

function DisclaimerCard({
  icon,
  number,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.numberBadge,
            {
              backgroundColor: colors.primaryMuted || colors.primary + '18',
              borderColor: colors.primary + '35',
            },
          ]}
        >
          <Text style={[styles.numberBadgeText, { color: colors.primary }]}>{number}</Text>
        </View>

        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
      </View>

      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

/**
 * FirstLaunchDisclaimer
 * Full-screen modal that displays ONCE in the lifetime of the device.
 * Persisted using Zustand + AsyncStorage.
 */
export function FirstLaunchDisclaimer() {
  const { colors } = useTheme();

  const hasAccepted = useDisclaimerStore((s) => s.hasAcceptedDisclaimer);
  const acceptDisclaimer = useDisclaimerStore((s) => s.acceptDisclaimer);

  if (hasAccepted) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <GradientBackground />

      {/* Ambient luxury glow */}
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '06', 'rgba(0,0,0,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Scrollable Disclaimer Content */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Shield & Title */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.primaryMuted || colors.primary + '18',
                  borderColor: colors.primary + '40',
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>

            <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
              Notice & Disclaimer
            </Text>

            <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
              Important Terms Before You Begin Reading
            </Text>
          </View>

          {/* Welcoming Text */}
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Welcome to Novesia. Before you begin exploring thousands of translated web novel chapters, please take a moment to understand our service nature, copyright standards, and terms.
          </Text>

          {/* Section 1: Agregator */}
          <DisclaimerCard
            icon="server-outline"
            number={1}
            title="Web Fiction Aggregator Platform"
          >
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Novesia functions strictly as a web aggregator platform and indexing directory for Asian fiction literature. We do NOT author original content and do NOT store private novel text files on our servers.
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              All indexed novels and chapters are gathered from open public sources across the internet for reading convenience, language study, and literary appreciation.
            </Text>
          </DisclaimerCard>

          {/* Section 2: Hak Cipta */}
          <DisclaimerCard
            icon="ribbon-outline"
            number={2}
            title="Intellectual Property & Creator Rights"
          >
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              All novel titles, fictional characters, story manuscripts, and official illustrations remain the exclusive intellectual property of their original authors, publishers, and licensed rights holders.
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Novesia claims no ownership over these works and wholeheartedly urges readers to support original creators through official licensed publications.
            </Text>
          </DisclaimerCard>

          {/* Section 3: Takedown & Hubungi Kami */}
          <DisclaimerCard
            icon="scale-outline"
            number={3}
            title="Takedown Inquiries & Contact"
          >
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              If you are a legitimate rights holder requesting the removal of specific indexed links from our directory, our team handles takedown requests promptly via email:
            </Text>
            <Text style={[styles.emailText, { color: colors.primary }]}>
              support@novesia.cc
            </Text>
          </DisclaimerCard>

          {/* Agreement Notice */}
          <View style={styles.footnoteContainer}>
            <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text style={[styles.footnoteText, { color: colors.textMuted }]}>
              By tapping the button below, you confirm that you have read, understood, and agreed to this notice and Novesia’s complete Terms of Service.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Footer with Agreement Button */}
        <View
          style={[
            styles.footerContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={acceptDisclaimer}
            style={({ pressed }) => [
              styles.agreeBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="I Understand and Agree"
          >
            <Ionicons name="checkmark-circle" size={17} color={colors.textOnPrimary} />
            <Text style={[styles.agreeBtnText, { color: colors.textOnPrimary }]}>
              I Understand and Agree
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  iconContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  introText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardBody: {
    gap: 6,
    paddingLeft: 34,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 18.5,
  },
  emailText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  footnoteContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  footnoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15.5,
    fontStyle: 'italic',
  },
  footerContainer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  agreeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 13,
  },
  agreeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
