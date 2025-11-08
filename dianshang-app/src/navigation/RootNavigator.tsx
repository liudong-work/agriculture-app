import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { useAuthStore } from '../store/authStore';
import LaunchScreen from '../screens/LaunchScreen';

export default function RootNavigator() {
  const { user, accessToken, isBootstrapped, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!isBootstrapped) {
    return <LaunchScreen />;
  }

  if (user && accessToken) {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}

