import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
  style?: ViewStyle;
};

export function StatTile({ label, value, sublabel, accent, style }: Props) {
  return (
    <View style={[styles.wrap, accent && styles.accentWrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && { color: colors.gold }]}>{value}</Text>
      {sublabel ? <Text style={styles.sub}>{sublabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  accentWrap: {
    borderColor: colors.goldDark,
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  value: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.xs,
  },
  sub: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: spacing.xs,
  },
});
