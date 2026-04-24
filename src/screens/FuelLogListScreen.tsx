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
import { listFuelLogs, listVehicles } from '../lib/api';
import { colors, radii, spacing, typography } from '../theme';
import type { FuelLog, Vehicle } from '../types';
import { formatCurrency, formatDate, formatLiters, formatNumber } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function FuelLogListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [v, f] = await Promise.all([listVehicles(user.id), listFuelLogs(user.id)]);
    setVehicles(v);
    setLogs(f);
    if (!filter && v.length) setFilter(null);
  }, [user, filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filteredLogs = useMemo(
    () => (filter ? logs.filter((l) => l.vehicle_id === filter) : logs),
    [logs, filter],
  );

  const vehicleMap = useMemo(() => {
    const m = new Map<string, Vehicle>();
    for (const v of vehicles) m.set(v.id, v);
    return m;
  }, [vehicles]);

  // Compute KPL for each full-tank fill
  const kplMap = useMemo(() => {
    const out = new Map<string, number>();
    const byVehicle = new Map<string, FuelLog[]>();
    for (const log of logs) {
      if (!byVehicle.has(log.vehicle_id)) byVehicle.set(log.vehicle_id, []);
      byVehicle.get(log.vehicle_id)!.push(log);
    }
    for (const arr of byVehicle.values()) {
      const sorted = [...arr].sort(
        (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
      );
      let lastFullOdo: number | null = null;
      let pendingLiters = 0;
      for (const log of sorted) {
        if (log.is_full_tank) {
          if (lastFullOdo !== null) {
            const distance = log.odometer_km - lastFullOdo;
            const liters = pendingLiters + Number(log.liters);
            if (distance > 0 && liters > 0) {
              out.set(log.id, distance / liters);
            }
          }
          lastFullOdo = log.odometer_km;
          pendingLiters = 0;
        } else {
          pendingLiters += Number(log.liters);
        }
      }
    }
    return out;
  }, [logs]);

  if (vehicles.length === 0) {
    return (
      <Screen>
        <Text style={styles.kicker}>FUEL LOG</Text>
        <Text style={styles.title}>Fuel</Text>
        <EmptyState
          icon="water-outline"
          title="Add a vehicle first"
          description="You need at least one vehicle before you can log fuel."
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
          <Text style={styles.kicker}>FUEL LOG</Text>
          <Text style={styles.title}>Fuel</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('FuelLogForm', { vehicleId: filter ?? undefined })}
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

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon="water-outline"
          title="No fuel logs yet"
          description="Log your first fill-up to start tracking mileage and cost."
          action={
            <Button
              title="Log fuel"
              onPress={() =>
                navigation.navigate('FuelLogForm', { vehicleId: filter ?? undefined })
              }
            />
          }
        />
      ) : (
        filteredLogs.map((log) => {
          const kpl = kplMap.get(log.id);
          return (
            <Pressable
              key={log.id}
              onPress={() => navigation.navigate('FuelLogForm', { logId: log.id })}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.logRow}>
                  <View style={styles.logIcon}>
                    <Ionicons name="water" size={20} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Text style={styles.vehName}>
                        {vehicleMap.get(log.vehicle_id)?.name ?? 'Vehicle'}
                      </Text>
                      <Text style={styles.cost}>
                        {formatCurrency(log.total_cost, settings.currencySymbol, 0)}
                      </Text>
                    </View>
                    <Text style={styles.subText}>
                      {formatDate(log.logged_at)} · {formatLiters(log.liters)} ·{' '}
                      {formatNumber(log.odometer_km, 0)} km
                    </Text>
                    {kpl ? (
                      <View style={styles.kplTag}>
                        <Text style={styles.kplText}>{formatNumber(kpl, 2)} km/L</Text>
                      </View>
                    ) : !log.is_full_tank ? (
                      <View style={[styles.kplTag, { borderColor: colors.border }]}>
                        <Text style={[styles.kplText, { color: colors.textMuted }]}>
                          Partial fill
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
  vehName: {
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
  kplTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  kplText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.gold,
    fontSize: 11,
  },
});
