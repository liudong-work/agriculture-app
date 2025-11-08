import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';

import type {
  AfterSaleStatus,
  LogisticsCheckpoint,
  Order,
  OrderStatus,
  OrderStatusHistoryEntry,
} from '../types/order';

const statusLabelMap: Record<OrderStatus, string> = {
  pending: '待付款',
  processing: '待发货',
  shipped: '待收货',
  completed: '已完成',
  cancelled: '已取消',
  'after-sale': '售后中',
};

const statusColorMap: Partial<Record<OrderStatus, string>> = {
  pending: '#d84315',
  processing: '#ef6c00',
  shipped: '#2e7d32',
  completed: '#0277bd',
  cancelled: '#757575',
  'after-sale': '#6a1b9a',
};

const afterSaleStatusMap: Record<AfterSaleStatus, string> = {
  applied: '已申请',
  processing: '处理中',
  resolved: '已完成',
  rejected: '已驳回',
};

type OrderCardProps = {
  order: Order;
  onPressDetail?: (orderId: string) => void;
  onPrimaryAction?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  onApplyAfterSale?: (order: Order) => void;
  isActionLoading?: boolean;
};

export default function OrderCard({
  order,
  onPressDetail,
  onPrimaryAction,
  onCancel,
  onApplyAfterSale,
  isActionLoading,
}: OrderCardProps) {
  const statusLabel = statusLabelMap[order.status];
  const statusColor = statusColorMap[order.status] ?? '#333';

  const canCancel = ['pending', 'processing'].includes(order.status);
  const canApplyAfterSale = ['shipped', 'completed'].includes(order.status) && !order.afterSale;

  const primaryActionLabel = (() => {
    switch (order.status) {
      case 'pending':
        return '去支付';
      case 'processing':
        return '提醒发货';
      case 'shipped':
        return '确认收货';
      case 'completed':
        return '再次购买';
      case 'after-sale':
        return '查看详情';
      default:
        return '查看详情';
    }
  })();

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
    const min = `${date.getMinutes()}`.padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  const history: OrderStatusHistoryEntry[] = order.statusHistory ?? [];
  const timeline = [...history].reverse().slice(0, 4);

  const latestCheckpoint: LogisticsCheckpoint | undefined =
    order.logistics?.checkpoints?.[order.logistics.checkpoints.length - 1];

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={() => onPressDetail?.(order.id)}>
      <View style={styles.header}>
        <Text variant="titleSmall">订单号 {order.id}</Text>
        <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
      </View>
      <Text style={styles.meta}>下单时间 {formatDateTime(order.createdAt)}</Text>
      <Text style={styles.meta}>收货地址 {order.address}</Text>

      {timeline.length > 0 ? (
        <View style={styles.timelineWrapper}>
          <Text style={styles.sectionTitle}>最新进度</Text>
          {timeline.map((entry, index) => (
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
      ) : null}

      {order.logistics ? (
        <View style={styles.logisticsCard}>
          <View style={styles.logisticsHeader}>
            <Text style={styles.sectionTitle}>物流信息</Text>
            <Text style={styles.logisticsCarrier}>
              {order.logistics.carrier} · 运单号 {order.logistics.trackingNumber}
            </Text>
          </View>
          {latestCheckpoint ? (
            <Text style={styles.logisticsLatest}>
              {latestCheckpoint.status} · {formatDateTime(latestCheckpoint.timestamp)}
              {latestCheckpoint.location ? ` · ${latestCheckpoint.location}` : ''}
            </Text>
          ) : (
            <Text style={styles.logisticsEmpty}>尚未生成物流节点</Text>
          )}
        </View>
      ) : null}

      {order.afterSale ? (
        <View style={styles.afterSaleCard}>
          <Text style={styles.sectionTitle}>
            售后状态：{afterSaleStatusMap[order.afterSale.status] ?? order.afterSale.status}
          </Text>
          <Text style={styles.afterSaleMeta}>申请时间：{formatDateTime(order.afterSale.appliedAt)}</Text>
          <Text style={styles.afterSaleMeta}>更新时间：{formatDateTime(order.afterSale.updatedAt)}</Text>
          <Text style={styles.afterSaleMeta}>原因：{order.afterSale.reason}</Text>
          {order.afterSale.description ? (
            <Text style={styles.afterSaleMeta}>说明：{order.afterSale.description}</Text>
          ) : null}
          {order.afterSale.resolutionNote ? (
            <Text style={styles.afterSaleNote}>处理结果：{order.afterSale.resolutionNote}</Text>
          ) : null}
        </View>
      ) : null}

      {order.cancellation ? (
        <View style={styles.cancelCard}>
          <Text style={styles.sectionTitle}>取消原因</Text>
          <Text style={styles.afterSaleMeta}>{order.cancellation.reason}</Text>
          <Text style={styles.afterSaleMeta}>取消时间：{formatDateTime(order.cancellation.cancelledAt)}</Text>
        </View>
      ) : null}

      <View style={styles.itemList}>
        {order.items.map((orderItem, index) => (
          <View key={orderItem.id}>
            <View style={styles.itemRow}>
              <Image source={{ uri: orderItem.thumbnail }} style={styles.itemImage} />
              <View style={styles.itemContent}>
                <Text numberOfLines={2}>{orderItem.name}</Text>
                <Text style={styles.itemMeta}>
                  数量 {orderItem.quantity} · 单价 ¥{orderItem.price.toFixed(2)} / {orderItem.unit}
                </Text>
              </View>
              <Text style={styles.itemPrice}>¥{orderItem.subtotal.toFixed(2)}</Text>
            </View>
            {index < order.items.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.total}>合计 ¥{order.total.toFixed(2)}</Text>
          <Text style={styles.links} onPress={() => onPressDetail?.(order.id)}>
            查看详情
          </Text>
        </View>
        <View style={styles.actions}>
          {canCancel ? (
            <Button
              mode="outlined"
              onPress={() => onCancel?.(order)}
              compact
              style={styles.actionButton}
              disabled={isActionLoading}
            >
              取消订单
            </Button>
          ) : null}
          {canApplyAfterSale ? (
            <Button
              mode="outlined"
              onPress={() => onApplyAfterSale?.(order)}
              compact
              style={styles.actionButton}
              disabled={isActionLoading}
            >
              申请售后
            </Button>
          ) : null}
          <Button
            mode="contained"
            compact
            onPress={() => onPrimaryAction?.(order)}
            disabled={isActionLoading}
          >
            {primaryActionLabel}
          </Button>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontWeight: '600',
  },
  meta: {
    color: '#777',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  timelineWrapper: {
    backgroundColor: '#f1f8e9',
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
  logisticsCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  logisticsHeader: {
    gap: 4,
  },
  logisticsCarrier: {
    fontSize: 12,
    color: '#a86b00',
  },
  logisticsLatest: {
    fontSize: 12,
    color: '#704c00',
  },
  logisticsEmpty: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  afterSaleCard: {
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  afterSaleMeta: {
    fontSize: 12,
    color: '#6a1b9a',
  },
  afterSaleNote: {
    fontSize: 12,
    color: '#4a148c',
  },
  cancelCard: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 12,
    gap: 4,
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
    backgroundColor: '#fafafa',
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemMeta: {
    color: '#888',
    fontSize: 12,
  },
  itemPrice: {
    color: '#d84315',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  total: {
    fontWeight: '700',
    color: '#333',
  },
  footerInfo: {
    gap: 4,
  },
  links: {
    color: '#0277bd',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 20,
  },
});

