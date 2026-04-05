import { type FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu as MenuIcon, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/useAuth";
import { useAdminNotifications } from "../context/useAdminNotifications";
import { useCart } from "../context/useCart";
import { EnvironmentInlineTag } from "./EnvironmentIndicator";
import { getCurrentUser, getLineAuthStartUrl, login as loginUser, logout as logoutUser, register as registerUser } from "../lib/auth";
import type { LoginPayload, RegisterPayload } from "../types/auth";

type AuthMode = "login" | "register";
type LoginFormState = { identifier: string; password: string; remember: boolean };
type RegisterFormState = { name: string; phone: string; email: string; password: string; confirmPassword: string };

const navLinks = [{ to: "/origin", label: "品牌故事" }, { to: "/fullMenu", label: "產品列表" }, { to: "/store", label: "門市資訊" }];
const shippingRows = [
  { amount: "1000 元以下", shipping: "200 元", codFee: "30 元" },
  { amount: "1001～1800 元", shipping: "230 元", codFee: "30 元" },
  { amount: "1801～6000 元", shipping: "290 元", codFee: "60 元" },
  { amount: "6001～10000 元", shipping: "0 元", codFee: "90 元" },
  { amount: "10001 元以上", shipping: "0 元", codFee: "0 元" },
];
const inputClassName = "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400";
const initialLoginForm = (): LoginFormState => ({ identifier: "", password: "", remember: true });
const initialRegisterForm = (): RegisterFormState => ({ name: "", phone: "", email: "", password: "", confirmPassword: "" });

const RequiredLabel = ({ children }: { children: string }) => <label className="mb-2 block text-sm font-semibold text-zinc-900">{children}<span className="ml-1 text-orange-600">*</span></label>;

const LineAuthButton = ({ mode }: { mode: AuthMode }) => (
  <div className="mt-6 space-y-3">
    <div className="flex items-center gap-3"><div className="h-px flex-1 bg-zinc-200" /><span className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">或使用 LINE</span><div className="h-px flex-1 bg-zinc-200" /></div>
    <motion.a href={getLineAuthStartUrl(mode)} whileTap={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.7 }} className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#06C755] px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#05b24b] active:scale-[0.97] active:bg-[#049c42]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] font-black tracking-[0.16em] text-[#06C755]">LINE</span>
      <span>{mode === "login" ? "LINE 快速登入" : "LINE 快速註冊 / 登入"}</span>
    </motion.a>
    <p className="text-center text-xs leading-5 text-zinc-500">使用 LINE 授權即可快速完成登入或建立會員資料。</p>
    <p className="text-center text-[11px] leading-5 text-zinc-400 md:hidden">若手機內建瀏覽器無法正常跳轉，請改用 Safari 或 Chrome 開啟。</p>
  </div>
);

const NoticeModal = ({ onClose }: { onClose: () => void }) => {
  const shouldCloseRef = useRef(false);

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/50 px-8 py-8"
      onMouseDown={(event) => {
        shouldCloseRef.current = event.target === event.currentTarget;
      }}
      onMouseUp={(event) => {
        if (shouldCloseRef.current && event.target === event.currentTarget) {
          onClose();
        }
        shouldCloseRef.current = false;
      }}
    >
    <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.22 }} onClick={(event) => event.stopPropagation()} className="max-h-[85vh] w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <div><p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">Notice</p><h2 className="mt-2 text-3xl font-black text-zinc-900">訂購須知</h2></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900" aria-label="關閉訂購須知"><X /></button>
        </div>
        <div className="max-h-[calc(85vh-96px)] space-y-8 overflow-y-auto px-6 py-6 text-sm leading-7 text-zinc-600">
          <section><p>請先至<Link to="/fullMenu" onClick={onClose} className="mx-1 font-semibold text-orange-600 underline underline-offset-4">產品列表</Link>選購商品，再依照以下方式完成訂購流程。</p><p>訂購前可先註冊會員，也可先選購商品，於結帳時一併完成會員註冊。</p></section>
          <section className="space-y-4">
            <div><h3 className="text-base font-bold text-zinc-900">運費與貨到付款手續費</h3><p>皆採用統一速達宅急便費用計算方式。</p></div>
            <div className="overflow-hidden rounded-3xl border border-zinc-200">
              <table className="w-full border-collapse text-center text-sm"><thead className="bg-zinc-50 text-zinc-900"><tr><th className="py-3 font-semibold">訂購金額</th><th className="py-3 font-semibold">運費</th><th className="py-3 font-semibold">貨到付款手續費</th></tr></thead><tbody>{shippingRows.map((row) => <tr key={row.amount} className="border-t border-zinc-100"><td className="py-3">{row.amount}</td><td className="py-3">{row.shipping}</td><td className="py-3">{row.codFee}</td></tr>)}</tbody></table>
            </div>
            <p className="text-sm text-zinc-500">訂單滿 6000 元以上可享免運優惠。</p>
          </section>
          <section className="space-y-3"><p>1. 網路訂購須7天後才出貨，若要更改時間請在備註說明，實際到貨日須視宅急便當區配送狀況而定。</p><p>2. 門市自取訂單請留意手機與 Email，店家會主動聯繫取貨資訊。</p><p>3. 如遇節慶高峰或天候影響，配送與到貨時間可能調整，敬請見諒。</p><p>4. 離島地區不適用以上運費計算方式(請來電詢問)。</p></section>
          <section className="grid gap-6 rounded-[1.75rem] bg-zinc-50 px-5 py-5 text-sm text-zinc-600 md:grid-cols-2">
            <div><p className="text-xs font-black uppercase tracking-[0.28em] text-orange-600">Store</p><p className="mt-3 font-semibold text-zinc-900">門市地址</p><p>台中市南屯區永春東七路746-1號</p></div>
            <div><p className="text-xs font-black uppercase tracking-[0.28em] text-orange-600">Contact</p><p className="mt-3 font-semibold text-zinc-900">訂購專線</p><a href="tel:04-2380-0255" className="text-orange-600">04-2380-0255</a><p className="mt-3 font-semibold text-zinc-900">取貨方式</p><p>黑貓低溫宅配 / 門市自取</p><p className="mt-3 font-semibold text-zinc-900">電子郵件</p><a href="mailto:888@yahoo.com.tw" className="text-orange-600">888@yahoo.com.tw</a></div>
          </section>
        </div>
      </motion.div>
    </div>
    </div>
  );
};

const AuthModal = ({
  mode,
  onModeChange,
  onClose,
  onLoginSuccess,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onLoginSuccess: (isAdmin: boolean) => void;
}) => {
  const navigate = useNavigate();
  const shouldCloseRef = useRef(false);
  const { signIn } = useAuth();
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterForm);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const resetForms = () => {
    setLoginForm(initialLoginForm());
    setRegisterForm(initialRegisterForm());
    setIsLoginSubmitting(false);
    setIsRegisterSubmitting(false);
    setAuthFeedback(null);
  };

  const handleModeSwitch = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    resetForms();
    onModeChange(nextMode);
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (registerForm.password.length < 8) {
      setAuthFeedback({ type: "error", message: "密碼至少需要 8 碼。" });
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthFeedback({ type: "error", message: "兩次輸入的密碼不一致。" });
      return;
    }

    const payload: RegisterPayload = {
      name: registerForm.name.trim(),
      phone: registerForm.phone.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
    };

    setIsRegisterSubmitting(true);
    setAuthFeedback(null);
    try {
      const response = await registerUser(payload);
      setRegisterForm(initialRegisterForm());
      setLoginForm((prev) => ({ ...prev, identifier: payload.phone || payload.email, password: "", remember: prev.remember }));
      setAuthFeedback({ type: "success", message: response.message ?? "註冊成功，請使用新帳號登入。" });
      onModeChange("login");
    } catch (error) {
      setAuthFeedback({ type: "error", message: error instanceof Error ? error.message : "註冊失敗，請稍後再試。" });
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: LoginPayload = {
      identifier: loginForm.identifier.trim(),
      password: loginForm.password,
      remember: loginForm.remember,
    };

    setIsLoginSubmitting(true);
    setAuthFeedback(null);
    try {
      const response = await loginUser(payload);
      if (!response.user) throw new Error("登入成功，但暫時無法取得會員資料。");
      const currentUserResponse = await getCurrentUser();
      if (!currentUserResponse.user) throw new Error("登入成功，但無法同步最新會員狀態，請再試一次。");
      signIn(currentUserResponse.user);
      resetForms();
      onLoginSuccess(currentUserResponse.user.isAdmin);
    } catch (error) {
      setAuthFeedback({ type: "error", message: error instanceof Error ? error.message : "登入失敗，請稍後再試。" });
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[115] bg-black/55 px-8 py-6"
      onMouseDown={(event) => {
        shouldCloseRef.current = event.target === event.currentTarget;
      }}
      onMouseUp={(event) => {
        if (shouldCloseRef.current && event.target === event.currentTarget) {
          handleClose();
        }
        shouldCloseRef.current = false;
      }}
    >
      <div className="mx-auto flex h-full max-w-lg items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.22 }} onClick={(event) => event.stopPropagation()} className="flex h-[min(88vh,44rem)] w-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="shrink-0 border-b border-zinc-100 px-5 py-5 md:px-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">Account</p><h2 className="mt-2 text-2xl font-black text-zinc-900 md:text-3xl">{mode === "login" ? "會員登入" : "建立帳號"}</h2></div>
              <button type="button" onClick={handleClose} className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900" aria-label="關閉登入視窗"><X /></button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-5 py-5 md:px-6">
            <div className="relative mb-6 grid shrink-0 grid-cols-2 rounded-2xl bg-zinc-100 p-1">
              <motion.span layoutId="auth-mode-pill" transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }} className={`absolute bottom-1 top-1 z-0 w-[calc(50%-0.25rem)] rounded-2xl bg-white shadow-sm ${mode === "login" ? "left-1" : "left-[calc(50%+0.25rem)]"}`} />
              <button type="button" onClick={() => handleModeSwitch("login")} className={`relative z-10 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${mode === "login" ? "text-zinc-900" : "text-zinc-500"}`}>登入</button>
              <button type="button" onClick={() => handleModeSwitch("register")} className={`relative z-10 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${mode === "register" ? "text-zinc-900" : "text-zinc-500"}`}>註冊</button>
            </div>
            {authFeedback && <div className={`mb-4 shrink-0 rounded-2xl px-4 py-3 text-sm ${authFeedback.type === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-600"}`} aria-live="polite">{authFeedback.message}</div>}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {mode === "login" ? (
                <form className="space-y-4" autoComplete="off" onSubmit={handleLoginSubmit}>
                  <div><RequiredLabel>手機號碼或 Email</RequiredLabel><input type="text" name="storefront-login-identifier" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} value={loginForm.identifier} onChange={(event) => setLoginForm((prev) => ({ ...prev, identifier: event.target.value }))} required placeholder="請輸入手機號碼或 Email" className={inputClassName} /></div>
                  <div><RequiredLabel>密碼</RequiredLabel><input type="password" name="storefront-login-password" autoComplete="new-password" value={loginForm.password} onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))} required placeholder="請輸入至少 8 碼密碼" className={inputClassName} /></div>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-zinc-500"><input type="checkbox" checked={loginForm.remember} onChange={(event) => setLoginForm((prev) => ({ ...prev, remember: event.target.checked }))} className="h-4 w-4 rounded border-zinc-300" />記住我</label>
                    <button type="button" className="font-semibold text-orange-600" onClick={() => { handleClose(); navigate("/forgot-password"); }}>忘記密碼？</button>
                  </div>
                  <Button asChild disabled={isLoginSubmitting} className="mt-2 h-12 w-full rounded-2xl bg-zinc-900 text-sm text-white transition-all duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400">
                    <motion.button type="submit" whileTap={isLoginSubmitting ? undefined : { scale: 0.985 }} transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.7 }}>{isLoginSubmitting ? "登入中..." : "登入"}</motion.button>
                  </Button>
                  <LineAuthButton mode={mode} />
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                  <div><RequiredLabel>手機號碼</RequiredLabel><input type="tel" value={registerForm.phone} onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))} required placeholder="09xxxxxxxx" className={inputClassName} /></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><RequiredLabel>姓名</RequiredLabel><input type="text" value={registerForm.name} onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))} required placeholder="請輸入收件姓名" className={inputClassName} /></div>
                    <div><RequiredLabel>Email</RequiredLabel><input type="email" value={registerForm.email} onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))} required placeholder="you@example.com" className={inputClassName} /></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><RequiredLabel>密碼</RequiredLabel><input type="password" value={registerForm.password} onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))} required placeholder="至少 8 碼" className={inputClassName} /></div>
                    <div><RequiredLabel>確認密碼</RequiredLabel><input type="password" value={registerForm.confirmPassword} onChange={(event) => setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} required placeholder="請再次輸入密碼" className={inputClassName} /></div>
                  </div>
                  <ul className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs leading-6 text-zinc-500 list-decimal pl-8">
                    <li>請會員填寫真實且正確的個人資料。</li>
                    <li>您所提供的個人資料，我們將妥善保管並善盡保密義務。</li>
                    <li>會員不得於網站上發布或傳送任何不實、威脅、不雅、不法或毀謗性內容。</li>
                    <li>若會員有嚴重不當行為，本站有權停用或取消其會員帳號。</li>
                    <li>註冊完成後，可使用手機號碼或 Email 登入；若忘記密碼，也可透過 Email 重設。</li>
                  </ul>
                  <Button asChild disabled={isRegisterSubmitting} className="mt-2 h-12 w-full rounded-2xl bg-zinc-900 text-sm text-white transition-all duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400">
                    <motion.button type="submit" whileTap={isRegisterSubmitting ? undefined : { scale: 0.985 }} transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.7 }}>{isRegisterSubmitting ? "建立帳號中..." : "建立帳號"}</motion.button>
                  </Button>
                  <LineAuthButton mode={mode} />
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const { unreadCount: adminUnreadCount } = useAdminNotifications();
  const { totalItems } = useCart();
  const { user, isAuthenticated, isAuthReady, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isOverlayOpen = isNoticeOpen || isMobileMenuOpen || isAuthOpen;
    if (!isOverlayOpen) {
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNoticeOpen(false);
        setIsMobileMenuOpen(false);
        setIsAuthOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthOpen, isMobileMenuOpen, isNoticeOpen]);

  const openAuth = (nextMode: AuthMode) => {
    setIsMobileMenuOpen(false);
    setAuthMode(nextMode);
    setIsAuthOpen(true);
  };

  const closeAll = () => {
    setIsMobileMenuOpen(false);
    setIsNoticeOpen(false);
    setIsAuthOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      signOut();
      closeAll();
    }
  };

  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthOpen(false);
    setIsMobileMenuOpen(false);
    if (isAdmin) navigate("/admin/notifications");
  };

  const userLabel = user?.name?.trim() || "會員";

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 overflow-visible transition-all duration-300 before:pointer-events-none before:absolute before:inset-x-0 before:top-[-14px] before:h-12 before:bg-gradient-to-b before:from-white/38 before:via-white/14 before:to-transparent before:blur-2xl after:pointer-events-none after:absolute after:inset-x-0 after:bottom-[-24px] after:h-12 after:bg-gradient-to-b after:from-white/24 after:via-white/8 after:to-transparent after:blur-2xl ${
          isScrolled
            ? "bg-white/34 py-4 shadow-[0_10px_34px_rgba(0,0,0,0.035)] backdrop-blur-[24px] backdrop-saturate-[1.8]"
            : "bg-white/48 py-6 shadow-[0_8px_30px_rgba(0,0,0,0.025)] backdrop-blur-[20px] backdrop-saturate-[1.6]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center" onClick={closeAll}>
            <div className="relative mr-2 h-12 w-12 overflow-hidden rounded-full border-2 border-zinc-100 shadow-sm">
              <img
                src="/goose-logo.svg"
                alt="Goose Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative">
              <div className="cursor-pointer text-2xl font-black tracking-tighter">
                鵝作社<span className="text-orange-500">.</span>
              </div>
              <EnvironmentInlineTag className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap" />
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-widest md:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="transition-colors hover:text-orange-500">
                {link.label}
              </Link>
            ))}

            {isAuthReady && isAuthenticated && (
              <Link to="/orders" className="transition-colors hover:text-orange-500">
                訂單查詢
              </Link>
            )}

            {isAuthReady && isAuthenticated && user?.isAdmin && (
              <Link to="/admin/orders" className="transition-colors hover:text-orange-500">
                後台管理
              </Link>
            )}

            {isAuthReady && isAuthenticated && user?.isAdmin && (
              <Link
                to="/admin/notifications"
                className="inline-flex items-center gap-2 transition-colors hover:text-orange-500"
              >
                <span>後台通知</span>
                <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[11px] font-bold text-white">
                  {adminUnreadCount > 99 ? "99+" : adminUnreadCount}
                </span>
              </Link>
            )}

            <button type="button" onClick={() => setIsNoticeOpen(true)} className="transition-colors hover:text-orange-500">
              訂購須知
            </button>

            <div className="ml-2 flex items-center gap-6 border-l border-zinc-200 pl-6">
              <Link to="/cart" className="group relative p-2">
                <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-orange-600" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              </Link>

              {isAuthReady && isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold normal-case tracking-normal text-zinc-700">
                    你好，{userLabel}
                  </span>
                  <Button variant="ghost" className="gap-2 text-xs hover:text-orange-600" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    登出
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-none border border-zinc-300 bg-white px-6 text-xs text-zinc-900 transition-all duration-200 hover:border-orange-300 hover:text-orange-600 active:scale-[0.98] active:border-orange-300 active:bg-orange-50 active:text-orange-600"
                    onClick={() => openAuth("login")}
                  >
                    登入
                  </Button>
                  <Button className="rounded-none bg-black px-6 text-xs text-white transition-transform hover:bg-zinc-800 active:scale-95" onClick={() => openAuth("register")}>
                    註冊
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <Link to="/cart" className="group relative p-2">
              <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-orange-600" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            </Link>
            <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="rounded-full border border-zinc-200 p-2 text-zinc-900 transition-colors hover:border-orange-300 hover:text-orange-600" aria-label="開啟導覽選單">
              <MenuIcon size={20} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-[105] bg-black/40 md:hidden" onClick={closeAll} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} onClick={(event) => event.stopPropagation()} className="fixed right-0 top-0 z-[106] ml-auto flex h-full w-[86vw] max-w-sm flex-col bg-white px-6 pb-8 pt-6 shadow-xl md:hidden">
              <div className="mb-8 flex items-center justify-between">
                <div><p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">Menu</p><p className="mt-2 text-2xl font-black text-zinc-900">導覽選單</p></div>
                <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900" aria-label="關閉導覽選單"><X /></button>
              </div>

              <div className="space-y-3">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-4 text-base font-semibold text-zinc-900 transition-colors hover:border-orange-300 hover:text-orange-600">{link.label}</Link>
                ))}
                {isAuthReady && isAuthenticated && <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-2xl border border-zinc-200 px-4 py-4 text-base font-semibold text-zinc-900 transition-colors hover:border-orange-300 hover:text-orange-600">訂單查詢</Link>}
                {isAuthReady && isAuthenticated && user?.isAdmin && <Link to="/admin/notifications" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-2xl border border-zinc-200 px-4 py-4 text-base font-semibold text-zinc-900 transition-colors hover:border-orange-300 hover:text-orange-600">後台通知</Link>}
                {isAuthReady && isAuthenticated && user?.isAdmin && <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-2xl border border-zinc-200 px-4 py-4 text-base font-semibold text-zinc-900 transition-colors hover:border-orange-300 hover:text-orange-600">後台管理</Link>}
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); setIsNoticeOpen(true); }} className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-base font-semibold text-zinc-900 transition-colors hover:border-orange-300 hover:text-orange-600">訂購須知</button>
              </div>

              <div className="mt-auto space-y-3 pt-8">
                {isAuthReady && isAuthenticated ? (
                  <>
                    <div className="rounded-2xl bg-zinc-50 px-4 py-4 text-center text-sm text-zinc-600">目前登入：<span className="font-semibold text-zinc-900">{userLabel}</span></div>
                    <Button variant="ghost" className="w-full justify-center gap-2 text-sm hover:text-orange-600" onClick={handleLogout}><LogOut className="h-4 w-4" />登出</Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full rounded-full border border-zinc-300 bg-white py-6 text-sm text-zinc-900 transition-all duration-200 hover:border-orange-300 hover:text-orange-600">
                      <motion.button type="button" onClick={() => openAuth("login")} whileTap={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.7 }}>登入</motion.button>
                    </Button>
                    <Button asChild className="w-full rounded-full bg-zinc-900 py-6 text-sm text-white transition-all duration-200 hover:bg-zinc-800">
                      <motion.button type="button" onClick={() => openAuth("register")} whileTap={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.7 }}>註冊</motion.button>
                    </Button>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}

        {isNoticeOpen && <NoticeModal onClose={() => setIsNoticeOpen(false)} />}
        {isAuthOpen && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setIsAuthOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      </AnimatePresence>
    </>
  );
};
