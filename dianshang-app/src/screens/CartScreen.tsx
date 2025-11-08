import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import {
  Button,
  Checkbox,
  Dialog,
  Divider,
  Portal,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import CartItemCard from '../components/CartItemCard';
import CartSummaryPanel from '../components/CartSummaryPanel';
import { fetchCart, removeCartItem, setCartSelectAll, updateCartItem } from '../services/cart.api';
import { fetchAddresses } from '../services/address.api';
import { createOrder, type CreateOrderPayload } from '../services/order.api';
import type { CartItem, CartSummary } from '../types/cart';
import type { CartStackParamList, RootTabParamList } from '../navigation/AppNavigator';
import type { PaymentMethod } from '../types/order';
import type { Address } from '../types/address';

const emptySummary: CartSummary = {
  subtotal: 0,
  discount: 0,
  deliveryFee: 0,
  total: 0,
  details: [],
};

type CartScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<CartStackParamList, 'Cart'>,
  BottomTabNavigationProp<RootTabParamList>
>;

type CheckoutFormState = {
  paymentMethod: PaymentMethod;
  note?: string;
};

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigation>();
  const queryClient = useQueryClient();

  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    paymentMethod: 'wechat',
    note: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  });

  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });

  const cartItems = data?.items ?? [];
  const summary = data?.summary ?? emptySummary;
  const selectedItems = useMemo(() => cartItems.filter((item) => item.selected), [cartItems]);
  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;
  const addresses = addressData ?? [];

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }
    const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
    setSelectedAddressId((prev) => {
      if (!prev) {
        return defaultAddress.id;
      }
      const exists = addresses.some((address) => address.id === prev);
      return exists ? prev : defaultAddress.id;
    });
  }, [addresses]);

  const selectedAddress = useMemo<Address | undefined>(() => {
    if (addresses.length === 0) {
      return undefined;
    }
    if (!selectedAddressId) {
      return addresses[0];
    }
    return addresses.find((address) => address.id === selectedAddressId) ?? addresses[0];
  }, [addresses, selectedAddressId]);

  const formatAddress = (address?: Address) => {
    if (!address) {
      return '';
    }
    const parts = [
      address.province,
      address.city,
      address.district,
      address.street,
      address.detail,
    ].filter(Boolean);
    return parts.join(' ');
  };

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, payload }: { itemId: string; payload: { quantity?: number; selected?: boolean } }) =>
      updateCartItem(itemId, payload),
    onSuccess: invalidateCart,
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? '操作失败，请稍后重试';
      setSnackbarMessage(message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      invalidateCart();
      setSnackbarMessage('已移除商品');
    },
    onError: () => setSnackbarMessage('移除失败，请稍后重试'),
  });

  const selectAllMutation = useMutation({
    mutationFn: setCartSelectAll,
    onSuccess: invalidateCart,
    onError: () => setSnackbarMessage('更新失败，请稍后重试'),
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: (order) => {
      invalidateCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCheckoutVisible(false);
      setSnackbarMessage('下单成功，查看订单详情');
      const parentNavigator = navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
      parentNavigator?.navigate('OrderStack', {
        screen: 'OrderDetail',
        params: { orderId: order.id },
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? '下单失败，请稍后重试';
      setSnackbarMessage(message);
    },
  });

  const handleToggleSelect = (id: string, selected: boolean) => {
    updateMutation.mutate({ itemId: id, payload: { selected } });
  };

  const handleSelectAll = () => {
    selectAllMutation.mutate(!allSelected);
  };

  const handleChangeQuantity = (id: string, quantity: number) => {
    updateMutation.mutate({ itemId: id, payload: { quantity: Math.max(1, quantity) } });
  };

  const handleRemove = (id: string) => {
    removeMutation.mutate(id);
  };

  const navigateToAddressManagement = () => {
    const parentNavigator = navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
    parentNavigator?.navigate('ProfileStack', { screen: 'AddressList' });
  };

  const handleSubmitOrder = () => {
    if (selectedItems.length === 0) {
      setSnackbarMessage('请选择需要结算的商品');
      return;
    }
    if (!selectedAddress) {
      setSnackbarMessage('请先新增收货地址');
      navigateToAddressManagement();
      return;
    }
    setCheckoutVisible(true);
  };

  const handleCheckoutFieldChange = (key: keyof CheckoutFormState, value: string | PaymentMethod) => {
    setCheckoutForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleConfirmCheckout = () => {
    const address = selectedAddress;
    if (!address) {
      setSnackbarMessage('请先新增收货地址');
      return;
    }

    const name = address.contactName.trim();
    const phone = address.contactPhone.trim();
    const fullAddress = formatAddress(address);
    const note = checkoutForm.note?.trim();

    if (!/^1\d{10}$/.test(phone)) {
      setSnackbarMessage('请输入正确的手机号');
      return;
    }
    if (fullAddress.length < 5) {
      setSnackbarMessage('收货地址信息不完整，请前往地址管理更新');
      return;
    }

    const payload: CreateOrderPayload = {
      contactName: name,
      contactPhone: phone,
      address: fullAddress,
      paymentMethod: checkoutForm.paymentMethod,
      ...(note ? { note } : {}),
    };

    createOrderMutation.mutate(payload);
  };

  const handleManageAddress = () => {
    setCheckoutVisible(false);
    navigateToAddressManagement();
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} />
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeaderWrapper}>
              {cartItems.length > 0 ? (
                <View style={styles.headerBar}>
                  <View style={styles.selectAllRow}>
                    <Checkbox.Android
                      status={allSelected ? 'checked' : 'unchecked'}
                      onPress={handleSelectAll}
                      color="#2e7d32"
                    />
                    <Text>全选</Text>
                  </View>
                  <Text style={styles.notice}>冷链配送，支持京东物流极速达</Text>
                </View>
              ) : null}
              <View style={styles.addressCard}>
                <View style={styles.addressCardHeader}>
                  <Text variant="titleMedium">收货地址</Text>
                  <Button mode="text" onPress={navigateToAddressManagement}>
                    管理地址
                  </Button>
                </View>
                {selectedAddress ? (
                  <View style={styles.addressContent}>
                    <Text style={styles.addressName}>
                      {selectedAddress.contactName} {selectedAddress.contactPhone}
                    </Text>
                    <Text style={styles.addressDetail}>{formatAddress(selectedAddress)}</Text>
                    {selectedAddress.isDefault ? (
                      <Text style={styles.addressTag}>默认地址</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.addressEmpty}>
                    <Text variant="bodySmall" style={styles.addressEmptyText}>
                      暂无收货地址，请先添加
                    </Text>
                    <Button mode="outlined" onPress={navigateToAddressManagement} style={styles.addAddressButton}>
                      去新增地址
                    </Button>
                  </View>
                )}
              </View>
            </View>
          }
          ItemSeparatorComponent={() => <Divider style={styles.separator} />}
          renderItem={({ item }) => (
            <CartItemCard item={item as CartItem} onToggleSelect={handleToggleSelect} onChangeQuantity={handleChangeQuantity} onRemove={handleRemove} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="titleMedium">购物车还是空的</Text>
              <Text variant="bodySmall" style={styles.emptyHint}>
                快去挑选新鲜农产品吧～
              </Text>
            </View>
          }
        />
      )}

      <CartSummaryPanel
        summary={summary}
        selectedCount={selectedItems.length}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={createOrderMutation.isPending}
        disabled={selectedItems.length === 0 || !selectedAddress}
      />

      <Portal>
        <Dialog visible={checkoutVisible} onDismiss={() => setCheckoutVisible(false)}>
          <Dialog.Title>确认订单</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <View style={styles.dialogAddressCard}>
              <View style={styles.dialogAddressHeader}>
                <Text variant="titleMedium">收货地址</Text>
                <Button mode="text" onPress={handleManageAddress}>
                  修改
                </Button>
              </View>
              {selectedAddress ? (
                <View style={styles.addressContent}>
                  <Text style={styles.addressName}>
                    {selectedAddress.contactName} {selectedAddress.contactPhone}
                  </Text>
                  <Text style={styles.addressDetail}>{formatAddress(selectedAddress)}</Text>
                </View>
              ) : (
                <Text variant="bodySmall" style={styles.addressEmptyText}>
                  暂无收货地址，请先添加
                </Text>
              )}
            </View>
            <TextInput
              label="订单备注"
              value={checkoutForm.note ?? ''}
              onChangeText={(text) => handleCheckoutFieldChange('note', text)}
              mode="outlined"
              dense
              placeholder="选填，可填写配送说明等"
            />
            <SegmentedButtons
              style={styles.paymentSegmented}
              value={checkoutForm.paymentMethod}
              onValueChange={(value) => handleCheckoutFieldChange('paymentMethod', value as PaymentMethod)}
              buttons={[
                { value: 'wechat', label: '微信支付' },
                { value: 'alipay', label: '支付宝' },
                { value: 'cash-on-delivery', label: '货到付款' },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCheckoutVisible(false)}>取消</Button>
            <Button
              onPress={handleConfirmCheckout}
              loading={createOrderMutation.isPending}
              disabled={!selectedAddress || createOrderMutation.isPending}
            >
              提交订单
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
  loadingIndicator: {
    marginTop: 48,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  listHeaderWrapper: {
    gap: 12,
  },
  headerBar: {
    paddingBottom: 12,
    marginBottom: 12,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notice: {
    marginLeft: 44,
    marginTop: 4,
    color: '#4a6a49',
  },
  addressCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    gap: 8,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressContent: {
    gap: 6,
  },
  addressName: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  addressDetail: {
    color: '#4a4a4a',
    lineHeight: 20,
  },
  addressTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: 12,
    fontSize: 12,
  },
  addressEmpty: {
    gap: 8,
  },
  addressEmptyText: {
    color: '#777',
  },
  addAddressButton: {
    alignSelf: 'flex-start',
    borderRadius: 20,
  },
  separator: {
    height: 12,
    backgroundColor: 'transparent',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyHint: {
    color: '#888',
    marginTop: 8,
  },
  dialogContent: {
    gap: 12,
  },
  dialogAddressCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    gap: 8,
  },
  dialogAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentSegmented: {
    marginTop: 8,
  },
});

