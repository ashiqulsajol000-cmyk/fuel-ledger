import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, radii, spacing, typography } from '../theme';

const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'BDT', symbol: '৳', label: 'BDT — ৳' },
  { code: 'USD', symbol: '$', label: 'USD — $' },
  { code: 'EUR', symbol: '€', label: 'EUR — €' },
  { code: 'INR', symbol: '₹', label: 'INR — ₹' },
  { code: 'GBP', symbol: '£', label: 'GBP — £' },
  { code: 'AED', symbol: 'د.إ', label: 'AED — د.إ' },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { settings, update } = useSettings();

  return (
    <Screen>
      <Text style={styles.kicker}>SETTINGS</Text>
      <Text style={styles.title}>Preferences</Text>
      <View style={{ height: spacing.lg }} />

      <Card padded>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
      </Card>

      <Text style={styles.section}>Currency</Text>
      <Card padded>
        {CURRENCIES.map((c, i) => (
          <Pressable
            key={c.code}
            onPress={() =>
              update({ currencyCode: c.code, currencySymbol: c.symbol })
            }
            style={[styles.row, i === CURRENCIES.length - 1 && { borderBottomWidth: 0 }]}
          >
            <Text style={styles.rowLabel}>{c.label}</Text>
            {settings.currencyCode === c.code ? (
              <Ionicons name="checkmark" size={20} color={colors.gold} />
            ) : null}
          </Pressable>
        ))}
      </Card>

      <Text style={styles.section}>Efficiency display</Text>
      <Card padded>
        {[
          { key: 'kpl', label: 'km / L' },
          { key: 'l_per_100km', label: 'L / 100 km' },
          { key: 'mpg', label: 'MPG (US)' },
        ].map((o, i, arr) => (
          <Pressable
            key={o.key}
            onPress={() => update({ efficiencyUnit: o.key as never })}
            style={[styles.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}
          >
            <Text style={styles.rowLabel}>{o.label}</Text>
            {settings.efficiencyUnit === o.key ? (
              <Ionicons name="checkmark" size={20} color={colors.gold} />
            ) : null}
          </Pressable>
        ))}
      </Card>

      <View style={{ height: spacing.xl }} />
      <Button title="Sign out" onPress={signOut} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { ...typography.label, color: colors.gold },
  title: { ...typography.title, color: colors.text, marginTop: 4 },
  section: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  cardLabel: { ...typography.label, color: colors.textMuted },
  email: {
    ...typography.subheading,
    color: colors.text,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.body, color: colors.text },
});
