import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { listVehicles } from '../lib/api';
import { colors, radii, spacing, typography } from '../theme';
import type { Vehicle } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function VehiclesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const v = await listVehicles(user.id);
      setVehicles(v);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>GARAGE</Text>
          <Text style={styles.title}>Vehicles</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('VehicleForm', {})}
          style={styles.addBtn}
          hitSlop={4}
        >
          <Ionicons name="add" size={20} color={colors.gold} />
        </Pressable>
      </View>

      {!loading && vehicles.length === 0 ? (
        <EmptyState
          icon="car-sport-outline"
          title="No vehicles yet"
          description="Add a vehicle to start logging fuel and maintenance."
          action={
            <Button
              title="Add Vehicle"
              onPress={() => navigation.navigate('VehicleForm', {})}
            />
          }
        />
      ) : null}

      {vehicles.map((v) => (
        <Pressable
          key={v.id}
          onPress={() => navigation.navigate('VehicleForm', { vehicleId: v.id })}
        >
          <Card style={{ marginBottom: spacing.md }}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="car-sport" size={22} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehName}>{v.name}</Text>
                <Text style={styles.vehSub}>
                  {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'No details'}
                </Text>
                {v.license_plate ? (
                  <Text style={styles.plate}>{v.license_plate}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
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
  vehSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  plate: {
    ...typography.label,
    color: colors.gold,
    marginTop: 6,
    letterSpacing: 2,
  },
});
