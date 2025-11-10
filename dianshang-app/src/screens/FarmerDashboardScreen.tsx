import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Button, Card, Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '../navigation/AppNavigator';

export default function FarmerDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const theme = useTheme();

  const quickEntries = [
    {
      id: 'products',
      title: '商品管理',
      subtitle: '当前在售商品',
      metric: '12',
      metricUnit: '个',
      icon: 'sprout',
      color: '#2e7d32',
      onPress: () => navigation.navigate('FarmerProductList'),
    },
    {
      id: 'orders',
      title: '订单管理',
      subtitle: '待处理订单',
      metric: '5',
      metricUnit: '单',
      icon: 'clipboard-list',
      color: '#1976d2',
      onPress: () => navigation.navigate('FarmerOrderList'),
    },
    {
      id: 'story',
      title: '农户故事',
      subtitle: '编辑溯源档案',
      metric: '更新',
      metricUnit: '',
      icon: 'book-open-page-variant',
      color: '#8e24aa',
      onPress: () => navigation.navigate('FarmerStoryEditor'),
    },
    {
      id: 'subscription',
      title: '订阅计划',
      subtitle: '固定配额箱',
      metric: '1',
      metricUnit: '个',
      icon: 'cube-outline',
      color: '#00796b',
      onPress: () => navigation.navigate('FarmerSubscriptionManager'),
    },
  ] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="leaf" size={22} color="#ffffff" />
            <Text style={styles.heroBadgeText}>农户中心</Text>
          </View>
          <Text variant="titleLarge" style={styles.heroTitle}>
            农户工作台
          </Text>
          <Text style={styles.heroText}>
            快速处理商品、订单与售后，助你把控自营业务。
          </Text>
          <Button
            mode="contained"
            icon="plus-circle"
            style={styles.heroAction}
            onPress={() => navigation.navigate('FarmerProductCreate')}
          >
            发布新品
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.gridSection}>
        {quickEntries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.gridCard, { backgroundColor: entry.color }]}
            activeOpacity={0.85}
            onPress={entry.onPress}
          >
            <View style={styles.gridIconWrapper}>
              <MaterialCommunityIcons name={entry.icon as any} size={28} color="#ffffff" />
            </View>
            <Text style={styles.gridTitle}>{entry.title}</Text>
            <Text style={styles.gridSubtitle}>{entry.subtitle}</Text>
            <View style={styles.gridMetricRow}>
              <Text style={styles.gridMetric}>{entry.metric}</Text>
              <Text style={styles.gridMetricUnit}>{entry.metricUnit}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Surface style={styles.noticeCard} elevation={1}>
        <Text style={styles.noticeTitle}>运营提醒</Text>
        <Text style={styles.noticeText}>
          当前项目为自营模式示例，只有官方农户账号可以访问此工作台。后续可以扩展农户入驻、审核与结算流程。
        </Text>
        <Button mode="outlined" textColor={theme.colors.primary} onPress={() => console.log('TODO: 联系运营')}>
          联系运营支持
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2e7d32',
  },
  heroText: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginTop: 8,
  },
  heroContent: {
    gap: 12,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  heroTitle: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroAction: {
    alignSelf: 'flex-start',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  gridSection: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  gridCard: {
    flexBasis: '48%',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  gridIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridTitle: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  gridSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  gridMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
  },
  gridMetric: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  gridMetricUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  noticeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  noticeTitle: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  noticeText: {
    color: '#555',
    lineHeight: 20,
  },
});
