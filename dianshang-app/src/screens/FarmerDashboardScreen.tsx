import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, List, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '../navigation/AppNavigator';

export default function FarmerDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.heroCard}>
        <Card.Title title="农户工作台" titleVariant="titleLarge" subtitle="当前仅开放基础功能" />
        <Card.Content>
          <Text style={styles.heroText}>
            在这里可以管理商品、处理订单与售后。后续会接入更多生产工具和数据分析能力。
          </Text>
        </Card.Content>
      </Card>

      <List.Section>
        <List.Subheader>快速入口</List.Subheader>
        <List.Item
          title="商品管理"
          description="查看与编辑商品、调整库存和上下架状态"
          left={(props) => <List.Icon {...props} icon="sprout-outline" />}
          onPress={() => navigation.navigate('FarmerProductList')}
        />
        <List.Item
          title="新增商品"
          description="快速上架新商品，支持多图与状态设置"
          left={(props) => <List.Icon {...props} icon="plus-circle-outline" />}
          onPress={() => navigation.navigate('FarmerProductCreate')}
        />
        <List.Item
          title="订单履约"
          description="确认订单、填写物流信息、处理售后"
          left={(props) => <List.Icon {...props} icon="truck-delivery-outline" />}
          onPress={() => navigation.navigate('FarmerOrderList')}
        />
        <List.Item
          title="售后处理"
          description="及时响应消费者的售后申请"
          left={(props) => <List.Icon {...props} icon="handshake-outline" />}
          onPress={() => console.log('TODO: 售后处理')}
        />
      </List.Section>

      <View style={styles.sectionFooter}>
        <Text style={styles.tipTitle}>提示</Text>
        <Text style={styles.tipText}>
          当前项目为自营模式示例，只有官方农户账号可以访问此工作台。后续可以扩展农户入驻与审核流程。
        </Text>
        <Button mode="outlined" onPress={() => console.log('TODO: 联系运营')}>联系运营支持</Button>
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
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    borderRadius: 16,
  },
  heroText: {
    color: '#4a6a49',
    lineHeight: 20,
  },
  sectionFooter: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  tipTitle: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  tipText: {
    color: '#555',
    lineHeight: 20,
  },
});
