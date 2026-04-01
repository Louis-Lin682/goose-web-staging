import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AdminLogin } from "./components/AdminLogin";
import { AdminRouteGuard } from "./components/AdminRouteGuard";
import { AboutPreview } from "./components/AboutPreview";
import { AdminMembers } from "./components/AdminMembers";
import { AdminNotifications } from "./components/AdminNotifications";
import { AdminOrders } from "./components/AdminOrders";
import { AdminProductStats } from "./components/AdminProductStats";
import { AdminProducts } from "./components/AdminProducts";
import { Cart } from "./components/Cart";
import { Checkout } from "./components/Checkout";
import { ForgotPassword } from "./components/ForgotPassword";
import { FullMenu } from "./components/FullMenu";
import { GooseDetail } from "./components/GooseDetail";
import { Hero } from "./components/Hero";
import { LineAuthComplete } from "./components/LineAuthComplete";
import { Menu } from "./components/Menu";
import { Orders } from "./components/Orders";
import { PaymentResult } from "./components/PaymentResult";
import { RouteLoadingOverlay } from "./components/RouteLoadingOverlay";
import { SessionTimeoutManager } from "./components/SessionTimeoutManager";
import ScrollToTop from "./components/ScrollToTop";
import { StoreInfo } from "./components/StoreInfo";
import { StorefrontLayout } from "./components/StorefrontLayout";

const MaintenanceHome = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "鵝作社 | 網站維護中";

    const existingMeta = document.querySelector('meta[name="robots"]');
    const meta = existingMeta ?? document.createElement("meta");
    const previousContent = meta.getAttribute("content");

    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex,nofollow");

    if (!existingMeta) {
      document.head.appendChild(meta);
    }

    return () => {
      document.title = previousTitle;

      if (existingMeta) {
        if (previousContent) {
          existingMeta.setAttribute("content", previousContent);
        } else {
          existingMeta.removeAttribute("content");
        }
      } else {
        meta.remove();
      }
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-4xl items-center px-6 py-20">
      <section className="w-full rounded-[2rem] border border-zinc-200/80 bg-white/90 px-8 py-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">Maintenance</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-5xl">官網維護中</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-600 md:text-lg">
          目前官網首頁暫時維護中，若有訂購、門市、取貨或合作需求，請先透過官方 LINE
          與我們聯繫，我們會儘快協助你。
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="https://line.me/ti/p/@737uyerc"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-[13rem] items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            聯絡官方 LINE
          </a>
          <a
            href="tel:04-2380-0255"
            className="inline-flex min-w-[13rem] items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-4 text-sm font-semibold text-zinc-900 transition-colors hover:border-orange-300 hover:text-orange-600"
          >
            門市電話 04-2380-0255
          </a>
        </div>
      </section>
    </main>
  );
};

function App() {
  const isProductionStorefront =
    typeof window !== "undefined" &&
    ["www.gozoshe.com", "gozoshe.com"].includes(window.location.hostname);

  return (
    <Router>
      <ScrollToTop />
      <RouteLoadingOverlay />
      <SessionTimeoutManager />
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={isProductionStorefront ? <MaintenanceHome /> : <main><Hero /><AboutPreview /><Menu /></main>} />
          <Route path="/origin" element={isProductionStorefront ? <MaintenanceHome /> : <GooseDetail />} />
          <Route path="/store" element={isProductionStorefront ? <MaintenanceHome /> : <StoreInfo />} />
          <Route path="/orders" element={isProductionStorefront ? <MaintenanceHome /> : <Orders />} />
          <Route path="/forgot-password" element={isProductionStorefront ? <MaintenanceHome /> : <ForgotPassword />} />
          <Route path="/auth/line/complete" element={isProductionStorefront ? <MaintenanceHome /> : <LineAuthComplete />} />
          <Route path="/payment/ecpay/result" element={isProductionStorefront ? <MaintenanceHome /> : <PaymentResult />} />
          <Route path="/fullMenu" element={isProductionStorefront ? <MaintenanceHome /> : <FullMenu />} />
          <Route path="/cart" element={isProductionStorefront ? <MaintenanceHome /> : <Cart />} />
          <Route path="/checkout" element={isProductionStorefront ? <MaintenanceHome /> : <Checkout />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminRouteGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="stats" element={<AdminProductStats />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="products" element={<AdminProducts />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
