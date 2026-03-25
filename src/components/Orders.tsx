import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getOrderHistory } from "../lib/orders";
import type { OrderHistoryEntry, OrderStatus } from "../types/order";

const REFRESH_INTERVAL_MS = 30 * 1000;

const formatCurrency = (value: number) => `$${value}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "待確認",
  PAID: "已付款待處理",
  PROCESSING: "處理中",
  SHIPPED: "已出貨",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const paymentStatusLabels: Record<"UNPAID" | "PAID" | "FAILED", string> = {
  UNPAID: "未付款",
  PAID: "已付款",
  FAILED: "付款失敗",
};

const deliveryLabels: Record<string, string> = {
  home: "宅配到府",
  pickup: "黑貓店取",
};

const paymentLabels: Record<string, string> = {
  online: "線上付款",
  cod: "貨到付款",
};

const variantLabels: Record<string, string> = {
  single: "單一規格",
  small: "小",
  large: "大",
};

const orderStatusBadgeStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-sky-100 text-sky-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

const paymentStatusBadgeStyles: Record<"UNPAID" | "PAID" | "FAILED", string> = {
  UNPAID: "bg-zinc-100 text-zinc-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

export const Orders = () => {
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      setOrders([]);
      setExpandedOrderId(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const hydrateOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getOrderHistory();

        if (!isMounted) {
          return;
        }

        setOrders(response.orders);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "訂單資料載入失敗，請稍後再試一次。",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydrateOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isAuthenticated]);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) {
      return;
    }

    let isMounted = true;
    let intervalId: number | null = null;

    const refreshOrders = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        const response = await getOrderHistory();

        if (!isMounted) {
          return;
        }

        setOrders(response.orders);
      } catch {
        if (!isMounted) {
          return;
        }
      }
    };

    const startPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      intervalId = window.setInterval(() => {
        void refreshOrders();
      }, REFRESH_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshOrders();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthReady, isAuthenticated]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId((currentId) => (currentId === orderId ? null : orderId));
  };

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">正在確認登入狀態...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Orders
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            請先登入查看訂單
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            登入後就能查看所有歷史訂單與目前付款、配送進度。
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/"
              className="inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              返回首頁
            </Link>
            <Link
              to="/store"
              className="inline-flex rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              查看門市資訊
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 border-b border-zinc-100 pb-8">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Orders
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            訂單查詢
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
            {user?.name
              ? `${user.name}，這裡會顯示你的訂單進度與付款狀態。`
              : "這裡會顯示你的訂單進度與付款狀態。"}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center text-sm text-zinc-500">
            訂單資料載入中...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 px-8 py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
            <p className="text-2xl font-bold text-zinc-900">目前還沒有訂單</p>
            <p className="mt-3 text-sm text-zinc-500">
              先到產品列表挑選商品，完成結帳後就能在這裡查看最新訂單。
            </p>
            <Link
              to="/fullMenu"
              className="mt-8 inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              前往產品列表
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-sm"
                >
                  <div
                    className="cursor-pointer px-5 py-5 md:px-6"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleOrder(order.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleOrder(order.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 md:hidden">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                          {order.orderNumber}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${orderStatusBadgeStyles[order.status]}`}
                          >
                            {orderStatusLabels[order.status]}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentStatusBadgeStyles[order.paymentStatus]}`}
                          >
                            {paymentStatusLabels[order.paymentStatus]}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-zinc-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition-colors hover:border-orange-300 hover:text-orange-600">
                        <ChevronDown
                          className={`h-5 w-5 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    <div className="hidden items-start justify-between gap-6 md:flex">
                      <div className="grid flex-1 gap-5 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr]">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                            訂單編號
                          </p>
                          <p className="mt-2 text-lg font-black text-zinc-900">
                            {order.orderNumber}
                          </p>
                          <p className="mt-2 text-sm text-zinc-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                            訂單狀態
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${orderStatusBadgeStyles[order.status]}`}
                            >
                              {orderStatusLabels[order.status]}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                            付款狀態
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentStatusBadgeStyles[order.paymentStatus]}`}
                            >
                              {paymentStatusLabels[order.paymentStatus]}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                            配送方式
                          </p>
                          <p className="mt-2 font-semibold text-zinc-900">
                            {deliveryLabels[order.deliveryMethod] ?? order.deliveryMethod}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                            付款方式
                          </p>
                          <p className="mt-2 font-semibold text-zinc-900">
                            {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-orange-300 hover:text-orange-600">
                        {isExpanded ? "收合明細" : "展開明細"}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-zinc-100 px-5 py-5 md:px-6">
                        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl bg-zinc-50 px-4 py-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-semibold text-zinc-900">
                                      {item.itemName}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                      {item.itemSubCategory} |{" "}
                                      {variantLabels[item.variant] ?? item.variant} x{" "}
                                      {item.quantity}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold text-zinc-900">
                                    {formatCurrency(item.lineTotal)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-2xl bg-zinc-900 px-5 py-5 text-sm text-white">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                  收件人
                                </p>
                                <p className="mt-2 font-semibold text-white">
                                  {order.recipientName}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                  聯絡電話
                                </p>
                                <p className="mt-2 font-semibold text-white">
                                  {order.recipientPhone}
                                </p>
                              </div>
                              <div className="sm:col-span-2 lg:col-span-1">
                                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                  Email
                                </p>
                                <p className="mt-2 break-all font-semibold text-white">
                                  {order.recipientEmail}
                                </p>
                              </div>
                              {order.recipientAddress && (
                                <div className="sm:col-span-2 lg:col-span-1">
                                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                    地址
                                  </p>
                                  <p className="mt-2 break-words font-semibold text-white">
                                    {order.recipientAddress}
                                  </p>
                                </div>
                              )}
                              {order.paidAt && (
                                <div className="sm:col-span-2 lg:col-span-1">
                                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                    付款時間
                                  </p>
                                  <p className="mt-2 font-semibold text-white">
                                    {formatDate(order.paidAt)}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                              <div className="flex items-center justify-between text-white/75">
                                <span>商品金額</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                              </div>
                              <div className="flex items-center justify-between text-white/75">
                                <span>運費</span>
                                <span>{formatCurrency(order.shippingFee)}</span>
                              </div>
                              <div className="flex items-center justify-between text-white/75">
                                <span>貨到付款手續費</span>
                                <span>{formatCurrency(order.codFee)}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-bold">
                                <span>訂單總額</span>
                                <span>{formatCurrency(order.totalAmount)}</span>
                              </div>
                            </div>

                            {order.note && (
                              <div className="mt-5 rounded-2xl bg-white/5 px-4 py-4 text-sm leading-6 text-white/75">
                                備註：{order.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
