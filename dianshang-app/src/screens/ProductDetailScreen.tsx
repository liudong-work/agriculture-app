import React from 'react';
import { Image, ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { CategoryStackParamList, HomeStackParamList } from '../navigation/AppNavigator';
import { fetchProductDetail } from '../services/product.api';
import { addToCart } from '../services/cart.api';

type Props = NativeStackScreenProps<HomeStackParamList | CategoryStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route }: Props) {
  const { productId } = route.params;
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductDetail(productId),
  });

  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(productId, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert('已加入购物车', '可前往购物车查看并结算');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? '加入购物车失败，请稍后重试';
      Alert.alert('提示', message);
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium">未找到商品</Text>
        <Text variant="bodySmall" style={styles.emptyHint}>
          请返回重新选择商品。
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: data.images[0] }} style={styles.cover} />

      <View style={styles.headerSection}>
        <Text variant="titleLarge" style={styles.name}>
          {data.name}
        </Text>
        <Text style={styles.origin}>{data.origin}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>¥{data.price.toFixed(2)}</Text>
          <Text style={styles.unit}>/{data.unit}</Text>
        </View>
        {data.originalPrice ? (
          <Text style={styles.originalPrice}>原价 ¥{data.originalPrice.toFixed(2)}</Text>
        ) : null}
        <View style={styles.badgeRow}>
          {data.seasonalTag ? <Chip compact>{data.seasonalTag}</Chip> : null}
          {data.isOrganic ? <Chip compact icon="leaf">有机认证</Chip> : null}
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium">产地介绍</Text>
        <Text style={styles.description}>{data.description ?? '优质产区直供，保证品质与新鲜。'}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium">配送与售后</Text>
        <Text style={styles.description}>· 支持冷链配送，主要城市 48 小时内送达</Text>
        <Text style={styles.description}>· 坏果包赔，售后极速响应</Text>
      </View>

      <Button
        mode="contained"
        style={styles.actionButton}
        onPress={() => addToCartMutation.mutate()}
        loading={addToCartMutation.isPending}
        disabled={addToCartMutation.isPending}
      >
        加入购物车
      </Button>
      <Button mode="outlined" style={styles.secondaryButton} onPress={() => console.log('立即购买', data.id)}>
        立即购买
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 32,
  },
  cover: {
    width: '100%',
    height: 320,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontWeight: '600',
  },
  origin: {
    marginTop: 6,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  price: {
    fontSize: 28,
    color: '#d84315',
    fontWeight: '700',
  },
  unit: {
    color: '#888',
    marginBottom: 4,
  },
  originalPrice: {
    marginTop: 4,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  divider: {
    height: 12,
    backgroundColor: 'transparent',
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 12,
  },
  description: {
    marginTop: 8,
    color: '#4a6a49',
    lineHeight: 20,
  },
  actionButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 28,
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 28,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: {
    marginTop: 8,
    color: '#888',
  },
});

