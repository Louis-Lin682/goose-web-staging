import { useMemo, useState } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useAdminNotifications } from "../context/useAdminNotifications";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const AdminNotifications = () => {
  const navigate = useNavigate();
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    error: notificationsError,
    isSoundEnabled,
    enableNotificationSound,
    disableNotificationSound,
    markNotificationAsRead,
  } = useAdminNotifications();
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const groupedNotifications = useMemo(
    () => ({
      unread: notifications.filter((notification) => !notification.isRead),
      read: notifications.filter((notification) => notification.isRead),
    }),
    [notifications],
  );
  const latestNotification = groupedNotifications.unread[0] ?? null;
  const readCount = Math.max(notifications.length - unreadCount, 0);

  const markAsRead = async (notificationId: string) => {
    setMarkingNotificationId(notificationId);
    setActionError(null);

    try {
      await markNotificationAsRead(notificationId);
    } catch (markError) {
      setActionError(markError instanceof Error ? markError.message : "標記通知失敗。");
    } finally {
      setMarkingNotificationId(null);
    }
  };


  const openOrderFromNotification = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  const navigateToOrder = async (
    notificationId: string,
    orderNumber: string,
    isRead: boolean,
  ) => {
    try {
      await openOrderFromNotification(notificationId, isRead);
    } catch {
      return;
    }

    navigate(`/admin/orders?focusOrder=${encodeURIComponent(orderNumber)}`);
  };

  const error = actionError ?? notificationsError;

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">通知載入中...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40 lg:h-full lg:overflow-hidden lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <div className="shrink-0">
        <section className="mb-8 rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <p class="text-xs font-black uppercase tracking-[0.4em] text-orange-600">Admin</p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black text-zinc-900">新訂單通知</h2>
                <button
                  type="button"
                  onClick={() =>
                    void (isSoundEnabled
                      ? Promise.resolve(disableNotificationSound())
                      : enableNotificationSound())
                  }
                  aria-label={
                    isSoundEnabled
                      ? "通知音效已開啟，點擊可關閉"
                      : "通知音效已關閉，點擊可開啟"
                  }
                  title={
                    isSoundEnabled
                      ? "通知音效已開啟，點擊可關閉"
                      : "通知音效已關閉，點擊可開啟"
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    isSoundEnabled
                      ? "border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                      : "border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  }`}
                >
                  {isSoundEnabled ? (
                    <Bell className="h-5 w-5" />
                  ) : (
                    <BellOff className="h-5 w-5" />
                  )}
                </button>
                <div className="inline-flex min-h-9 items-center justify-center rounded-full border border-zinc-200 px-3 text-[11px] font-semibold text-zinc-700">
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  點進訂單後自動移出未讀
                </div>
              </div>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-black leading-none text-zinc-900">
                  {groupedNotifications.unread.length}
                </span>
                <span className="pb-1 text-sm text-zinc-500">未讀通知</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-500">
                {latestNotification?.message ??
                  "目前沒有未讀的新訂單通知，新的訂單進來時會顯示在這裡。"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-3xl bg-zinc-50 p-3 xl:min-w-[260px]">
              <div className="min-w-0 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  總數
                </p>
                <p className="mt-1.5 text-xl font-black text-zinc-900">
                  {notifications.length}
                </p>
              </div>
              <div className="min-w-0 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  未讀
                </p>
                <p className="mt-1.5 text-xl font-black text-zinc-900">{unreadCount}</p>
              </div>
              <div className="min-w-0 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  已處理
                </p>
                <p className="mt-1.5 text-xl font-black text-zinc-900">{readCount}</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        </div>

        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
        {isLoading ? (
          <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center text-sm text-zinc-500">
            通知載入中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
            <p className="text-2xl font-bold text-zinc-900">目前還沒有通知</p>
            <p className="mt-3 text-sm text-zinc-500">
              等有新訂單成立後，系統會自動在這裡建立提醒。
            </p>
          </div>
        ) : (
          <section className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-zinc-900">未讀訂單列表</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  目前共有 {groupedNotifications.unread.length} 筆待處理的新訂單提醒。
                </p>
              </div>
            </div>

            {groupedNotifications.unread.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-12 text-center text-sm text-zinc-500">
                目前沒有未讀訂單。
              </div>
            ) : (
              <div className="space-y-5">
                {groupedNotifications.unread.map((notification) => (
                  <article
                    key={notification.id}
                    className="rounded-[1.75rem] border border-orange-200 bg-orange-50/40 px-5 py-5 shadow-sm md:px-6"
                  >
                    <div className="flex flex-row items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-black text-zinc-900">
                            {notification.title}
                          </p>
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            未讀
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-7 text-zinc-600">
                          {notification.message}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-6 text-sm text-zinc-500">
                          <span>通知時間 {formatDate(notification.createdAt)}</span>
                          {notification.orderNumber && (
                            <span>訂單編號 {notification.orderNumber}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start">
                        {notification.orderNumber && (
                          <Link
                            to="/admin/orders"
                            onClick={async (event) => {
                              event.preventDefault();
                              if (!notification.orderNumber) {
                                return;
                              }
                              await navigateToOrder(
                                notification.id,
                                notification.orderNumber,
                                notification.isRead,
                              );
                            }}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                          >
                            查看訂單
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => void markAsRead(notification.id)}
                          disabled={markingNotificationId === notification.id}
                          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {markingNotificationId === notification.id ? "更新中..." : "移出未讀"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        </div>
      </div>
    </main>
  );
};
