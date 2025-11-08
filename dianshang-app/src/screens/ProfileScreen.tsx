import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Card, List, Surface, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { mockQuickAccess, mockUserProfile } from '../utils/mockData';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user, logout } = useAuthStore();

  const profile = user
    ? {
        name: user.name ?? '未命名用户',
        phone: user.phone,
        role: user.role,
        level: user.role === 'farmer' ? '农户伙伴' : '标准会员',
        avatar: mockUserProfile.avatar,
        coupons: mockUserProfile.coupons,
        points: mockUserProfile.points,
        pendingAfterSale: mockUserProfile.pendingAfterSale,
      }
    : {
        ...mockUserProfile,
        role: 'customer' as const,
      };

  const handleNavigateAddress = () => {
    navigation.navigate('AddressList');
  };

  const handleNavigateFarmer = () => {
    navigation.navigate('FarmerDashboard');
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账户吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出登录',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('提示', '退出登录失败，请稍后重试');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.userCard} elevation={2}>
        <View style={styles.userInfoRow}>
          <Avatar.Image source={{ uri: profile.avatar }} size={64} />
          <View style={styles.userInfoText}>
            <Text variant="titleMedium">{profile.name}</Text>
            <Text variant="bodySmall" style={styles.muted}>
              {profile.phone} · {profile.level}
            </Text>
          </View>
          <Button mode="contained" onPress={handleNavigateFarmer}>
            农户工作台
          </Button>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text variant="titleLarge">{profile.coupons}</Text>
            <Text style={styles.muted}>优惠券</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="titleLarge">{profile.points}</Text>
            <Text style={styles.muted}>积分</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="titleLarge">{profile.pendingAfterSale}</Text>
            <Text style={styles.muted}>售后中</Text>
          </View>
        </View>
      </Surface>

      <Card style={styles.quickAccessCard}>
        <Card.Title title="常用功能" titleVariant="titleMedium" />
        <Card.Content>
          <View style={styles.quickGrid}>
            {mockQuickAccess.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.quickItem}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.route === 'Address') {
                    handleNavigateAddress();
                  } else {
                    console.log('常用功能：', item.route);
                  }
                }}
              >
                <Avatar.Icon size={48} icon={item.icon as any} style={styles.quickIcon} color="#2e7d32" />
                <Text style={styles.quickLabel}>{item.label}</Text>
                {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>

      <List.Section style={styles.section}>
        <List.Subheader>订单与服务</List.Subheader>
        <List.Item
          title="我的地址"
          left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleNavigateAddress}
        />
        <List.Item
          title="售后与退款"
          left={(props) => <List.Icon {...props} icon="clipboard-alert-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => console.log('售后入口')}
        />
        <List.Item
          title="发票管理"
          left={(props) => <List.Icon {...props} icon="file-document-edit-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => console.log('发票管理')}
        />
      </List.Section>

      <List.Section style={styles.section}>
        <List.Subheader>设置与支持</List.Subheader>
        <List.Item
          title="账号安全"
          left={(props) => <List.Icon {...props} icon="shield-check-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => console.log('账号安全')}
        />
        <List.Item
          title="通知设置"
          left={(props) => <List.Icon {...props} icon="bell-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => console.log('通知设置')}
        />
        <List.Item
          title="意见反馈"
          left={(props) => <List.Icon {...props} icon="message-processing-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => console.log('意见反馈')}
        />
        <List.Item
          title="关于应用"
          left={(props) => <List.Icon {...props} icon="information-outline" />}
          right={(props) => <Text style={styles.version}>v1.0.0</Text>}
          onPress={() => console.log('关于应用')}
        />
        <List.Item
          title="退出登录"
          left={(props) => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  content: {
    paddingBottom: 32,
  },
  userCard: {
    margin: 16,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#fff',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfoText: {
    flex: 1,
    gap: 4,
  },
  muted: {
    color: '#777',
  },
  statRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e0e0e0',
  },
  quickAccessCard: {
    marginHorizontal: 16,
    borderRadius: 20,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  quickIcon: {
    backgroundColor: '#e8f5e9',
  },
  quickLabel: {
    marginTop: 8,
    color: '#333',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 32,
    backgroundColor: '#d84315',
    color: '#fff',
    paddingHorizontal: 6,
    borderRadius: 12,
    fontSize: 12,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
  },
  version: {
    color: '#777',
    marginRight: 12,
  },
});

