import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { deleteVehicle, listVehicles, upsertVehicle } from '../lib/api';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleForm'>;

export default function VehicleFormScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { vehicleId } = route.params ?? {};
  const editing = Boolean(vehicleId);

  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [tank, setTank] = useState('');
  const [initialOdo, setInitialOdo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!vehicleId || !user) return;
      const list = await listVehicles(user.id);
      const v = list.find((x) => x.id === vehicleId);
      if (!v) return;
      setName(v.name);
      setMake(v.make ?? '');
      setModel(v.model ?? '');
      setYear(v.year ? String(v.year) : '');
      setPlate(v.license_plate ?? '');
      setTank(v.tank_capacity_l ? String(v.tank_capacity_l) : '');
      setInitialOdo(String(v.initial_odometer_km ?? 0));
      setNotes(v.notes ?? '');
    })();
  }, [vehicleId, user]);

  const save = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError('Give your vehicle a name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertVehicle(user.id, {
        id: vehicleId,
        name: name.trim(),
        make: make.trim() || null,
        model: model.trim() || null,
        year: year ? Number(year) : null,
        license_plate: plate.trim() || null,
        tank_capacity_l: tank ? Number(tank) : null,
        initial_odometer_km: initialOdo ? Number(initialOdo) : 0,
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
    if (!vehicleId) return;
    Alert.alert('Delete vehicle?', 'This will also delete all fuel and maintenance logs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(vehicleId);
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
      <Text style={styles.kicker}>{editing ? 'EDIT' : 'NEW'} VEHICLE</Text>
      <Text style={styles.title}>{editing ? 'Edit vehicle' : 'Add a vehicle'}</Text>
      <View style={{ height: spacing.lg }} />

      <Input label="Name" value={name} onChangeText={setName} placeholder="Daily driver" />
      <Input label="Make" value={make} onChangeText={setMake} placeholder="Toyota" />
      <Input label="Model" value={model} onChangeText={setModel} placeholder="Corolla" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Year"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            placeholder="2020"
          />
        </View>
        <View style={{ width: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Input
            label="License plate"
            value={plate}
            onChangeText={setPlate}
            placeholder="DHA-1234"
            autoCapitalize="characters"
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Tank capacity"
            value={tank}
            onChangeText={setTank}
            keyboardType="decimal-pad"
            suffix="L"
            placeholder="50"
          />
        </View>
        <View style={{ width: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Input
            label="Start odometer"
            value={initialOdo}
            onChangeText={setInitialOdo}
            keyboardType="decimal-pad"
            suffix="km"
            placeholder="0"
          />
        </View>
      </View>
      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="VIN, insurance, anything"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={editing ? 'Save changes' : 'Add vehicle'}
        onPress={save}
        loading={loading}
        style={{ marginTop: spacing.md }}
      />
      {editing ? (
        <Button
          title="Delete vehicle"
          onPress={remove}
          variant="danger"
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Screen>
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
  row: {
    flexDirection: 'row',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
