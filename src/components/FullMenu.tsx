import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight } from "lucide-react";
import menuItems from "../config/menu.config";
import type { MenuItem } from "../types/menu";
import { SelectionDrawer } from "../components/SelectionDrawer";
import { useCart } from "../context/useCart";
import { getProducts } from "../lib/products";

const getDesktopPrice = (item: MenuItem) => item.price ?? item.priceSmall ?? 0;

const getProductImage = (item: MenuItem) => {
  const normalizedImageUrl = item.imageUrl?.trim();
  return normalizedImageUrl ? normalizedImageUrl : null;
};

const getMobilePriceLabel = (item: MenuItem) => {
  if (typeof item.priceSmall === "number" && typeof item.priceLarge === "number") {
    return `小 $${item.priceSmall} / 大 $${item.priceLarge}`;
  }

  if (typeof item.priceSmall === "number") {
    return `小 $${item.priceSmall}`;
  }

  return `$${item.price ?? 0}`;
};

export const FullMenu = () => {
  const [products, setProducts] = useState<MenuItem[]>(menuItems);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.category))),
    [products],
  );
  const [activeCategory, setActiveCategory] = useState("");
  const [hasCategorySelection, setHasCategorySelection] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    let isMounted = true;

    const hydrateProducts = async () => {
      try {
        const response = await getProducts();

        if (!isMounted || response.products.length === 0) {
          return;
        }

        setProducts(response.products);
      } catch {
        if (!isMounted) {
          return;
        }

        setProducts(menuItems);
      } finally {
        if (isMounted) {
          setIsProductsLoading(false);
        }
      }
    };

    void hydrateProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategory("");
      return;
    }

    if (!hasCategorySelection || !categories.includes(activeCategory)) {
      setActiveCategory(categories[0] ?? "");
    }
  }, [activeCategory, categories, hasCategorySelection]);

  const filteredItems = useMemo(
    () => products.filter((item) => item.category === activeCategory),
    [activeCategory, products],
  );

  const handleCategoryChange = (category: string) => {
    setHasCategorySelection(true);
    setActiveCategory(category);
  };

  const handleAddItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-white pb-24 pt-32 lg:pb-32 lg:pt-48">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 flex items-center gap-4 lg:mb-6"
          >
            <div className="h-[1px] w-10 bg-orange-600 lg:w-12" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600">
              The Selection
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black uppercase leading-[0.86] tracking-tighter text-zinc-900 italic md:text-7xl lg:text-9xl"
          >
            Full <br />
            <span className="text-zinc-200">Menu.</span>
          </motion.h1>
        </div>

        <div className="lg:hidden">
          {isProductsLoading && (
            <div className="mb-6 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
              載入商品資料中...
            </div>
          )}

          <div className="-mx-1 mb-6 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2 px-1 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    activeCategory === cat
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100">
                      {getProductImage(item) ? (
                        <img
                          src={getProductImage(item) ?? undefined}
                          alt={item.name}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                          IMG
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-orange-600">
                        {item.subCategory}
                      </p>
                      <h3 className="truncate text-lg font-bold text-zinc-900">{item.name}</h3>
                      <p className="mt-2 text-sm font-semibold text-zinc-500">
                        {getMobilePriceLabel(item)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddItem(item)}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition-colors active:scale-95"
                      aria-label={`加入 ${item.name}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden gap-20 lg:flex">
          <div className="lg:w-1/4">
            <nav className="sticky top-40 space-y-2">
              <p className="mb-6 px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">
                Categories
              </p>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`group flex w-full items-center justify-between rounded-xl px-4 py-5 text-left transition-all ${
                    activeCategory === cat
                      ? "scale-[1.02] bg-zinc-900 text-white shadow-2xl shadow-zinc-200"
                      : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-widest">{cat}</span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform duration-500 ${
                      activeCategory === cat ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:w-3/4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2"
              >
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative border-b border-zinc-100 pb-10 transition-colors duration-500 hover:border-zinc-900"
                  >
                    <div className="flex items-start gap-6">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 shadow-inner transition-all duration-700 group-hover:grayscale-0">
                        {getProductImage(item) ? (
                          <img
                            src={getProductImage(item) ?? undefined}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 italic">
                              IMAGE
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div>
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                              {item.subCategory}
                            </p>
                            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 transition-all group-hover:italic">
                              {item.name}
                            </h3>
                          </div>

                          <button
                            onClick={() => handleAddItem(item)}
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-all duration-500 active:scale-90 group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white"
                            aria-label={`加入 ${item.name}`}
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <p className="mb-6 text-xs font-medium leading-relaxed tracking-wide text-zinc-400">
                          精選商品資訊與介紹可顯示在這裡，桌機版先保留較完整的閱讀節奏。
                        </p>

                        <div className="text-right">
                          <span className="block text-[10px] font-bold uppercase text-zinc-300">
                            Price
                          </span>
                          <span className="text-2xl font-black text-zinc-900">
                            ${getDesktopPrice(item)}
                            {item.priceSmall && (
                              <span className="ml-1 text-[10px] font-sans uppercase tracking-tighter text-zinc-400">
                                up
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <SelectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onConfirm={(item, selections) => {
          selections.forEach((selection) => {
            addToCart(item, selection.variant, selection.price, selection.quantity);
          });
          setIsDrawerOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
};
