import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getCurrentUser, logout as logoutUser } from "../lib/auth";
import { SESSION_TIMEOUT_EVENT } from "../lib/session-timeout";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 15 * 1000;
const SESSION_KEEPALIVE_MS = 5 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_STORAGE_KEY = "goose_last_activity_at";

const readLastActivity = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const writeLastActivity = (timestamp: number) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, `${timestamp}`);
};

const clearLastActivity = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVITY_STORAGE_KEY);
};

export const SessionTimeoutManager = () => {
  const navigate = useNavigate();
  const { isAuthReady, isAuthenticated, signOut } = useAuth();
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastPersistedRef = useRef(0);
  const lastKeepAliveRef = useRef(0);
  const isHandlingTimeoutRef = useRef(false);
  const hasShownTimeoutModalRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      clearLastActivity();
      isHandlingTimeoutRef.current = false;
      hasShownTimeoutModalRef.current = false;
      lastKeepAliveRef.current = 0;
      return;
    }

    const showTimeoutModal = () => {
      if (hasShownTimeoutModalRef.current) {
        return;
      }

      hasShownTimeoutModalRef.current = true;
      signOut();
      clearLastActivity();
      setIsTimeoutModalOpen(true);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const persistActivity = (force = false) => {
      const now = Date.now();

      if (!force && now - lastPersistedRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastPersistedRef.current = now;
      writeLastActivity(now);
    };

    const keepSessionAlive = async (force = false) => {
      const now = Date.now();

      if (!force && now - lastKeepAliveRef.current < SESSION_KEEPALIVE_MS) {
        return;
      }

      lastKeepAliveRef.current = now;

      try {
        const response = await getCurrentUser();

        if (!response.user) {
          showTimeoutModal();
        }
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.toLowerCase().includes("unauthorized"))
        ) {
          showTimeoutModal();
        }
      }
    };

    const handleIdleTimeout = async () => {
      if (isHandlingTimeoutRef.current) {
        return;
      }

      isHandlingTimeoutRef.current = true;

      try {
        await logoutUser();
      } catch {
        // Ignore network errors here; local logout still matters for UX.
      } finally {
        signOut();
        clearLastActivity();
        lastKeepAliveRef.current = 0;
        hasShownTimeoutModalRef.current = true;
        setIsTimeoutModalOpen(true);

        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    const scheduleTimeout = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      const lastActivity = readLastActivity() ?? Date.now();
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivity);

      if (remaining <= 0) {
        void handleIdleTimeout();
        return;
      }

      timerRef.current = window.setTimeout(() => {
        void handleIdleTimeout();
      }, remaining);
    };

    const checkIdleState = () => {
      const lastActivity = readLastActivity();

      if (!lastActivity) {
        return;
      }

      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        void handleIdleTimeout();
      }
    };

    const markActivity = () => {
      if (isHandlingTimeoutRef.current) {
        return;
      }

      persistActivity();
      scheduleTimeout();
      void keepSessionAlive();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const lastActivity = readLastActivity();

      if (lastActivity && Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        void handleIdleTimeout();
        return;
      }

      persistActivity(true);
      scheduleTimeout();
      void keepSessionAlive(true);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACTIVITY_STORAGE_KEY) {
        scheduleTimeout();
      }
    };

    const handleForcedTimeout = () => {
      showTimeoutModal();
    };

    persistActivity(true);
    void keepSessionAlive(true);
    scheduleTimeout();
    intervalRef.current = window.setInterval(checkIdleState, IDLE_CHECK_INTERVAL_MS);

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(SESSION_TIMEOUT_EVENT, handleForcedTimeout);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SESSION_TIMEOUT_EVENT, handleForcedTimeout);
    };
  }, [isAuthReady, isAuthenticated, signOut]);

  if (!isTimeoutModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[130] bg-black/45 px-6 py-8">
      <div className="mx-auto flex h-full max-w-md items-center justify-center">
        <div className="w-full rounded-[2rem] bg-white p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
            Session
          </p>
          <h2 className="mt-3 text-2xl font-black text-zinc-900">
            閒置過久，已自動登出
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            已超過 30 分鐘沒有操作，系統已為了安全性自動登出。
            請重新登入後再繼續使用。
          </p>
          <button
            type="button"
            onClick={() => {
              setIsTimeoutModalOpen(false);
              hasShownTimeoutModalRef.current = false;
              navigate("/", { replace: true });
            }}
            className="mt-6 h-12 w-full rounded-full bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
};
