import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, Chip } from 'react-native-paper';

import type { Product } from '../types/product';

type ProductCardProps = {
  item: Product;
  onPress?: (product: Product) => void;
};

export default function ProductCard({ item, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(item)}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.images[0] }} style={styles.image} />
        {item.seasonalTag ? <Chip style={styles.tag}>{item.seasonalTag}</Chip> : null}
      </View>
      <View style={styles.content}>
        <Text variant="titleSmall" numberOfLines={2}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={styles.origin}>
          {item.origin}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
          {item.originalPrice ? (
            <Text style={styles.originalPrice}>¥{item.originalPrice.toFixed(2)}</Text>
          ) : null}
        </View>
        {item.rating ? (
          <Text style={styles.meta}>
            好评率 {item.rating.toFixed(1)} · {item.reviewCount ?? 0} 条评论
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  content: {
    padding: 12,
    gap: 4,
  },
  origin: {
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    color: '#d84315',
    fontSize: 16,
    fontWeight: '700',
  },
  originalPrice: {
    color: '#999',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  meta: {
    color: '#999',
    fontSize: 12,
  },
});

