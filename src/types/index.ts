export type Vehicle = {
  id: string;
  user_id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  tank_capacity_l: number | null;
  initial_odometer_km: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type FuelLog = {
  id: string;
  user_id: string;
  vehicle_id: string;
  logged_at: string; // ISO date
  odometer_km: number;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  is_full_tank: boolean;
  station: string | null;
  notes: string | null;
  created_at: string;
};

export type MaintenanceLog = {
  id: string;
  user_id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string; // ISO date
  odometer_km: number;
  cost: number;
  next_due_date: string | null;
  next_due_odometer_km: number | null;
  shop: string | null;
  notes: string | null;
  created_at: string;
};

export type Settings = {
  currencySymbol: string;
  currencyCode: string;
  distanceUnit: 'km' | 'mi';
  volumeUnit: 'L' | 'gal';
  efficiencyUnit: 'kpl' | 'l_per_100km' | 'mpg';
};
