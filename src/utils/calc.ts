import type { FuelLog, MaintenanceLog } from '../types';

export type FuelStats = {
  totalSpent: number;
  totalLiters: number;
  totalDistance: number;
  avgKpl: number; // km per liter
  avgLPer100: number; // L / 100 km
  avgPricePerLiter: number;
  costPerKm: number;
  fillCount: number;
  lastOdometer: number | null;
};

/**
 * Compute cumulative fuel stats using the "full-tank" method:
 * distance between two full tanks / liters pumped in between.
 * Partial fills are rolled into the next full fill window.
 */
export function computeFuelStats(logs: FuelLog[]): FuelStats {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
  );

  let totalSpent = 0;
  let totalLiters = 0;
  let fullDistance = 0;
  let fullLiters = 0;
  let lastFullOdo: number | null = null;
  let pendingLiters = 0;

  for (const log of sorted) {
    totalSpent += Number(log.total_cost) || 0;
    totalLiters += Number(log.liters) || 0;

    if (log.is_full_tank) {
      if (lastFullOdo !== null) {
        const distance = log.odometer_km - lastFullOdo;
        if (distance > 0) {
          fullDistance += distance;
          fullLiters += pendingLiters + (Number(log.liters) || 0);
        }
      }
      lastFullOdo = log.odometer_km;
      pendingLiters = 0;
    } else {
      pendingLiters += Number(log.liters) || 0;
    }
  }

  const firstOdo = sorted[0]?.odometer_km ?? null;
  const lastOdo = sorted[sorted.length - 1]?.odometer_km ?? null;
  const totalDistance =
    firstOdo !== null && lastOdo !== null && lastOdo > firstOdo ? lastOdo - firstOdo : 0;

  const avgKpl = fullLiters > 0 ? fullDistance / fullLiters : 0;
  const avgLPer100 = avgKpl > 0 ? 100 / avgKpl : 0;
  const avgPricePerLiter = totalLiters > 0 ? totalSpent / totalLiters : 0;
  const costPerKm = totalDistance > 0 ? totalSpent / totalDistance : 0;

  return {
    totalSpent,
    totalLiters,
    totalDistance,
    avgKpl,
    avgLPer100,
    avgPricePerLiter,
    costPerKm,
    fillCount: sorted.length,
    lastOdometer: lastOdo,
  };
}

/**
 * Per-fill efficiency series (km / L) based on distance since last full tank.
 * Returns one data point per full-tank fill (after the first).
 */
export function efficiencySeries(logs: FuelLog[]): { date: string; kpl: number }[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
  );
  const out: { date: string; kpl: number }[] = [];
  let lastFullOdo: number | null = null;
  let pendingLiters = 0;

  for (const log of sorted) {
    if (log.is_full_tank) {
      if (lastFullOdo !== null) {
        const distance = log.odometer_km - lastFullOdo;
        const liters = pendingLiters + Number(log.liters);
        if (distance > 0 && liters > 0) {
          out.push({ date: log.logged_at, kpl: distance / liters });
        }
      }
      lastFullOdo = log.odometer_km;
      pendingLiters = 0;
    } else {
      pendingLiters += Number(log.liters);
    }
  }
  return out;
}

export function monthlySpend(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[] = [],
): { month: string; fuel: number; maintenance: number; total: number }[] {
  const buckets = new Map<string, { fuel: number; maintenance: number }>();
  for (const l of fuelLogs) {
    const d = new Date(l.logged_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.get(key) ?? { fuel: 0, maintenance: 0 };
    b.fuel += Number(l.total_cost) || 0;
    buckets.set(key, b);
  }
  for (const m of maintenanceLogs) {
    const d = new Date(m.service_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.get(key) ?? { fuel: 0, maintenance: 0 };
    b.maintenance += Number(m.cost) || 0;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => ({
      month,
      fuel: v.fuel,
      maintenance: v.maintenance,
      total: v.fuel + v.maintenance,
    }));
}

export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}
