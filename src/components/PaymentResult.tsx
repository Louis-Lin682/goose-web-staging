import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/useCart";
import {
  clearPendingPayment,
  getPendingPayment,
  simulateEcpayPaid,
} from "../lib/orders";

const getMessage = (isSuccess: boolean) =>
  isSuccess
    ? "付款已完成，訂單已送出並進入待確認狀態。"
    : "付款尚未完成，你可以回訂單查詢確認目前狀態。";

export const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [simulatedOrderNumber, setSimulatedOrderNumber] = useState<string | null>(null);
  const hasAutoTriggeredRef = useRef(false);
  const hasHandledSuccessRef = useRef(false);

  const pendingPayment = useMemo(() => getPendingPayment(), []);
  const params = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams],
  );

  const result = useMemo(() => {
    const rtnCode = searchParams.get("RtnCode");
    const tradeNo = searchParams.get("TradeNo");
    const merchantTradeNo = searchParams.get("MerchantTradeNo");
    const orderNumber =
      simulatedOrderNumber ??
      searchParams.get("CustomField2") ??
      merchantTradeNo ??
      pendingPayment?.orderNumber ??
      null;
    const paymentType = searchParams.get("PaymentType");
    const isSuccess = rtnCode === "1" || Boolean(tradeNo) || Boolean(simulatedOrderNumber);

    return {
      isSuccess,
      orderNumber,
      tradeNo,
      paymentType,
    };
  }, [pendingPayment?.orderNumber, searchParams, simulatedOrderNumber]);

  useEffect(() => {
    console.log("ECPay result params:", params);

    if (result.isSuccess && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true;
      clearPendingPayment();
      clearCart();
    }
  }, [clearCart, params, result.isSuccess]);

  const handleSimulatePaid = async () => {
    if (!pendingPayment?.orderId) {
      return;
    }

    setIsSimulating(true);
    setSimulateError(null);

    try {
      const response = await simulateEcpayPaid(pendingPayment.orderId);
      setSimulatedOrderNumber(response.orderNumber);
    } catch (error) {
      setSimulateError(
        error instanceof Error ? error.message : "模擬付款失敗，請稍後再試一次。",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    if (hasAutoTriggeredRef.current) {
      return;
    }

    if (result.isSuccess || !pendingPayment?.orderId) {
      return;
    }

    hasAutoTriggeredRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void handleSimulatePaid();
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingPayment?.orderId, result.isSuccess]);

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40">
      <div
        className={`mx-auto max-w-4xl rounded-[2rem] border px-8 py-16 text-center ${
          result.isSuccess
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <p
          className={`text-xs font-black uppercase tracking-[0.4em] ${
            result.isSuccess ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          Payment Result
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
          {result.isSuccess ? "付款完成" : "付款未完成"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">{getMessage(result.isSuccess)}</p>

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

        {isSimulating && !result.isSuccess && (
          <p className="mt-6 text-sm font-medium text-sky-700">
            正在補上開發環境的模擬付款成功...
          </p>
        )}

        <div className="mt-8 rounded-[1.5rem] border border-zinc-200 bg-white/70 p-5 text-left">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-zinc-500">
            Debug Params
          </p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all text-sm leading-6 text-zinc-700">
            {JSON.stringify(params, null, 2)}
          </pre>
        </div>

        {import.meta.env.DEV && !result.isSuccess && pendingPayment && (
          <div className="mt-6 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5 text-left">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-sky-600">
              Dev Tools
            </p>
            <p className="mt-3 text-sm leading-7 text-sky-900">
              如果綠界 sandbox 測試卡流程卡住，系統會先自動補一次模擬付款成功；如果還是沒成功，你也可以手動再試一次。
            </p>
            {simulateError && (
              <p className="mt-3 text-sm font-medium text-red-600">{simulateError}</p>
            )}
            <button
              type="button"
              onClick={() => void handleSimulatePaid()}
              disabled={isSimulating}
              className="mt-4 inline-flex rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {isSimulating ? "模擬付款中..." : "重新模擬付款成功"}
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/orders"
            className="inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            前往訂單查詢
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
