import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

import { initDatabase } from './src/database/database';
import AppNavigator    from './src/navigation/AppNavigator';
import { Colors, Typography } from './src/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (e) {
        console.error('Erreur initialisation DB :', e);
        setError(e.message || 'Erreur inconnue');
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de démarrer l'application</Text>
        <Text style={styles.errorMsg}>{error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement de votre bibliothèque…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.background,
    padding:         32,
  },
  loadingText: {
    marginTop: 16,
    fontSize:  Typography.fontSize.md,
    color:     Colors.textSecondary,
  },
  errorTitle: {
    fontSize:     Typography.fontSize.lg,
    fontWeight:   Typography.fontWeight.bold,
    color:        Colors.error,
    marginBottom: 8,
    textAlign:    'center',
  },
  errorMsg: {
    fontSize:  Typography.fontSize.sm,
    color:     Colors.textSecondary,
    textAlign: 'center',
  },
});
