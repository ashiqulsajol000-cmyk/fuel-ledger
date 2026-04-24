# Fuel Ledger

A minimal, luxury-dark mobile app for **fuel tracking, cost calculation, mileage tracking, and maintenance tracking**. Built with React Native + Expo, backed by Supabase.

![dark-luxury](https://img.shields.io/badge/theme-dark%20luxury-D4AF37)
![platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-black)
![stack](https://img.shields.io/badge/stack-Expo%20%2B%20Supabase-green)

## Features

- **Vehicles** — track multiple vehicles (make, model, year, plate, tank capacity)
- **Fuel log** — every fill-up with liters, price-per-liter, total cost, full-tank flag, odometer, station
- **Auto calculations** — KPL, L/100km, cost/km, monthly spend, lifetime totals
- **Maintenance** — service records with cost and next-due reminders (date + odometer)
- **Dashboard** — hero spend card, efficiency trend chart, 6-month spend bars, upcoming services
- **Cloud sync** — Supabase auth + per-user row-level security (your data is yours)
- **Currency** — ৳ / $ / € / ₹ / £ / د.إ selectable in Settings
- **Dark luxury design** — obsidian black base, champagne-gold accents, serif display type

## Tech stack

- Expo (SDK 54) + React Native 0.81
- TypeScript strict
- React Navigation (native-stack + bottom-tabs)
- Supabase (auth + Postgres + RLS)
- `react-native-svg` for custom trend chart
- `expo-linear-gradient` for gold accents

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Pick a region near you (e.g. Singapore for South Asia)
3. Wait for the project to provision
4. Copy your **Project URL** and **anon public key** from *Project Settings → API*

### 3. Run the migrations

In the Supabase dashboard, open **SQL Editor** and paste the contents of [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql). This creates:

- `vehicles`, `fuel_logs`, `maintenance_logs` tables
- Indexes
- Row-level security policies (every row is scoped to `auth.uid()`)

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 5. Run the app

```bash
npx expo start
```

Then scan the QR code with:
- **iOS** — the Expo Go app from the App Store
- **Android** — the Expo Go app from the Play Store

Or press `w` to open in a web browser, `a` for an Android emulator, `i` for an iOS simulator.

## Project structure

```
src/
  components/      Button, Input, Card, Screen, TrendChart, StatTile, EmptyState, SectionHeader
  context/         AuthContext, SettingsContext
  lib/             supabase client, typed API wrappers
  navigation/      RootNavigator (stack + tabs), types
  screens/
    auth/          SignInScreen
    DashboardScreen, VehiclesScreen, VehicleFormScreen,
    FuelLogListScreen, FuelLogFormScreen,
    MaintenanceListScreen, MaintenanceFormScreen,
    SettingsScreen
  theme/           colors, typography, spacing, radii, shadows
  types/           Vehicle, FuelLog, MaintenanceLog, Settings
  utils/           calc (mileage math), format (currency, dates)
supabase/
  migrations/0001_initial.sql
```

## Mileage math

Mileage uses the **full-tank method** for accuracy: distance between two full tanks divided by the liters pumped in between. Partial fills are rolled into the next full-fill window. This means your first full tank won't have a KPL value — it establishes the baseline. See [`src/utils/calc.ts`](src/utils/calc.ts).

## License

MIT — do whatever you want with it.
