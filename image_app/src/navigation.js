import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerProvider, AppDrawer } from './drawer';
import AppHeader from './components/AppHeader';
import FloatingBottomNav from './components/FloatingBottomNav';
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

function CatalogStack() {
  return (
    <Catalog.Navigator
      screenOptions={{
        header: ({ options, route, back }) => (
          <AppHeader
            title={options.title || route.name}
            subtitle={options.headerSubtitle}
            showBack={Boolean(back)}
            activeTab="Categories"
          />
        ),
      }}
    >
      <Catalog.Screen
        name="CategoryList"
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <Catalog.Screen
        name="SubCategories"
        component={SubCategoriesScreen}
        options={{ title: 'Sub-Categories' }}
      />
      <Catalog.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: 'Products' }}
      />
      <Catalog.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product' }}
      />
    </Catalog.Navigator>
  );
}

function ProcessStack() {
  return (
    <Process.Navigator
      screenOptions={{
        header: ({ options, route, back }) => (
          <AppHeader
            title={options.title || route.name}
            subtitle={options.headerSubtitle}
            showBack={Boolean(back)}
            activeTab="Processing"
          />
        ),
      }}
    >
      <Process.Screen
        name="ProcessHome"
        component={ProcessHomeScreen}
        options={{ title: 'Image Processing' }}
      />
      <Process.Screen
        name="SearchImages"
        component={SearchImagesScreen}
        options={{ title: 'Search Images' }}
      />
      <Process.Screen
        name="ProcessWizard"
        component={ProcessWizardScreen}
        options={{ title: 'Process Images' }}
      />
      <Process.Screen
        name="PrintPreview"
        component={PrintPreviewScreen}
        options={{ title: 'Print Preview' }}
      />
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
    <Tab.Navigator
      tabBar={(props) => <FloatingBottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          title: 'Dashboard',
          header: () => <AppHeader isDashboard activeTab="Home" />,
        }}
      />
      <Tab.Screen name="Categories" component={CatalogStack} />
      <Tab.Screen name="Processing" component={ProcessStack} />
      <Tab.Screen
        name="Shortlist"
        component={ShortlistScreen}
        options={{
          headerShown: true,
          title: 'Shortlist',
          header: () => <AppHeader title="Shortlist" activeTab="Shortlist" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
          header: () => <AppHeader title="Profile" activeTab="Profile" />,
        }}
      />
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
