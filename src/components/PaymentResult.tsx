import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/useCart";

type PaymentResultState = "success" | "failed";

const CART_STORAGE_PREFIX = "goose.cart.items";

const clearStoredCarts = () => {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key) {
      continue;
    }

    if (key === CART_STORAGE_PREFIX || key.startsWith(`${CART_STORAGE_PREFIX}.`)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

const getResultState = (rtnCode: string | null): PaymentResultState => {
  if (rtnCode === "1") {
    return "success";
  }

  return "failed";
};

const getHeading = (state: PaymentResultState) =>
  state === "success" ? "付款完成" : "付款失敗";

const getMessage = (state: PaymentResultState) => {
  if (state === "success") {
    return "付款已完成，訂單已送出並進入待確認狀態。";
  }

  return "本次付款未成功，若仍想購買，請重新建立一筆新的交易。";
};

const getAccentClasses = (state: PaymentResultState) =>
  state === "success"
    ? {
        card: "border-emerald-200 bg-emerald-50",
        tag: "text-emerald-600",
      }
    : {
        card: "border-rose-200 bg-rose-50",
        tag: "text-rose-600",
      };

export const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [hasHandledSuccess, setHasHandledSuccess] = useState(false);

  const result = useMemo(() => {
    const rtnCode = searchParams.get("RtnCode");
    const rtnMsg = searchParams.get("RtnMsg");
    const tradeNo = searchParams.get("TradeNo");
    const merchantTradeNo = searchParams.get("MerchantTradeNo");
    const orderNumber =
      searchParams.get("CustomField2") ?? merchantTradeNo ?? null;
    const paymentType = searchParams.get("PaymentType");
    const state = getResultState(rtnCode);

    return {
      state,
      rtnCode,
      rtnMsg,
      orderNumber,
      tradeNo,
      paymentType,
      isSuccess: state === "success",
    };
  }, [searchParams]);

  useEffect(() => {
    if (!result.isSuccess || hasHandledSuccess) {
      return;
    }

    clearStoredCarts();
    clearCart();
    setHasHandledSuccess(true);
  }, [clearCart, hasHandledSuccess, result.isSuccess]);

  const accentClasses = getAccentClasses(result.state);

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40">
      <div
        className={`mx-auto max-w-4xl rounded-[2rem] border px-8 py-16 text-center ${accentClasses.card}`}
      >
        <p className={`text-xs font-black uppercase tracking-[0.4em] ${accentClasses.tag}`}>
          Payment Result
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
          {getHeading(result.state)}
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">{getMessage(result.state)}</p>

        {result.orderNumber && (
          <p className="mt-4 text-sm text-zinc-600">
            訂單編號
            <span className="mx-2 font-bold text-zinc-900">{result.orderNumber}</span>
          </p>
        )}

        {result.tradeNo && (
          <p className="mt-2 text-sm text-zinc-600">
            綠界交易編號
            <span className="mx-2 font-bold text-zinc-900">{result.tradeNo}</span>
          </p>
        )}

        {result.paymentType && (
          <p className="mt-2 text-sm text-zinc-600">
            付款方式
            <span className="mx-2 font-bold text-zinc-900">{result.paymentType}</span>
          </p>
        )}

        {result.rtnCode && !result.isSuccess && (
          <p className="mt-2 text-sm text-zinc-600">
            交易代碼
            <span className="mx-2 font-bold text-zinc-900">{result.rtnCode}</span>
          </p>
        )}

        {result.rtnMsg && !result.isSuccess && (
          <p className="mt-2 text-sm text-zinc-600">
            失敗訊息
            <span className="mx-2 font-bold text-zinc-900">{result.rtnMsg}</span>
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/orders"
            className="inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            訂單查詢
          </Link>
          <Link
            to="/"
            className="inline-flex rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </main>
  );
};
