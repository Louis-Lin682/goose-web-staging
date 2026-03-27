import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { AdminActionLoadingOverlay } from "./AdminActionLoadingOverlay";
import { useAuth } from "../context/useAuth";
import { useAdminNotifications } from "../context/useAdminNotifications";
import { getAdminOrders, updateOrderStatus } from "../lib/orders";
import type { OrderHistoryEntry, OrderStatus } from "../types/order";

type OrderDatePreset = "today" | "this-month" | "last-month" | "custom";

const MIN_ACTION_LOADING_MS = 650;

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const formatCurrency = (value: number) => `$${value}`;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getDateString = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolvePresetRange = (preset: Exclude<OrderDatePreset, "custom">) => {
  const now = new Date();

  if (preset === "today") {
    const today = getDateString(now);
    return { startDate: today, endDate: today };
  }

  if (preset === "this-month") {
    return {
      startDate: getDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: getDateString(now),
    };
  }

  return {
    startDate: getDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    endDate: getDateString(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
};

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

const datePresetLabels: Record<Exclude<OrderDatePreset, "custom">, string> = {
  today: "本日",
  "this-month": "本月",
  "last-month": "上月",
};

const deliveryLabels: Record<string, string> = {
  home: "宅配到府",
  pickup: "門市自取",
  familymart: "全家取貨（舊資料）",
  seven_eleven: "7-11 取貨（舊資料）",
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

const resolvePaymentStatusDisplay = (order: {
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PAID" | "FAILED";
}) => {
  if (order.paymentMethod === "online") {
    if (order.paymentStatus === "PAID") {
      return {
        label: paymentStatusLabels.PAID,
        badgeClassName: paymentStatusBadgeStyles.PAID,
      };
    }

    return {
      label: paymentStatusLabels.FAILED,
      badgeClassName: paymentStatusBadgeStyles.FAILED,
    };
  }

  return {
    label: paymentStatusLabels[order.paymentStatus],
    badgeClassName: paymentStatusBadgeStyles[order.paymentStatus],
  };
};

const isOrderInRange = (createdAt: string, startDate: string, endDate: string) => {
  const orderDate = getDateString(new Date(createdAt));
  return orderDate >= startDate && orderDate <= endDate;
};

export const AdminOrders = () => {
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const { unreadCount, markNotificationsForOrderAsRead } = useAdminNotifications();
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusFilterInput, setStatusFilterInput] = useState<"" | OrderStatus>("");
  const [orderNumberInput, setOrderNumberInput] = useState("");
  const [datePreset, setDatePreset] = useState<OrderDatePreset>("today");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<"" | OrderStatus>("");
  const [appliedOrderNumberFilter, setAppliedOrderNumberFilter] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  useEffect(() => {
    const range = resolvePresetRange("today");
    setStartDateInput(range.startDate);
    setEndDateInput(range.endDate);
    setAppliedStartDate(range.startDate);
    setAppliedEndDate(range.endDate);
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

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
        if (!isMounted) return;
        setOrders(response.orders);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "訂單資料載入失敗，請稍後再試一次。",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void hydrateOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isAuthenticated, user?.isAdmin]);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || !user?.isAdmin) {
      return;
    }

    let isMounted = true;

    const refreshOrdersFromNotifications = async () => {
      try {
        const response = await getAdminOrders();
        if (!isMounted) return;
        setOrders(response.orders);
      } catch {
        // Keep current list if silent refresh fails.
      }
    };

    void refreshOrdersFromNotifications();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isAuthenticated, unreadCount, user?.isAdmin]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        appliedStatusFilter === "" || order.status === appliedStatusFilter;
      const matchesOrderNumber =
        appliedOrderNumberFilter.trim() === "" ||
        order.orderNumber
          .toLowerCase()
          .includes(appliedOrderNumberFilter.trim().toLowerCase());
      const matchesDate =
        !appliedStartDate ||
        !appliedEndDate ||
        isOrderInRange(order.createdAt, appliedStartDate, appliedEndDate);

      return matchesStatus && matchesOrderNumber && matchesDate;
    });
  }, [
    appliedEndDate,
    appliedOrderNumberFilter,
    appliedStartDate,
    appliedStatusFilter,
    orders,
  ]);

  const filteredStatusCounts = useMemo(
    () =>
      filteredOrders.reduce<Record<OrderStatus, number>>(
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
      ),
    [filteredOrders],
  );

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
      await markNotificationsForOrderAsRead(orderId);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "更新訂單狀態失敗，請稍後再試一次。",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const applyFilters = () => {
    setIsFilterLoading(true);
    setAppliedStatusFilter(statusFilterInput);
    setAppliedOrderNumberFilter(orderNumberInput);
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setExpandedOrderId(null);
    window.setTimeout(() => setIsFilterLoading(false), 280);
  };

  const clearFilters = () => {
    setIsFilterLoading(true);
    const range = resolvePresetRange("today");
    setDatePreset("today");
    setStatusFilterInput("");
    setOrderNumberInput("");
    setStartDateInput(range.startDate);
    setEndDateInput(range.endDate);
    setAppliedStatusFilter("");
    setAppliedOrderNumberFilter("");
    setAppliedStartDate(range.startDate);
    setAppliedEndDate(range.endDate);
    setExpandedOrderId(null);
    window.setTimeout(() => setIsFilterLoading(false), 280);
  };

  const handleDatePresetChange = (nextPreset: Exclude<OrderDatePreset, "custom">) => {
    setIsFilterLoading(true);
    setDatePreset(nextPreset);
    window.setTimeout(() => setIsFilterLoading(false), 280);
  };

  useEffect(() => {
    setAppliedStatusFilter(statusFilterInput);
    setExpandedOrderId(null);
  }, [statusFilterInput]);

  useEffect(() => {
    setAppliedOrderNumberFilter(orderNumberInput);
    setExpandedOrderId(null);
  }, [orderNumberInput]);

  useEffect(() => {
    if (datePreset === "custom") return;

    const range = resolvePresetRange(datePreset);
    setStartDateInput(range.startDate);
    setEndDateInput(range.endDate);
    setAppliedStartDate(range.startDate);
    setAppliedEndDate(range.endDate);
    setExpandedOrderId(null);
  }, [datePreset]);

  useEffect(() => {
    if (datePreset !== "custom") return;

    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setExpandedOrderId(null);
  }, [datePreset, endDateInput, startDateInput]);

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">正在確認登入狀態...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40 lg:h-full lg:overflow-hidden lg:pb-10 lg:pt-10">
      {updatingOrderId && <AdminActionLoadingOverlay title="更新訂單狀態中..." />}
      {isFilterLoading && <AdminActionLoadingOverlay title="篩選中..." />}

      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <div className="shrink-0">
          <div className="mb-8 flex flex-col gap-4 border-b border-zinc-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
                Admin
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
                訂單管理
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                快速查看訂單進度、付款狀態與商品明細，並直接調整處理狀態。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl bg-zinc-50 p-4 md:grid-cols-6">
              {[
                ["待確認", filteredStatusCounts.PENDING],
                ["已付款待處理", filteredStatusCounts.PAID],
                ["處理中", filteredStatusCounts.PROCESSING],
                ["已出貨", filteredStatusCounts.SHIPPED],
                ["已完成", filteredStatusCounts.COMPLETED],
                ["已取消", filteredStatusCounts.CANCELLED],
              ].map(([label, value]) => (
                <div key={label} className="min-w-[86px] text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-black text-zinc-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {(["today", "this-month", "last-month"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleDatePresetChange(item)}
                    className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      datePreset === item
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {datePresetLabels[item]}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 xl:grid-cols-[0.75fr_1fr_1fr_1.1fr_auto_auto]">
                <select
                  value={statusFilterInput}
                  onChange={(event) =>
                    setStatusFilterInput(event.target.value as "" | OrderStatus)
                  }
                  className="h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-orange-400"
                >
                  <option value="">全部狀態</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabels[status]}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={startDateInput}
                  onChange={(event) => {
                    setDatePreset("custom");
                    setStartDateInput(event.target.value);
                  }}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  onFocus={(event) => event.currentTarget.showPicker?.()}
                  className="h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                />

                <input
                  type="date"
                  value={endDateInput}
                  onChange={(event) => {
                    setDatePreset("custom");
                    setEndDateInput(event.target.value);
                  }}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  onFocus={(event) => event.currentTarget.showPicker?.()}
                  className="h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                />

                <input
                  type="text"
                  value={orderNumberInput}
                  onChange={(event) => setOrderNumberInput(event.target.value)}
                  placeholder="搜尋訂單編號，例如 GO2026..."
                  className="h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400"
                />

                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  <Search className="mr-2 h-4 w-4" />
                  搜尋
                </button>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  清除
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
              <p className="text-2xl font-bold text-zinc-900">目前沒有符合條件的訂單</p>
              <p className="mt-3 text-sm text-zinc-500">
                可以調整日期、狀態或訂單編號篩選條件，再重新查看訂單列表。
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const isUpdating = updatingOrderId === order.id;
                const paymentStatusDisplay = resolvePaymentStatusDisplay(order);

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
                              {formatDateTime(order.createdAt)}
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
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentStatusDisplay.badgeClassName}`}
                              >
                                {paymentStatusDisplay.label}
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
                              void handleStatusChange(order.id, event.target.value as OrderStatus)
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
                            {isExpanded ? "收合" : "展開"}
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
                                {order.pickupStoreCode && (
                                  <div className="sm:col-span-2 lg:col-span-1">
                                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                      取貨門市
                                    </p>
                                    <p className="mt-2 font-semibold text-white">
                                      {order.pickupStoreName || "未填寫"}（{order.pickupStoreCode}）
                                    </p>
                                    {order.pickupStoreAddress && (
                                      <p className="mt-2 break-words text-white/75">
                                        {order.pickupStoreAddress}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {order.paidAt && (
                                  <div className="sm:col-span-2 lg:col-span-1">
                                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                      付款時間
                                    </p>
                                    <p className="mt-2 font-semibold text-white">
                                      {formatDateTime(order.paidAt)}
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

          <div className="mt-8 rounded-[1.5rem] border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm text-zinc-500">
            <span className="font-semibold text-zinc-900">{filteredOrders.length}</span>{" "}
            筆符合條件的訂單
          </div>
        </div>
      </div>
    </main>
  );
};



