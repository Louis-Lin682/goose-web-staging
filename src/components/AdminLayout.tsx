import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
  LogIn,
  LogOut,
  Package,
  ReceiptText,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAdminNotifications } from "../context/useAdminNotifications";
import { useAuth } from "../context/useAuth";
import { logout as logoutUser } from "../lib/auth";
import { AdminSectionNav } from "./AdminSectionNav";
import { EnvironmentInlineTag } from "./EnvironmentIndicator";

const desktopNavItemClassName =
  "flex items-center rounded-2xl text-sm font-semibold transition-colors";

type DesktopNavItem = {
  to: string;
  icon: typeof Bell;
  label: string;
  badge?: string;
};

export const AdminLayout = () => {
  const { unreadCount } = useAdminNotifications();
  const { isAuthenticated, signOut } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      signOut();
    }
  };

  const desktopNavItems: DesktopNavItem[] = [
    {
      to: "/admin/notifications",
      icon: Bell,
      label: "通知管理",
      badge: unreadCount > 99 ? "99+" : String(unreadCount),
    },
    {
      to: "/admin/orders",
      icon: ReceiptText,
      label: "訂單管理",
    },
    {
      to: "/admin/featured",
      icon: Sparkles,
      label: "推薦產品",
    },
    {
      to: "/admin/stats",
      icon: BarChart3,
      label: "商品統計",
    },
    {
      to: "/admin/members",
      icon: Users,
      label: "會員管理",
    },
    {
      to: "/admin/products",
      icon: Package,
      label: "商品管理",
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f5f1_0%,#ffffff_28%,#f5f6f8_100%)] px-4 pb-10 pt-6 md:px-6 lg:h-screen lg:overflow-hidden lg:px-8 lg:pb-6">
      <div className="mx-auto flex max-w-[1680px] gap-6 lg:h-[calc(100vh-3rem)]">
        <div
          className={`relative hidden shrink-0 lg:block ${
            isSidebarCollapsed ? "w-[7.25rem]" : "w-[18.5rem]"
          }`}
        >
          <aside
            className={`hide-scrollbar sticky top-6 flex h-[calc(100vh-3rem)] overflow-x-hidden overflow-y-auto rounded-[2.25rem] border border-white/60 bg-white/85 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.07)] backdrop-blur-sm transition-[width,padding] duration-200 ${
              isSidebarCollapsed ? "w-24 px-3" : "w-72 px-6"
            }`}
          >
            <div className="flex w-full flex-col">
              <div>
                {isSidebarCollapsed ? (
                  <div className="flex justify-center">
                    <div className="relative inline-flex">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">
                        Admin
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative inline-flex">
                      <p className="text-xs font-black uppercase tracking-[0.38em] text-orange-600">
                        Goose Admin
                      </p>
                      <EnvironmentInlineTag className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap" />
                    </div>
                    <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900">
                      後台管理中心
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-zinc-500">
                      管理訂單、通知、推薦產品、會員與商品資料，讓每日營運資訊集中在同一個工作台。
                    </p>
                  </>
                )}
              </div>

              <nav className={`space-y-3 ${isSidebarCollapsed ? "mt-6" : "mt-8"}`}>
                {desktopNavItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className={({ isActive }) =>
                        `${desktopNavItemClassName} ${
                          isSidebarCollapsed
                            ? "justify-center px-0 py-3"
                            : "justify-between px-4 py-3"
                        } ${
                          isActive
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        }`
                      }
                    >
                      <span
                        className={`inline-flex items-center ${
                          isSidebarCollapsed ? "justify-center" : "gap-3"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </span>
                      {!isSidebarCollapsed && item.badge ? (
                        <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </nav>

              <div
                className={`mt-auto rounded-[1.75rem] bg-zinc-50 ${
                  isSidebarCollapsed ? "px-3 py-4" : "px-5 py-5"
                }`}
              >
                {isSidebarCollapsed ? (
                  <div className="flex flex-col items-center gap-3">
                    <NavLink
                      to="/"
                      title="返回官網"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
                    >
                      <Home className="h-4 w-4" />
                    </NavLink>
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        title="登出"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    ) : (
                      <NavLink
                        to="/"
                        title="返回登入"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        <LogIn className="h-4 w-4" />
                      </NavLink>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-zinc-400">
                      Storefront
                    </p>
                    <p className="mt-3 text-sm leading-7 text-zinc-500">
                      快速回到前台檢查門市資訊、推薦產品與商品內容，確認實際呈現是否符合目前設定。
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <NavLink
                        to="/"
                        className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                      >
                        <Home className="h-4 w-4" />
                        返回官網
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
                          返回登入
                        </NavLink>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            className="absolute right-0 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100"
            aria-label={isSidebarCollapsed ? "展開側欄" : "收合側欄"}
            title={isSidebarCollapsed ? "展開側欄" : "收合側欄"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1 lg:flex lg:min-h-0 lg:flex-col">
          <div className="space-y-5 lg:hidden">
            <div className="rounded-[2rem] border border-white/55 bg-white/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="relative inline-flex">
                    <p className="text-xs font-black uppercase tracking-[0.38em] text-orange-600">
                      Goose Admin
                    </p>
                    <EnvironmentInlineTag className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap" />
                  </div>
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
                    返回官網
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
                      返回登入
                    </NavLink>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-zinc-500">
                在手機或較小螢幕上也能快速切換通知、訂單、推薦產品、會員與商品管理。
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
