import React from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
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
import { SHOWCASE_FARMER_ID } from '../constants/farmer';

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
          title="溯源档案"
          subtitle="走进合作农户，了解一颗果子的旅程"
          actionLabel="查看详情"
          onPressAction={() =>
            navigation.navigate('FarmerStory', {
              farmerId: SHOWCASE_FARMER_ID,
              title: '合作社故事',
            })
          }
        />
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('FarmerStory', {
              farmerId: SHOWCASE_FARMER_ID,
              title: '丰收农场故事',
            })
          }
        >
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
            }}
            style={styles.storyCard}
            imageStyle={styles.storyCardImage}
          >
            <View style={styles.storyCardOverlay}>
              <Text style={styles.storyTitle}>丰收农场·赣南脐橙</Text>
              <Text style={styles.storyDesc}>凌晨采摘 · 冷链入仓 · 实时溯源</Text>
              <Text style={styles.storyAction}>进入故事 &gt;</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="订阅鲜箱"
          subtitle="小而美的固定配额，定期送达城市家庭"
          actionLabel="全部订阅"
          onPressAction={() => navigation.navigate('SubscriptionPlans')}
        />
        <TouchableOpacity
          style={styles.subscriptionCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SubscriptionPlans')}
        >
          <View style={styles.subscriptionContent}>
            <Text style={styles.subscriptionTitle}>丰收订阅箱</Text>
            <Text style={styles.subscriptionText}>每周一次 · 脐橙 3kg + 有机叶菜 + 伴手礼</Text>
            <Text style={styles.subscriptionPrice}>￥109 / 次</Text>
          </View>
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionBadgeText}>限量 80 份</Text>
          </View>
        </TouchableOpacity>
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
  storyCard: {
    height: 180,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  storyCardImage: {
    borderRadius: 18,
  },
  storyCardOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(46, 125, 50, 0.3)',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  storyDesc: {
    marginTop: 6,
    color: '#f1f8e9',
  },
  storyAction: {
    marginTop: 10,
    color: '#fff',
    fontWeight: '600',
  },
  subscriptionCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c5e1a5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  subscriptionContent: {
    flex: 1,
    marginRight: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e5436',
  },
  subscriptionText: {
    marginTop: 6,
    color: '#607d8b',
  },
  subscriptionPrice: {
    marginTop: 12,
    color: '#d32f2f',
    fontWeight: '700',
  },
  subscriptionBadge: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subscriptionBadgeText: {
    color: '#fff',
    fontWeight: '600',
  },
});

