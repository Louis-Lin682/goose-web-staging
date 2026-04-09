import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { getCurrentUser } from "../lib/auth";
import { useAuth } from "../context/useAuth";

const LINE_HYDRATE_MAX_ATTEMPTS = 10;
const LINE_HYDRATE_RETRY_DELAY_MS = 1500;

export const LineAuthComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextPath = searchParams.get("next") ?? "/";
  const explicitStatus = searchParams.get("status");

  useEffect(() => {
    if (explicitStatus === "error") {
      setErrorMessage(
        searchParams.get("message") ?? "LINE 登入失敗，請稍後再試。",
      );
      return;
    }

    let isMounted = true;
    let isHydrating = false;
    let timeoutId: number | null = null;
    let completed = false;

    const waitForRetry = (attempt: number) => {
      if (!isMounted || completed) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void hydrateLineUser(attempt + 1);
      }, LINE_HYDRATE_RETRY_DELAY_MS);
    };

    const hydrateLineUser = async (attempt = 0) => {
      if (!isMounted || completed || isHydrating) {
        return;
      }

      isHydrating = true;

      try {
        const response = await getCurrentUser();

        if (!isMounted || completed) {
          return;
        }

        if (response.user) {
          completed = true;
          signIn(response.user);
          navigate(response.user.isAdmin ? "/admin/notifications" : nextPath, {
            replace: true,
          });
          return;
        }

        if (attempt < LINE_HYDRATE_MAX_ATTEMPTS - 1) {
          waitForRetry(attempt);
          return;
        }

        completed = true;
        setErrorMessage("LINE 登入完成後未能同步會員狀態，請稍後再試。");
      } catch (error) {
        if (!isMounted || completed) {
          return;
        }

        if (attempt < LINE_HYDRATE_MAX_ATTEMPTS - 1) {
          waitForRetry(attempt);
          return;
        }

        completed = true;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "LINE 登入失敗，請稍後再試。",
        );
      } finally {
        isHydrating = false;
      }
    };

    const resumeHydration = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      void hydrateLineUser();
    };

    void hydrateLineUser();

    window.addEventListener("pageshow", resumeHydration);
    window.addEventListener("focus", resumeHydration);
    document.addEventListener("visibilitychange", resumeHydration);

    return () => {
      isMounted = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("pageshow", resumeHydration);
      window.removeEventListener("focus", resumeHydration);
      document.removeEventListener("visibilitychange", resumeHydration);
    };
  }, [explicitStatus, navigate, nextPath, searchParams, signIn]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-3xl items-center justify-center px-6 py-28">
      <div className="w-full rounded-[2rem] border border-zinc-200 bg-white/90 p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.05)] backdrop-blur">
        {errorMessage ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-black text-zinc-900">
              LINE 登入失敗
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              {errorMessage}
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-900 px-6 text-sm font-semibold text-white transition-transform hover:bg-zinc-800 active:scale-[0.98]"
            >
              返回首頁
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <LoaderCircle className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="mt-6 text-3xl font-black text-zinc-900">
              正在完成 LINE 登入
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              正在同步會員資料與登入狀態，若頁面稍慢屬正常情況，請先稍候。
            </p>
          </>
        )}
      </div>
    </main>
  );
};
