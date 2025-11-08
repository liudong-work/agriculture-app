import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { ProductCategory } from '../types/product';

type CategoryGridProps = {
  data: ProductCategory[];
  onPressCategory?: (category: ProductCategory) => void;
};

export default function CategoryGrid({ data, onPressCategory }: CategoryGridProps) {
  return (
    <FlatList
      data={data}
      numColumns={4}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => onPressCategory?.(item)}
        >
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons
              name={(item.icon as any) || 'basket'}
              size={28}
              color="#2e7d32"
            />
          </View>
          <Text variant="bodyMedium" style={styles.label} numberOfLines={1}>
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    marginVertical: 4,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f1f8e9',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcedc8',
    marginBottom: 6,
  },
  label: {
    color: '#33691e',
  },
});

