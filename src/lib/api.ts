import { supabase } from './supabase';
import type { FuelLog, MaintenanceLog, Vehicle } from '../types';

export async function listVehicles(userId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function upsertVehicle(
  userId: string,
  v: Partial<Vehicle> & { id?: string },
): Promise<Vehicle> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    name: v.name ?? 'My Vehicle',
    make: v.make ?? null,
    model: v.model ?? null,
    year: v.year ?? null,
    license_plate: v.license_plate ?? null,
    tank_capacity_l: v.tank_capacity_l ?? null,
    initial_odometer_km: v.initial_odometer_km ?? 0,
    notes: v.notes ?? null,
    is_active: v.is_active ?? true,
  };
  if (v.id) payload.id = v.id;
  const { data, error } = await supabase
    .from('vehicles')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

export async function listFuelLogs(userId: string, vehicleId?: string): Promise<FuelLog[]> {
  let q = supabase.from('fuel_logs').select('*').eq('user_id', userId);
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q.order('logged_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FuelLog[];
}

export async function upsertFuelLog(
  userId: string,
  log: Partial<FuelLog> & { id?: string; vehicle_id: string },
): Promise<FuelLog> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    vehicle_id: log.vehicle_id,
    logged_at: log.logged_at ?? new Date().toISOString(),
    odometer_km: log.odometer_km ?? 0,
    liters: log.liters ?? 0,
    price_per_liter: log.price_per_liter ?? 0,
    total_cost: log.total_cost ?? (log.liters ?? 0) * (log.price_per_liter ?? 0),
    is_full_tank: log.is_full_tank ?? true,
    station: log.station ?? null,
    notes: log.notes ?? null,
  };
  if (log.id) payload.id = log.id;
  const { data, error } = await supabase
    .from('fuel_logs')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as FuelLog;
}

export async function deleteFuelLog(id: string) {
  const { error } = await supabase.from('fuel_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function listMaintenance(
  userId: string,
  vehicleId?: string,
): Promise<MaintenanceLog[]> {
  let q = supabase.from('maintenance_logs').select('*').eq('user_id', userId);
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q.order('service_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MaintenanceLog[];
}

export async function upsertMaintenance(
  userId: string,
  log: Partial<MaintenanceLog> & { id?: string; vehicle_id: string },
): Promise<MaintenanceLog> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    vehicle_id: log.vehicle_id,
    service_type: log.service_type ?? 'General service',
    service_date: log.service_date ?? new Date().toISOString(),
    odometer_km: log.odometer_km ?? 0,
    cost: log.cost ?? 0,
    next_due_date: log.next_due_date ?? null,
    next_due_odometer_km: log.next_due_odometer_km ?? null,
    shop: log.shop ?? null,
    notes: log.notes ?? null,
  };
  if (log.id) payload.id = log.id;
  const { data, error } = await supabase
    .from('maintenance_logs')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as MaintenanceLog;
}

export async function deleteMaintenance(id: string) {
  const { error } = await supabase.from('maintenance_logs').delete().eq('id', id);
  if (error) throw error;
}
