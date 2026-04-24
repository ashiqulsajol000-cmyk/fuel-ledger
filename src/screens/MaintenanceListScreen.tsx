import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { listMaintenance, listVehicles } from '../lib/api';
import { colors, radii, spacing, typography } from '../theme';
import type { MaintenanceLog, Vehicle } from '../types';
import { daysUntil } from '../utils/calc';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MaintenanceListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [v, m] = await Promise.all([listVehicles(user.id), listMaintenance(user.id)]);
    setVehicles(v);
    setLogs(m);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(
    () => (filter ? logs.filter((l) => l.vehicle_id === filter) : logs),
    [logs, filter],
  );

  const vehicleMap = useMemo(() => {
    const m = new Map<string, Vehicle>();
    for (const v of vehicles) m.set(v.id, v);
    return m;
  }, [vehicles]);

  if (vehicles.length === 0) {
    return (
      <Screen>
        <Text style={styles.kicker}>MAINTENANCE</Text>
        <Text style={styles.title}>Service log</Text>
        <EmptyState
          icon="construct-outline"
          title="Add a vehicle first"
          description="You need at least one vehicle before you can log maintenance."
          action={
            <Button
              title="Go to Garage"
              onPress={() => navigation.navigate('Main', { screen: 'VehiclesTab' } as never)}
            />
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>MAINTENANCE</Text>
          <Text style={styles.title}>Service log</Text>
        </View>
        <Pressable
          onPress={() =>
            navigation.navigate('MaintenanceForm', { vehicleId: filter ?? undefined })
          }
          style={styles.addBtn}
          hitSlop={4}
        >
          <Ionicons name="add" size={22} color={colors.gold} />
        </Pressable>
      </View>

      {vehicles.length > 1 ? (
        <View style={styles.filterRow}>
          <FilterPill label="All" active={filter === null} onPress={() => setFilter(null)} />
          {vehicles.map((v) => (
            <FilterPill
              key={v.id}
              label={v.name}
              active={filter === v.id}
              onPress={() => setFilter(v.id)}
            />
          ))}
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title="No services logged"
          description="Log oil changes, tire rotations, and repairs to see cost totals and due dates."
          action={
            <Button
              title="Log service"
              onPress={() =>
                navigation.navigate('MaintenanceForm', {
                  vehicleId: filter ?? undefined,
                })
              }
            />
          }
        />
      ) : (
        filtered.map((m) => {
          const dueDays = m.next_due_date ? daysUntil(m.next_due_date) : null;
          const overdue = dueDays !== null && dueDays < 0;
          const soon = dueDays !== null && dueDays >= 0 && dueDays <= 14;
          return (
            <Pressable
              key={m.id}
              onPress={() => navigation.navigate('MaintenanceForm', { logId: m.id })}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.logRow}>
                  <View style={styles.logIcon}>
                    <Ionicons name="construct" size={20} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Text style={styles.serviceName}>{m.service_type}</Text>
                      <Text style={styles.cost}>
                        {formatCurrency(m.cost, settings.currencySymbol, 0)}
                      </Text>
                    </View>
                    <Text style={styles.subText}>
                      {vehicleMap.get(m.vehicle_id)?.name ?? 'Vehicle'} ·{' '}
                      {formatDate(m.service_date)} · {formatNumber(m.odometer_km, 0)} km
                    </Text>
                    {m.next_due_date ? (
                      <View
                        style={[
                          styles.dueTag,
                          overdue && { borderColor: colors.danger },
                          soon && !overdue && { borderColor: colors.warning },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dueText,
                            overdue && { color: colors.danger },
                            soon && !overdue && { color: colors.warning },
                          ]}
                        >
                          {overdue
                            ? `Overdue · ${formatDate(m.next_due_date)}`
                            : `Due ${formatDate(m.next_due_date)}`}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  kicker: {
    ...typography.label,
    color: colors.gold,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginTop: 4,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: colors.goldDark,
  },
  pillText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  serviceName: {
    ...typography.subheading,
    color: colors.text,
  },
  cost: {
    ...typography.subheading,
    color: colors.gold,
  },
  subText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  dueTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  dueText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.gold,
    fontSize: 11,
  },
});
