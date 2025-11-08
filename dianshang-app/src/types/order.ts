export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'after-sale';

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

export type OrderSummary = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
};

export type OrderStatusHistoryEntry = {
  status: OrderStatus;
  timestamp: string;
  note?: string;
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

export type Order = OrderSummary & {
  id: string;
  farmerId: string;
  status: OrderStatus;
  createdAt: string;
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

export type OrderListResponse = {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
};

