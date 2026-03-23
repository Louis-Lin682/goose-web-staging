import { NavLink } from "react-router-dom";
import { useAdminNotifications } from "../context/useAdminNotifications";

const navItemClassName =
  "inline-flex rounded-full px-5 py-2 text-sm font-semibold transition-colors";

export const AdminSectionNav = () => {
  const { unreadCount } = useAdminNotifications();

  return (
    <div className="mb-8 flex flex-wrap gap-3 rounded-3xl bg-zinc-50 p-3">
      <NavLink
        to="/admin/notifications"
        className={({ isActive }) =>
          `${navItemClassName} ${
            isActive
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700 hover:bg-zinc-100"
          }`
        }
      >
        <span className="inline-flex items-center gap-2">
          <span>通知管理</span>
          <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </span>
      </NavLink>
      <NavLink
        to="/admin/orders"
        className={({ isActive }) =>
          `${navItemClassName} ${
            isActive
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700 hover:bg-zinc-100"
          }`
        }
      >
        訂單管理
      </NavLink>
      <NavLink
        to="/admin/members"
        className={({ isActive }) =>
          `${navItemClassName} ${
            isActive
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700 hover:bg-zinc-100"
          }`
        }
      >
        會員管理
      </NavLink>
      <NavLink
        to="/admin/products"
        className={({ isActive }) =>
          `${navItemClassName} ${
            isActive
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700 hover:bg-zinc-100"
          }`
        }
      >
        商品管理
      </NavLink>
    </div>
  );
};
