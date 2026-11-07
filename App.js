import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './src/theme';
import { ScopeContext, SCOPE_TINT } from './src/utils/scope';

import HomeScreen from './src/screens/HomeScreen';
import OverviewScreen from './src/screens/DashboardScreen';
import AssetsScreen from './src/screens/AssetsScreen';
import LedgerScreen from './src/screens/LedgerScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AssetDetailScreen from './src/screens/AssetDetailScreen';
import AssetFormScreen from './src/screens/AssetFormScreen';
import ExpenseFormScreen from './src/screens/ExpenseFormScreen';
import IncomeFormScreen from './src/screens/IncomeFormScreen';
import SellAssetScreen from './src/screens/SellAssetScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Overview: 'speedometer',
  Assets: 'albums',
  Daily: 'calendar',
  Reports: 'pie-chart',
};

// The tabs for one chosen type (House, Land, Vehicle or All)
function Workspace({ route }) {
  const { c, isDark } = useTheme();
  const scope = route.params?.type || 'All';
  return (
    <ScopeContext.Provider value={{ type: scope }}>
      <Tab.Navigator
        screenOptions={({ route: r }) => ({
          headerShown: false,
          tabBarActiveTintColor: c[SCOPE_TINT[scope]],
          tabBarInactiveTintColor: c.gray,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.separator,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : c.card,
            elevation: 0,
          },
          // Translucent bar: content scrolls underneath (iOS)
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} intensity={100} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(28,28,30,0.94)' : 'rgba(249,249,249,0.94)' }]} />
            ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? TAB_ICONS[r.name] : `${TAB_ICONS[r.name]}-outline`} size={24} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Overview" component={OverviewScreen} />
        <Tab.Screen name="Assets" component={AssetsScreen} />
        <Tab.Screen name="Daily" component={LedgerScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
    </ScopeContext.Provider>
  );
}

export default function App() {
  const { c, isDark } = useTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: c.blue, background: c.bg, card: c.card, text: c.text, border: c.separator,
    },
  };
  const modal = {
    presentation: 'modal',
    headerStyle: { backgroundColor: c.bg },
    headerShadowVisible: false,
    headerTitleStyle: { fontWeight: '600' },
  };
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Navigator screenOptions={{ headerTintColor: c.blue, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Workspace" component={Workspace} options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerStyle: { backgroundColor: c.bg }, headerShadowVisible: false }} />
          <Stack.Screen
            name="AssetDetail"
            component={AssetDetailScreen}
            options={{ title: '', headerTransparent: Platform.OS === 'ios', headerBlurEffect: isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight', headerStyle: { backgroundColor: c.bg }, headerShadowVisible: false }}
          />
          <Stack.Screen name="AssetForm" component={AssetFormScreen} options={modal} />
          <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={modal} />
          <Stack.Screen name="IncomeForm" component={IncomeFormScreen} options={modal} />
          <Stack.Screen name="SellAsset" component={SellAssetScreen} options={{ ...modal, title: 'Sell Asset' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
