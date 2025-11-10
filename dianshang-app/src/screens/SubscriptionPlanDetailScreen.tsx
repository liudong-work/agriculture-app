import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { HomeStackParamList } from '../navigation/AppNavigator';
import {
  createSubscription,
  fetchSubscriptionPlan,
} from '../services/subscription.api';
import type { CreateSubscriptionPayload } from '../types/subscription';
import { useAuthStore } from '../store/authStore';

export default function SubscriptionPlanDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'SubscriptionPlanDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const queryClient = useQueryClient();
  const { planId } = route.params;
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['subscription-plan', planId],
    queryFn: () => fetchSubscriptionPlan(planId),
  });

  const subscriptionMutation = useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => createSubscription(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      Alert.alert('订阅成功', '已为你锁定该订阅箱，本周开始配送。');
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert('订阅失败', error?.response?.data?.message ?? '请稍后再试');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator />
        <Text style={styles.hintText}>正在加载订阅详情...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>订阅方案不存在或已下架。</Text>
      </View>
    );
  }

  const disableSubscribe = !user;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {data.coverImage ? (
        <Image source={{ uri: data.coverImage }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.placeholderText}>{data.title}</Text>
        </View>
      )}

      <View style={styles.headerBox}>
        <Text style={styles.title}>{data.title}</Text>
        {data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
        <Text style={styles.price}>￥{data.price.toFixed(2)}</Text>
        {data.originalPrice && data.originalPrice > data.price && (
          <Text style={styles.originPrice}>原价 ￥{data.originalPrice.toFixed(2)}</Text>
        )}
        <View style={styles.chipRow}>
          <Chip icon="calendar" style={styles.chip}>
            {cycleText(data.cycle)}
          </Chip>
          {typeof data.deliverWeekday === 'number' && (
            <Chip icon="truck" style={styles.chip}>
              每周{weekdayText(data.deliverWeekday)}配送
            </Chip>
          )}
        </View>
        <View style={styles.benefitRow}>
          {data.benefits.map((benefit) => (
            <Chip key={benefit} compact style={styles.benefitChip}>
              {benefit}
            </Chip>
          ))}
        </View>
      </View>

      {data.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>方案介绍</Text>
          <Text style={styles.sectionText}>{data.description}</Text>
        </View>
      )}

      {data.items && data.items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>每箱包含</Text>
          {data.items.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {item.quantity ?? '按季配比'} {item.description ?? ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Button
        mode="contained"
        style={styles.subscribeButton}
        onPress={() => subscriptionMutation.mutate({ planId })}
        loading={subscriptionMutation.isPending}
        disabled={disableSubscribe || subscriptionMutation.isPending}
      >
        {disableSubscribe ? '请先登录后订阅' : '立即订阅'}
      </Button>
    </ScrollView>
  );
}

function cycleText(cycle: string) {
  switch (cycle) {
    case 'weekly':
      return '每周定投';
    case 'biweekly':
      return '隔周配送';
    case 'monthly':
      return '每月精选';
    case 'seasonal':
    default:
      return '当季限定';
  }
}

function weekdayText(day: number) {
  const mapping = ['日', '一', '二', '三', '四', '五', '六'];
  return mapping[day] ?? '日';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9f6',
  },
  content: {
    paddingBottom: 40,
  },
  cover: {
    width: '100%',
    height: 240,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c5e1a5',
  },
  placeholderText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  headerBox: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1b5e20',
  },
  subtitle: {
    marginTop: 8,
    color: '#546e7a',
  },
  price: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '700',
    color: '#d32f2f',
  },
  originPrice: {
    marginTop: 4,
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#f1f8e9',
  },
  benefitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  benefitChip: {
    backgroundColor: '#e8f5e9',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2f3d2b',
    marginBottom: 12,
  },
  sectionText: {
    color: '#455a64',
    lineHeight: 22,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dce0d9',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f3d2b',
  },
  itemMeta: {
    marginTop: 4,
    color: '#607d8b',
  },
  subscribeButton: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 6,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9f6',
  },
  hintText: {
    marginTop: 12,
    color: '#607d8b',
  },
  errorText: {
    color: '#d32f2f',
  },
});
