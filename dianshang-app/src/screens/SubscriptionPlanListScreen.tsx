import React from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import type { HomeStackParamList } from '../navigation/AppNavigator';
import { fetchSubscriptionPlans } from '../services/subscription.api';
import type { SubscriptionPlan } from '../types/subscription';

function PlanCard({ plan, onPress }: { plan: SubscriptionPlan; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {plan.coverImage ? (
        <Image source={{ uri: plan.coverImage }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.placeholderText}>订阅鲜箱</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{plan.title}</Text>
          <Chip compact style={styles.cycleChip}>
            {cycleText(plan.cycle)}
          </Chip>
        </View>
        {plan.subtitle && <Text style={styles.subtitle}>{plan.subtitle}</Text>}
        <Text style={styles.price}>
          ￥{plan.price.toFixed(2)} <Text style={styles.priceUnit}>/次</Text>
        </Text>
        <View style={styles.benefitRow}>
          {plan.benefits.slice(0, 2).map((benefit) => (
            <Chip key={benefit} compact style={styles.benefitChip}>
              {benefit}
            </Chip>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function cycleText(cycle: SubscriptionPlan['cycle']) {
  switch (cycle) {
    case 'weekly':
      return '每周';
    case 'biweekly':
      return '隔周';
    case 'monthly':
      return '每月';
    case 'seasonal':
    default:
      return '当季';
  }
}

export default function SubscriptionPlanListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  });

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator />
        <Text style={styles.hintText}>正在加载订阅箱...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>获取订阅箱信息失败，请稍后再试。</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>订阅箱</Text>
        <Text style={styles.headerSub}>锁定产区产能，定期送达当季好味</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            onPress={() => navigation.navigate('SubscriptionPlanDetail', { planId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9f6',
  },
  headerBox: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#2e7d32',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    marginTop: 8,
    color: '#e8f5e9',
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cover: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c5e1a5',
  },
  placeholderText: {
    color: '#33691e',
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2f3d2b',
    flex: 1,
    marginRight: 12,
  },
  subtitle: {
    marginTop: 6,
    color: '#546e7a',
  },
  price: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#d32f2f',
  },
  priceUnit: {
    fontSize: 12,
    color: '#d32f2f',
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  benefitChip: {
    backgroundColor: '#f1f8e9',
  },
  cycleChip: {
    backgroundColor: '#f1f8e9',
    borderRadius: 12,
  },
  separator: {
    height: 24,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
