import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Divider, IconButton, Text } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import type { OrderStackParamList } from '../navigation/AppNavigator';
import { fetchOrderDetail } from '../services/order.api';
import type { Order, OrderStatus } from '../types/order';

type Props = NativeStackScreenProps<OrderStackParamList, 'OrderDetail'>;

const statusLabelMap: Record<OrderStatus, string> = {
  pending: '待付款',
  processing: '待发货',
  shipped: '待收货',
  completed: '已完成',
  cancelled: '已取消',
  'after-sale': '售后中',
};

const afterSaleStatusLabelMap = {
  applied: '已申请',
  processing: '处理中',
  resolved: '已完成',
  rejected: '已驳回',
} as const;

const statusColorMap: Partial<Record<OrderStatus, string>> = {
  pending: '#d84315',
  processing: '#ef6c00',
  shipped: '#2e7d32',
  completed: '#0277bd',
  cancelled: '#757575',
  'after-sale': '#6a1b9a',
};

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => fetchOrderDetail(orderId),
  });

  const order = data;

  const handleBackToOrders = () => {
    navigation.navigate('Order');
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">订单信息加载失败</Text>
        <Button onPress={() => refetch()} style={styles.retryButton}>
          点击重试
        </Button>
      </View>
    );
  }

  const statusLabel = statusLabelMap[order.status];
  const statusColor = statusColorMap[order.status] ?? '#333';

  const formatDateTime = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    const h = `${date.getHours()}`.padStart(2, '0');
    const mi = `${date.getMinutes()}`.padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${mi}`;
  };

  const handleCopyTrackingNumber = async () => {
    const trackingNumber = order.logistics?.trackingNumber;
    if (trackingNumber) {
      await Clipboard.setStringAsync(trackingNumber);
      Alert.alert('提示', `运单号已复制：${trackingNumber}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <Text variant="titleLarge" style={[styles.statusLabel, { color: statusColor }]}>
          {statusLabel}
        </Text>
        <Text style={styles.statusMeta}>订单号：{order.id}</Text>
        <Text style={styles.statusMeta}>下单时间：{formatDateTime(order.createdAt)}</Text>
        <Chip icon="credit-card" style={styles.paymentChip}>
          支付方式：{order.paymentMethod === 'cash-on-delivery' ? '货到付款' : order.paymentMethod === 'wechat' ? '微信支付' : '支付宝'}
        </Chip>
      </View>

      {order.statusHistory?.length ? (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            状态时间线
          </Text>
          <View style={styles.timelineWrapper}>
            {[...order.statusHistory].reverse().map((entry, index) => (
              <View key={`${entry.status}-${entry.timestamp}-${index}`} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{statusLabelMap[entry.status] ?? entry.status}</Text>
                  <Text style={styles.timelineTime}>{formatDateTime(entry.timestamp)}</Text>
                  {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {order.logistics ? (
        <View style={styles.section}>
          <View style={styles.logisticsHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              物流信息
            </Text>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingText}>
                {order.logistics.carrier} · 运单号 {order.logistics.trackingNumber}
              </Text>
              <IconButton icon="content-copy" size={18} onPress={handleCopyTrackingNumber} />
            </View>
          </View>
          <Text style={styles.logisticsMeta}>联系电话：{order.logistics.contactPhone ?? '暂无'}</Text>
          <Text style={styles.logisticsMeta}>最近更新：{formatDateTime(order.logistics.updatedAt)}</Text>
          <Divider style={styles.logisticsDivider} />
          {order.logistics.checkpoints?.length ? (
            <View style={styles.timelineWrapper}>
              {[...order.logistics.checkpoints].reverse().map((checkpoint, index) => (
                <View key={`${checkpoint.status}-${checkpoint.timestamp}-${index}`} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>{checkpoint.status}</Text>
                    <Text style={styles.timelineTime}>{formatDateTime(checkpoint.timestamp)}</Text>
                    {checkpoint.location ? (
                      <Text style={styles.timelineNote}>地点：{checkpoint.location}</Text>
                    ) : null}
                    {checkpoint.description ? (
                      <Text style={styles.timelineNote}>{checkpoint.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.logisticsEmpty}>暂无物流节点，请稍后再试</Text>
          )}
        </View>
      ) : null}

      {order.afterSale ? (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            售后信息
          </Text>
          <Text style={styles.sectionContent}>类型：{order.afterSale.type === 'refund' ? '仅退款' : order.afterSale.type === 'return-refund' ? '退货退款' : '换货'}</Text>
          <Text style={styles.sectionContent}>
            状态：{afterSaleStatusLabelMap[order.afterSale.status] ?? order.afterSale.status}
          </Text>
          <Text style={styles.sectionContent}>申请时间：{formatDateTime(order.afterSale.appliedAt)}</Text>
          <Text style={styles.sectionContent}>更新时间：{formatDateTime(order.afterSale.updatedAt)}</Text>
          <Text style={styles.sectionContent}>原因：{order.afterSale.reason}</Text>
          {order.afterSale.description ? (
            <Text style={styles.sectionContent}>说明：{order.afterSale.description}</Text>
          ) : null}
          {order.afterSale.resolutionNote ? (
            <Text style={styles.sectionContent}>处理结果：{order.afterSale.resolutionNote}</Text>
          ) : null}
          {order.afterSale.attachments && order.afterSale.attachments.length > 0 ? (
            <View style={styles.attachmentList}>
              <Text style={styles.attachmentTitle}>凭证：</Text>
              {order.afterSale.attachments.map((item) => (
                <Text key={item} style={styles.attachmentItem}>
                  {item}
                </Text>
              ))}
            </View>
          ) : null}
          {order.afterSale.refund ? (
            <View style={styles.refundCard}>
              <Text style={styles.sectionTitle}>退款信息</Text>
              <Text style={styles.sectionContent}>退款金额：¥{order.afterSale.refund.amount.toFixed(2)}</Text>
              <Text style={styles.sectionContent}>
                退款方式：
                {order.afterSale.refund.method === 'original'
                  ? '原路返回'
                  : order.afterSale.refund.method === 'wallet'
                  ? '余额账户'
                  : '银行卡'}
              </Text>
              <Text style={styles.sectionContent}>到账时间：{formatDateTime(order.afterSale.refund.completedAt)}</Text>
              {order.afterSale.refund.referenceId ? (
                <Text style={styles.sectionContent}>流水号：{order.afterSale.refund.referenceId}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          收货信息
        </Text>
        <Text style={styles.sectionContent}>
          {order.contactName} {order.contactPhone}
        </Text>
        <Text style={styles.sectionContent}>{order.address}</Text>
        {order.note ? <Text style={styles.sectionContent}>备注：{order.note}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          商品清单
        </Text>
        <View style={styles.itemList}>
          {order.items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <Image source={{ uri: item.thumbnail }} style={styles.itemImage} />
                <View style={styles.itemContent}>
                  <Text numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    数量：{item.quantity} · 单价 ¥{item.price.toFixed(2)} / {item.unit}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>¥{item.subtotal.toFixed(2)}</Text>
              </View>
              {index < order.items.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          费用明细
        </Text>
        <View style={styles.summaryRow}>
          <Text>商品小计</Text>
          <Text>¥{order.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>优惠减免</Text>
          <Text style={styles.negative}>-¥{order.discount.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>配送费用</Text>
          <Text>¥{order.deliveryFee.toFixed(2)}</Text>
        </View>
        <Divider style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>应付金额</Text>
          <Text style={styles.summaryTotal}>¥{order.total.toFixed(2)}</Text>
        </View>
      </View>

      <Button mode="outlined" style={styles.backButton} onPress={handleBackToOrders}>
        返回订单列表
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f9f3',
    padding: 24,
  },
  retryButton: {
    marginTop: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  statusLabel: {
    fontWeight: '700',
  },
  statusMeta: {
    color: '#666',
  },
  paymentChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionContent: {
    color: '#555',
  },
  itemList: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: '#fafafa',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemMeta: {
    color: '#777',
    fontSize: 12,
  },
  itemSubtotal: {
    color: '#d84315',
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  negative: {
    color: '#d84315',
  },
  summaryDivider: {
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontWeight: '600',
  },
  summaryTotal: {
    color: '#d84315',
    fontWeight: '700',
    fontSize: 18,
  },
  backButton: {
    marginTop: 8,
  },
  timelineWrapper: {
    backgroundColor: '#f4f8ef',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2e7d32',
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineStatus: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
  },
  timelineNote: {
    fontSize: 12,
    color: '#888',
  },
  logisticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingText: {
    color: '#a86b00',
    fontSize: 12,
  },
  logisticsMeta: {
    fontSize: 12,
    color: '#6d4c41',
  },
  logisticsDivider: {
    marginVertical: 8,
  },
  logisticsEmpty: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  attachmentList: {
    marginTop: 8,
    gap: 4,
  },
  attachmentTitle: {
    fontWeight: '600',
    color: '#555',
  },
  attachmentItem: {
    fontSize: 12,
    color: '#0277bd',
  },
  refundCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff8e1',
    gap: 4,
  },
});


