import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import AddressCard from '../components/AddressCard';
import { deleteAddress, fetchAddresses } from '../services/address.api';
import type { Address } from '../types/address';
import type { ProfileStackParamList } from '../navigation/AppNavigator';

type Navigation = NativeStackNavigationProp<ProfileStackParamList, 'AddressList'>;

export default function AddressListScreen() {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['addresses'] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),
    onSuccess: invalidate,
  });

  const handleAdd = () => {
    navigation.navigate('AddressForm', { mode: 'create' });
  };

  const handleEdit = (address: Address) => {
    navigation.navigate('AddressForm', { mode: 'edit', address });
  };

  const handleDelete = (address: Address) => {
    deleteMutation.mutate(address.id);
  };

  const renderContent = () => {
    if (isLoading && !data) {
      return <ActivityIndicator style={styles.loading} />;
    }

    if (isError) {
      return (
        <View style={styles.errorState}>
          <Text variant="titleMedium">收货地址加载失败</Text>
          <Button onPress={() => refetch()} style={styles.retryButton}>
            点击重试
          </Button>
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text variant="titleMedium">还没有收货地址</Text>
          <Text variant="bodySmall" style={styles.emptyHint}>
            添加一个常用地址，让下单更轻松。
          </Text>
          <Button mode="contained" onPress={handleAdd} style={styles.primaryButton}>
            新增收货地址
          </Button>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AddressCard address={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      <FAB icon="plus" style={styles.fab} onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  loading: {
    marginTop: 64,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyHint: {
    color: '#777',
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 24,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  retryButton: {
    borderRadius: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },
});


