export type OrderDeliveryMethod = "home" | "pickup";
export type OrderPaymentMethod = "online" | "cod";

export type OrderItemPayload = {
  id: string;
  category: string;
  subCategory: string;
  name: string;
  selectedVariant: string;
  finalPrice: number;
  quantity: number;
};

export type CreateOrderPayload = {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress?: string;
  pickupStoreCode?: string;
  pickupStoreName?: string;
  pickupStoreAddress?: string;
  note?: string;
  deliveryMethod: OrderDeliveryMethod;
  paymentMethod: OrderPaymentMethod;
  shippingFee: number;
  codFee: number;
  items: OrderItemPayload[];
};

export type CreateOrderResponse = {
  message: string;
  orderId: string;
  orderNumber: string;
};

export type EcpayCheckoutResponse = {
  action: string;
  method: "POST";
  fields: Record<string, string>;
};

export type SimulateEcpayPaidResponse = {
  message: string;
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
};

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUND_PROCESSING"
  | "REFUNDED";

export type PaymentStatus =
  | "UNPAID"
  | "PAID"
  | "FAILED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type OrderHistoryItem = {
  id: string;
  itemName: string;
  itemCategory: string;
  itemSubCategory: string;
  variant: string;
  unitPrice: number;
  quantity: number;
  refundedQuantity: number;
  lineTotal: number;
};

export type OrderHistoryEntry = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: "ECPAY" | null;
  deliveryMethod: string;
  paymentMethod: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string | null;
  pickupStoreCode: string | null;
  pickupStoreName: string | null;
  pickupStoreAddress: string | null;
  note: string | null;
  subtotal: number;
  refundedAmount: number;
  refundReason: string | null;
  refundedAt: string | null;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  paidAt: string | null;
  createdAt: string;
  items: OrderHistoryItem[];
};

export type OrderHistoryResponse = {
  orders: OrderHistoryEntry[];
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
};

export type UpdateOrderStatusResponse = {
  message: string;
  orderId: string;
  status: OrderStatus;
};

export type RefundRequestMode = "FULL" | "PARTIAL";

export type RefundOrderItemPayload = {
  orderItemId: string;
  quantity: number;
};

export type RefundOrderPayload = {
  mode: RefundRequestMode;
  reason?: string;
  items?: RefundOrderItemPayload[];
};

export type RefundOrderResponse = {
  message: string;
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  refundedAmount: number;
};

export type AdminProductStatsPreset =
  | "today"
  | "this-month"
  | "last-month"
  | "custom";

export type AdminProductStatPoint = {
  productKey: string;
  productName: string;
  category: string;
  subCategory: string;
  variant: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
};

export type AdminProductStatsResponse = {
  range: {
    preset: AdminProductStatsPreset;
    label: string;
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  topProducts: AdminProductStatPoint[];
};
