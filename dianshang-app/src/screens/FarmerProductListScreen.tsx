import React, { useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  HelperText,
  Portal,
  SegmentedButtons,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchProductList,
  updateProductStatus,
  type ProductListItem,
  type ProductStatus,
} from '../services/product.api';
import type { ProfileStackParamList } from '../navigation/AppNavigator';

const statusSegments: { value: ProductStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '已上架' },
  { value: 'inactive', label: '已下架' },
  { value: 'draft', label: '草稿' },
];

type Navigation = NativeStackNavigationProp<ProfileStackParamList>;

export default function FarmerProductListScreen() {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ProductStatus | 'all'>('all');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  const productQuery = useQuery({
    queryKey: ['farmer-products', status],
    queryFn: () => fetchProductList({ page: 1, pageSize: 100, status }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ productId, nextStatus }: { productId: string; nextStatus: ProductStatus }) =>
      updateProductStatus(productId, nextStatus),
    onSuccess: (product) => {
      setSnackbarMessage(`商品状态已更新为${statusSegments.find((item) => item.value === product.status)?.label ?? ''}`);
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-detail', product.id] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? '更新状态失败，请稍后重试';
      setSnackbarMessage(message);
    },
  });

  const products = productQuery.data?.items ?? [];
  const isLoading = productQuery.isLoading;
  const isRefreshing = productQuery.isRefetching;
  const hasError = productQuery.isError;

  const handleToggleStatus = (product: ProductListItem) => {
    setSelectedProduct(product);
    setConfirmDialogVisible(true);
  };

  const confirmToggleStatus = () => {
    if (!selectedProduct) {
      return;
    }
    const nextStatus: ProductStatus = selectedProduct.status === 'active' ? 'inactive' : 'active';
    updateStatusMutation.mutate({ productId: selectedProduct.id, nextStatus });
    setConfirmDialogVisible(false);
  };

  const renderStatusChip = (statusValue: ProductStatus) => {
    const label = statusSegments.find((item) => item.value === statusValue)?.label ?? statusValue;
    const chipStyle =
      statusValue === 'active'
        ? styles.statusChipActive
        : statusValue === 'inactive'
        ? styles.statusChipInactive
        : styles.statusChipDraft;
    return <Chip style={chipStyle}>{label}</Chip>;
  };

  const renderProductCard = (item: ProductListItem) => {
    return (
      <Card style={styles.card} key={item.id}>
        <Card.Title
          title={item.name}
          subtitle={`库存 ${item.stock} · ${item.unit}`}
          right={() => renderStatusChip(item.status)}
        />
        <Card.Content style={styles.cardContent}>
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          <View style={styles.cardInfo}>
            <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
            <Text style={styles.meta}>{item.origin}</Text>
            {item.seasonalTag ? <Chip compact style={styles.tag}>{item.seasonalTag}</Chip> : null}
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button mode="text" onPress={() => navigation.navigate('FarmerProductEdit', { productId: item.id })}>
            编辑
          </Button>
          <Button
            mode="contained"
            onPress={() => handleToggleStatus(item)}
            loading={updateStatusMutation.isPending && selectedProduct?.id === item.id}
          >
            {item.status === 'active' ? '下架' : '上架'}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderContent = () => {
    if (isLoading && products.length === 0) {
      return <ActivityIndicator style={styles.loadingIndicator} />;
    }

    if (hasError) {
      return (
        <View style={styles.errorState}>
          <Text variant="titleMedium">商品加载失败</Text>
          <HelperText type="error">请检查网络后重试</HelperText>
          <Button mode="text" onPress={() => productQuery.refetch()}>
            重新加载
          </Button>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text variant="titleMedium">暂无商品</Text>
          <Text style={styles.emptyHint}>快去上架第一件商品吧</Text>
          <Button mode="contained" onPress={() => navigation.navigate('FarmerProductCreate')}>
            新增商品
          </Button>
        </View>
      );
    }

    return <View style={styles.list}>{products.map(renderProductCard)}</View>;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => productQuery.refetch()} />}>
        <SegmentedButtons
          value={status}
          onValueChange={(value) => setStatus(value as ProductStatus | 'all')}
          buttons={statusSegments.map((segment) => ({ value: segment.value, label: segment.label }))}
          style={styles.segmented}
        />
        <Button
          mode="contained"
          icon="plus"
          style={styles.createButton}
          onPress={() => navigation.navigate('FarmerProductCreate')}
        >
          新增商品
        </Button>
        {renderContent()}
      </ScrollView>

      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage('')} duration={2500}>
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Dialog visible={confirmDialogVisible} onDismiss={() => setConfirmDialogVisible(false)}>
          <Dialog.Title>确认操作</Dialog.Title>
          <Dialog.Content>
            <Text>
              确定要将商品「{selectedProduct?.name}」
              {selectedProduct?.status === 'active' ? '下架' : '上架'}吗？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>取消</Button>
            <Button onPress={confirmToggleStatus}>确认</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  segmented: {
    marginBottom: 8,
  },
  createButton: {
    alignSelf: 'flex-end',
    borderRadius: 24,
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  price: {
    fontWeight: '700',
    color: '#d84315',
  },
  meta: {
    color: '#666',
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
  },
  cardActions: {
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statusChipActive: {
    backgroundColor: '#e8f5e9',
  },
  statusChipInactive: {
    backgroundColor: '#fff3e0',
  },
  statusChipDraft: {
    backgroundColor: '#ede7f6',
  },
  loadingIndicator: {
    marginTop: 80,
  },
  errorState: {
    alignItems: 'center',
    gap: 12,
    marginTop: 80,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    marginTop: 80,
  },
  emptyHint: {
    color: '#777',
  },
});
