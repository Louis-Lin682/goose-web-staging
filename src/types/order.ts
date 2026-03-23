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
  | "CANCELLED";

export type OrderHistoryItem = {
  id: string;
  itemName: string;
  itemCategory: string;
  itemSubCategory: string;
  variant: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderHistoryEntry = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PAID" | "FAILED";
  paymentProvider: "ECPAY" | null;
  deliveryMethod: string;
  paymentMethod: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string | null;
  note: string | null;
  subtotal: number;
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
