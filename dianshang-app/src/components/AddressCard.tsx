import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';

import type { Address } from '../types/address';

type AddressCardProps = {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
};

export default function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">{address.contactName}</Text>
        <Text style={styles.phone}>{address.contactPhone}</Text>
        {address.isDefault ? <Chip compact style={styles.defaultChip}>默认</Chip> : null}
        {address.tag ? <Chip compact style={styles.tagChip}>{address.tag}</Chip> : null}
      </View>
      <Text style={styles.addressText}>
        {address.province} {address.city} {address.district} {address.street}
        {address.detail ? ` ${address.detail}` : ''}
        {address.postalCode ? `（${address.postalCode}）` : ''}
      </Text>
      <View style={styles.footer}>
        <Button mode="outlined" onPress={() => onEdit?.(address)} style={styles.actionButton}>
          编辑
        </Button>
        <IconButton icon="delete-outline" onPress={() => onDelete?.(address)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phone: {
    color: '#666',
  },
  defaultChip: {
    backgroundColor: '#e8f5e9',
  },
  tagChip: {
    backgroundColor: '#e3f2fd',
  },
  addressText: {
    color: '#4a4a4a',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 20,
  },
});


