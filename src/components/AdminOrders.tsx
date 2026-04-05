import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AdminActionLoadingOverlay } from "./AdminActionLoadingOverlay";
import { useAuth } from "../context/useAuth";
import { useAdminNotifications } from "../context/useAdminNotifications";
import { getAdminOrders, updateOrderStatus } from "../lib/orders";
import type { OrderHistoryEntry, OrderStatus } from "../types/order";

type OrderDatePreset = "today" | "this-month" | "last-month" | "custom";

const MIN_ACTION_LOADING_MS = 650;
const REFRESH_INTERVAL_MS = 10 * 1000;

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

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildPrintableOrderHtml = (
  orders: OrderHistoryEntry[],
  options: {
    deliveryLabels: Record<string, string>;
    orderStatusLabels: Record<OrderStatus, string>;
    paymentLabels: Record<string, string>;
    resolvePaymentStatusDisplay: (order: {
      paymentMethod: string;
      paymentStatus: "UNPAID" | "PAID" | "FAILED";
    }) => { label: string };
    variantLabels: Record<string, string>;
  },
) => {
  const printedAt = formatDateTime(new Date().toISOString());

  const orderSections = orders
    .map((order) => {
      const paymentStatusDisplay = options.resolvePaymentStatusDisplay(order);
      const addressMarkup =
        order.deliveryMethod === "pickup" && order.pickupStoreCode
          ? `
              <div class="info-row">
                <span class="label">取貨門市</span>
                <span class="value">${escapeHtml(
                  `${order.pickupStoreName || "未填寫"}（${order.pickupStoreCode}）`,
                )}</span>
              </div>
              ${
                order.pickupStoreAddress
                  ? `
                    <div class="info-row">
                      <span class="label">門市地址</span>
                      <span class="value">${escapeHtml(order.pickupStoreAddress)}</span>
                    </div>
                  `
                  : ""
              }
            `
          : order.recipientAddress
            ? `
                <div class="info-row">
                  <span class="label">收件地址</span>
                  <span class="value">${escapeHtml(order.recipientAddress)}</span>
                </div>
              `
            : "";

      const itemsMarkup = order.items
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.itemName)}</td>
              <td>${escapeHtml(options.variantLabels[item.variant] ?? item.variant)}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.lineTotal)}</td>
            </tr>
          `,
        )
        .join("");

      const noteMarkup = order.note
        ? `
            <div class="note-block">
              <div class="note-title">訂單備註</div>
              <div class="note-content">${escapeHtml(order.note)}</div>
            </div>
          `
        : "";

      return `
        <section class="order-sheet">
          <div class="sheet-header">
            <div>
              <div class="eyebrow">鵝作社 訂單單據</div>
              <h1>${escapeHtml(order.orderNumber)}</h1>
            </div>
            <div class="status-group">
              <div><span class="status-label">訂單狀態</span><strong>${escapeHtml(options.orderStatusLabels[order.status])}</strong></div>
              <div><span class="status-label">付款狀態</span><strong>${escapeHtml(paymentStatusDisplay.label)}</strong></div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="card-title">訂單資訊</div>
              <div class="info-row">
                <span class="label">下單時間</span>
                <span class="value">${formatDateTime(order.createdAt)}</span>
              </div>
              ${
                order.paidAt
                  ? `
                      <div class="info-row">
                        <span class="label">付款時間</span>
                        <span class="value">${formatDateTime(order.paidAt)}</span>
                      </div>
                    `
                  : ""
              }
              <div class="info-row">
                <span class="label">配送方式</span>
                <span class="value">${escapeHtml(options.deliveryLabels[order.deliveryMethod] ?? order.deliveryMethod)}</span>
              </div>
              <div class="info-row">
                <span class="label">付款方式</span>
                <span class="value">${escapeHtml(options.paymentLabels[order.paymentMethod] ?? order.paymentMethod)}</span>
              </div>
            </div>

            <div class="info-card">
              <div class="card-title">收件資訊</div>
              <div class="info-row">
                <span class="label">收件人</span>
                <span class="value">${escapeHtml(order.recipientName)}</span>
              </div>
              <div class="info-row">
                <span class="label">聯絡電話</span>
                <span class="value">${escapeHtml(order.recipientPhone)}</span>
              </div>
              <div class="info-row">
                <span class="label">Email</span>
                <span class="value">${escapeHtml(order.recipientEmail)}</span>
              </div>
              ${addressMarkup}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>商品名稱</th>
                <th>規格</th>
                <th>數量</th>
                <th>單價</th>
                <th>小計</th>
              </tr>
            </thead>
            <tbody>${itemsMarkup}</tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>商品金額</span><strong>${formatCurrency(order.subtotal)}</strong></div>
            <div class="total-row"><span>運費</span><strong>${formatCurrency(order.shippingFee)}</strong></div>
            <div class="total-row"><span>貨到付款手續費</span><strong>${formatCurrency(order.codFee)}</strong></div>
            <div class="total-row grand-total"><span>訂單總額</span><strong>${formatCurrency(order.totalAmount)}</strong></div>
          </div>

          ${noteMarkup}
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
  <html lang="zh-Hant">
    <head>
      <meta charset="UTF-8" />
      <title>鵝作社訂單列印</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
          color: #18181b;
          background: #fff;
          font-size: 12px;
          line-height: 1.55;
        }
        .print-shell { width: 100%; max-width: 168mm; margin: 0 auto; }
        .print-header { margin-bottom: 10mm; text-align: center; }
        .print-header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; }
        .print-header p { margin: 4px 0 0; color: #71717a; }
        .order-sheet { padding: 8mm 0; border-bottom: 1px dashed #d4d4d8; page-break-inside: avoid; }
        .order-sheet:first-of-type { padding-top: 0; }
        .order-sheet:last-of-type { border-bottom: none; padding-bottom: 0; }
        .sheet-header { display: flex; justify-content: space-between; gap: 6mm; align-items: flex-start; margin-bottom: 5mm; }
        .sheet-header h1 { margin: 2mm 0 0; font-size: 18px; font-weight: 800; }
        .eyebrow { font-size: 10px; color: #ea580c; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; }
        .status-group { display: grid; gap: 2mm; min-width: 34mm; text-align: right; }
        .status-label, .label, .card-title {
          color: #71717a;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .info-grid { display: grid; gap: 4mm; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 5mm; }
        .info-card { border: 1px solid #e4e4e7; border-radius: 4mm; padding: 4mm; }
        .card-title { margin-bottom: 2.5mm; }
        .info-row { display: grid; gap: 1.2mm; margin-bottom: 2.2mm; }
        .info-row:last-child { margin-bottom: 0; }
        .value { font-size: 12px; font-weight: 600; color: #18181b; word-break: break-word; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        .items-table th, .items-table td { border-bottom: 1px solid #e4e4e7; padding: 2.6mm 2mm; text-align: left; vertical-align: top; }
        .items-table th { color: #52525b; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
        .totals { margin-left: auto; width: min(100%, 68mm); }
        .total-row { display: flex; justify-content: space-between; gap: 4mm; padding: 1.6mm 0; border-bottom: 1px solid #e4e4e7; }
        .grand-total { font-size: 13px; font-weight: 800; }
        .note-block { margin-top: 4mm; border-radius: 4mm; background: #f5f5f5; padding: 4mm; }
        .note-title { color: #71717a; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 1.5mm; }
        .note-content { word-break: break-word; }
      </style>
    </head>
    <body>
      <main class="print-shell">
        <header class="print-header">
          <h1>鵝作社 訂單列印</h1>
          <p>列印時間：${printedAt}</p>
        </header>
        ${orderSections}
      </main>
      <script>
        window.addEventListener("load", () => { window.print(); });
      </script>
    </body>
  </html>`;
};

export const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const { unreadCount, markNotificationsForOrderAsRead } = useAdminNotifications();
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [isFocusedOrderView, setIsFocusedOrderView] = useState(false);
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
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const orderCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const focusedOrderNumber = searchParams.get("focusOrder")?.trim() ?? "";

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
    let intervalId: number | null = null;

    const refreshOrdersFromNotifications = async () => {
      try {
        const response = await getAdminOrders();
        if (!isMounted) return;
        setOrders(response.orders);
      } catch {
        // Keep current list if silent refresh fails.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshOrdersFromNotifications();
      }
    };

    const handlePageShow = () => {
      void refreshOrdersFromNotifications();
    };

    const startPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      intervalId = window.setInterval(() => {
        void refreshOrdersFromNotifications();
      }, REFRESH_INTERVAL_MS);
    };

    void refreshOrdersFromNotifications();
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handlePageShow);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      isMounted = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handlePageShow);
      window.removeEventListener("pageshow", handlePageShow);
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

  const selectedOrders = useMemo(
    () => filteredOrders.filter((order) => selectedOrderIds.includes(order.id)),
    [filteredOrders, selectedOrderIds],
  );

  useEffect(() => {
    setSelectedOrderIds((current) =>
      current.filter((id) => filteredOrders.some((order) => order.id === id)),
    );
  }, [filteredOrders]);

  const exitFocusedOrderView = () => {
    setIsFocusedOrderView(false);
    setOrderNumberInput("");
    setAppliedOrderNumberFilter("");
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const selectAllFilteredOrders = () => {
    setSelectedOrderIds(filteredOrders.map((order) => order.id));
  };

  const clearSelectedOrders = () => {
    setSelectedOrderIds([]);
  };

  const handlePrintSelectedOrders = () => {
    if (selectedOrders.length === 0) {
      setError("請先勾選至少一筆訂單再列印。");
      return;
    }

    setError(null);

    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      setError("無法開啟列印視窗，請確認瀏覽器未封鎖彈出視窗。");
      return;
    }

    const html = buildPrintableOrderHtml(selectedOrders, {
      deliveryLabels,
      orderStatusLabels,
      paymentLabels,
      resolvePaymentStatusDisplay,
      variantLabels,
    });

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  useEffect(() => {
    if (!focusedOrderNumber || orders.length === 0) {
      return;
    }

    const targetOrder = orders.find(
      (order) => order.orderNumber === focusedOrderNumber,
    );

    if (!targetOrder) {
      return;
    }

    setDatePreset("custom");
    setStatusFilterInput("");
    setOrderNumberInput(targetOrder.orderNumber);
    setStartDateInput("");
    setEndDateInput("");
    setAppliedStatusFilter("");
    setAppliedOrderNumberFilter(targetOrder.orderNumber);
    setAppliedStartDate("");
    setAppliedEndDate("");
    setExpandedOrderId(targetOrder.id);
    setHighlightedOrderId(targetOrder.id);
    setIsFocusedOrderView(true);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focusOrder");
    setSearchParams(nextParams, { replace: true });
  }, [focusedOrderNumber, orders, searchParams, setSearchParams]);

  useEffect(() => {
    if (!highlightedOrderId) {
      return;
    }

    const targetCard = orderCardRefs.current[highlightedOrderId];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timer = window.setTimeout(() => {
      setHighlightedOrderId((currentId) =>
        currentId === highlightedOrderId ? null : currentId,
      );
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [filteredOrders, highlightedOrderId]);

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
    setIsFocusedOrderView(false);
    setAppliedStatusFilter(statusFilterInput);
    setAppliedOrderNumberFilter(orderNumberInput);
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setExpandedOrderId(null);
    window.setTimeout(() => setIsFilterLoading(false), 280);
  };

  const clearFilters = () => {
    setIsFilterLoading(true);
    setIsFocusedOrderView(false);
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
    if (isFocusedOrderView) {
      exitFocusedOrderView();
    }
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
          <div className="mb-5 flex flex-col gap-3 border-b border-zinc-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
                Admin
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
                訂單管理
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                快速查看訂單進度、付款狀態與商品明細，並直接調整處理狀態。
              </p>
            </div>

            <div className="grid grid-cols-6 gap-1.5 rounded-[1.5rem] bg-zinc-50 p-2.5">
              {[
                ["待確認", filteredStatusCounts.PENDING],
                ["已付款待處理", filteredStatusCounts.PAID],
                ["處理中", filteredStatusCounts.PROCESSING],
                ["已出貨", filteredStatusCounts.SHIPPED],
                ["已完成", filteredStatusCounts.COMPLETED],
                ["已取消", filteredStatusCounts.CANCELLED],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                    {label}
                  </p>
                  <p className="mt-1 text-base font-black text-zinc-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky top-3 z-20 mb-5 rounded-[1.6rem] border border-zinc-100 bg-white/95 p-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {(["today", "this-month", "last-month"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleDatePresetChange(item)}
                  className={`inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[10px] font-semibold transition-colors ${
                      datePreset === item
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {datePresetLabels[item]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-[94px_98px_98px_minmax(0,1fr)_70px_54px] gap-2">
                <select
                  value={statusFilterInput}
                  onChange={(event) => {
                    if (isFocusedOrderView) {
                      exitFocusedOrderView();
                    }
                    setStatusFilterInput(event.target.value as "" | OrderStatus);
                  }}
                  className="h-8 w-full min-w-0 rounded-full border border-zinc-200 bg-white px-3 text-[11px] font-semibold text-zinc-900 outline-none transition-colors focus:border-orange-400"
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
                    if (isFocusedOrderView) {
                      exitFocusedOrderView();
                    }
                    setDatePreset("custom");
                    setStartDateInput(event.target.value);
                  }}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  onFocus={(event) => event.currentTarget.showPicker?.()}
                  className="h-8 w-full min-w-0 rounded-full border border-zinc-200 bg-white px-3 text-[10px] text-zinc-900 outline-none transition-colors focus:border-orange-400"
                />

                <input
                  type="date"
                  value={endDateInput}
                  onChange={(event) => {
                    if (isFocusedOrderView) {
                      exitFocusedOrderView();
                    }
                    setDatePreset("custom");
                    setEndDateInput(event.target.value);
                  }}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  onFocus={(event) => event.currentTarget.showPicker?.()}
                  className="h-8 w-full min-w-0 rounded-full border border-zinc-200 bg-white px-3 text-[10px] text-zinc-900 outline-none transition-colors focus:border-orange-400"
                />

                <input
                  type="text"
                  value={orderNumberInput}
                  onChange={(event) => {
                    setIsFocusedOrderView(false);
                    setOrderNumberInput(event.target.value);
                  }}
                  placeholder="訂單編號"
                  className="h-8 w-full min-w-0 rounded-full border border-zinc-200 bg-white px-3 text-[10px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400"
                />

                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex h-8 items-center justify-center rounded-full bg-zinc-900 px-3 text-[10px] font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  搜尋
                </button>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-200 px-3 text-[10px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  清除
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2.5">
                <button
                  type="button"
                  onClick={selectAllFilteredOrders}
                  disabled={filteredOrders.length === 0}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-200 px-3 text-[10px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  全選
                </button>
                <button
                  type="button"
                  onClick={clearSelectedOrders}
                  disabled={selectedOrders.length === 0}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-200 px-3 text-[10px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  取消全選
                </button>
                <button
                  type="button"
                  onClick={handlePrintSelectedOrders}
                  disabled={selectedOrders.length === 0}
                  className="inline-flex h-8 items-center justify-center rounded-full bg-zinc-900 px-3 text-[10px] font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  列印已選訂單（{selectedOrders.length}）
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
                    ref={(node) => {
                      orderCardRefs.current[order.id] = node;
                    }}
                    className={`overflow-hidden rounded-[2rem] border bg-white shadow-sm transition-[border-color,box-shadow] duration-300 ${
                      highlightedOrderId === order.id
                        ? "border-orange-300 shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
                        : "border-zinc-100"
                    }`}
                  >
                    <div className="px-5 py-5 md:px-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="flex flex-1 items-start gap-4">
                          <label className="mt-1 inline-flex shrink-0 items-center">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="h-5 w-5 rounded border-zinc-300 accent-zinc-900"
                              aria-label={`選取訂單 ${order.orderNumber}`}
                            />
                          </label>
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



