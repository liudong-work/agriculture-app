import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import type { CartSummary } from '../types/cart';

type CartSummaryPanelProps = {
  summary: CartSummary;
  selectedCount: number;
  onSubmitOrder: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
};

export default function CartSummaryPanel({
  summary,
  selectedCount,
  onSubmitOrder,
  isSubmitting = false,
  disabled = false,
}: CartSummaryPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <View>
          <Text variant="bodySmall" style={styles.summaryLabel}>
            已选商品 {selectedCount} 件
          </Text>
          <Text variant="titleLarge" style={styles.total}>
            ¥{summary.total.toFixed(2)}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={onSubmitOrder}
          style={styles.button}
          loading={isSubmitting}
          disabled={disabled || isSubmitting}
        >
          去结算
        </Button>
      </View>
      {summary.details ? (
        <View style={styles.detailList}>
          {summary.details.map((detail) => (
            <View key={detail.label} style={styles.detailItem}>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>¥{detail.value.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#666',
    marginBottom: 4,
  },
  total: {
    color: '#d84315',
    fontWeight: '700',
  },
  button: {
    borderRadius: 24,
  },
  detailList: {
    marginTop: 12,
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#999',
  },
  detailValue: {
    color: '#333',
  },
});

