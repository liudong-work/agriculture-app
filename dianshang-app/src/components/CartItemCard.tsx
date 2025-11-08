import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Checkbox, IconButton, Text } from 'react-native-paper';

import type { CartItem } from '../types/cart';

type CartItemCardProps = {
  item: CartItem;
  onToggleSelect: (id: string, selected: boolean) => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
};

export default function CartItemCard({
  item,
  onToggleSelect,
  onChangeQuantity,
  onRemove,
}: CartItemCardProps) {
  const { product } = item;
  const maxReached = item.quantity >= product.stock;
  const outOfStock = product.stock <= 0;

  return (
    <View style={styles.container}>
      <Checkbox.Android
        status={item.selected ? 'checked' : 'unchecked'}
        onPress={() => onToggleSelect(item.id, !item.selected)}
        color="#2e7d32"
        disabled={outOfStock}
      />
      <TouchableOpacity style={styles.imageWrapper} onPress={() => console.log('查看商品', product.id)}>
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text variant="titleSmall" numberOfLines={2}>
          {product.name}
        </Text>
        <Text variant="bodySmall" style={styles.origin}>
          {product.origin}
        </Text>
        <Text variant="bodySmall" style={[styles.stock, outOfStock && styles.stockWarning]}>
          {outOfStock ? '已售罄' : `库存 ${product.stock} 件`}
        </Text>
        <View style={styles.operationRow}>
          <Text style={styles.price}>¥{product.price.toFixed(2)}</Text>
          <View style={styles.quantityControl}>
            <IconButton
              icon="minus"
              size={16}
              onPress={() => onChangeQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
            />
            <Text style={styles.quantity}>{item.quantity}</Text>
            <IconButton
              icon="plus"
              size={16}
              onPress={() => onChangeQuantity(item.id, item.quantity + 1)}
              disabled={maxReached || outOfStock}
            />
          </View>
        </View>
      </View>
      <IconButton icon="delete-outline" onPress={() => onRemove(item.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f1f1f1',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  origin: {
    color: '#888',
  },
  stock: {
    color: '#4a6a49',
  },
  stockWarning: {
    color: '#d84315',
  },
  operationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: '#d84315',
    fontWeight: '700',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantity: {
    width: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
});

