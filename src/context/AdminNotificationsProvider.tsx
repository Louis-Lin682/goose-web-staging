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

const playNotificationSound = () => {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  try {
    const audioContext = new AudioContextClass();
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.18, audioContext.currentTime);
    masterGain.connect(audioContext.destination);

    const playTone = (
      startTime: number,
      fromFrequency: number,
      toFrequency: number,
    ) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(fromFrequency, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        toFrequency,
        startTime + 0.18,
      );

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

      oscillator.connect(gainNode);
      gainNode.connect(masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.24);
    };

    const firstToneAt = audioContext.currentTime;
    playTone(firstToneAt, 1040, 740);
    playTone(firstToneAt + 0.26, 1240, 880);

    window.setTimeout(() => {
      void audioContext.close().catch(() => undefined);
    }, 800);
  } catch {
    // Ignore browser sound playback issues and keep notification polling working.
  }
};

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
  const hasHydratedRef = useRef(false);
  const previousUnreadCountRef = useRef(0);
  const latestFetchIdRef = useRef(0);

  const isAdminActive = isAuthReady && isAuthenticated && Boolean(user?.isAdmin);

  const refreshNotifications = async (options?: { silent?: boolean }) => {
    if (!isAdminActive) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
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

      if (
        hasHydratedRef.current &&
        response.unreadCount > previousUnreadCountRef.current
      ) {
        playNotificationSound();
      }

      previousUnreadCountRef.current = response.unreadCount;
      hasHydratedRef.current = true;
    } catch (fetchError) {
      if (fetchId !== latestFetchIdRef.current) {
        return;
      }

      const message =
        fetchError instanceof Error ? fetchError.message : "通知載入失敗。";

      setError(message);

      if (
        fetchError instanceof Error &&
        (fetchError.message.includes("401") ||
          fetchError.message.toLowerCase().includes("unauthorized"))
      ) {
        setNotifications([]);
        setUnreadCount(0);
        hasHydratedRef.current = false;
        previousUnreadCountRef.current = 0;

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
    latestFetchIdRef.current = 0;

    if (!isAdminActive) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    void refreshNotifications();

    const timer = window.setInterval(() => {
      void refreshNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAdminActive, signOut]);

  useEffect(() => {
    if (!isAdminActive) {
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
      refreshNotifications,
      markNotificationAsRead,
      markNotificationsForOrderAsRead,
      markAllNotificationsAsRead,
    }),
    [error, isLoading, notifications, unreadCount],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
};
