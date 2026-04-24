import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from '../screens/DashboardScreen';
import FuelLogFormScreen from '../screens/FuelLogFormScreen';
import FuelLogListScreen from '../screens/FuelLogListScreen';
import MaintenanceFormScreen from '../screens/MaintenanceFormScreen';
import MaintenanceListScreen from '../screens/MaintenanceListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.gold,
    notification: colors.gold,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 18,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 0.8,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const name: Record<string, keyof typeof Ionicons.glyphMap> = {
            DashboardTab: focused ? 'analytics' : 'analytics-outline',
            FuelTab: focused ? 'water' : 'water-outline',
            MaintenanceTab: focused ? 'construct' : 'construct-outline',
            VehiclesTab: focused ? 'car-sport' : 'car-sport-outline',
            SettingsTab: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={name[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen as never}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="FuelTab"
        component={FuelLogListScreen as never}
        options={{ title: 'Fuel' }}
      />
      <Tab.Screen
        name="MaintenanceTab"
        component={MaintenanceListScreen as never}
        options={{ title: 'Service' }}
      />
      <Tab.Screen
        name="VehiclesTab"
        component={VehiclesScreen as never}
        options={{ title: 'Garage' }}
      />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="VehicleForm"
              component={VehicleFormScreen}
              options={{ title: '', headerTransparent: true }}
            />
            <Stack.Screen
              name="FuelLogForm"
              component={FuelLogFormScreen}
              options={{ title: '', headerTransparent: true }}
            />
            <Stack.Screen
              name="MaintenanceForm"
              component={MaintenanceFormScreen}
              options={{ title: '', headerTransparent: true }}
            />
          </>
        ) : (
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
