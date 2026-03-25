import {
  BarChart3,
  Bell,
  Home,
  LogIn,
  LogOut,
  Package,
  ReceiptText,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { AdminSectionNav } from "./AdminSectionNav";
import { useAdminNotifications } from "../context/useAdminNotifications";
import { useAuth } from "../context/useAuth";
import { logout as logoutUser } from "../lib/auth";

const desktopNavItemClassName =
  "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors";

export const AdminLayout = () => {
  const { unreadCount } = useAdminNotifications();
  const { isAuthenticated, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      signOut();
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f5f1_0%,#ffffff_28%,#f5f6f8_100%)] px-4 pb-10 pt-6 md:px-6 lg:h-screen lg:overflow-hidden lg:px-8 lg:pb-6">
      <div className="mx-auto flex max-w-[1680px] gap-6 lg:h-[calc(100vh-3rem)]">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-72 shrink-0 overflow-x-hidden overflow-y-auto rounded-[2.25rem] border border-white/60 bg-white/85 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.07)] backdrop-blur-sm lg:flex lg:flex-col">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.38em] text-orange-600">
              Goose Admin
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900">
              後台管理中心
            </h1>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              在這裡集中查看通知、訂單、商品、會員與銷售統計，快速完成日常營運管理。
            </p>
          </div>

          <nav className="mt-8 space-y-3">
            <NavLink
              to="/admin/notifications"
              className={({ isActive }) =>
                `${desktopNavItemClassName} ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`
              }
            >
              <span className="inline-flex items-center gap-3">
                <Bell className="h-4 w-4" />
                <span>通知管理</span>
              </span>
              <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `${desktopNavItemClassName} ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`
              }
            >
              <span className="inline-flex items-center gap-3">
                <ReceiptText className="h-4 w-4" />
                <span>訂單管理</span>
              </span>
            </NavLink>

            <NavLink
              to="/admin/stats"
              className={({ isActive }) =>
                `${desktopNavItemClassName} ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`
              }
            >
              <span className="inline-flex items-center gap-3">
                <BarChart3 className="h-4 w-4" />
                <span>商品統計</span>
              </span>
            </NavLink>

            <NavLink
              to="/admin/members"
              className={({ isActive }) =>
                `${desktopNavItemClassName} ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`
              }
            >
              <span className="inline-flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span>會員管理</span>
              </span>
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `${desktopNavItemClassName} ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`
              }
            >
              <span className="inline-flex items-center gap-3">
                <Package className="h-4 w-4" />
                <span>商品管理</span>
              </span>
            </NavLink>
          </nav>

          <div className="mt-auto rounded-[1.75rem] bg-zinc-50 px-5 py-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-zinc-400">
              Storefront
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              可隨時返回前台網站查看實際頁面與購物流程，確認最新內容與後台設定是否同步。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <NavLink
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                <Home className="h-4 w-4" />
                前台
              </NavLink>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  <LogOut className="h-4 w-4" />
                  登出
                </button>
              ) : (
                <NavLink
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  <LogIn className="h-4 w-4" />
                  登入
                </NavLink>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:flex lg:min-h-0 lg:flex-col">
          <div className="space-y-5 lg:hidden">
            <div className="rounded-[2rem] border border-white/55 bg-white/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.38em] text-orange-600">
                    Goose Admin
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
                    後台管理中心
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <NavLink
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    <Home className="h-4 w-4" />
                    前台
                  </NavLink>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      <LogOut className="h-4 w-4" />
                      登出
                    </button>
                  ) : (
                    <NavLink
                      to="/"
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      <LogIn className="h-4 w-4" />
                      登入
                    </NavLink>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-zinc-500">
                可隨時返回前台網站查看實際頁面與購物流程，確認最新內容與後台設定是否同步。
              </p>
            </div>

            <AdminSectionNav />
          </div>

          <div className="lg:min-h-0 lg:flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
