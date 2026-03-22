import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";

const variantLabels: Record<string, string> = {
  single: "單點",
  small: "小份",
  large: "大份",
};

const mobileVariantLabels: Record<string, string> = {
  single: "",
  small: "小",
  large: "大",
};

const DESKTOP_SCROLL_THRESHOLD = 2;
const MOBILE_COLLAPSED_COUNT = 3;

const formatCurrency = (value: number) => `$${value}`;

export const Cart = () => {
  const { cart, totalItems } = useCart();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  const visibleMobileItems = cart.slice(0, MOBILE_COLLAPSED_COUNT);
  const hiddenMobileItems = cart.slice(MOBILE_COLLAPSED_COUNT);
  const showMobileToggle = cart.length > MOBILE_COLLAPSED_COUNT;
  const desktopShouldScroll = cart.length > DESKTOP_SCROLL_THRESHOLD;

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex items-end justify-between gap-6 border-b border-zinc-100 pb-8">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.4em] text-orange-600">
              Cart
            </p>
            <h1 className="text-5xl font-black tracking-tight text-zinc-900 md:text-7xl">
              購物車
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Items</p>
            <p className="text-3xl font-black text-zinc-900">{totalItems}</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
            <p className="text-2xl font-bold text-zinc-900">購物車目前是空的</p>
            <p className="mt-3 text-sm text-zinc-500">
              先去挑選幾樣產品，加入後這裡就會顯示內容。
            </p>
            <Link
              to="/fullMenu"
              className="mt-8 inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              去挑選產品
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 rounded-2xl border border-zinc-100 bg-white p-4 lg:grid-cols-[1.6fr_0.8fr]">
            <section className="hidden lg:block">
              <h2 className="mb-4 text-lg font-bold text-zinc-900">商品明細</h2>

              <div
                className={`space-y-4 pr-2 ${
                  desktopShouldScroll ? "max-h-[34rem] overflow-y-auto" : ""
                }`}
              >
                {cart.map((item) => {
                  const lineTotal = item.finalPrice * item.quantity;

                  return (
                    <article
                      key={`${item.id}-${item.selectedVariant}`}
                      className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">
                            {item.subCategory}
                          </p>
                          <h2 className="mt-2 text-2xl font-bold text-zinc-900">{item.name}</h2>
                          <p className="mt-3 text-sm text-zinc-500">
                            規格：{variantLabels[item.selectedVariant] ?? item.selectedVariant}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
                            Qty
                          </p>
                          <p className="text-2xl font-black text-zinc-900">{item.quantity}</p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-4 text-sm text-zinc-500 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
                            單價
                          </p>
                          <p className="mt-2 text-lg font-semibold text-zinc-900">
                            {formatCurrency(item.finalPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
                            數量
                          </p>
                          <p className="mt-2 text-lg font-semibold text-zinc-900">
                            {item.quantity}
                          </p>
                        </div>
                        <div className="md:text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
                            小計
                          </p>
                          <p className="mt-2 text-lg font-semibold text-zinc-900">
                            {formatCurrency(lineTotal)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="h-fit rounded-3xl bg-zinc-900 p-6 text-white lg:mt-[2.8rem]">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">
                Summary
              </p>
              <h2 className="mt-3 text-3xl font-black">訂單摘要</h2>

              <div className="mt-6 border-t border-white/10 pt-6 lg:hidden">
                <p className="mb-3 text-sm font-semibold text-white">訂單內容</p>

                <div className="space-y-3">
                  {visibleMobileItems.map((item) => {
                    const lineTotal = item.finalPrice * item.quantity;
                    const mobileVariantLabel =
                      mobileVariantLabels[item.selectedVariant] ?? item.selectedVariant;

                    return (
                      <div
                        key={`${item.id}-${item.selectedVariant}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <p className="text-sm text-white/80">
                          <span className="font-semibold text-white">{item.name}</span>
                          {mobileVariantLabel ? ` ${mobileVariantLabel}` : ""}
                          {` x ${item.quantity}`}
                        </p>
                        <div className="text-right font-semibold text-white">
                          <span>{formatCurrency(lineTotal)}</span>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out ${
                      isMobileExpanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-3">
                        {hiddenMobileItems.map((item) => {
                          const lineTotal = item.finalPrice * item.quantity;
                          const mobileVariantLabel =
                            mobileVariantLabels[item.selectedVariant] ?? item.selectedVariant;

                          return (
                            <div
                              key={`${item.id}-${item.selectedVariant}`}
                              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                            >
                              <p className="text-sm text-white/80">
                                <span className="font-semibold text-white">{item.name}</span>
                                {mobileVariantLabel ? ` ${mobileVariantLabel}` : ""}
                                {` x ${item.quantity}`}
                              </p>
                              <div className="text-right font-semibold text-white">
                                <span>{formatCurrency(lineTotal)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {showMobileToggle && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsMobileExpanded((prev) => !prev)}
                      className="text-sm font-semibold text-orange-300 transition-colors hover:text-orange-200"
                    >
                      {isMobileExpanded ? "收合" : "展開"}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>商品總數</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>商品金額</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4 text-lg font-bold">
                  <span>合計</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  to="/fullMenu"
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  繼續加購
                </Link>
                <Link
                  to="/checkout"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  前往結帳
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};
