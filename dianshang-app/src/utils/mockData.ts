import type { ActivityBanner, ActivityCard, Product, ProductCategory } from '../types/product';
import type { Order } from '../types/order';
import type { QuickAccessItem, UserProfile } from '../types/user';

export const mockBanners: ActivityBanner[] = [
  {
    id: 'banner-1',
    title: '秋季特色农品上新',
    subtitle: '精选产地直供，限时 8 折起',
    image:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=60',
    link: '/activity/autumn',
  },
  {
    id: 'banner-2',
    title: '有机蔬菜套餐',
    subtitle: '每日采摘，新鲜到家',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=60',
    link: '/activity/organic',
  },
];

export const mockCategories: ProductCategory[] = [
  { id: 'cat-1', name: '新鲜水果', icon: 'fruit-watermelon' },
  { id: 'cat-2', name: '叶菜根茎', icon: 'food-apple' },
  { id: 'cat-3', name: '粮油副食', icon: 'rice' },
  { id: 'cat-4', name: '肉禽蛋类', icon: 'food-drumstick' },
  { id: 'cat-5', name: '海鲜水产', icon: 'fish' },
  { id: 'cat-6', name: '南北干货', icon: 'basket-outline' },
  { id: 'cat-7', name: '蜂蜜茶饮', icon: 'cup-water' },
  { id: 'cat-8', name: '有机专区', icon: 'sprout-outline' },
];

export const mockActivityCards: ActivityCard[] = [
  {
    id: 'act-1',
    title: '产地直发 · 现摘水果',
    description: '荔枝、梨、葡萄新鲜采摘，48 小时内送达。',
    image:
      'https://images.unsplash.com/photo-1596612557832-3aa1d3d9f7c5?auto=format&fit=crop&w=1200&q=60',
    badge: '限时优惠',
    link: '/activity/fresh-fruit',
  },
  {
    id: 'act-2',
    title: '绿色有机蔬菜套餐',
    description: '农户直供，每周更新，满足家庭所需。',
    image:
      'https://images.unsplash.com/photo-1489447068241-b3490214e879?auto=format&fit=crop&w=1200&q=60',
    badge: '订阅特惠',
    link: '/activity/organic-set',
  },
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: '赣南脐橙 5kg 装',
    description: '从赣南果园直采，汁多味甜，富含维 C。',
    images: [
      'https://images.unsplash.com/photo-1615485290382-aca3bd1ccae1?auto=format&fit=crop&w=800&q=60',
    ],
    price: 69.9,
    originalPrice: 89.9,
    unit: '箱',
    origin: '江西赣州',
    categoryId: 'cat-1',
    seasonalTag: '当季热卖',
    rating: 4.9,
    reviewCount: 1287,
  },
  {
    id: 'prod-2',
    name: '崂山有机芹菜 1.5kg',
    description: '通过有机认证，全程冷链配送。',
    images: [
      'https://images.unsplash.com/photo-1543248939-d74ff3d9d1b6?auto=format&fit=crop&w=800&q=60',
    ],
    price: 32.5,
    unit: '份',
    origin: '山东青岛',
    categoryId: 'cat-2',
    isOrganic: true,
    rating: 4.7,
    reviewCount: 342,
  },
  {
    id: 'prod-3',
    name: '五常稻花香大米 5kg',
    description: '冷水浸种，稻花香 2 号，米香软糯。',
    images: [
      'https://images.unsplash.com/photo-1472145246862-b24cf25c4a36?auto=format&fit=crop&w=800&q=60',
    ],
    price: 109.0,
    unit: '袋',
    origin: '黑龙江五常',
    categoryId: 'cat-3',
    rating: 4.8,
    reviewCount: 876,
  },
  {
    id: 'prod-4',
    name: '散养土鸡蛋 30 枚',
    description: '农户散养，蛋香浓郁，营养丰富。',
    images: [
      'https://images.unsplash.com/photo-1517959105821-eaf2591984d5?auto=format&fit=crop&w=800&q=60',
    ],
    price: 52.9,
    unit: '盒',
    origin: '安徽黄山',
    categoryId: 'cat-4',
    rating: 4.6,
    reviewCount: 423,
  },
];

export const mockOrders: Order[] = [
  {
    id: 'order-20241105001',
    farmerId: 'farmer-self-operated',
    status: 'pending',
    createdAt: '2024-11-05 10:12',
    subtotal: 134.9,
    discount: 10,
    deliveryFee: 8,
    total: 132.9,
    items: [
      {
        id: 'order-item-1',
        productId: mockProducts[0].id,
        name: mockProducts[0].name,
        thumbnail: mockProducts[0].images[0],
        unit: mockProducts[0].unit,
        price: 69.9,
        quantity: 1,
        subtotal: 69.9,
      },
      {
        id: 'order-item-2',
        productId: mockProducts[1].id,
        name: mockProducts[1].name,
        thumbnail: mockProducts[1].images[0],
        unit: mockProducts[1].unit,
        price: 32.5,
        quantity: 2,
        subtotal: 65.0,
      },
    ],
    contactName: '李先生',
    contactPhone: '13812345120',
    address: '上海市浦东新区世博大道 1000 号',
    paymentMethod: 'wechat',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2024-11-05 10:12:00',
        note: '订单已创建',
      },
    ],
  },
  {
    id: 'order-20241102021',
    farmerId: 'farmer-self-operated',
    status: 'processing',
    createdAt: '2024-11-02 15:43',
    subtotal: 109.0,
    discount: 0,
    deliveryFee: 8,
    total: 117.0,
    items: [
      {
        id: 'order-item-3',
        productId: mockProducts[2].id,
        name: mockProducts[2].name,
        thumbnail: mockProducts[2].images[0],
        unit: mockProducts[2].unit,
        price: 109.0,
        quantity: 1,
        subtotal: 109.0,
      },
    ],
    contactName: '王女士',
    contactPhone: '13987654321',
    address: '北京市朝阳区建国路 88 号 A 座',
    paymentMethod: 'alipay',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2024-11-02 15:43:00',
        note: '订单已创建',
      },
      {
        status: 'processing',
        timestamp: '2024-11-02 15:46:00',
        note: '用户已支付，等待发货',
      },
    ],
  },
  {
    id: 'order-20241028005',
    farmerId: 'farmer-self-operated',
    status: 'shipped',
    createdAt: '2024-10-28 08:21',
    subtotal: 52.9,
    discount: 0,
    deliveryFee: 8,
    total: 60.9,
    items: [
      {
        id: 'order-item-4',
        productId: mockProducts[3].id,
        name: mockProducts[3].name,
        thumbnail: mockProducts[3].images[0],
        unit: mockProducts[3].unit,
        price: 52.9,
        quantity: 1,
        subtotal: 52.9,
      },
    ],
    contactName: '周先生',
    contactPhone: '13755556666',
    address: '杭州市西湖区紫霞街 168 号',
    paymentMethod: 'cash-on-delivery',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2024-10-28 08:21:00',
        note: '订单已创建',
      },
      {
        status: 'processing',
        timestamp: '2024-10-28 08:22:00',
        note: '商家已接单',
      },
      {
        status: 'shipped',
        timestamp: '2024-10-29 09:30:00',
        note: '包裹正在派送中',
      },
    ],
    logistics: {
      carrier: '顺丰速运',
      trackingNumber: 'SF123456789CN',
      contactPhone: '95338',
      updatedAt: '2024-10-29 12:30:00',
      checkpoints: [
        {
          status: '包裹已揽收',
          timestamp: '2024-10-28 12:30:00',
          location: '杭州市',
        },
        {
          status: '包裹已发出',
          timestamp: '2024-10-28 21:45:00',
          location: '杭州市转运中心',
        },
        {
          status: '运输中',
          timestamp: '2024-10-29 06:15:00',
          location: '上海市分拨中心',
        },
      ],
    },
  },
  {
    id: 'order-20241020110',
    farmerId: 'farmer-self-operated',
    status: 'completed',
    createdAt: '2024-10-20 12:05',
    subtotal: 69.9,
    discount: 0,
    deliveryFee: 8,
    total: 77.9,
    items: [
      {
        id: 'order-item-5',
        productId: mockProducts[0].id,
        name: mockProducts[0].name,
        thumbnail: mockProducts[0].images[0],
        unit: mockProducts[0].unit,
        price: 69.9,
        quantity: 1,
        subtotal: 69.9,
      },
    ],
    contactName: '赵女士',
    contactPhone: '13623456789',
    address: '深圳市南山区科技园南区 88 号',
    paymentMethod: 'wechat',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2024-10-20 12:05:00',
        note: '订单已创建',
      },
      {
        status: 'processing',
        timestamp: '2024-10-20 12:06:00',
        note: '用户已支付',
      },
      {
        status: 'shipped',
        timestamp: '2024-10-20 18:15:00',
        note: '包裹已发出',
      },
      {
        status: 'completed',
        timestamp: '2024-10-22 09:40:00',
        note: '用户确认收货',
      },
      {
        status: 'after-sale',
        timestamp: '2024-10-23 14:10:00',
        note: '申请售后：商品存在破损',
      },
      {
        status: 'after-sale',
        timestamp: '2024-10-24 09:25:00',
        note: '售后完成：已退款',
      },
    ],
    afterSale: {
      type: 'refund',
      reason: '收到商品存在破损',
      description: '包装破损导致商品受潮，申请退款',
      attachments: ['https://img.example.com/after-sale/evidence1.jpg'],
      status: 'resolved',
      appliedAt: '2024-10-23 14:10:00',
      updatedAt: '2024-10-24 09:25:00',
      resolutionNote: '客服已审核通过，完成退款',
      refund: {
        amount: 69.9,
        method: 'original',
        completedAt: '2024-10-24 09:20:00',
        referenceId: 'REF20241024001',
      },
    },
  },
];

export const mockUserProfile: UserProfile = {
  id: 'user-1001',
  name: '李先生',
  avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=60',
  phone: '138****5120',
  level: '臻选会员',
  points: 1280,
  coupons: 4,
  pendingAfterSale: 1,
};

export const mockQuickAccess: QuickAccessItem[] = [
  { id: 'qa-1', icon: 'ticket-confirmation-outline', label: '优惠券', route: 'Coupon', badge: 4 },
  { id: 'qa-2', icon: 'star-outline', label: '收藏夹', route: 'Favorite' },
  { id: 'qa-3', icon: 'map-marker-outline', label: '收货地址', route: 'Address' },
  { id: 'qa-4', icon: 'gift-outline', label: '积分商城', route: 'Points' },
  { id: 'qa-5', icon: 'headset', label: '在线客服', route: 'Support' },
  { id: 'qa-6', icon: 'history', label: '浏览记录', route: 'History' },
];

