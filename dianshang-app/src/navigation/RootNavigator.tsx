import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { useAuthStore } from '../store/authStore';

export default function RootNavigator() {
  const { user, accessToken, isBootstrapped, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!isBootstrapped) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (user && accessToken) {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

