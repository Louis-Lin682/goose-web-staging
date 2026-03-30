import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getAdminNotifications,
  markAllNotificationsAsRead as markAllNotificationsAsReadRequest,
  markNotificationAsRead as markNotificationAsReadRequest,
} from "../lib/notifications";
import { logout as logoutUser } from "../lib/auth";
import { emitSessionTimeout } from "../lib/session-timeout";
import type { AdminNotificationEntry } from "../types/notification";
import { useAuth } from "./useAuth";
import { AdminNotificationsContext } from "./AdminNotificationsContext";

const POLL_INTERVAL_MS = 12000;
const NOTIFICATION_SOUND_PATH = "/mp3/newmessage.mp3";
const AUTO_NOTIFICATION_REFRESH_DISABLED = false;
const SERVER_ERROR_BACKOFF_INITIAL_MS = 15000;
const SERVER_ERROR_BACKOFF_MAX_MS = 60000;

export const AdminNotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isAuthReady, isAuthenticated, user, signOut } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotificationEntry[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const hasHydratedRef = useRef(false);
  const previousUnreadCountRef = useRef(0);
  const previousUnreadNotificationIdsRef = useRef<string[]>([]);
  const latestFetchIdRef = useRef(0);
  const authActivatedAtRef = useRef(0);
  const serverErrorBackoffMsRef = useRef(0);
  const serverErrorRetryAtRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSoundEnabledRef = useRef(false);
  const isSoundUnlockedRef = useRef(false);

  const isAdminActive = isAuthReady && isAuthenticated && Boolean(user?.isAdmin);

  const playStoredAudio = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 0.85;
    await audio.play();
  };

  const playNotificationSound = async () => {
    if (!isSoundEnabledRef.current || !isSoundUnlockedRef.current) {
      return;
    }

    try {
      await playStoredAudio();
    } catch {
      isSoundUnlockedRef.current = false;
    }
  };

  const enableNotificationSound = async () => {
    try {
      await playStoredAudio();
      isSoundUnlockedRef.current = true;
      isSoundEnabledRef.current = true;
      setIsSoundEnabled(true);
    } catch {
      isSoundUnlockedRef.current = false;
      isSoundEnabledRef.current = false;
      setIsSoundEnabled(false);
    }
  };

  const disableNotificationSound = () => {
    isSoundEnabledRef.current = false;
    setIsSoundEnabled(false);
    isSoundUnlockedRef.current = false;
  };

  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND_PATH);
    audio.preload = "auto";
    audio.volume = 0.85;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  const refreshNotifications = async (options?: { silent?: boolean }) => {
    if (!isAdminActive) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (options?.silent && serverErrorRetryAtRef.current > Date.now()) {
      return;
    }

    if (!hasHydratedRef.current || !options?.silent) {
      setIsLoading(true);
    }
    const fetchId = latestFetchIdRef.current + 1;
    latestFetchIdRef.current = fetchId;

    try {
      const response = await getAdminNotifications();

      if (fetchId !== latestFetchIdRef.current) {
        return;
      }

      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setError(null);
      serverErrorBackoffMsRef.current = 0;
      serverErrorRetryAtRef.current = 0;

      const unreadNotificationIds = response.notifications
        .filter((notification) => !notification.isRead)
        .map((notification) => notification.id);
      const hasNewUnreadNotification =
        hasHydratedRef.current &&
        unreadNotificationIds.some(
          (notificationId) =>
            !previousUnreadNotificationIdsRef.current.includes(notificationId),
        );

      if (hasNewUnreadNotification) {
        void playNotificationSound();
      }

      previousUnreadCountRef.current = response.unreadCount;
      previousUnreadNotificationIdsRef.current = unreadNotificationIds;
      hasHydratedRef.current = true;
    } catch (fetchError) {
      if (fetchId !== latestFetchIdRef.current) {
        return;
      }

      const message =
        fetchError instanceof Error ? fetchError.message : "通知載入失敗。";

      setError(message);
      const isServerUnavailable =
        fetchError instanceof Error &&
        (fetchError.message === "Request timeout" ||
          fetchError.message.includes("500") ||
          fetchError.message.includes("502") ||
          fetchError.message.includes("503") ||
          fetchError.message.includes("504") ||
          fetchError.message.toLowerCase().includes("bad gateway"));

      if (isServerUnavailable) {
        const nextBackoffMs = serverErrorBackoffMsRef.current
          ? Math.min(
              serverErrorBackoffMsRef.current * 2,
              SERVER_ERROR_BACKOFF_MAX_MS,
            )
          : SERVER_ERROR_BACKOFF_INITIAL_MS;

        serverErrorBackoffMsRef.current = nextBackoffMs;
        serverErrorRetryAtRef.current = Date.now() + nextBackoffMs;
        return;
      }

      if (
        fetchError instanceof Error &&
        (fetchError.message.includes("401") ||
          fetchError.message.toLowerCase().includes("unauthorized"))
      ) {
        if (AUTO_NOTIFICATION_REFRESH_DISABLED) {
          return;
        }

        // Give freshly-created sessions a brief window before treating a 401
        // as a hard timeout; cross-site cookies can lag behind the redirect.
        if (Date.now() - authActivatedAtRef.current < 3000) {
          return;
        }

        setNotifications([]);
        setUnreadCount(0);
        hasHydratedRef.current = false;
        previousUnreadCountRef.current = 0;
        previousUnreadNotificationIdsRef.current = [];

        try {
          await logoutUser();
        } catch {
          // Ignore logout network errors and still reset local auth state.
        }

        signOut();
        emitSessionTimeout();
        return;
      }
    } finally {
      if (fetchId === latestFetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await markNotificationAsReadRequest(notificationId);
    await refreshNotifications({ silent: true });
  };

  const markNotificationsForOrderAsRead = async (orderId: string) => {
    const unreadOrderNotifications = notifications.filter(
      (notification) => notification.orderId === orderId && !notification.isRead,
    );

    if (unreadOrderNotifications.length === 0) {
      return;
    }

    await Promise.all(
      unreadOrderNotifications.map((notification) =>
        markNotificationAsReadRequest(notification.id),
      ),
    );
    await refreshNotifications({ silent: true });
  };

  const markAllNotificationsAsRead = async () => {
    await markAllNotificationsAsReadRequest();
    await refreshNotifications({ silent: true });
  };

  useEffect(() => {
    hasHydratedRef.current = false;
    previousUnreadCountRef.current = 0;
    previousUnreadNotificationIdsRef.current = [];
    latestFetchIdRef.current = 0;
    serverErrorBackoffMsRef.current = 0;
    serverErrorRetryAtRef.current = 0;

    if (!isAdminActive) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
      authActivatedAtRef.current = 0;
      return;
    }

    authActivatedAtRef.current = Date.now();

    if (AUTO_NOTIFICATION_REFRESH_DISABLED) {
      return;
    }

    const initialTimer = window.setTimeout(() => {
      void refreshNotifications();
    }, 1200);

    const timer = window.setInterval(() => {
      void refreshNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [isAdminActive, signOut]);

  useEffect(() => {
    if (!isAdminActive || AUTO_NOTIFICATION_REFRESH_DISABLED) {
      return;
    }

    const handleFocus = () => {
      void refreshNotifications({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAdminActive]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      isSoundEnabled,
      enableNotificationSound,
      disableNotificationSound,
      refreshNotifications,
      markNotificationAsRead,
      markNotificationsForOrderAsRead,
      markAllNotificationsAsRead,
    }),
    [error, isLoading, isSoundEnabled, notifications, unreadCount],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
};
