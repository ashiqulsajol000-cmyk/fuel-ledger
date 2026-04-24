import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  deleteFuelLog,
  listFuelLogs,
  listVehicles,
  upsertFuelLog,
} from '../lib/api';
import { colors, radii, spacing, typography } from '../theme';
import type { FuelLog, Vehicle } from '../types';
import { formatCurrency } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FuelLogForm'>;

export default function FuelLogFormScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { logId, vehicleId: initialVehicle } = route.params ?? {};
  const editing = Boolean(logId);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(initialVehicle ?? null);
  const [date, setDate] = useState(new Date());
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [lastEdited, setLastEdited] = useState<'price' | 'total'>('price');
  const [isFullTank, setIsFullTank] = useState(true);
  const [station, setStation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const v = await listVehicles(user.id);
      setVehicles(v);
      if (!vehicleId && v.length) setVehicleId(v[0].id);
      if (logId) {
        const all = await listFuelLogs(user.id);
        const l = all.find((x) => x.id === logId);
        if (l) {
          setVehicleId(l.vehicle_id);
          setDate(new Date(l.logged_at));
          setOdometer(String(l.odometer_km));
          setLiters(String(l.liters));
          setPricePerLiter(String(l.price_per_liter));
          setTotalCost(String(l.total_cost));
          setIsFullTank(l.is_full_tank);
          setStation(l.station ?? '');
          setNotes(l.notes ?? '');
        }
      }
    })();
  }, [user, logId]);

  // Auto-compute: if liters + price-per-liter → total. If liters + total → price-per-liter.
  const litersNum = Number(liters) || 0;
  const computedTotal = useMemo(() => {
    if (lastEdited === 'price' && litersNum && Number(pricePerLiter)) {
      return (litersNum * Number(pricePerLiter)).toFixed(2);
    }
    return totalCost;
  }, [litersNum, pricePerLiter, totalCost, lastEdited]);

  const computedPrice = useMemo(() => {
    if (lastEdited === 'total' && litersNum && Number(totalCost)) {
      return (Number(totalCost) / litersNum).toFixed(2);
    }
    return pricePerLiter;
  }, [litersNum, totalCost, pricePerLiter, lastEdited]);

  useEffect(() => {
    if (lastEdited === 'price') setTotalCost(computedTotal);
  }, [computedTotal, lastEdited]);

  useEffect(() => {
    if (lastEdited === 'total') setPricePerLiter(computedPrice);
  }, [computedPrice, lastEdited]);

  const save = async () => {
    if (!user) return;
    if (!vehicleId) {
      setError('Choose a vehicle.');
      return;
    }
    if (!odometer || !liters) {
      setError('Odometer and liters are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertFuelLog(user.id, {
        id: logId,
        vehicle_id: vehicleId,
        logged_at: date.toISOString(),
        odometer_km: Number(odometer),
        liters: Number(liters),
        price_per_liter: Number(pricePerLiter) || 0,
        total_cost: Number(totalCost) || 0,
        is_full_tank: isFullTank,
        station: station.trim() || null,
        notes: notes.trim() || null,
      });
      navigation.goBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    if (!logId) return;
    Alert.alert('Delete fuel entry?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFuelLog(logId);
            navigation.goBack();
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.kicker}>{editing ? 'EDIT' : 'NEW'} FUEL ENTRY</Text>
      <Text style={styles.title}>{editing ? 'Edit fill-up' : 'Log a fill-up'}</Text>
      <View style={{ height: spacing.lg }} />

      <Text style={styles.fieldLabel}>Vehicle</Text>
      <View style={styles.vehicleRow}>
        {vehicles.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => setVehicleId(v.id)}
            style={[styles.pill, vehicleId === v.id && styles.pillActive]}
          >
            <Text
              style={[styles.pillText, vehicleId === v.id && styles.pillTextActive]}
            >
              {v.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <DateRow date={date} onChange={setDate} />

      <Input
        label="Odometer"
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="decimal-pad"
        suffix="km"
        placeholder="12345"
      />
      <Input
        label="Liters"
        value={liters}
        onChangeText={setLiters}
        keyboardType="decimal-pad"
        suffix="L"
        placeholder="40"
      />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Price / liter"
            value={pricePerLiter}
            onChangeText={(t) => {
              setPricePerLiter(t);
              setLastEdited('price');
            }}
            keyboardType="decimal-pad"
            suffix={`${settings.currencySymbol}`}
            placeholder="135"
          />
        </View>
        <View style={{ width: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Input
            label="Total cost"
            value={totalCost}
            onChangeText={(t) => {
              setTotalCost(t);
              setLastEdited('total');
            }}
            keyboardType="decimal-pad"
            suffix={`${settings.currencySymbol}`}
            placeholder="5400"
          />
        </View>
      </View>
      {Number(totalCost) > 0 ? (
        <Text style={styles.computed}>
          = {formatCurrency(Number(totalCost), settings.currencySymbol, 2)} total
        </Text>
      ) : null}

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Full tank</Text>
          <Text style={styles.switchHelp}>
            Turn off for partial fills. Full tanks are needed to calculate mileage.
          </Text>
        </View>
        <Switch
          value={isFullTank}
          onValueChange={setIsFullTank}
          trackColor={{ false: colors.border, true: colors.goldDark }}
          thumbColor={isFullTank ? colors.gold : colors.textSubtle}
        />
      </View>

      <Input label="Station" value={station} onChangeText={setStation} placeholder="Optional" />
      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Octane, trip purpose, etc."
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={editing ? 'Save changes' : 'Add fill-up'}
        onPress={save}
        loading={loading}
        style={{ marginTop: spacing.md }}
      />
      {editing ? (
        <Button
          title="Delete entry"
          onPress={remove}
          variant="danger"
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Screen>
  );
}

function DateRow({ date, onChange }: { date: Date; onChange: (d: Date) => void }) {
  const shift = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onChange(d);
  };
  return (
    <View style={styles.dateWrap}>
      <Text style={styles.fieldLabel}>Date</Text>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateStep} onPress={() => shift(-1)}>
          <Ionicons name="chevron-back" size={18} color={colors.gold} />
        </Pressable>
        <Text style={styles.dateText}>
          {date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Pressable
          style={styles.dateStep}
          onPress={() => shift(1)}
          disabled={date.toDateString() === new Date().toDateString()}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={
              date.toDateString() === new Date().toDateString()
                ? colors.textSubtle
                : colors.gold
            }
          />
        </Pressable>
      </View>
      <Pressable onPress={() => onChange(new Date())} style={{ marginTop: 4 }}>
        <Text style={styles.todayLink}>Today</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...typography.label,
    color: colors.gold,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginTop: 4,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs + 2,
  },
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  pill: {
    paddingVertical: 8,
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
  dateWrap: {
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dateStep: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    ...typography.body,
    color: colors.text,
  },
  todayLink: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  switchLabel: {
    ...typography.subheading,
    color: colors.text,
  },
  switchHelp: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    paddingRight: spacing.md,
  },
  computed: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
