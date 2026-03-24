import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  forgotPassword as forgotPasswordRequest,
  resetPassword as resetPasswordRequest,
} from "../lib/auth";

type RequestState = {
  identifier: string;
};

type ResetState = {
  token: string;
  password: string;
  confirmPassword: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400";

const initialRequestState = (): RequestState => ({
  identifier: "",
});

const initialResetState = (): ResetState => ({
  token: "",
  password: "",
  confirmPassword: "",
});

const formatExpiry = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token") ?? "";
  const [requestForm, setRequestForm] = useState<RequestState>(initialRequestState);
  const [resetForm, setResetForm] = useState<ResetState>(() => ({
    ...initialResetState(),
    token: tokenFromQuery,
  }));
  const [requestFeedback, setRequestFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [resetFeedback, setResetFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [debugResetLink, setDebugResetLink] = useState<string | null>(null);
  const [debugResetExpiry, setDebugResetExpiry] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenFromQuery) {
      return;
    }

    setResetForm((prev) => ({
      ...prev,
      token: tokenFromQuery,
    }));
  }, [tokenFromQuery]);

  const formattedDebugExpiry = useMemo(
    () => formatExpiry(debugResetExpiry ?? undefined),
    [debugResetExpiry],
  );
  const canReset = Boolean(tokenFromQuery || resetForm.token.trim());

  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRequestSubmitting(true);
    setRequestFeedback(null);
    setDebugResetLink(null);
    setDebugResetExpiry(null);

    try {
      const response = await forgotPasswordRequest({
        identifier: requestForm.identifier.trim(),
      });

      setRequestFeedback({
        type: "success",
        message: response.message,
      });

      if (response.resetToken) {
        setResetForm((prev) => ({
          ...prev,
          token: response.resetToken ?? prev.token,
        }));
        setDebugResetLink(response.resetLink ?? null);
        setDebugResetExpiry(response.expiresAt ?? null);
      }
    } catch (error) {
      setRequestFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "送出失敗，請稍後再試一次。",
      });
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (resetForm.password.length < 8) {
      setResetFeedback({
        type: "error",
        message: "新密碼至少需要 8 個字元。",
      });
      return;
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      setResetFeedback({
        type: "error",
        message: "兩次輸入的新密碼不一致。",
      });
      return;
    }

    setIsResetSubmitting(true);
    setResetFeedback(null);

    try {
      const response = await resetPasswordRequest({
        token: resetForm.token.trim(),
        password: resetForm.password,
      });

      setResetFeedback({
        type: "success",
        message: response.message,
      });
      setResetForm({
        token: "",
        password: "",
        confirmPassword: "",
      });
      setDebugResetLink(null);
      setDebugResetExpiry(null);
    } catch (error) {
      setResetFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "重設失敗，請重新確認 reset token。",
      });
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-5xl items-center px-6 py-28">
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-zinc-200 bg-white/90 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.05)] backdrop-blur lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.36em] text-orange-600">
            Account Recovery
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-5xl">
            忘記密碼
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600">
            先輸入註冊用 Email 取得重設連結，收到信後再回來設定新密碼。
          </p>

          <div className="mt-8">
            {!canReset ? (
              <form className="space-y-5" onSubmit={handleRequestSubmit}>
                <label className="block text-sm font-semibold text-zinc-900">
                  Email
                </label>
                <input
                  type="text"
                  required
                  value={requestForm.identifier}
                  onChange={(event) =>
                    setRequestForm({ identifier: event.target.value })
                  }
                  placeholder="you@example.com"
                  className={inputClassName}
                />

                {requestFeedback && (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      requestFeedback.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    {requestFeedback.message}
                  </div>
                )}

                {debugResetLink && (
                  <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-zinc-700">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900">
                      <Mail className="h-4 w-4 text-orange-600" />
                      測試模式 Reset Link
                    </div>
                    <p className="mt-3 break-all leading-6 text-zinc-600">
                      {debugResetLink}
                    </p>
                    {formattedDebugExpiry && (
                      <p className="mt-2 text-xs text-zinc-500">
                        有效期限至 {formattedDebugExpiry}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isRequestSubmitting}
                  className="h-12 w-full rounded-2xl bg-zinc-900 text-sm text-white transition-transform hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:active:scale-100"
                >
                  {isRequestSubmitting ? "送出中..." : "取得重設憑證"}
                </Button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleResetSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-900">
                    重設憑證
                  </label>
                  <input
                    type="text"
                    required
                    value={resetForm.token}
                    onChange={(event) =>
                      setResetForm((prev) => ({
                        ...prev,
                        token: event.target.value,
                      }))
                    }
                    placeholder="貼上 token 或從 reset link 進來"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-900">
                    新密碼
                  </label>
                  <input
                    type="password"
                    required
                    value={resetForm.password}
                    onChange={(event) =>
                      setResetForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    placeholder="至少 8 個字元"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-900">
                    確認新密碼
                  </label>
                  <input
                    type="password"
                    required
                    value={resetForm.confirmPassword}
                    onChange={(event) =>
                      setResetForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="再次輸入新密碼"
                    className={inputClassName}
                  />
                </div>

                {resetFeedback && (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      resetFeedback.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    {resetFeedback.message}
                  </div>
                )}

                {resetFeedback?.type === "success" ? (
                  <Link
                    to="/"
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white transition-transform hover:bg-zinc-800 active:scale-[0.98]"
                  >
                    返回首頁
                  </Link>
                ) : (
                  <Button
                    type="submit"
                    disabled={isResetSubmitting}
                    className="h-12 w-full rounded-2xl bg-zinc-900 text-sm text-white transition-transform hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:active:scale-100"
                  >
                    {isResetSubmitting ? "重設中..." : "更新密碼"}
                  </Button>
                )}
              </form>
            )}
          </div>
        </section>

      </div>
    </main>
  );
};
