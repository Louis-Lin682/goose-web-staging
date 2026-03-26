import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export const AdminRouteGuard = () => {
  const location = useLocation();
  const { isAuthReady, isAuthenticated, user } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f5f1_0%,#ffffff_28%,#f5f6f8_100%)] px-6">
        <div className="rounded-[2rem] border border-white/60 bg-white/90 px-8 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
            Admin
          </p>
          <p className="mt-3 text-sm font-semibold text-zinc-600">
            正在檢查後台登入狀態...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/admin/login" replace state={{ from }} />;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
