import React from 'react';
import { ColorValue } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NavigatorScreenParams } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CategoryScreen from '../screens/CategoryScreen';
import CartScreen from '../screens/CartScreen';
import OrderScreen from '../screens/OrderScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FarmerDashboardScreen from '../screens/FarmerDashboardScreen';
import AddressListScreen from '../screens/AddressListScreen';
import AddressFormScreen from '../screens/AddressFormScreen';
import FarmerProductCreateScreen from '../screens/FarmerProductCreateScreen';
import FarmerProductListScreen from '../screens/FarmerProductListScreen';
import FarmerOrderListScreen from '../screens/FarmerOrderListScreen';
import FarmerOrderDetailScreen from '../screens/FarmerOrderDetailScreen';

export type RootTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  CategoryStack: NavigatorScreenParams<CategoryStackParamList>;
  CartStack: NavigatorScreenParams<CartStackParamList>;
  OrderStack: NavigatorScreenParams<OrderStackParamList>;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
};

export type CategoryStackParamList = {
  Category: undefined;
  ProductDetail: { productId: string };
};

export type CartStackParamList = {
  Cart: undefined;
};

export type OrderStackParamList = {
  Order: undefined;
  OrderDetail: { orderId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  FarmerDashboard: undefined;
  FarmerProductList: undefined;
  FarmerProductCreate: { productId?: string } | undefined;
  FarmerOrderList: undefined;
  FarmerOrderDetail: { orderId: string };
  AddressList: undefined;
  AddressForm: { mode: 'create' } | { mode: 'edit'; address: import('../types/address').Address };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CategoryStack = createNativeStackNavigator<CategoryStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const OrderStack = createNativeStackNavigator<OrderStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '首页推荐' }}
      />
      <HomeStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: '商品详情' }}
      />
    </HomeStack.Navigator>
  );
}

function CategoryStackNavigator() {
  return (
    <CategoryStack.Navigator>
      <CategoryStack.Screen
        name="Category"
        component={CategoryScreen}
        options={{ title: '农产品分类' }}
      />
      <CategoryStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: '商品详情' }}
      />
    </CategoryStack.Navigator>
  );
}

function CartStackNavigator() {
  return (
    <CartStack.Navigator>
      <CartStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: '购物车' }}
      />
    </CartStack.Navigator>
  );
}

function OrderStackNavigator() {
  return (
    <OrderStack.Navigator>
      <OrderStack.Screen
        name="Order"
        component={OrderScreen}
        options={{ title: '我的订单' }}
      />
      <OrderStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: '订单详情' }}
      />
    </OrderStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: '个人中心' }}
      />
      <ProfileStack.Screen
        name="FarmerDashboard"
        component={FarmerDashboardScreen}
        options={{ title: '农户工作台' }}
      />
      <ProfileStack.Screen
        name="FarmerProductList"
        component={FarmerProductListScreen}
        options={{ title: '商品管理' }}
      />
      <ProfileStack.Screen
        name="FarmerProductCreate"
        component={FarmerProductCreateScreen}
        options={({ route }) => ({
          title: route.params?.productId ? '编辑商品' : '新增商品',
        })}
      />
      <ProfileStack.Screen
        name="FarmerOrderList"
        component={FarmerOrderListScreen}
        options={{ title: '订单管理' }}
      />
      <ProfileStack.Screen
        name="FarmerOrderDetail"
        component={FarmerOrderDetailScreen}
        options={{ title: '订单详情' }}
      />
      <ProfileStack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{ title: '我的地址' }}
      />
      <ProfileStack.Screen
        name="AddressForm"
        component={AddressFormScreen}
        options={({ route }) => ({
          title: route.params.mode === 'edit' ? '编辑地址' : '新增地址',
        })}
      />
    </ProfileStack.Navigator>
  );
}

type TabIconProps = {
  color: ColorValue;
  size: number;
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CategoryStack"
        component={CategoryStackNavigator}
        options={{
          title: '分类',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialCommunityIcons name="grid" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CartStack"
        component={CartStackNavigator}
        options={{
          title: '购物车',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialCommunityIcons name="cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="OrderStack"
        component={OrderStackNavigator}
        options={{
          title: '订单',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialCommunityIcons name="clipboard-text" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

