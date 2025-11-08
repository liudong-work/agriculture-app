import React from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import BannerCarousel from '../components/BannerCarousel';
import CategoryGrid from '../components/CategoryGrid';
import ActivityHighlight from '../components/ActivityHighlight';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import { fetchProductList } from '../services/product.api';
import type { HomeStackParamList } from '../navigation/AppNavigator';
import { mockActivityCards, mockBanners, mockCategories } from '../utils/mockData';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: () => fetchProductList({ page: 1, pageSize: 10 }),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BannerCarousel data={mockBanners} />

      <View style={styles.section}>
        <SectionHeader title="分类直达" subtitle="甄选农产品品类，快速找到所需" />
        <CategoryGrid data={mockCategories} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="活动专区"
          subtitle="当季新品与农户合作活动"
          actionLabel="更多活动"
          onPressAction={() => console.log('前往活动列表')}
        />
        <ActivityHighlight data={mockActivityCards} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="热销推荐"
          subtitle="根据热度推荐人气农产品"
          actionLabel="查看更多"
          onPressAction={() => console.log('查看更多推荐商品')}
        />
        {isLoading ? (
          <ActivityIndicator style={styles.loadingIndicator} />
        ) : isError ? (
          <Text style={styles.errorText}>加载推荐商品失败，请稍后重试</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productList}>
            {data?.items.map((item) => (
              <ProductCard
                key={item.id}
                item={{
                  id: item.id,
                  name: item.name,
                  images: [item.thumbnail],
                  price: item.price,
                  unit: item.unit,
                  origin: item.origin,
                  categoryId: item.categoryId,
                  seasonalTag: item.seasonalTag,
                  isOrganic: item.isOrganic,
                }}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={[styles.section, styles.noticeBox]}>
        <Text variant="titleMedium" style={styles.noticeTitle}>
          新鲜直达保障
        </Text>
        <Text variant="bodySmall" style={styles.noticeText}>
          • 产地直采 · 冷链运输 · 次日达主要城市
        </Text>
        <Text variant="bodySmall" style={styles.noticeText}>
          • 支持无忧售后，坏果包赔、售后极速处理
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  content: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  productList: {
    paddingHorizontal: 16,
  },
  loadingIndicator: {
    marginVertical: 24,
  },
  errorText: {
    color: '#d32f2f',
    paddingHorizontal: 16,
  },
  noticeBox: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c5e1a5',
  },
  noticeTitle: {
    marginBottom: 8,
    color: '#2e7d32',
    fontWeight: '600',
  },
  noticeText: {
    color: '#4a6a49',
    marginTop: 4,
  },
});

