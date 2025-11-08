import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { fetchFarmerOrderList, type FarmerOrderListParams } from '../services/farmerOrder.api';
import type { Order, OrderStatus } from '../types/order';

const statusSegments: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '待发货' },
  { value: 'shipped', label: '运输中' },
  { value: 'after-sale', label: '售后中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const statusColorMap: Partial<Record<OrderStatus, string>> = {
  pending: '#f9a825',
  processing: '#1976d2',
  shipped: '#0277bd',
  completed: '#2e7d32',
  cancelled: '#757575',
  'after-sale': '#d84315',
};

export default function FarmerOrderListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const theme = useTheme();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('processing');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['farmerOrders', { status: statusFilter }],
    queryFn: () => {
      const params: FarmerOrderListParams = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      params.pageSize = 50;
      return fetchFarmerOrderList(params);
    },
  });

  const orders = useMemo(() => data?.items ?? [], [data]);

  const handleOpenDetail = (orderId: string) => {
    navigation.navigate('FarmerOrderDetail', { orderId });
  };

  const renderOrderCard = (order: Order) => {
    const statusColor = statusColorMap[order.status] ?? theme.colors.primary;
    const firstItem = order.items[0];
    return (
      <Card style={styles.orderCard}>
        <Card.Title
          title={`订单号：${order.id}`}
          subtitle={`下单时间：${new Date(order.createdAt).toLocaleString()}`}
          right={() => <Chip style={[styles.statusChip, { backgroundColor: statusColor }]}>{statusLabel(order.status)}</Chip>}
        />
        <Card.Content style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium">收件人：{order.contactName}</Text>
            <Text variant="bodyMedium">电话：{order.contactPhone}</Text>
          </View>
          <Text variant="bodySmall" style={styles.addressText} numberOfLines={2}>
            地址：{order.address}
          </Text>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">
              商品：{order.items.length} 件
              {firstItem ? `（含 ${firstItem.name} 等）` : ''}
            </Text>
            <Text variant="titleMedium" style={styles.amountText}>
              ¥{order.total.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button mode="contained" onPress={() => handleOpenDetail(order.id)}>
            查看详情
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text style={styles.loadingText}>加载订单列表...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="titleMedium">订单加载失败</Text>
        <Button mode="contained" onPress={() => refetch()} style={styles.retryButton}>
          重新加载
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
          buttons={statusSegments}
          style={styles.statusSegmented}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderOrderCard(item)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium">当前没有相关订单</Text>
            <Text variant="bodySmall" style={styles.emptyHint}>
              尝试切换筛选条件或稍后再来看看
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      />
    </View>
  );
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return '待支付';
    case 'processing':
      return '待发货';
    case 'shipped':
      return '已发货';
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    case 'after-sale':
      return '售后中';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  statusSegmented: {
    alignSelf: 'stretch',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  orderCard: {
    borderRadius: 12,
  },
  statusChip: {
    marginRight: 12,
    alignSelf: 'center',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressText: {
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    color: '#d84315',
    fontWeight: '600',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    gap: 8,
  },
  emptyHint: {
    color: '#777',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f9f3',
    gap: 16,
  },
  loadingText: {
    color: '#555',
  },
  retryButton: {
    marginTop: 8,
  },
});
