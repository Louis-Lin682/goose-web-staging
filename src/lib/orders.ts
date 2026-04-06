import { apiRequest } from "./api";
import type {
  AdminProductStatsPreset,
  AdminProductStatsResponse,
  CreateOrderPayload,
  CreateOrderResponse,
  EcpayCheckoutResponse,
  OrderHistoryResponse,
  RefundOrderPayload,
  RefundOrderResponse,
  SimulateEcpayPaidResponse,
  UpdateOrderStatusPayload,
  UpdateOrderStatusResponse,
} from "../types/order";

export type PendingPaymentSnapshot = {
  orderId: string;
  orderNumber: string;
};

const PENDING_PAYMENT_STORAGE_KEY = "goose_pending_payment";

export const createOrder = async (
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> => {
  return apiRequest<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const createEcpayCheckout = async (
  orderId: string,
): Promise<EcpayCheckoutResponse> => {
  return apiRequest<EcpayCheckoutResponse>("/payments/ecpay/checkout", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
};

export const simulateEcpayPaid = async (
  orderId: string,
): Promise<SimulateEcpayPaidResponse> => {
  return apiRequest<SimulateEcpayPaidResponse>("/payments/ecpay/dev-simulate-paid", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
};

export const savePendingPayment = (snapshot: PendingPaymentSnapshot) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(snapshot));
};

export const getPendingPayment = (): PendingPaymentSnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingPaymentSnapshot;

    if (!parsed.orderId || !parsed.orderNumber) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const clearPendingPayment = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
};

export const getOrderHistory = async (): Promise<OrderHistoryResponse> => {
  return apiRequest<OrderHistoryResponse>("/orders");
};

export const getOrderByIdFromHistory = async (orderId: string) => {
  const response = await getOrderHistory();
  return response.orders.find((order) => order.id === orderId) ?? null;
};

export const getAdminOrders = async (): Promise<OrderHistoryResponse> => {
  return apiRequest<OrderHistoryResponse>("/admin/orders");
};

export const getAdminProductStats = async (params: {
  preset: AdminProductStatsPreset;
  startDate?: string;
  endDate?: string;
}): Promise<AdminProductStatsResponse> => {
  const searchParams = new URLSearchParams({
    preset: params.preset,
  });

  if (params.startDate) {
    searchParams.set("startDate", params.startDate);
  }

  if (params.endDate) {
    searchParams.set("endDate", params.endDate);
  }

  return apiRequest<AdminProductStatsResponse>(
    `/admin/orders/product-stats?${searchParams.toString()}`,
  );
};

export const updateOrderStatus = async (
  orderId: string,
  payload: UpdateOrderStatusPayload,
): Promise<UpdateOrderStatusResponse> => {
  return apiRequest<UpdateOrderStatusResponse>(`/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const refundAdminOrder = async (
  orderId: string,
  payload: RefundOrderPayload,
): Promise<RefundOrderResponse> => {
  return apiRequest<RefundOrderResponse>(`/admin/orders/${orderId}/refund`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
