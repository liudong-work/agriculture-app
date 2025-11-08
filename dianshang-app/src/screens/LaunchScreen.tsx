import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export default function LaunchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
        <Text variant="headlineSmall" style={styles.brandName}>
          乡村优选
        </Text>
        <Text variant="bodyMedium" style={styles.tagline}>
          打造农户与消费者的快捷桥梁
        </Text>
      </View>
      <View style={styles.loadingBlock}>
        <ActivityIndicator animating size="large" color="#ffffff" />
        <Text variant="bodySmall" style={styles.loadingText}>
          正在加载应用资源，请稍候...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 16,
  },
  brandName: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  loadingBlock: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
});
