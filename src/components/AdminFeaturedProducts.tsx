import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/useAuth";
import {
  getAdminFeaturedProducts,
  getAdminProducts,
  updateFeaturedProducts,
} from "../lib/products";
import type {
  FeaturedProductPayload,
  FeaturedProductsResponse,
  MenuItem,
} from "../types/menu";

const DEFAULT_PRODUCT_IMAGE = "/products/goose-platter-1.jpg";

type FeaturedProductFormSlot = {
  slot: number;
  productId: string;
  tag: string;
  description: string;
};

const EMPTY_FORM_SLOTS: FeaturedProductFormSlot[] = [1, 2, 3].map((slot) => ({
  slot,
  productId: "",
  tag: "",
  description: "",
}));

const toFormSlots = (
  featuredProducts: FeaturedProductsResponse["featuredProducts"],
): FeaturedProductFormSlot[] => {
  const bySlot = new Map(featuredProducts.map((item) => [item.slot, item]));

  return [1, 2, 3].map((slot) => {
    const item = bySlot.get(slot);
    return {
      slot,
      productId: item?.productId ?? "",
      tag: item?.tag ?? "",
      description: item?.description ?? "",
    };
  });
};

const toPayload = (
  slots: FeaturedProductFormSlot[],
): FeaturedProductPayload[] =>
  slots.map((slot) => ({
    slot: slot.slot,
    productId: slot.productId.trim() || null,
    tag: slot.tag.trim() || null,
    description: slot.description.trim() || null,
  }));

export const AdminFeaturedProducts = () => {
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [formSlots, setFormSlots] =
    useState<FeaturedProductFormSlot[]>(EMPTY_FORM_SLOTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated || !user?.isAdmin) {
      setProducts([]);
      setFormSlots(EMPTY_FORM_SLOTS);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const hydratePage = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const [productsResponse, featuredResponse] = await Promise.all([
          getAdminProducts(),
          getAdminFeaturedProducts(),
        ]);

        if (!isMounted) return;

        setProducts(productsResponse.products);
        setFormSlots(toFormSlots(featuredResponse.featuredProducts));
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "推薦產品載入失敗。");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydratePage();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isAuthenticated, user?.isAdmin]);

  const activeProducts = useMemo(
    () =>
      products
        .filter((product) => product.isActive !== false)
        .sort((left, right) => left.name.localeCompare(right.name, "zh-Hant")),
    [products],
  );

  const selectedProductMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const handleSlotChange = (
    slotNumber: number,
    field: keyof Omit<FeaturedProductFormSlot, "slot">,
    value: string,
  ) => {
    setFormSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.slot === slotNumber
          ? {
              ...slot,
              [field]: value,
            }
          : slot,
      ),
    );
    setSuccessMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateFeaturedProducts({
        featuredProducts: toPayload(formSlots),
      });
      setFormSlots(toFormSlots(response.featuredProducts));
      setSuccessMessage(response.message);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "推薦產品更新失敗。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/55 bg-white/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-sm md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.38em] text-orange-600">
              Admin
            </p>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-zinc-900">
                  推薦產品
                </h1>
                <p className="mt-1 text-sm leading-7 text-zinc-500">
                  設定首頁推薦區塊的三張產品卡片，可隨時更換商品、標籤與文案描述。
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isLoading || isSaving}
            className="rounded-full bg-zinc-900 px-5"
          >
            {isSaving ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                儲存設定
              </>
            )}
          </Button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {successMessage}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {formSlots.map((slot) => {
          const selectedProduct = slot.productId
            ? selectedProductMap.get(slot.productId) ?? null
            : null;

          return (
              <article
                key={slot.slot}
                className="h-[72vh] overflow-auto rounded-[2rem] border border-white/55 bg-white/82 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-sm"
              >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-zinc-400">
                    Slot 0{slot.slot}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
                    推薦卡片 {slot.slot}
                  </h2>
                </div>
                <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                  首頁顯示
                </div>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-zinc-800">推薦商品</span>
                  <select
                    value={slot.productId}
                    onChange={(event) =>
                      handleSlotChange(slot.slot, "productId", event.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300"
                  >
                    <option value="">請選擇商品</option>
                    {activeProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-zinc-800">標籤文字</span>
                  <input
                    type="text"
                    value={slot.tag}
                    onChange={(event) =>
                      handleSlotChange(slot.slot, "tag", event.target.value)
                    }
                    placeholder="例如：人氣推薦"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-zinc-800">文案描述</span>
                  <textarea
                    value={slot.description}
                    onChange={(event) =>
                      handleSlotChange(slot.slot, "description", event.target.value)
                    }
                    placeholder="輸入首頁推薦卡片要顯示的描述文案"
                    rows={5}
                    className="w-full rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3 text-sm leading-7 text-zinc-900 outline-none transition focus:border-orange-300"
                  />
                </label>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-zinc-50">
                <div className="aspect-[4/3] bg-zinc-100">
                  <img
                    src={selectedProduct?.imageUrl?.trim() || DEFAULT_PRODUCT_IMAGE}
                    alt={selectedProduct?.name ?? "預設商品圖片"}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-2 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold tracking-tight text-zinc-900">
                      {selectedProduct?.name ?? "尚未選擇推薦商品"}
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500 shadow-sm">
                      {slot.tag.trim() || "未設定標籤"}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-zinc-500">
                    {slot.description.trim() ||
                      selectedProduct?.description ||
                      "尚未設定推薦描述。"}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
