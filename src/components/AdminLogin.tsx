import { type FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnvironmentInlineTag } from "./EnvironmentIndicator";
import { useAuth } from "../context/useAuth";
import { getCurrentUser, login as loginUser, logout as logoutUser } from "../lib/auth";
import type { AuthUser, LoginPayload } from "../types/auth";

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400";

type LoginFormState = {
  identifier: string;
  password: string;
  remember: boolean;
};

const initialLoginForm = (): LoginFormState => ({
  identifier: "",
  password: "",
  remember: true,
});

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const resolveAdminUser = async (loginUserCandidate: AuthUser | null) => {
  if (loginUserCandidate?.isAdmin) {
    return loginUserCandidate;
  }

  const retryDelays = [250, 500, 900];

  for (const delay of retryDelays) {
    await wait(delay);
    const currentUser = (await getCurrentUser()).user;

    if (currentUser?.isAdmin) {
      return currentUser;
    }
  }

  return loginUserCandidate;
};

export const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAuthReady, signIn, signOut } = useAuth();
  const [form, setForm] = useState<LoginFormState>(initialLoginForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const redirectTarget = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from && from.startsWith("/admin")) {
      return from;
    }

    return "/admin/notifications";
  }, [location.state]);

  if (isAuthReady && isAuthenticated && user?.isAdmin) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const payload: LoginPayload = {
      identifier: form.identifier.trim(),
      password: form.password,
      remember: form.remember,
    };

    try {
      const loginResponse = await loginUser(payload);
      const currentUser = await resolveAdminUser(loginResponse.user ?? null);

      if (!currentUser?.isAdmin) {
        await logoutUser().catch(() => undefined);
        signOut();
        setFeedback({
          type: "error",
          message: "管理員請改由後台登入頁登入。",
        });
        return;
      }

      signIn(currentUser);
      setFeedback({
        type: "success",
        message: "登入成功，正在進入後台...",
      });
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "後台登入失敗，請稍後再試。",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f5f1_0%,#ffffff_28%,#f5f6f8_100%)] px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.25rem] border border-white/60 bg-zinc-900 px-8 py-10 text-white shadow-[0_28px_90px_rgba(0,0,0,0.08)]">
            <div className="relative inline-flex">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-orange-400">
                Goose Admin
              </p>
              <EnvironmentInlineTag className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap" />
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
              後台登入入口
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-300">
              這裡是管理員專用登入頁。登入後即可查看通知、處理訂單、調整商品與會員資料，不需要再從前台會員彈窗進入後台。
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-white">管理權限分流更清楚</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">
                    一般會員從前台登入，管理員則從這個獨立入口登入，權限與操作情境會更直覺。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                <LockKeyhole className="mt-0.5 h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-white">登入流程更聚焦</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">
                    使用管理員帳號即可直接進入後台，不再混用前台登入流程，整體也更接近正式站。
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-orange-300 transition-colors hover:text-orange-200"
            >
              <ArrowLeft className="h-4 w-4" />
              返回前台首頁
            </Link>
          </section>

          <section className="rounded-[2.25rem] border border-zinc-200 bg-white/92 px-8 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-orange-600">
              Admin Login
            </p>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
              管理員登入
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              請輸入管理員電話、Email 或帳號與密碼。成功登入後會直接進入後台通知頁。
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-900">
                  電話、Email 或帳號
                </label>
                <input
                  type="text"
                  value={form.identifier}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, identifier: event.target.value }))
                  }
                  required
                  placeholder="請輸入管理員電話、Email 或帳號"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-900">
                  密碼
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  required
                  placeholder="請輸入密碼"
                  className={inputClassName}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-zinc-500">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, remember: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  記住我
                </label>
                <Link
                  to="/forgot-password"
                  className="font-semibold text-orange-600 transition-colors hover:text-orange-500"
                >
                  忘記密碼？
                </Link>
              </div>

              {feedback && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    feedback.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-red-200 bg-red-50 text-red-600"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl bg-zinc-900 text-sm text-white transition-transform hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:active:scale-100"
              >
                {isSubmitting ? "登入中..." : "登入後台"}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};
