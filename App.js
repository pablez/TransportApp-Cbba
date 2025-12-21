import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SnackbarProvider } from './src/components/ui/SnackbarProvider';

// Suprimir advertencias conocidas
import './src/utils/WarningSuppress';

export default function App() {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <AppNavigator />
        </View>
      </SnackbarProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
