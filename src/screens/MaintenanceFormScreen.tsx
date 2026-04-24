import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  deleteMaintenance,
  listMaintenance,
  listVehicles,
  upsertMaintenance,
} from '../lib/api';
import { colors, radii, spacing, typography } from '../theme';
import type { Vehicle } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MaintenanceForm'>;

const QUICK_SERVICES = [
  'Oil change',
  'Tire rotation',
  'Brake service',
  'Battery',
  'Air filter',
  'Inspection',
];

export default function MaintenanceFormScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { logId, vehicleId: initialVehicle } = route.params ?? {};
  const editing = Boolean(logId);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(initialVehicle ?? null);
  const [serviceType, setServiceType] = useState('');
  const [date, setDate] = useState(new Date());
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);
  const [nextDueOdo, setNextDueOdo] = useState('');
  const [shop, setShop] = useState('');
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
        const all = await listMaintenance(user.id);
        const l = all.find((x) => x.id === logId);
        if (l) {
          setVehicleId(l.vehicle_id);
          setServiceType(l.service_type);
          setDate(new Date(l.service_date));
          setOdometer(String(l.odometer_km));
          setCost(String(l.cost));
          setNextDueDate(l.next_due_date ? new Date(l.next_due_date) : null);
          setNextDueOdo(l.next_due_odometer_km ? String(l.next_due_odometer_km) : '');
          setShop(l.shop ?? '');
          setNotes(l.notes ?? '');
        }
      }
    })();
  }, [user, logId]);

  const save = async () => {
    if (!user) return;
    if (!vehicleId) return setError('Choose a vehicle.');
    if (!serviceType.trim()) return setError('Add a service type.');
    if (!odometer) return setError('Odometer is required.');
    setLoading(true);
    setError(null);
    try {
      await upsertMaintenance(user.id, {
        id: logId,
        vehicle_id: vehicleId,
        service_type: serviceType.trim(),
        service_date: date.toISOString(),
        odometer_km: Number(odometer),
        cost: Number(cost) || 0,
        next_due_date: nextDueDate ? nextDueDate.toISOString() : null,
        next_due_odometer_km: nextDueOdo ? Number(nextDueOdo) : null,
        shop: shop.trim() || null,
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
    Alert.alert('Delete service record?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMaintenance(logId);
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
      <Text style={styles.kicker}>{editing ? 'EDIT' : 'NEW'} SERVICE</Text>
      <Text style={styles.title}>{editing ? 'Edit service' : 'Log a service'}</Text>
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

      <Input
        label="Service type"
        value={serviceType}
        onChangeText={setServiceType}
        placeholder="Oil change"
      />
      <View style={styles.quickRow}>
        {QUICK_SERVICES.map((s) => (
          <Pressable key={s} onPress={() => setServiceType(s)} style={styles.quickPill}>
            <Text style={styles.quickText}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <DateRow label="Service date" date={date} onChange={setDate} />

      <Input
        label="Odometer"
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="decimal-pad"
        suffix="km"
      />
      <Input
        label="Cost"
        value={cost}
        onChangeText={setCost}
        keyboardType="decimal-pad"
        suffix={settings.currencySymbol}
      />

      <DateRow
        label="Next due (optional)"
        date={nextDueDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
        onChange={(d) => setNextDueDate(d)}
        allowClear={nextDueDate !== null}
        onClear={() => setNextDueDate(null)}
        placeholder={!nextDueDate ? 'Tap to set' : undefined}
      />
      <Input
        label="Next due odometer (optional)"
        value={nextDueOdo}
        onChangeText={setNextDueOdo}
        keyboardType="decimal-pad"
        suffix="km"
      />

      <Input label="Shop" value={shop} onChangeText={setShop} placeholder="Optional" />
      <Input label="Notes" value={notes} onChangeText={setNotes} multiline />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={editing ? 'Save changes' : 'Add service'}
        onPress={save}
        loading={loading}
        style={{ marginTop: spacing.md }}
      />
      {editing ? (
        <Button
          title="Delete record"
          onPress={remove}
          variant="danger"
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Screen>
  );
}

function DateRow({
  label,
  date,
  onChange,
  allowClear,
  onClear,
  placeholder,
}: {
  label: string;
  date: Date;
  onChange: (d: Date) => void;
  allowClear?: boolean;
  onClear?: () => void;
  placeholder?: string;
}) {
  const shift = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onChange(d);
  };
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateStep} onPress={() => shift(-30)}>
          <Ionicons name="chevron-back" size={18} color={colors.gold} />
        </Pressable>
        <Pressable onPress={() => onChange(new Date())} style={{ flex: 1 }}>
          <Text style={styles.dateText}>
            {placeholder
              ? placeholder
              : date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
          </Text>
        </Pressable>
        <Pressable style={styles.dateStep} onPress={() => shift(30)}>
          <Ionicons name="chevron-forward" size={18} color={colors.gold} />
        </Pressable>
      </View>
      {allowClear ? (
        <Pressable onPress={onClear} style={{ marginTop: 4 }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { ...typography.label, color: colors.gold },
  title: { ...typography.title, color: colors.text, marginTop: 4 },
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
  pillText: { ...typography.caption, color: colors.textMuted },
  pillTextActive: { color: colors.gold, fontWeight: '700' },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  quickPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  quickText: { ...typography.caption, fontSize: 11, color: colors.textMuted },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
