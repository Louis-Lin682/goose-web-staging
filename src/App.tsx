import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AboutPreview } from "./components/AboutPreview";
import { AdminMembers } from "./components/AdminMembers";
import { AdminNotifications } from "./components/AdminNotifications";
import { AdminOrders } from "./components/AdminOrders";
import { AdminProducts } from "./components/AdminProducts";
import { Cart } from "./components/Cart";
import { Checkout } from "./components/Checkout";
import { FullMenu } from "./components/FullMenu";
import { GooseDetail } from "./components/GooseDetail";
import { Hero } from "./components/Hero";
import { Menu } from "./components/Menu";
import { Orders } from "./components/Orders";
import { PaymentResult } from "./components/PaymentResult";
import { RouteLoadingOverlay } from "./components/RouteLoadingOverlay";
import ScrollToTop from "./components/ScrollToTop";
import { StoreInfo } from "./components/StoreInfo";
import { StorefrontLayout } from "./components/StorefrontLayout";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <RouteLoadingOverlay />
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
          <Route path="/payment/ecpay/result" element={<PaymentResult />} />
          <Route path="/fullMenu" element={<FullMenu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="products" element={<AdminProducts />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
