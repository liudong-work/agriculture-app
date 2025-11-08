import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  HelperText,
  List,
  Portal,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

import type { ProfileStackParamList } from '../navigation/AppNavigator';
import {
  appendFarmerLogisticsCheckpoint,
  fetchFarmerOrderDetail,
  setFarmerOrderLogistics,
  updateFarmerAfterSale,
  updateFarmerOrderStatus,
} from '../services/farmerOrder.api';
import type { Order, OrderStatus } from '../types/order';

const statusLabelMap: Record<OrderStatus, string> = {
  pending: '待支付',
  processing: '待发货',
  shipped: '运输中',
  completed: '已完成',
  cancelled: '已取消',
  'after-sale': '售后中',
};

type RouteProps = {
  params: {
    orderId: string;
  };
};

type LogisticsForm = {
  carrier: string;
  trackingNumber: string;
  contactPhone: string;
};

type CheckpointForm = {
  status: string;
  description: string;
  location: string;
};

type AfterSaleForm = {
  status: 'processing' | 'resolved' | 'rejected';
  resolutionNote: string;
  refundAmount: string;
};

const statusActionMap: Partial<Record<OrderStatus, Array<{ label: string; next: OrderStatus; note?: string }>>> = {
  pending: [{ label: '确认已支付', next: 'processing', note: '客户已完成支付' }],
  processing: [{ label: '标记已发货', next: 'shipped', note: '包裹已交给承运商' }],
  shipped: [{ label: '标记已完成', next: 'completed', note: '订单履约完成' }],
};

export default function FarmerOrderDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const queryClient = useQueryClient();
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [logisticsDialogVisible, setLogisticsDialogVisible] = useState(false);
  const [checkpointDialogVisible, setCheckpointDialogVisible] = useState(false);
  const [afterSaleDialogVisible, setAfterSaleDialogVisible] = useState(false);

  const [logisticsForm, setLogisticsForm] = useState<LogisticsForm>({
    carrier: '',
    trackingNumber: '',
    contactPhone: '',
  });
  const [checkpointForm, setCheckpointForm] = useState<CheckpointForm>({
    status: '',
    description: '',
    location: '',
  });
  const [afterSaleForm, setAfterSaleForm] = useState<AfterSaleForm>({
    status: 'processing',
    resolutionNote: '',
    refundAmount: '',
  });

  const orderId = route.params?.orderId;

  const {
    data: order,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['farmerOrder', orderId],
    queryFn: () => fetchFarmerOrderDetail(orderId!),
    enabled: !!orderId,
  });

  const refreshQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['farmerOrders'] });
    queryClient.invalidateQueries({ queryKey: ['farmerOrder', orderId] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) =>
      updateFarmerOrderStatus(orderId!, { status, note }),
    onSuccess: () => {
      setSnackbarMessage('订单状态已更新');
      refreshQueries();
    },
    onError: (error: any) => {
      Alert.alert('操作失败', error?.response?.data?.message ?? '更新状态失败');
    },
  });

  const logisticsMutation = useMutation({
    mutationFn: (payload: LogisticsForm) =>
      setFarmerOrderLogistics(orderId!, {
        carrier: payload.carrier.trim(),
        trackingNumber: payload.trackingNumber.trim(),
        contactPhone: payload.contactPhone.trim() || undefined,
      }),
    onSuccess: () => {
      setSnackbarMessage('物流信息已保存');
      setLogisticsDialogVisible(false);
      refreshQueries();
    },
    onError: (error: any) => {
      Alert.alert('提交失败', error?.response?.data?.message ?? '保存物流信息失败');
    },
  });

  const checkpointMutation = useMutation({
    mutationFn: (payload: CheckpointForm) =>
      appendFarmerLogisticsCheckpoint(orderId!, {
        status: payload.status.trim(),
        description: payload.description.trim() || undefined,
        location: payload.location.trim() || undefined,
      }),
    onSuccess: () => {
      setSnackbarMessage('物流节点已追加');
      setCheckpointDialogVisible(false);
      refreshQueries();
    },
    onError: (error: any) => {
      Alert.alert('提交失败', error?.response?.data?.message ?? '追加物流节点失败');
    },
  });

  const afterSaleMutation = useMutation({
    mutationFn: (payload: AfterSaleForm) =>
      updateFarmerAfterSale(orderId!, {
        status: payload.status,
        resolutionNote: payload.resolutionNote.trim() || undefined,
        refund: payload.refundAmount
          ? { amount: Number(payload.refundAmount), method: 'original' }
          : undefined,
      }),
    onSuccess: () => {
      setSnackbarMessage('售后处理已提交');
      setAfterSaleDialogVisible(false);
      refreshQueries();
    },
    onError: (error: any) => {
      Alert.alert('处理失败', error?.response?.data?.message ?? '更新售后状态失败');
    },
  });

  const actions = useMemo(() => {
    if (!order) return [];
    return statusActionMap[order.status] ?? [];
  }, [order]);

  if (isLoading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text style={styles.loadingText}>{isFetching ? '刷新中...' : '加载订单详情...'}</Text>
      </View>
    );
  }

  const handleCopyTracking = async (trackingNumber: string) => {
    await Clipboard.setStringAsync(trackingNumber);
    setSnackbarMessage('运单号已复制');
  };

  const handleSubmitLogistics = () => {
    if (!logisticsForm.carrier.trim() || !logisticsForm.trackingNumber.trim()) {
      Alert.alert('提示', '请填写完整的物流信息');
      return;
    }
    logisticsMutation.mutate(logisticsForm);
  };

  const handleSubmitCheckpoint = () => {
    if (!checkpointForm.status.trim()) {
      Alert.alert('提示', '请填写节点标题');
      return;
    }
    checkpointMutation.mutate(checkpointForm);
  };

  const handleSubmitAfterSale = () => {
    if (order.afterSale && order.afterSale.type === 'refund' && !afterSaleForm.refundAmount.trim()) {
      Alert.alert('提示', '退款类售后请填写退款金额');
      return;
    }
    if (afterSaleForm.refundAmount && Number.isNaN(Number(afterSaleForm.refundAmount))) {
      Alert.alert('提示', '退款金额需为数字');
      return;
    }
    afterSaleMutation.mutate(afterSaleForm);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Surface style={styles.section} elevation={1}>
          <View style={styles.headerRow}>
            <Text variant="titleMedium">订单概览</Text>
            <Chip>{statusLabelMap[order.status]}</Chip>
          </View>
          <Text style={styles.orderId}>订单号：{order.id}</Text>
          <Text>创建时间：{new Date(order.createdAt).toLocaleString()}</Text>
          <Text>支付方式：{order.paymentMethod}</Text>
          <Text style={styles.totalText}>实付金额：¥{order.total.toFixed(2)}</Text>
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            收货信息
          </Text>
          <Text>收件人：{order.contactName}</Text>
          <Text>联系电话：{order.contactPhone}</Text>
          <Text style={styles.address}>{order.address}</Text>
          {order.note ? <HelperText type="info">客户备注：{order.note}</HelperText> : null}
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            商品明细
          </Text>
          <List.Section>
            {order.items.map((item) => (
              <List.Item
                key={item.id}
                title={`${item.name} × ${item.quantity}`}
                description={`¥${item.price.toFixed(2)} / ${item.unit}`}
                right={() => <Text style={styles.subtotal}>¥{item.subtotal.toFixed(2)}</Text>}
              />
            ))}
          </List.Section>
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              物流信息
            </Text>
            <View style={styles.sectionActions}>
              <Button mode="text" onPress={() => {
                setLogisticsForm({
                  carrier: order.logistics?.carrier ?? '',
                  trackingNumber: order.logistics?.trackingNumber ?? '',
                  contactPhone: order.logistics?.contactPhone ?? '',
                });
                setLogisticsDialogVisible(true);
              }}>
                填写/修改
              </Button>
              <Button
                mode="text"
                onPress={() => {
                  setCheckpointForm({ status: '', description: '', location: '' });
                  setCheckpointDialogVisible(true);
                }}
                disabled={!order.logistics}
              >
                追加节点
              </Button>
            </View>
          </View>

          {order.logistics ? (
            <View style={styles.logisticsBlock}>
              <Text>承运商：{order.logistics.carrier}</Text>
              <Text>
                运单号：{order.logistics.trackingNumber}{' '}
                <Text style={styles.copyLink} onPress={() => handleCopyTracking(order.logistics!.trackingNumber)}>
                  复制
                </Text>
              </Text>
              {order.logistics.contactPhone ? <Text>客服电话：{order.logistics.contactPhone}</Text> : null}
              <Text>更新时间：{new Date(order.logistics.updatedAt).toLocaleString()}</Text>
              <List.Section>
                {order.logistics.checkpoints.map((checkpoint, index) => (
                  <List.Item
                    key={`${checkpoint.timestamp}-${index}`}
                    title={checkpoint.status}
                    description={`${checkpoint.description ?? ''} ${checkpoint.location ?? ''}`.trim()}
                    right={() => <Text style={styles.checkpointTime}>{new Date(checkpoint.timestamp).toLocaleString()}</Text>}
                  />
                ))}
              </List.Section>
            </View>
          ) : (
            <HelperText type="info">尚未填写物流信息</HelperText>
          )}
        </Surface>

        {order.afterSale ? (
          <Surface style={styles.section} elevation={1}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="titleMedium">售后情况</Text>
              <Button
                mode="text"
                onPress={() => {
                  setAfterSaleForm({
                    status:
                      order.afterSale?.status === 'applied'
                        ? 'processing'
                        : (order.afterSale?.status as AfterSaleForm['status'] | undefined) ?? 'processing',
                    resolutionNote: order.afterSale?.resolutionNote ?? '',
                    refundAmount: order.afterSale?.refund?.amount ? String(order.afterSale.refund.amount) : '',
                  });
                  setAfterSaleDialogVisible(true);
                }}
              >
                处理售后
              </Button>
            </View>
            <Text>类型：{afterSaleTypeLabel(order.afterSale.type)}</Text>
            <Text>原因：{order.afterSale.reason}</Text>
            <Text>当前状态：{afterSaleStatusLabel(order.afterSale.status)}</Text>
            <Text>申请时间：{new Date(order.afterSale.appliedAt).toLocaleString()}</Text>
            <Text>更新时间：{new Date(order.afterSale.updatedAt).toLocaleString()}</Text>
            {order.afterSale.resolutionNote ? <Text>处理备注：{order.afterSale.resolutionNote}</Text> : null}
            {order.afterSale.refund ? (
              <Text>
                退款：¥{order.afterSale.refund.amount.toFixed(2)} · {order.afterSale.refund.method} ·{' '}
                {order.afterSale.refund.completedAt ? new Date(order.afterSale.refund.completedAt).toLocaleString() : '待入账'}
              </Text>
            ) : null}
          </Surface>
        ) : null}

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            操作面板
          </Text>
          <View style={styles.actionButtons}>
            {actions.map((action) => (
              <Button
                key={action.label}
                mode="contained"
                onPress={() =>
                  statusMutation.mutate({ status: action.next, note: action.note })
                }
                loading={statusMutation.isPending}
                style={styles.actionButton}
              >
                {action.label}
              </Button>
            ))}
            <Button mode="outlined" onPress={() => refetch()} disabled={isFetching}>
              手动刷新
            </Button>
          </View>
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog visible={logisticsDialogVisible} onDismiss={() => setLogisticsDialogVisible(false)}>
          <Dialog.Title>填写物流信息</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="物流公司"
              mode="outlined"
              value={logisticsForm.carrier}
              onChangeText={(text) => setLogisticsForm((prev) => ({ ...prev, carrier: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="运单号"
              mode="outlined"
              value={logisticsForm.trackingNumber}
              onChangeText={(text) => setLogisticsForm((prev) => ({ ...prev, trackingNumber: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="承运商电话（可选）"
              mode="outlined"
              keyboardType="phone-pad"
              value={logisticsForm.contactPhone}
              onChangeText={(text) => setLogisticsForm((prev) => ({ ...prev, contactPhone: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogisticsDialogVisible(false)}>取消</Button>
            <Button onPress={handleSubmitLogistics} loading={logisticsMutation.isPending}>
              保存
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={checkpointDialogVisible} onDismiss={() => setCheckpointDialogVisible(false)}>
          <Dialog.Title>追加物流节点</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="节点状态"
              mode="outlined"
              value={checkpointForm.status}
              onChangeText={(text) => setCheckpointForm((prev) => ({ ...prev, status: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="节点描述（可选）"
              mode="outlined"
              value={checkpointForm.description}
              onChangeText={(text) => setCheckpointForm((prev) => ({ ...prev, description: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="地点（可选）"
              mode="outlined"
              value={checkpointForm.location}
              onChangeText={(text) => setCheckpointForm((prev) => ({ ...prev, location: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCheckpointDialogVisible(false)}>取消</Button>
            <Button onPress={handleSubmitCheckpoint} loading={checkpointMutation.isPending}>
              保存
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={afterSaleDialogVisible} onDismiss={() => setAfterSaleDialogVisible(false)}>
          <Dialog.Title>售后处理</Dialog.Title>
          <Dialog.Content>
            <List.Section>
              <List.Item
                title="处理状态"
                right={() => (
                  <Button onPress={() => cycleAfterSaleStatus()}>切换：{afterSaleStatusLabel(afterSaleForm.status)}</Button>
                )}
              />
            </List.Section>
            <TextInput
              label="处理备注"
              mode="outlined"
              multiline
              value={afterSaleForm.resolutionNote}
              onChangeText={(text) => setAfterSaleForm((prev) => ({ ...prev, resolutionNote: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="退款金额（可选）"
              mode="outlined"
              keyboardType="decimal-pad"
              value={afterSaleForm.refundAmount}
              onChangeText={(text) => setAfterSaleForm((prev) => ({ ...prev, refundAmount: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAfterSaleDialogVisible(false)}>取消</Button>
            <Button onPress={handleSubmitAfterSale} loading={afterSaleMutation.isPending}>
              提交
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage('')} duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </>
  );

  function cycleAfterSaleStatus() {
    setAfterSaleForm((prev) => {
      const orderStatus: Array<'processing' | 'resolved' | 'rejected'> = ['processing', 'resolved', 'rejected'];
      const currentIndex = orderStatus.indexOf(prev.status);
      const nextIndex = (currentIndex + 1) % orderStatus.length;
      return { ...prev, status: orderStatus[nextIndex] };
    });
  }
}

function afterSaleTypeLabel(type: Order['afterSale']!['type']) {
  switch (type) {
    case 'refund':
      return '仅退款';
    case 'return-refund':
      return '退货退款';
    case 'exchange':
      return '换货';
    default:
      return type;
  }
}

function afterSaleStatusLabel(status: Order['afterSale']!['status']) {
  switch (status) {
    case 'applied':
      return '已申请';
    case 'processing':
      return '处理中';
    case 'resolved':
      return '已完成';
    case 'rejected':
      return '已驳回';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f6f9f3',
  },
  loadingText: {
    color: '#666',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  orderId: {
    color: '#555',
  },
  totalText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#d84315',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  address: {
    color: '#555',
  },
  subtotal: {
    alignSelf: 'center',
    fontWeight: '600',
  },
  logisticsBlock: {
    gap: 6,
  },
  copyLink: {
    color: '#1976d2',
  },
  checkpointTime: {
    alignSelf: 'center',
    color: '#777',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  dialogInput: {
    marginBottom: 12,
  },
});
