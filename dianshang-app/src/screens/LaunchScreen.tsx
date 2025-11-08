import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

type Props = {
  status?: 'loading' | 'error';
  message?: string;
  onRetry?: () => void;
};

export default function LaunchScreen({ status = 'loading', message, onRetry }: Props) {
  const isError = status === 'error';
  return (
    <View style={[styles.container, isError ? styles.errorContainer : null]}>
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
        {isError ? (
          <>
            <Text variant="titleMedium" style={styles.errorTitle}>
              加载失败
            </Text>
            <Text variant="bodySmall" style={styles.errorText}>
              {message ?? '无法初始化应用，请检查网络后重试'}
            </Text>
            <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
              重试
            </Button>
          </>
        ) : (
          <>
            <ActivityIndicator animating size="large" color="#ffffff" />
            <Text variant="bodySmall" style={styles.loadingText}>
              正在加载应用资源，请稍候...
            </Text>
          </>
        )}
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
  errorContainer: {
    backgroundColor: '#b71c1c',
  },
  errorTitle: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorText: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 24,
    paddingHorizontal: 24,
  },
});
