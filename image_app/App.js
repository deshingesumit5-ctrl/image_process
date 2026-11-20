import React from 'react';
import { View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { AuthStack, MainShell } from './src/navigation';
import { COLORS } from './src/theme';

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
  },
};

function Root() {
  const { token, bootstrapping } = useAuth();
  if (bootstrapping) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  }
  return token ? <MainShell /> : <AuthStack />;
}

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: COLORS.bg }}>
      <AuthProvider>
        <NavigationContainer theme={NAV_THEME}>
          <StatusBar style="dark" />
          <Root />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
