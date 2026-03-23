import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminActionLoadingOverlay } from "./AdminActionLoadingOverlay";
import { useAuth } from "../context/useAuth";
import { getAdminOrders, updateOrderStatus } from "../lib/orders";
import type { OrderHistoryEntry, OrderStatus } from "../types/order";

const formatCurrency = (value: number) => `$${value}`;
const MIN_ACTION_LOADING_MS = 650;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

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

const statusOptions: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

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

export const AdminOrders = () => {
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusFilterInput, setStatusFilterInput] = useState<"" | OrderStatus>("");
  const [orderNumberInput, setOrderNumberInput] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<"" | OrderStatus>("");
  const [appliedOrderNumberFilter, setAppliedOrderNumberFilter] = useState("");

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated || !user?.isAdmin) {
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
        const response = await getAdminOrders();

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
  }, [isAuthReady, isAuthenticated, user?.isAdmin]);

  const statusCounts = useMemo(() => {
    return orders.reduce<Record<OrderStatus, number>>(
      (acc, order) => {
        acc[order.status] += 1;
        return acc;
      },
      {
        PENDING: 0,
        PAID: 0,
        PROCESSING: 0,
        SHIPPED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      },
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        appliedStatusFilter === "" || order.status === appliedStatusFilter;
      const matchesOrderNumber =
        appliedOrderNumberFilter.trim() === "" ||
        order.orderNumber
          .toLowerCase()
          .includes(appliedOrderNumberFilter.trim().toLowerCase());

      return matchesStatus && matchesOrderNumber;
    });
  }, [appliedOrderNumberFilter, appliedStatusFilter, orders]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId((currentId) => (currentId === orderId ? null : orderId));
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setError(null);

    try {
      await Promise.all([
        updateOrderStatus(orderId, { status: nextStatus }),
        wait(MIN_ACTION_LOADING_MS),
      ]);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "訂單狀態更新失敗，請稍後再試一次。",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const applyFilters = () => {
    const nextStatusFilter = statusFilterInput;
    const nextOrderNumberFilter = orderNumberInput.trim().toLowerCase();

    setAppliedStatusFilter(nextStatusFilter);
    setAppliedOrderNumberFilter(orderNumberInput);

    orders.filter((order) => {
      const matchesStatus =
        nextStatusFilter === "" || order.status === nextStatusFilter;
      const matchesOrderNumber =
        nextOrderNumberFilter === "" ||
        order.orderNumber.toLowerCase().includes(nextOrderNumberFilter);

      return matchesStatus && matchesOrderNumber;
    });

    setExpandedOrderId(null);
  };

  const clearFilters = () => {
    setStatusFilterInput("");
    setOrderNumberInput("");
    setAppliedStatusFilter("");
    setAppliedOrderNumberFilter("");
    setExpandedOrderId(null);
  };

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">正在載入後台資料...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Admin
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            請先登入後台
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            登入管理員帳號後，才能查看與管理全部訂單。
          </p>
        </div>
      </main>
    );
  }

  if (!user?.isAdmin) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Admin
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            你沒有後台權限
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            目前登入帳號不是管理員，無法查看後台訂單資料。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40 lg:h-full lg:overflow-hidden lg:pb-10 lg:pt-10">
      {updatingOrderId && (
        <AdminActionLoadingOverlay title="訂單狀態更新中..." />
      )}

      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <div className="shrink-0">
          <div className="mb-12 flex flex-col gap-6 border-b border-zinc-100 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
                Admin
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
                訂單管理
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
                查看全部訂單、付款狀態與配送進度，並手動更新訂單處理流程。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-3xl bg-zinc-50 p-4 md:grid-cols-5">
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  待確認
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">
                  {statusCounts.PENDING}
                </p>
              </div>
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  已付款待處理
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">
                  {statusCounts.PAID}
                </p>
              </div>
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  處理中
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">
                  {statusCounts.PROCESSING}
                </p>
                </div>
                <div className="min-w-[96px] text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                    已出貨
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-900">
                    {statusCounts.SHIPPED}
                  </p>
                </div>
                <div className="min-w-[96px] text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                    已完成
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-900">
                    {statusCounts.COMPLETED}
                  </p>
                </div>
            </div>
          </div>

          <div className="mb-8 rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr_0.8fr]">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  訂單狀態篩選
                </p>
                <select
                  value={statusFilterInput}
                  onChange={(event) =>
                    setStatusFilterInput(event.target.value as "" | OrderStatus)
                  }
                  className="h-11 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-orange-400"
                >
                  <option value="">全部狀態</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  訂單編號搜尋
                </p>
                <input
                  type="text"
                  value={orderNumberInput}
                  onChange={(event) => setOrderNumberInput(event.target.value)}
                  placeholder="輸入訂單編號，例如 GO2026..."
                  className="h-11 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  <Search className="mr-2 h-4 w-4" />
                  搜尋
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  全部
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
          {isLoading ? (
            <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center text-sm text-zinc-500">
              訂單資料載入中...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
              <p className="text-2xl font-bold text-zinc-900">找不到符合條件的訂單</p>
              <p className="mt-3 text-sm text-zinc-500">
                可以調整狀態篩選或重新輸入訂單編號後再試一次。
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const isUpdating = updatingOrderId === order.id;

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-sm"
                  >
                    <div className="px-5 py-5 md:px-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="grid flex-1 gap-5 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_0.8fr]">
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

                        <div className="flex items-center gap-3 self-start">
                          <select
                            value={statusOptions.includes(order.status) ? order.status : "PENDING"}
                            disabled={isUpdating}
                            onChange={(event) =>
                              void handleStatusChange(
                                order.id,
                                event.target.value as OrderStatus,
                              )
                            }
                            className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {orderStatusLabels[status]}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => toggleOrder(order.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-orange-300 hover:text-orange-600"
                          >
                            {isExpanded ? "收合明細" : "展開明細"}
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
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
                                    電話
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
                                  <span>應付合計</span>
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

          <div className="mt-8">
            <Link
              to="/orders"
              className="inline-flex rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              查看前台訂單查詢
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
