import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
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

    navigate("/admin/orders");
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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
            請先登入後台帳號
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            後台通知只提供管理員查看，請先登入後再回來。
          </p>
        </div>
      </main>
    );
  }

  if (!user?.isAdmin) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
            你沒有後台權限
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            目前登入身分不是管理員，所以無法查看新訂單通知。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40 lg:h-full lg:overflow-hidden lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <div className="shrink-0">
        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
              Admin
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
              新訂單通知
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              這裡會集中顯示最新訂單提醒，未讀和已讀通知會分開呈現，方便你快速處理新單。</p>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-3xl bg-zinc-50 p-4">
            <div className="min-w-[96px] text-center">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                總數
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900">
                {notifications.length}
              </p>
            </div>
            <div className="min-w-[96px] text-center">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                未讀
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900">{unreadCount}</p>
            </div>
            <div className="min-w-[96px] text-center">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                已處理              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900">{readCount}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        </div>

        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                  Latest
                </p>
                <h2 className="mt-3 text-2xl font-black text-zinc-900">
                  {latestNotification?.title ?? "目前沒有未讀訂單"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  {latestNotification?.message ?? "目前沒有未讀的新訂單通知，新的訂單進來時會顯示在這裡。"}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                  Action
                </p>
                <h2 className="mt-3 text-2xl font-black text-zinc-900">通知操作</h2>
              </div>

              <div className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-semibold text-zinc-700">
                <CheckCheck className="mr-2 h-4 w-4" />
                點進訂單後自動移出未讀
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
                <p className="font-semibold text-zinc-900">未讀通知</p>
                <p className="mt-2">目前共有 {unreadCount} 筆新的未讀訂單提醒。</p>
              </div>
            </div>
          </section>
        </div>

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
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                  New
                </p>
                <h2 className="mt-2 text-2xl font-black text-zinc-900">新訂單通知</h2>
              </div>
              <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-zinc-900 px-2 text-sm font-bold text-white">
                {groupedNotifications.unread.length}
              </span>
            </div>

            {groupedNotifications.unread.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-12 text-center text-sm text-zinc-500">
                目前沒有未讀訂單。
              </div>
            ) : (
              <div className="space-y-5">
                {groupedNotifications.unread.map((notification) => (
                  <article
                    key={notification.id}
                    className="rounded-[2rem] border border-orange-200 bg-orange-50/40 px-5 py-5 shadow-sm md:px-6"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                              await openOrderFromNotification(
                                notification.id,
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
