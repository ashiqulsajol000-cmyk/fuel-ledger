-- Fuel Tracker initial schema
-- Run this in your Supabase project (SQL editor) once.

create extension if not exists "pgcrypto";

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  make text,
  model text,
  year int,
  license_plate text,
  tank_capacity_l numeric(6, 2),
  initial_odometer_km numeric(10, 2) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_user_idx on public.vehicles (user_id);

create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  odometer_km numeric(10, 2) not null,
  liters numeric(8, 3) not null,
  price_per_liter numeric(10, 3) not null,
  total_cost numeric(12, 2) not null,
  is_full_tank boolean not null default true,
  station text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists fuel_logs_user_idx on public.fuel_logs (user_id);
create index if not exists fuel_logs_vehicle_idx on public.fuel_logs (vehicle_id, logged_at desc);

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_type text not null,
  service_date timestamptz not null default now(),
  odometer_km numeric(10, 2) not null,
  cost numeric(12, 2) not null default 0,
  next_due_date timestamptz,
  next_due_odometer_km numeric(10, 2),
  shop text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists maintenance_user_idx on public.maintenance_logs (user_id);
create index if not exists maintenance_vehicle_idx on public.maintenance_logs (vehicle_id, service_date desc);

-- Row-level security: each user can only access their own rows.
alter table public.vehicles enable row level security;
alter table public.fuel_logs enable row level security;
alter table public.maintenance_logs enable row level security;

drop policy if exists "vehicles_owner_all" on public.vehicles;
create policy "vehicles_owner_all" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "fuel_logs_owner_all" on public.fuel_logs;
create policy "fuel_logs_owner_all" on public.fuel_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "maintenance_logs_owner_all" on public.maintenance_logs;
create policy "maintenance_logs_owner_all" on public.maintenance_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
