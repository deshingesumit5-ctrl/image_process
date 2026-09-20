import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { PRIMARY } from './config';
import { DrawerProvider, AppDrawer, Hamburger } from './drawer';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import SubCategoriesScreen from './screens/SubCategoriesScreen';
import ProductsScreen from './screens/ProductsScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ShortlistScreen from './screens/ShortlistScreen';
import ProcessHomeScreen from './screens/ProcessHomeScreen';
import ProcessWizardScreen from './screens/ProcessWizardScreen';
import PrintPreviewScreen from './screens/PrintPreviewScreen';
import SearchImagesScreen from './screens/SearchImagesScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Catalog = createNativeStackNavigator();
const Process = createNativeStackNavigator();

const header = {
  headerTintColor: PRIMARY,
  headerLeft: () => <Hamburger />,
};

function CatalogStack() {
  return (
    <Catalog.Navigator screenOptions={{ headerTintColor: PRIMARY }}>
      <Catalog.Screen name="CategoryList" component={CategoriesScreen} options={{ title: 'Categories', headerLeft: () => <Hamburger /> }} />
      <Catalog.Screen name="SubCategories" component={SubCategoriesScreen} options={{ title: 'Sub-Categories' }} />
      <Catalog.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
      <Catalog.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
    </Catalog.Navigator>
  );
}

function ProcessStack() {
  return (
    <Process.Navigator screenOptions={{ headerTintColor: PRIMARY }}>
      <Process.Screen name="ProcessHome" component={ProcessHomeScreen} options={{ title: 'Image Processing', headerLeft: () => <Hamburger /> }} />
      <Process.Screen name="SearchImages" component={SearchImagesScreen} options={{ title: 'Search Images' }} />
      <Process.Screen name="ProcessWizard" component={ProcessWizardScreen} options={{ title: 'Process' }} />
      <Process.Screen name="PrintPreview" component={PrintPreviewScreen} options={{ title: 'Print Preview' }} />
    </Process.Navigator>
  );
}

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: PRIMARY, tabBarStyle: { height: 58 } }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text>⌂</Text>, headerShown: true, title: 'Dashboard', ...header }} />
      <Tab.Screen name="Categories" component={CatalogStack} options={{ tabBarIcon: () => <Text>▣</Text> }} />
      <Tab.Screen name="Processing" component={ProcessStack} options={{ tabBarIcon: () => <Text>✦</Text> }} />
      <Tab.Screen name="Shortlist" component={ShortlistScreen} options={{ tabBarIcon: () => <Text>♡</Text>, headerShown: true, ...header }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text>●</Text>, headerShown: true, ...header }} />
    </Tab.Navigator>
  );
}

export function MainShell() {
  return (
    <DrawerProvider>
      <Tabs />
      <AppDrawer />
    </DrawerProvider>
  );
}
