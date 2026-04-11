import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, type Variants } from "framer-motion";
import { getFeaturedProducts, getProducts } from "../lib/products";
import type { FeaturedProductEntry, MenuItem } from "../types/menu";

type RenderableFeaturedItem = {
  slot: number;
  name: string;
  description: string;
  tag: string;
  image: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const DEFAULT_DESCRIPTION = "精選人氣料理，值得慢慢品嚐。";
const DEFAULT_PRODUCT_IMAGE = "/products/goose-platter-1.jpg";

const toRenderableItem = (
  slot: number,
  product: MenuItem,
  overrides?: Pick<FeaturedProductEntry, "tag" | "description">,
): RenderableFeaturedItem => ({
  slot,
  name: product.name,
  description:
    overrides?.description?.trim() ||
    product.description?.trim() ||
    DEFAULT_DESCRIPTION,
  tag: overrides?.tag?.trim() || product.subCategory || product.category,
  image: product.imageUrl?.trim() || DEFAULT_PRODUCT_IMAGE,
});

const buildFallbackFeaturedItems = (products: MenuItem[]): RenderableFeaturedItem[] => {
  return products
    .filter((product) => product.isActive !== false)
    .slice(0, 3)
    .map((product, index) => toRenderableItem(index + 1, product));
};

const mergeFeaturedItems = (
  featuredProducts: FeaturedProductEntry[],
  products: MenuItem[],
): RenderableFeaturedItem[] => {
  const activeProducts = products.filter((product) => product.isActive !== false);
  const productMap = new Map(activeProducts.map((product) => [product.id, product]));
  const usedProductIds = new Set<string>();

  const configuredItems = featuredProducts
    .map((entry) => {
      const product =
        entry.productId != null ? productMap.get(entry.productId) ?? entry.product : entry.product;

      if (!product) {
        return null;
      }

      usedProductIds.add(product.id);
      return toRenderableItem(entry.slot, product, entry);
    })
    .filter((item): item is RenderableFeaturedItem => Boolean(item))
    .sort((left, right) => left.slot - right.slot);

  if (configuredItems.length >= 3) {
    return configuredItems.slice(0, 3);
  }

  const fallbackPool = activeProducts.filter((product) => !usedProductIds.has(product.id));
  const missingSlots = [1, 2, 3].filter(
    (slot) => !configuredItems.some((item) => item.slot === slot),
  );

  const fillerItems = missingSlots
    .map((slot, index) => {
      const product = fallbackPool[index];
      return product ? toRenderableItem(slot, product) : null;
    })
    .filter((item): item is RenderableFeaturedItem => Boolean(item));

  return [...configuredItems, ...fillerItems]
    .sort((left, right) => left.slot - right.slot)
    .slice(0, 3);
};

export const Menu = () => {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState<RenderableFeaturedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateFeaturedItems = async () => {
      setIsLoading(true);

      try {
        const [featuredResponse, productsResponse] = await Promise.all([
          getFeaturedProducts().catch(() => null),
          getProducts(),
        ]);

        if (!isMounted) return;

        if (featuredResponse) {
          setFeaturedItems(
            mergeFeaturedItems(featuredResponse.featuredProducts, productsResponse.products),
          );
        } else {
          setFeaturedItems(buildFallbackFeaturedItems(productsResponse.products));
        }
      } catch {
        if (!isMounted) return;
        setFeaturedItems([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydrateFeaturedItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const items = useMemo(() => featuredItems.slice(0, 3), [featuredItems]);

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tighter underline decoration-orange-500 decoration-4 underline-offset-8">
          推薦產品
        </h2>
        <div className="ml-8 hidden h-px flex-1 bg-zinc-100 md:block" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((menu) => (
          <motion.div
            key={menu.slot}
            variants={cardVariants}
            whileHover={{ y: -10 }}
            whileTap={{ scale: 0.985, y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate("/fullMenu")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/fullMenu");
                }
              }}
              className="group cursor-pointer overflow-hidden rounded-[1.75rem] border-zinc-200 bg-white shadow-none transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <img
                  src={menu.image}
                  alt={menu.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute right-4 top-4 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  {menu.tag}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {menu.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {menu.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
