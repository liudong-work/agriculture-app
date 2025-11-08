import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, SegmentedButtons, Snackbar, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import OrderCard from '../components/OrderCard';
import type { Order, OrderListResponse, OrderStatus } from '../types/order';
import {
  applyAfterSale,
  cancelOrder,
  fetchOrderList,
  updateOrderStatus,
} from '../services/order.api';
import type { OrderStackParamList } from '../navigation/AppNavigator';

const statusSegments: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待付款' },
  { value: 'processing', label: '待发货' },
  { value: 'shipped', label: '待收货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'after-sale', label: '售后' },
];

export default function OrderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OrderStackParamList>>();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [afterSaleVisible, setAfterSaleVisible] = useState(false);
  const [afterSaleOrder, setAfterSaleOrder] = useState<Order | null>(null);
  const [afterSaleType, setAfterSaleType] = useState<'refund' | 'return-refund' | 'exchange'>('refund');
  const [afterSaleReason, setAfterSaleReason] = useState('');
  const [afterSaleDescription, setAfterSaleDescription] = useState('');
  const [afterSaleEvidence, setAfterSaleEvidence] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const queryParams = useMemo(() => {
    return status === 'all'
      ? { page: 1, pageSize: 20 }
      : { page: 1, pageSize: 20, status };
  }, [status]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<OrderListResponse>({
    queryKey: ['orders', queryParams],
    queryFn: () => fetchOrderList(queryParams),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus, note }: { orderId: string; nextStatus: OrderStatus; note?: string }) =>
      updateOrderStatus(orderId, { status: nextStatus, note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => cancelOrder(orderId, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const afterSaleMutation = useMutation({
    mutationFn: ({
      orderId,
      type,
      reason,
      description,
      attachments,
    }: {
      orderId: string;
      type: 'refund' | 'return-refund' | 'exchange';
      reason: string;
      description?: string;
      attachments?: string[];
    }) => applyAfterSale(orderId, { type, reason, description, attachments }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const orders = data?.items ?? [];
  const isGlobalActionLoading =
    updateStatusMutation.isPending || cancelMutation.isPending || afterSaleMutation.isPending;

  const runOrderMutation = async (order: Order, action: () => Promise<any>, successMessage?: string) => {
    setProcessingOrderId(order.id);
    try {
      await action();
      if (successMessage) {
        setSnackbarMessage(successMessage);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? '操作失败，请稍后重试';
      Alert.alert('提示', message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handlePressDetail = (orderId: string) => {
    navigation.navigate('OrderDetail', { orderId });
  };

  const handlePrimaryAction = (order: Order) => {
    switch (order.status) {
      case 'pending': {
        Alert.alert('确认支付', '确认已完成支付？', [
          { text: '再想想', style: 'cancel' },
          {
            text: '确认支付',
            onPress: () =>
              runOrderMutation(order, () =>
                updateStatusMutation.mutateAsync({
                  orderId: order.id,
                  nextStatus: 'processing',
                  note: '用户已完成支付',
                }),
                '已记录付款，等待商家发货',
              ),
          },
        ]);
        return;
      }
      case 'shipped': {
        Alert.alert('确认收货', '请确认已经收到商品。', [
          { text: '取消', style: 'cancel' },
          {
            text: '确认收货',
            onPress: () =>
              runOrderMutation(order, () =>
                updateStatusMutation.mutateAsync({
                  orderId: order.id,
                  nextStatus: 'completed',
                  note: '用户确认收货',
                }),
                '收货成功，欢迎再次光临',
              ),
          },
        ]);
        return;
      }
      case 'processing': {
        Alert.alert('提醒成功', '我们已通知商家尽快发货。');
        return;
      }
      case 'completed':
      case 'after-sale':
      case 'cancelled':
      default:
        handlePressDetail(order.id);
        return;
    }
  };

  const handleCancelOrder = (order: Order) => {
    Alert.alert('取消订单', `确定取消订单 ${order.id} 吗？`, [
      { text: '暂不取消', style: 'cancel' },
      {
        text: '确认取消',
        style: 'destructive',
        onPress: () =>
          runOrderMutation(order, () => cancelMutation.mutateAsync({ orderId: order.id, reason: '用户主动取消订单' }), '订单已取消'),
      },
    ]);
  };

  const handleApplyAfterSale = (order: Order) => {
    setAfterSaleOrder(order);
    setAfterSaleType('refund');
    setAfterSaleReason('收到的商品存在问题，申请售后');
    setAfterSaleDescription('请协助处理售后问题');
    setAfterSaleEvidence('');
    setAfterSaleVisible(true);
  };

  const submitAfterSale = async () => {
    if (!afterSaleOrder) return;
    if (!afterSaleReason.trim()) {
      Alert.alert('提示', '请填写售后原因');
      return;
    }

    const attachments = afterSaleEvidence
      .split(/\s|,|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);

    await runOrderMutation(
      afterSaleOrder,
      () =>
        afterSaleMutation.mutateAsync({
          orderId: afterSaleOrder.id,
          reason: afterSaleReason.trim(),
          description: afterSaleDescription.trim() || undefined,
          type: afterSaleType,
          attachments,
        }),
      '售后申请提交成功，请等待处理',
    );
    setAfterSaleVisible(false);
    setAfterSaleOrder(null);
  };

  const renderContent = () => {
    if (isLoading && orders.length === 0) {
      return <ActivityIndicator style={styles.loading} />;
    }

    if (isError) {
      return (
        <View style={styles.errorState}>
          <Text variant="titleMedium">订单加载失败</Text>
          <Text variant="bodySmall" style={styles.errorHint}>
            请检查网络后重试
          </Text>
          <Button onPress={() => refetch()} style={styles.retryButton}>
            重新加载
          </Button>
        </View>
      );
    }

    return (
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isProcessing = processingOrderId === item.id && isGlobalActionLoading;
          return (
            <OrderCard
              order={item}
              onPressDetail={handlePressDetail}
              onPrimaryAction={handlePrimaryAction}
              onCancel={handleCancelOrder}
              onApplyAfterSale={handleApplyAfterSale}
              isActionLoading={isProcessing}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium">暂无订单</Text>
            <Text variant="bodySmall" style={styles.emptyHint}>
              您还没有该状态的订单，去首页看看吧。
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
      />
    );
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        density="small"
        style={styles.segmented}
        value={status}
        onValueChange={(value) => setStatus(value as OrderStatus | 'all')}
        buttons={statusSegments.map((segment) => ({
          value: segment.value,
          label: segment.label,
        }))}
      />
      {renderContent()}
      <Portal>
        <Dialog visible={afterSaleVisible} onDismiss={() => setAfterSaleVisible(false)}>
          <Dialog.Title>申请售后</Dialog.Title>
          <Dialog.Content style={styles.afterSaleContent}>
            <SegmentedButtons
              value={afterSaleType}
              onValueChange={(value) => setAfterSaleType(value as 'refund' | 'return-refund' | 'exchange')}
              buttons={[
                { value: 'refund', label: '仅退款' },
                { value: 'return-refund', label: '退货退款' },
                { value: 'exchange', label: '换货' },
              ]}
            />
            <TextInput
              label="售后原因"
              value={afterSaleReason}
              onChangeText={setAfterSaleReason}
              mode="outlined"
              dense
              multiline
            />
            <TextInput
              label="问题描述（可选）"
              value={afterSaleDescription}
              onChangeText={setAfterSaleDescription}
              mode="outlined"
              dense
              multiline
            />
            <TextInput
              label="凭证链接（可选，空格或逗号分隔）"
              value={afterSaleEvidence}
              onChangeText={setAfterSaleEvidence}
              mode="outlined"
              dense
              placeholder="例如：https://image.example.com/problem.jpg"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAfterSaleVisible(false)}>取消</Button>
            <Button onPress={submitAfterSale} loading={afterSaleMutation.isPending}>
              提交申请
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage('')} duration={2000}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  segmented: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  loading: {
    marginTop: 80,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyHint: {
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 16,
  },
  errorHint: {
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
  },
  afterSaleContent: {
    gap: 12,
  },
});

