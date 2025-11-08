import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { useAuthStore } from '../store/authStore';
import LaunchScreen from '../screens/LaunchScreen';

export default function RootNavigator() {
  const { user, accessToken, isBootstrapped, bootstrap, bootstrapError } = useAuthStore();
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [showLaunch, setShowLaunch] = useState(true);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (isBootstrapped && !bootstrapError) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setShowLaunch(false));
    }
  }, [isBootstrapped, bootstrapError, fadeAnim]);

  const handleRetry = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowLaunch(true);
      bootstrap();
    });
  };

  if (showLaunch) {
    return (
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}> 
        <LaunchScreen
          status={!isBootstrapped && !bootstrapError ? 'loading' : bootstrapError ? 'error' : 'loading'}
          message={bootstrapError?.message}
          onRetry={bootstrapError ? handleRetry : undefined}
        />
      </Animated.View>
    );
  }

  if (user && accessToken) {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
});

