import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  DashboardTab: undefined;
  FuelTab: undefined;
  MaintenanceTab: undefined;
  VehiclesTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  VehicleForm: { vehicleId?: string };
  FuelLogForm: { logId?: string; vehicleId?: string };
  MaintenanceForm: { logId?: string; vehicleId?: string };
};
