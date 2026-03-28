import { useMemo, useState, type FormEvent } from "react";
import { CircleAlert } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthRequiredPrompt } from "./AuthRequiredPrompt";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import {
  getPendingPayment,
  clearPendingPayment,
  createEcpayCheckout,
  createOrder,
  savePendingPayment,
} from "../lib/orders";
import type {
  CreateOrderPayload,
  OrderDeliveryMethod,
  OrderPaymentMethod,
} from "../types/order";

type CheckoutFormState = {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
  pickupStoreCode: string;
  pickupStoreName: string;
  pickupStoreAddress: string;
  note: string;
  deliveryMethod: OrderDeliveryMethod;
  paymentMethod: OrderPaymentMethod;
};

type OrderSummaryProps = {
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  finalTotal: number;
  paymentMethod: OrderPaymentMethod;
};

type CheckoutField =
  | "recipientName"
  | "recipientPhone"
  | "recipientEmail"
  | "recipientAddress";

type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;
type CheckoutTouchedFields = Partial<Record<CheckoutField, boolean>>;

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400";

const textareaClassName =
  "min-h-[132px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400";

const variantLabels: Record<string, string> = {
  single: "單一規格",
  small: "小",
  large: "大",
};

const formatCurrency = (value: number) => `$${value}`;

const getShippingFee = (subtotal: number, deliveryMethod: OrderDeliveryMethod) => {
  if (deliveryMethod === "pickup") {
    return 0;
  }

  if (subtotal <= 1000) {
    return 200;
  }

  if (subtotal <= 1800) {
    return 230;
  }

  if (subtotal <= 6000) {
    return 290;
  }

  return 0;
};

const getCodFee = (
  subtotal: number,
  deliveryMethod: OrderDeliveryMethod,
  paymentMethod: OrderPaymentMethod,
) => {
  if (paymentMethod !== "cod") {
    return 0;
  }

  if (deliveryMethod === "pickup") {
    return 0;
  }

  if (subtotal <= 1800) {
    return 30;
  }

  if (subtotal <= 6000) {
    return 60;
  }

  if (subtotal <= 10000) {
    return 90;
  }

  return 0;
};

const buildInitialForm = (
  name = "",
  phone = "",
  email = "",
  address = "",
): CheckoutFormState => ({
  recipientName: name,
  recipientPhone: phone,
  recipientEmail: email,
  recipientAddress: address,
  pickupStoreCode: "",
  pickupStoreName: "",
  pickupStoreAddress: "",
  note: "",
  deliveryMethod: "home",
  paymentMethod: "online",
});

const resolveCheckoutErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "送出失敗，請稍後再試一次。";
  }

  const message = error.message.trim();

  if (
    message.includes("Please log in before checking out.") ||
    message.includes("Please log in first") ||
    message.includes("Unauthorized") ||
    message.includes("401")
  ) {
    return "登入狀態已過期，請重新登入後再送出訂單。";
  }

  return message || "送出失敗，請稍後再試一次。";
};

const resolveCheckoutFieldErrors = (
  message: string,
  deliveryMethod: OrderDeliveryMethod,
): CheckoutFieldErrors => {
  const fieldErrors: CheckoutFieldErrors = {};

  if (message.includes("姓名")) {
    fieldErrors.recipientName = message;
  }

  if (message.includes("手機") || message.includes("電話")) {
    fieldErrors.recipientPhone = message;
  }

  if (message.toLowerCase().includes("email")) {
    fieldErrors.recipientEmail = message;
  }

  if (deliveryMethod === "home" && message.includes("地址")) {
    fieldErrors.recipientAddress = message;
  }

  return fieldErrors;
};

const validateCheckoutField = (
  field: CheckoutField,
  value: string,
  deliveryMethod: OrderDeliveryMethod,
): string | undefined => {
  const trimmedValue = value.trim();

  if (field === "recipientName") {
    if (!trimmedValue) {
      return "請輸入收件人姓名。";
    }

    return undefined;
  }

  if (field === "recipientPhone") {
    if (!trimmedValue) {
      return "請輸入正確的手機號碼。";
    }

    if (!/^09\d{8}$/.test(trimmedValue)) {
      return "請輸入正確的手機號碼。";
    }

    return undefined;
  }

  if (field === "recipientEmail") {
    if (!trimmedValue) {
      return "請輸入正確的 Email。";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
      return "請輸入正確的 Email。";
    }

    return undefined;
  }

  if (field === "recipientAddress") {
    if (deliveryMethod === "pickup") {
      return undefined;
    }

    if (!trimmedValue) {
      return "請輸入完整收件地址。";
    }
  }

  return undefined;
};

const collectCheckoutFieldErrors = (
  form: CheckoutFormState,
  deliveryMethod: OrderDeliveryMethod,
): CheckoutFieldErrors => {
  const fields: CheckoutField[] = [
    "recipientName",
    "recipientPhone",
    "recipientEmail",
    "recipientAddress",
  ];

  return fields.reduce<CheckoutFieldErrors>((errors, field) => {
    const nextError = validateCheckoutField(field, form[field], deliveryMethod);

    if (nextError) {
      errors[field] = nextError;
    }

    return errors;
  }, {});
};

const submitEcpayCheckout = (action: string, fields: Record<string, string>) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
};

const SectionTitle = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div>
    <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
      {eyebrow}
    </p>
    <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-900">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">{description}</p>
  </div>
);

const OrderSummary = ({
  totalItems,
  subtotal,
  shippingFee,
  codFee,
  finalTotal,
  paymentMethod,
}: OrderSummaryProps) => {
  const { cart } = useCart();

  return (
    <section className="rounded-[2rem] bg-zinc-900 p-6 text-white">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">
        Summary
      </p>
      <h2 className="mt-3 text-3xl font-black">訂單摘要</h2>

      <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
        {cart.map((item) => {
          const lineTotal = item.finalPrice * item.quantity;
          const variantLabel = variantLabels[item.selectedVariant] ?? item.selectedVariant;

          return (
            <div
              key={`${item.id}-${item.selectedVariant}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-white/65">
                    {variantLabel} x {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-white">{formatCurrency(lineTotal)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>商品總數</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>商品金額</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>運費</span>
          <span>{formatCurrency(shippingFee)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>貨到付款手續費</span>
          <span>{formatCurrency(codFee)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-lg font-bold">
          <span>應付合計</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      <div className="mt-8 rounded-[1.75rem] bg-white/5 px-4 py-4 text-sm leading-7 text-white/70">
        {paymentMethod === "cod"
          ? "目前選擇貨到付款，系統會依訂單金額自動計算手續費。"
          : "送出訂單後會依目前配送與付款方式計算應付金額；若為線上付款，會接著前往綠界付款頁。"}
      </div>
    </section>
  );
};

export const Checkout = () => {
  const { cart, totalItems, clearCart } = useCart();
  const { isAuthenticated, isAuthReady } = useAuth();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<CheckoutTouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState(() => getPendingPayment());
  const [form, setForm] = useState<CheckoutFormState>(() => buildInitialForm());
  const isPickup = form.deliveryMethod === "pickup";


  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0),
    [cart],
  );
  const shippingFee = getShippingFee(subtotal, form.deliveryMethod);
  const codFee = getCodFee(subtotal, form.deliveryMethod, form.paymentMethod);
  const finalTotal = subtotal + shippingFee + codFee;

  useEffect(() => {
    const syncPendingPayment = () => {
      const nextPendingPayment = getPendingPayment();
      setPendingPayment(nextPendingPayment);

      if (!nextPendingPayment) {
        return;
      }

      setSubmitError(null);
      setSubmitMessage(
        `偵測到尚未完成付款的訂單 ${nextPendingPayment.orderNumber}，可再次前往綠界完成付款。`,
      );
    };

    syncPendingPayment();

    const handlePageShow = () => {
      syncPendingPayment();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleFieldChange = <K extends keyof CheckoutFormState>(
    field: K,
    value: CheckoutFormState[K],
  ) => {
    setSubmitMessage(null);
    setSubmitError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFieldBlur = (field: CheckoutField) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setFieldErrors((current) => ({
      ...current,
      [field]: validateCheckoutField(field, form[field], form.deliveryMethod),
    }));
  };

  const handleResumePendingPayment = async () => {
    if (!pendingPayment) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(`正在重新導向至綠界付款頁，訂單編號 ${pendingPayment.orderNumber}...`);

    try {
      const checkoutResponse = await createEcpayCheckout(pendingPayment.orderId);
      submitEcpayCheckout(checkoutResponse.action, checkoutResponse.fields);
    } catch (error) {
      setSubmitMessage(null);
      setSubmitError(resolveCheckoutErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliveryMethodChange = (nextMethod: OrderDeliveryMethod) => {
    setSubmitMessage(null);
    setSubmitError(null);
    setForm((prev) => ({
      ...prev,
      deliveryMethod: nextMethod,
      ...(nextMethod === "pickup"
        ? {
            recipientAddress: "",
            pickupStoreCode: "",
            pickupStoreName: "",
            pickupStoreAddress: "",
          }
        : {}),
    }));
    setFieldErrors((prev) => ({
      ...prev,
      recipientAddress:
        touchedFields.recipientAddress
          ? validateCheckoutField("recipientAddress", form.recipientAddress, nextMethod)
          : undefined,
    }));
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: CreateOrderPayload = {
      recipientName: form.recipientName.trim(),
      recipientPhone: form.recipientPhone.trim(),
      recipientEmail: form.recipientEmail.trim(),
      recipientAddress:
        form.deliveryMethod === "home" ? form.recipientAddress.trim() : undefined,
      note: form.note.trim() || undefined,
      deliveryMethod: form.deliveryMethod,
      paymentMethod: form.paymentMethod,
      shippingFee,
      codFee,
      items: cart.map((item) => ({
        id: item.id,
        category: item.category,
        subCategory: item.subCategory,
        name: item.name,
        selectedVariant: item.selectedVariant,
        finalPrice: item.finalPrice,
        quantity: item.quantity,
      })),
    };

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);
    const nextFieldErrors = collectCheckoutFieldErrors(form, form.deliveryMethod);

    setTouchedFields({
      recipientName: true,
      recipientPhone: true,
      recipientEmail: true,
      recipientAddress: true,
    });
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await createOrder(payload);

      if (form.paymentMethod === "online") {
        const nextPendingPayment = {
          orderId: response.orderId,
          orderNumber: response.orderNumber,
        };

        savePendingPayment(nextPendingPayment);
        setPendingPayment(nextPendingPayment);
        setSubmitMessage("訂單建立成功，正在前往綠界付款...");
        const checkoutResponse = await createEcpayCheckout(response.orderId);
        submitEcpayCheckout(checkoutResponse.action, checkoutResponse.fields);
        return;
      }

      clearPendingPayment();
      setPendingPayment(null);
      clearCart();
      setCompletedOrderNumber(response.orderNumber);
      setSubmitMessage("訂單建立成功，我們會儘快為你安排後續處理。");
    } catch (error) {
      const message = resolveCheckoutErrorMessage(error);
      const nextFieldErrors = resolveCheckoutFieldErrors(message, form.deliveryMethod);

      setFieldErrors(nextFieldErrors);
      setSubmitError(Object.keys(nextFieldErrors).length === 0 ? message : null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrderNumber) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-emerald-200 bg-emerald-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-600">
            Order Success
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            訂單建立成功
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            你的訂單編號是
            <span className="mx-2 font-bold text-zinc-900">{completedOrderNumber}</span>
            ，我們會儘快為你安排後續處理。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              返回首頁
            </Link>
            <Link
              to="/orders"
              className="inline-flex rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              訂單查詢
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">正在載入會員資料...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto flex max-w-5xl justify-center">
          <AuthRequiredPrompt
            description="請先登入或註冊，再繼續填寫收件資訊與送出訂單。"
            actions={
              <Link
                to="/cart"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                返回購物車
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Checkout
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            購物車目前是空的
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            先到產品列表挑選商品，再回來完成結帳流程。
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/fullMenu"
              className="inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              前往產品列表
            </Link>
            <Link
              to="/cart"
              className="inline-flex rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              返回購物車
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-6 border-b border-zinc-100 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            eyebrow="Checkout"
            title="填寫收件資訊與付款方式"
            description="確認商品內容後，填寫收件資訊與付款方式；如果選擇線上付款，送出後會直接前往綠界測試付款頁。"
          />

          <div className="grid grid-cols-3 gap-4 rounded-3xl bg-zinc-50 p-4 text-center">
            <div className="min-w-[88px]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                Items
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900">{totalItems}</p>
            </div>
            <div className="min-w-[88px]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                Lines
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900">{cart.length}</p>
            </div>
            <div className="min-w-[88px]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                Total
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900">
                {formatCurrency(finalTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="lg:hidden">
              <OrderSummary
                totalItems={totalItems}
                subtotal={subtotal}
                shippingFee={shippingFee}
                codFee={codFee}
                finalTotal={finalTotal}
                paymentMethod={form.paymentMethod}
              />
            </div>

            <section className="order-3 rounded-[1.75rem] bg-zinc-50 p-5 lg:order-none">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">
                  Contact
                </p>
                <h2 className="mt-2 text-xl font-black text-zinc-900">收件資訊</h2>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-900">
                    收件人姓名
                  </label>
                  <input
                    type="text"
                    value={form.recipientName}
                    onChange={(event) => handleFieldChange("recipientName", event.target.value)}
                    onBlur={() => handleFieldBlur("recipientName")}
                    required
                    placeholder="請輸入收件人姓名"
                    className={inputClassName}
                  />
                  {fieldErrors.recipientName && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {fieldErrors.recipientName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-900">
                    收件人電話
                  </label>
                  <input
                    type="tel"
                    value={form.recipientPhone}
                    onChange={(event) => handleFieldChange("recipientPhone", event.target.value)}
                    onBlur={() => handleFieldBlur("recipientPhone")}
                    required
                    placeholder="09xxxxxxxx"
                    className={inputClassName}
                  />
                  {fieldErrors.recipientPhone && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {fieldErrors.recipientPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-zinc-900">
                  Email
                </label>
                <input
                  type="email"
                  value={form.recipientEmail}
                  onChange={(event) => handleFieldChange("recipientEmail", event.target.value)}
                  onBlur={() => handleFieldBlur("recipientEmail")}
                  required
                  placeholder="you@example.com"
                  className={inputClassName}
                />
                {fieldErrors.recipientEmail && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {fieldErrors.recipientEmail}
                  </p>
                )}
              </div>

              <div className="mt-4">
                {!isPickup ? (
                  <>
                    <label className="mb-2 block text-sm font-semibold text-zinc-900">
                      收件地址
                    </label>
                    <input
                      type="text"
                      value={form.recipientAddress}
                      onChange={(event) => handleFieldChange("recipientAddress", event.target.value)}
                      onBlur={() => handleFieldBlur("recipientAddress")}
                      required
                      placeholder="請輸入完整收件地址"
                      className={inputClassName}
                    />
                    {fieldErrors.recipientAddress && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {fieldErrors.recipientAddress}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-4 rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-4">
                    <div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">門市自取資訊</p>
                        <div className="mt-1 space-y-2">
                          <p className="text-xs leading-6 text-zinc-500">
                            門市自取不需填寫收件地址。
                            <br />
                            店家會依據收件人姓名、電話與 Email 與你聯繫取件事宜。
                          </p>
                          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
                            <CircleAlert className="h-3.5 w-3.5" />
                            請確認手機號碼是否填寫正確
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="order-1 rounded-[1.75rem] bg-zinc-50 p-5 lg:order-none">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">
                Delivery
              </p>
              <h2 className="mt-2 text-xl font-black text-zinc-900">配送方式</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleDeliveryMethodChange("home")}
                  className={`rounded-3xl border px-5 py-5 text-left transition-colors ${
                    form.deliveryMethod === "home"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-orange-300"
                  }`}
                >
                  <p className="text-sm font-bold">宅配到府</p>
                  <p
                    className={`mt-2 text-xs leading-6 ${
                      form.deliveryMethod === "home" ? "text-white/75" : "text-zinc-500"
                    }`}
                  >
                    黑貓低溫宅配，依訂單金額自動計算運費，線上付款與貨到付款皆可選擇。
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeliveryMethodChange("pickup")}
                  className={`rounded-3xl border px-5 py-5 text-left transition-colors ${
                    form.deliveryMethod === "pickup"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-orange-300"
                  }`}
                >
                  <p className="text-sm font-bold">門市自取</p>
                  <p
                    className={`mt-2 text-xs leading-6 ${
                      form.deliveryMethod === "pickup" ? "text-white/75" : "text-zinc-500"
                    }`}
                  >
                    可先與店家確認到店時間，門市自取不另外收取運費與貨到付款手續費。
                  </p>
                </button>
              </div>
            </section>

            <section className="order-2 rounded-[1.75rem] bg-zinc-50 p-5 lg:order-none">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">
                Payment
              </p>
              <h2 className="mt-2 text-xl font-black text-zinc-900">付款方式</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleFieldChange("paymentMethod", "online")}
                  className={`rounded-3xl border px-5 py-5 text-left transition-colors ${
                    form.paymentMethod === "online"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-orange-300"
                  }`}
                >
                  <p className="text-sm font-bold">線上付款</p>
                  <p
                    className={`mt-2 text-xs leading-6 ${
                      form.paymentMethod === "online" ? "text-white/75" : "text-zinc-500"
                    }`}
                  >
                    送出訂單後會直接前往綠界 sandbox 付款頁。
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange("paymentMethod", "cod")}
                  className={`rounded-3xl border px-5 py-5 text-left transition-colors ${
                    form.paymentMethod === "cod"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-orange-300"
                  }`}
                >
                  <p className="text-sm font-bold">貨到付款</p>
                  <p
                    className={`mt-2 text-xs leading-6 ${
                      form.paymentMethod === "cod" ? "text-white/75" : "text-zinc-500"
                    }`}
                  >
                    系統會依商品金額計算手續費。
                  </p>
                </button>
              </div>
            </section>

            <section className="order-4 rounded-[1.75rem] bg-zinc-50 p-5 lg:order-none">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">
                Notes
              </p>
              <h2 className="mt-2 text-xl font-black text-zinc-900">備註</h2>

              <div className="mt-5">
                <textarea
                  value={form.note}
                  onChange={(event) => handleFieldChange("note", event.target.value)}
                  placeholder="如果有希望到貨日期、取貨站所或其他補充資訊，可以在這裡備註。"
                  className={textareaClassName}
                />
              </div>
            </section>

            {submitError && (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {submitMessage && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                {submitMessage}
              </div>
            )}

            {pendingPayment && form.paymentMethod === "online" && (
              <div className="rounded-3xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-700">
                目前有一筆尚未完成付款的訂單
                <span className="mx-1 font-semibold text-zinc-900">
                  {pendingPayment.orderNumber}
                </span>
                ，若剛剛中途離開綠界頁面，可直接再次前往付款。
              </div>
            )}

            <div className="order-5 flex flex-col gap-3 pt-2 sm:flex-row lg:order-none">
              <Button
                type={pendingPayment && form.paymentMethod === "online" ? "button" : "submit"}
                onClick={
                  pendingPayment && form.paymentMethod === "online"
                    ? handleResumePendingPayment
                    : undefined
                }
                disabled={isSubmitting}
                className="h-12 rounded-full bg-zinc-900 px-6 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {isSubmitting
                  ? "送出中..."
                  : pendingPayment && form.paymentMethod === "online"
                    ? "再次前往付款"
                    : form.paymentMethod === "online"
                      ? "前往付款"
                      : "結帳送出"}
              </Button>
              <Link
                to="/cart"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                返回購物車
              </Link>
            </div>
          </form>

          <div className="hidden lg:block">
            <OrderSummary
              totalItems={totalItems}
              subtotal={subtotal}
              shippingFee={shippingFee}
              codFee={codFee}
              finalTotal={finalTotal}
              paymentMethod={form.paymentMethod}
            />
          </div>
        </div>
      </div>
    </main>
  );
};






