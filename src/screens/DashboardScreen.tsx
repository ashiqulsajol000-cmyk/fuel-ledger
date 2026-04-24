import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { listFuelLogs, listMaintenance, listVehicles } from '../lib/api';
import { colors, radii, spacing, typography } from '../theme';
import type { FuelLog, MaintenanceLog, Vehicle } from '../types';
import { computeFuelStats, daysUntil, efficiencySeries, monthlySpend } from '../utils/calc';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';
import { TrendChart } from '../components/TrendChart';
import { Button } from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [v, f, m] = await Promise.all([
        listVehicles(user.id),
        listFuelLogs(user.id),
        listMaintenance(user.id),
      ]);
      setVehicles(v);
      setFuelLogs(f);
      setMaintenanceLogs(m);
      if (!activeVehicleId && v.length) {
        setActiveVehicleId(v[0].id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user, activeVehicleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filteredFuel = useMemo(
    () =>
      activeVehicleId
        ? fuelLogs.filter((l) => l.vehicle_id === activeVehicleId)
        : fuelLogs,
    [fuelLogs, activeVehicleId],
  );
  const filteredMaint = useMemo(
    () =>
      activeVehicleId
        ? maintenanceLogs.filter((l) => l.vehicle_id === activeVehicleId)
        : maintenanceLogs,
    [maintenanceLogs, activeVehicleId],
  );

  const stats = useMemo(() => computeFuelStats(filteredFuel), [filteredFuel]);
  const series = useMemo(() => efficiencySeries(filteredFuel), [filteredFuel]);
  const months = useMemo(
    () => monthlySpend(filteredFuel, filteredMaint).slice(-6),
    [filteredFuel, filteredMaint],
  );
  const currentMonthTotal = months[months.length - 1]?.total ?? 0;

  const upcomingMaintenance = useMemo(
    () =>
      filteredMaint
        .filter((m) => m.next_due_date)
        .map((m) => ({ ...m, days: daysUntil(m.next_due_date as string) }))
        .filter((m) => m.days <= 60)
        .sort((a, b) => a.days - b.days)
        .slice(0, 3),
    [filteredMaint],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting()}, {user?.email?.split('@')[0] ?? 'driver'}
          </Text>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
        </View>
      </View>

      {vehicles.length === 0 && !loading ? (
        <Card style={{ marginTop: spacing.lg }}>
          <EmptyState
            icon="car-sport-outline"
            title="Add your first vehicle"
            description="Start tracking fuel, mileage, and maintenance by adding a vehicle."
            action={
              <Button
                title="Add Vehicle"
                onPress={() => navigation.navigate('VehicleForm', {})}
              />
            }
          />
        </Card>
      ) : null}

      {vehicles.length > 0 ? (
        <View style={styles.vehicleScroll}>
          <VehiclePill
            label="All vehicles"
            active={activeVehicleId === null}
            onPress={() => setActiveVehicleId(null)}
          />
          {vehicles.map((v) => (
            <VehiclePill
              key={v.id}
              label={v.name}
              active={activeVehicleId === v.id}
              onPress={() => setActiveVehicleId(v.id)}
            />
          ))}
        </View>
      ) : null}

      {vehicles.length > 0 ? (
        <>
          <HeroCard
            total={stats.totalSpent}
            thisMonth={currentMonthTotal}
            currencySymbol={settings.currencySymbol}
          />

          <View style={styles.statsRow}>
            <StatTile
              label="Avg KPL"
              value={formatNumber(stats.avgKpl, 2)}
              sublabel={`${formatNumber(stats.avgLPer100, 2)} L / 100 km`}
              accent
            />
            <View style={{ width: spacing.md }} />
            <StatTile
              label="Distance"
              value={`${formatNumber(stats.totalDistance, 0)} km`}
              sublabel={`${stats.fillCount} fills`}
            />
          </View>
          <View style={[styles.statsRow, { marginTop: spacing.md }]}>
            <StatTile
              label="Liters"
              value={formatNumber(stats.totalLiters, 1)}
              sublabel={`avg ${formatCurrency(stats.avgPricePerLiter, settings.currencySymbol, 2)}/L`}
            />
            <View style={{ width: spacing.md }} />
            <StatTile
              label="Cost / km"
              value={formatCurrency(stats.costPerKm, settings.currencySymbol, 2)}
              sublabel="running average"
            />
          </View>

          <SectionHeader title="Efficiency trend" />
          <Card padded>
            {series.length >= 1 ? (
              <TrendChart
                data={series.map((p) => ({ x: new Date(p.date).getTime(), y: p.kpl }))}
                unit="KPL"
                color={colors.gold}
              />
            ) : (
              <Text style={styles.muted}>
                Log at least two full-tank fills to see your efficiency trend.
              </Text>
            )}
          </Card>

          <SectionHeader title="Monthly spend" />
          <Card padded>
            {months.length ? (
              <MonthlyBars data={months} currencySymbol={settings.currencySymbol} />
            ) : (
              <Text style={styles.muted}>No spend yet. Add a fuel log to get started.</Text>
            )}
          </Card>

          <SectionHeader
            title="Upcoming maintenance"
            actionLabel="View all"
            onAction={() => navigation.navigate('Main', { screen: 'MaintenanceTab' } as never)}
          />
          {upcomingMaintenance.length === 0 ? (
            <Card padded>
              <Text style={styles.muted}>No services due in the next 60 days.</Text>
            </Card>
          ) : (
            upcomingMaintenance.map((m) => (
              <Card key={m.id} padded style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.serviceType}>{m.service_type}</Text>
                  <Text
                    style={[
                      styles.daysTag,
                      m.days <= 7 && { color: colors.danger, borderColor: colors.danger },
                    ]}
                  >
                    {m.days <= 0 ? 'Overdue' : `In ${m.days}d`}
                  </Text>
                </View>
                <Text style={styles.subText}>
                  Due {formatDate(m.next_due_date as string)}
                </Text>
              </Card>
            ))
          )}
        </>
      ) : null}

      {error ? <Text style={[styles.muted, { color: colors.danger }]}>{error}</Text> : null}
    </Screen>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function VehiclePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      hitSlop={4}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function HeroCard({
  total,
  thisMonth,
  currencySymbol,
}: {
  total: number;
  thisMonth: number;
  currencySymbol: string;
}) {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={['rgba(212,175,55,0.22)', 'rgba(10,10,11,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.heroInner}>
        <Text style={styles.heroLabel}>Lifetime spend</Text>
        <Text style={styles.heroValue}>{formatCurrency(total, currencySymbol, 0)}</Text>
        <View style={styles.heroRow}>
          <Ionicons name="trending-up" size={14} color={colors.gold} />
          <Text style={styles.heroSub}>
            {formatCurrency(thisMonth, currencySymbol, 0)} this month
          </Text>
        </View>
      </View>
    </View>
  );
}

function MonthlyBars({
  data,
  currencySymbol,
}: {
  data: { month: string; fuel: number; maintenance: number; total: number }[];
  currencySymbol: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <View>
      <View style={styles.barsRow}>
        {data.map((d) => {
          const fuelH = (d.fuel / max) * 120;
          const maintH = (d.maintenance / max) * 120;
          return (
            <View key={d.month} style={styles.barCol}>
              <Text style={styles.barTotal}>
                {d.total > 0 ? formatCurrency(d.total, currencySymbol, 0) : ''}
              </Text>
              <View style={styles.barStack}>
                {d.maintenance > 0 ? (
                  <View
                    style={[
                      styles.barSeg,
                      {
                        height: Math.max(maintH, 2),
                        backgroundColor: colors.info,
                      },
                    ]}
                  />
                ) : null}
                {d.fuel > 0 ? (
                  <LinearGradient
                    colors={[colors.goldSoft, colors.gold]}
                    style={[
                      styles.barSeg,
                      { height: Math.max(fuelH, 2), borderTopLeftRadius: 4, borderTopRightRadius: 4 },
                    ]}
                  />
                ) : null}
              </View>
              <Text style={styles.barLabel}>{d.month.slice(-2)}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
          <Text style={styles.legendText}>Fuel</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={styles.legendText}>Maintenance</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  greeting: {
    ...typography.title,
    color: colors.text,
  },
  date: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: 2,
  },
  vehicleScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.lg,
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
  hero: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.surfaceElevated,
  },
  heroInner: {
    padding: spacing.xl,
  },
  heroLabel: {
    ...typography.label,
    color: colors.gold,
  },
  heroValue: {
    ...typography.display,
    color: colors.text,
    marginTop: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  heroSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  muted: {
    ...typography.body,
    color: colors.textMuted,
  },
  serviceType: {
    ...typography.subheading,
    color: colors.text,
  },
  daysTag: {
    ...typography.caption,
    color: colors.gold,
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  subText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 170,
    paddingTop: spacing.md,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barStack: {
    width: 22,
    justifyContent: 'flex-end',
    height: 130,
  },
  barSeg: {
    width: '100%',
  },
  barTotal: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
    height: 14,
  },
  barLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
