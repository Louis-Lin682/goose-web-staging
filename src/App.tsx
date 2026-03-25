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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <RouteLoadingOverlay />
      <SessionTimeoutManager />
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route
            path="/"
            element={
              <main>
                <Hero />
                <AboutPreview />
                <Menu />
              </main>
            }
          />
          <Route path="/origin" element={<GooseDetail />} />
          <Route path="/store" element={<StoreInfo />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/line/complete" element={<LineAuthComplete />} />
          <Route path="/payment/ecpay/result" element={<PaymentResult />} />
          <Route path="/fullMenu" element={<FullMenu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
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
