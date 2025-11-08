import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Chip, List, Searchbar, SegmentedButtons, Text } from 'react-native-paper';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { mockCategories } from '../utils/mockData';
import { fetchProductList, type ProductListItem } from '../services/product.api';
type ProductListPage = Awaited<ReturnType<typeof fetchProductList>>;
import type { CategoryStackParamList } from '../navigation/AppNavigator';

type SortOption = 'default' | 'priceAsc' | 'priceDesc';

function mapSort(option: SortOption): { sortBy?: 'price'; sortOrder?: 'asc' | 'desc' } {
  switch (option) {
    case 'priceAsc':
      return { sortBy: 'price', sortOrder: 'asc' };
    case 'priceDesc':
      return { sortBy: 'price', sortOrder: 'desc' };
    default:
      return {};
  }
}

export default function CategoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CategoryStackParamList>>();

  const [search, setSearch] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const sortParams = useMemo(() => mapSort(sortOption), [sortOption]);

  const queryResult = useInfiniteQuery<ProductListPage>({
    queryKey: ['category-products', { keyword: debouncedKeyword, category: selectedCategoryId, sortOption }],
    queryFn: ({ pageParam = 1 }) =>
      fetchProductList({
        page: Number(pageParam),
        pageSize: 12,
        keyword: debouncedKeyword || undefined,
        categoryId: selectedCategoryId || undefined,
        ...sortParams,
      }),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.pageSize);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = queryResult;

  const productList = useMemo<ProductListItem[]>(() => {
    if (!data) {
      return [];
    }
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="搜索商品名称或关键字"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => setDebouncedKeyword(search.trim())}
      />

      <View style={styles.filterRow}>
        <Text variant="bodySmall" style={styles.filterLabel}>
          分类筛选：
        </Text>
        <Chip
          selected={!selectedCategoryId}
          onPress={() => setSelectedCategoryId(null)}
          style={styles.chip}
        >
          全部
        </Chip>
        {mockCategories.map((category) => (
          <Chip
            key={category.id}
            selected={selectedCategoryId === category.id}
            onPress={() => setSelectedCategoryId(category.id)}
            style={styles.chip}
          >
            {category.name}
          </Chip>
        ))}
      </View>

      <SegmentedButtons
        value={sortOption}
        onValueChange={(value) => setSortOption(value as SortOption)}
        style={styles.segmented}
        buttons={[
          { value: 'default', label: '默认排序' },
          { value: 'priceAsc', label: '价格升序' },
          { value: 'priceDesc', label: '价格降序' },
        ]}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} />
      ) : isError ? (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyTip}>商品加载失败，请下拉刷新重试</Text>
        </View>
      ) : (
        <FlatList
          data={productList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={`${item.origin} · 库存 ${item.stock} · ¥${item.price.toFixed(2)} / ${item.unit}`}
              left={() => <List.Icon icon="basket" />}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyTip}>暂无符合条件的商品</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator style={styles.footerIndicator} /> : null
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#4caf50" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  search: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  filterLabel: {
    color: '#4a6a49',
  },
  chip: {
    backgroundColor: '#e8f5e9',
  },
  segmented: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  loadingIndicator: {
    marginTop: 48,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#dce5d3',
    marginLeft: 56,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTip: {
    color: '#7d8b74',
  },
  footerIndicator: {
    marginVertical: 16,
  },
});

