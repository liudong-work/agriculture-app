export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'after-sale';

export type OrderStatusHistoryEntry = {
  status: OrderStatus;
  note?: string;
  timestamp: string;
};

export type PaymentMethod = 'wechat' | 'alipay' | 'cash-on-delivery';

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  thumbnail: string;
  unit: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type LogisticsCheckpoint = {
  status: string;
  description?: string;
  location?: string;
  timestamp: string;
};

export type OrderLogistics = {
  carrier: string;
  trackingNumber: string;
  contactPhone?: string;
  updatedAt: string;
  checkpoints: LogisticsCheckpoint[];
};

export type CancellationInfo = {
  reason: string;
  cancelledAt: string;
};

export type AfterSaleType = 'refund' | 'return-refund' | 'exchange';
export type AfterSaleStatus = 'applied' | 'processing' | 'resolved' | 'rejected';

export type AfterSaleRefundInfo = {
  amount: number;
  method: 'original' | 'wallet' | 'bank';
  completedAt?: string;
  referenceId?: string;
};

export type AfterSaleInfo = {
  type: AfterSaleType;
  reason: string;
  description?: string;
  attachments?: string[];
  status: AfterSaleStatus;
  appliedAt: string;
  updatedAt: string;
  resolutionNote?: string;
  refund?: AfterSaleRefundInfo;
};

export type Order = {
  id: string;
  userId: string;
  farmerId: string;
  status: OrderStatus;
  createdAt: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  contactName: string;
  contactPhone: string;
  address: string;
  note?: string;
  paymentMethod: PaymentMethod;
  statusHistory: OrderStatusHistoryEntry[];
  logistics?: OrderLogistics;
  cancellation?: CancellationInfo;
  afterSale?: AfterSaleInfo;
};

export type OrderListParams = {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
};

export type OrderListResult = {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
};


