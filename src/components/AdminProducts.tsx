import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/useAuth";
import {
  createProduct,
  deleteCategory,
  deleteProduct,
  getAdminProducts,
  updateCategoryOrder,
  updateProduct,
} from "../lib/products";
import type { CreateProductPayload, MenuItem } from "../types/menu";

type ProductDraft = {
  subCategory: string;
  name: string;
  imageUrl: string;
  price: string;
  priceSmall: string;
  priceLarge: string;
  sortOrder: string;
};

type ProductGroup = {
  category: string;
  categoryOrder: number;
  items: MenuItem[];
};

const createEmptyDraft = (): ProductDraft => ({
  subCategory: "",
  name: "",
  imageUrl: "",
  price: "",
  priceSmall: "",
  priceLarge: "",
  sortOrder: "",
});

const formatPrice = (value?: number) =>
  typeof value === "number" ? `${value}` : "";

const toOptionalNumber = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

export const AdminProducts = () => {
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [categoryOrderInputs, setCategoryOrderInputs] = useState<Record<string, string>>(
    {},
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateSuccess, setIsCreateSuccess] = useState(false);
  const [createErrorDialog, setCreateErrorDialog] = useState<string | null>(null);
  const [pendingDeleteCategory, setPendingDeleteCategory] =
    useState<ProductGroup | null>(null);
  const [draftCategory, setDraftCategory] = useState("");
  const [draftCategoryOrder, setDraftCategoryOrder] = useState("");
  const [drafts, setDrafts] = useState<ProductDraft[]>([createEmptyDraft()]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated || !user?.isAdmin) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const hydrateProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminProducts();
        if (!isMounted) return;
        setProducts(response.products);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "商品載入失敗。");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void hydrateProducts();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isAuthenticated, user?.isAdmin]);

  const groupedProducts = useMemo<ProductGroup[]>(() => {
    const groups = new Map<string, ProductGroup>();
    for (const product of products) {
      if (!groups.has(product.category)) {
        groups.set(product.category, {
          category: product.category,
          categoryOrder: product.categoryOrder ?? 0,
          items: [],
        });
      }
      groups.get(product.category)!.items.push(product);
    }

    return Array.from(groups.values()).sort(
      (left, right) =>
        left.categoryOrder - right.categoryOrder ||
        left.category.localeCompare(right.category, "zh-Hant"),
    );
  }, [products]);

  useEffect(() => {
    const nextInputs: Record<string, string> = {};
    groupedProducts.forEach((group) => {
      nextInputs[group.category] = `${group.categoryOrder}`;
    });
    setCategoryOrderInputs(nextInputs);
  }, [groupedProducts]);

  const categoryCount = groupedProducts.length;
  const categorySuggestions = useMemo(
    () => groupedProducts.map((group) => group.category),
    [groupedProducts],
  );

  const draftSubCategorySuggestions = useMemo(() => {
    const normalizedCategory = draftCategory.trim();
    return Array.from(
      new Set(
        products
          .filter(
            (product) =>
              normalizedCategory === "" || product.category === normalizedCategory,
          )
          .map((product) => product.subCategory),
      ),
    ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  }, [draftCategory, products]);

  const activeCategoryMeta = useMemo(
    () => groupedProducts.find((group) => group.category === draftCategory.trim()) ?? null,
    [draftCategory, groupedProducts],
  );

  const getNextDraftSortOrder = (category: string, existingDrafts: ProductDraft[]) => {
    const normalizedCategory = category.trim();
    const existingSortOrders = products
      .filter((product) => product.category === normalizedCategory)
      .map((product) => product.sortOrder ?? 0)
      .filter((value) => value > 0);
    const draftSortOrders = existingDrafts
      .map((item) => Number(item.sortOrder))
      .filter((value) => Number.isFinite(value) && value > 0);

    const maxSortOrder = Math.max(0, ...existingSortOrders, ...draftSortOrders);
    return `${maxSortOrder + 1}`;
  };

  const getAvailableSortOrder = (
    category: string,
    preferredSortOrder: string,
    existingDrafts: ProductDraft[],
  ) => {
    const normalizedCategory = category.trim();
    const usedSortOrders = new Set<number>(
      products
        .filter((product) => product.category === normalizedCategory)
        .map((product) => product.sortOrder ?? 0)
        .filter((value) => value > 0),
    );

    existingDrafts.forEach((item) => {
      const parsedValue = Number(item.sortOrder);
      if (Number.isFinite(parsedValue) && parsedValue > 0) {
        usedSortOrders.add(parsedValue);
      }
    });

    const parsedPreferred = Number(preferredSortOrder);

    if (
      Number.isFinite(parsedPreferred) &&
      parsedPreferred > 0 &&
      !usedSortOrders.has(parsedPreferred)
    ) {
      return parsedPreferred;
    }

    let candidate = 1;
    while (usedSortOrders.has(candidate)) {
      candidate += 1;
    }

    return candidate;
  };

  const refreshProducts = async () => {
    const response = await getAdminProducts();
    setProducts(response.products);
  };

  const scrollToCategory = (category: string) => {
    const section = categorySectionRefs.current[category];
    const container = contentScrollRef.current;
    if (!section) return;
    if (!container) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const top =
      section.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      12;

    container.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const handleFieldChange = (productId: string, field: keyof MenuItem, value: string) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              [field]:
                field === "sortOrder" ||
                field === "price" ||
                field === "priceSmall" ||
                field === "priceLarge"
                  ? value === ""
                    ? undefined
                    : Number(value)
                  : value,
            }
          : product,
      ),
    );
  };

  const handleSave = async (product: MenuItem) => {
    setSavingProductId(product.id);
    setSavedProductId(null);
    setError(null);
    try {
      await updateProduct(product.id, {
        category: product.category,
        subCategory: product.subCategory,
        name: product.name,
        imageUrl: product.imageUrl?.trim() ? product.imageUrl.trim() : null,
        price: typeof product.price === "number" ? product.price : undefined,
        priceSmall:
          typeof product.priceSmall === "number" ? product.priceSmall : undefined,
        priceLarge:
          typeof product.priceLarge === "number" ? product.priceLarge : undefined,
        sortOrder: typeof product.sortOrder === "number" ? product.sortOrder : 0,
      });
      await refreshProducts();
      setSavedProductId(product.id);
      window.setTimeout(() => {
        setSavedProductId((currentProductId) =>
          currentProductId === product.id ? null : currentProductId,
        );
      }, 700);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "商品更新失敗。");
    } finally {
      setSavingProductId(null);
    }
  };

  const handleDelete = async (product: MenuItem) => {
    const confirmed = window.confirm(`確定要刪除商品「${product.name}」嗎？`);
    if (!confirmed) return;
    setDeletingProductId(product.id);
    setError(null);
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "刪除商品失敗。");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleDeleteCategory = (group: ProductGroup) => {
    setPendingDeleteCategory(group);
  };

  const confirmDeleteCategory = async () => {
    if (!pendingDeleteCategory) return;
    setDeletingCategory(pendingDeleteCategory.category);
    setError(null);
    try {
      await deleteCategory(pendingDeleteCategory.category);
      await refreshProducts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "刪除分類失敗。");
    } finally {
      setDeletingCategory(null);
      setPendingDeleteCategory(null);
    }
  };

  const handleSaveCategoryOrder = async (category: string) => {
    const nextOrder = Number(categoryOrderInputs[category]);
    if (!Number.isInteger(nextOrder) || nextOrder < 0) {
      setError("分類排序必須是大於或等於 0 的整數。");
      return;
    }
    setSavingCategory(category);
    setError(null);
    try {
      await updateCategoryOrder({ category, categoryOrder: nextOrder });
      await refreshProducts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "分類排序更新失敗。");
    } finally {
      setSavingCategory(null);
    }
  };

  const handleDraftFieldChange = (index: number, field: keyof ProductDraft, value: string) => {
    setDrafts((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleCreate = async () => {
    if (!draftCategory.trim()) {
      setCreateErrorDialog("請先填寫分類。");
      return;
    }
    const normalizedDrafts = drafts.filter(
      (item) => item.subCategory.trim() || item.name.trim(),
    );
    if (normalizedDrafts.length === 0) {
      setCreateErrorDialog("請至少新增一個商品。");
      return;
    }
    if (normalizedDrafts.some((item) => !item.subCategory.trim() || !item.name.trim())) {
      setCreateErrorDialog("每個商品都需要填寫子分類和商品名稱。");
      return;
    }

    setIsCreating(true);
    setIsCreateSuccess(false);
    setError(null);
    setCreateErrorDialog(null);
    try {
      const workingDrafts = normalizedDrafts.map((item) => ({ ...item }));

      for (let index = 0; index < workingDrafts.length; index += 1) {
        const item = workingDrafts[index];
        const sortOrder = getAvailableSortOrder(
          draftCategory,
          item.sortOrder,
          workingDrafts.slice(0, index),
        );
        workingDrafts[index] = {
          ...item,
          sortOrder: `${sortOrder}`,
        };
        const payload: CreateProductPayload = {
          category: draftCategory.trim(),
          categoryOrder:
            activeCategoryMeta?.categoryOrder ?? toOptionalNumber(draftCategoryOrder),
          subCategory: item.subCategory.trim(),
          name: item.name.trim(),
          imageUrl: item.imageUrl.trim() || undefined,
          price: toOptionalNumber(item.price),
          priceSmall: toOptionalNumber(item.priceSmall),
          priceLarge: toOptionalNumber(item.priceLarge),
          sortOrder,
        };
        await createProduct(payload);
      }
      await refreshProducts();
      setIsCreateSuccess(true);
      window.setTimeout(() => {
        setDraftCategory("");
        setDraftCategoryOrder("");
        setDrafts([{ ...createEmptyDraft(), sortOrder: "1" }]);
        setIsCreateSuccess(false);
        setIsCreateModalOpen(false);
      }, 700);
    } catch (createError) {
      setCreateErrorDialog(createError instanceof Error ? createError.message : "新增商品失敗。");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">正在確認商品管理權限...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Admin
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            沒有權限查看商品管理
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            請使用管理員帳號登入後，再進入後台商品管理頁面。          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40 lg:h-full lg:overflow-hidden lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <div className="shrink-0">
          <div className="mb-12 flex flex-col gap-6 border-b border-zinc-100 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
                Admin
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
                商品管理
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
                在這裡可以調整分類排序、商品內容與價格。前台產品列表會直接跟著後台商品資料同步更新。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-3xl bg-zinc-50 p-4">
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  商品數
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">{products.length}</p>
              </div>
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  分類數
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">{categoryCount}</p>
              </div>
            </div>
          </div>

          {!isLoading && groupedProducts.length > 0 && (
            <div className="mb-8 rounded-[1.75rem] border border-zinc-100 bg-white/95 p-4 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="-mx-1 overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-2 px-1">
                    {groupedProducts.map((group) => (
                      <button
                        key={group.category}
                        type="button"
                        onClick={() => scrollToCategory(group.category)}
                        className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-orange-300 hover:text-orange-600"
                      >
                        {group.category}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                    onClick={() => {
                      setCreateErrorDialog(null);
                      setIsCreateSuccess(false);
                      setDraftCategory("");
                      setDraftCategoryOrder("");
                      setDrafts([{ ...createEmptyDraft(), sortOrder: "1" }]);
                      setIsCreateModalOpen(true);
                    }}
                  className="h-12 shrink-0 rounded-full bg-zinc-900 px-5 text-sm text-white hover:bg-zinc-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增商品
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div
          ref={contentScrollRef}
          className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2"
        >
          {isLoading ? (
            <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center text-sm text-zinc-500">
              商品載入中...
            </div>
          ) : (
            <div className="space-y-8">
              {groupedProducts.map((group) => (
                <section
                  key={group.category}
                  ref={(element) => {
                    categorySectionRefs.current[group.category] = element;
                  }}
                  className="scroll-mt-44"
                >
                  <div className="mb-4 flex flex-col gap-4 rounded-[1.75rem] border border-zinc-100 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                          分類
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-zinc-900">
                          {group.category}
                        </h2>
                      </div>
                      <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-500">
                        {group.items.length} 個商品                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                          分類排序
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={categoryOrderInputs[group.category] ?? `${group.categoryOrder}`}
                          onChange={(event) =>
                            setCategoryOrderInputs((current) => ({
                              ...current,
                              [group.category]: event.target.value,
                            }))
                          }
                          className="h-11 w-24 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => void handleSaveCategoryOrder(group.category)}
                        disabled={
                          savingCategory === group.category ||
                          deletingCategory === group.category
                        }
                        className="h-11 rounded-full bg-zinc-900 px-5 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {savingCategory === group.category ? "儲存中..." : "儲存分類排序"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDeleteCategory(group)}
                        disabled={deletingCategory === group.category}
                        className="h-11 rounded-full border-red-200 px-5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingCategory === group.category ? "刪除中..." : "刪除分類"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {group.items.map((product) => {
                      const isSaving = savingProductId === product.id;
                      const isDeleting = deletingProductId === product.id;

                      return (
                        <article
                          key={product.id}
                          className="rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm md:p-6"
                        >
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto]">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                                  商品
                                </p>
                                <p className="mt-2 text-sm text-zinc-400">ID: {product.id}</p>
                              </div>
                              <input
                                type="text"
                                value={product.name}
                                onChange={(event) =>
                                  handleFieldChange(product.id, "name", event.target.value)
                                }
                                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-orange-400"
                              />
                              <div className="grid gap-3 md:grid-cols-2">
                                <input
                                  type="text"
                                  value={product.category}
                                  onChange={(event) =>
                                    handleFieldChange(product.id, "category", event.target.value)
                                  }
                                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                                />
                                <input
                                  type="text"
                                  value={product.subCategory}
                                  onChange={(event) =>
                                    handleFieldChange(
                                      product.id,
                                      "subCategory",
                                      event.target.value,
                                    )
                                  }
                                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                                />
                              </div>
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_5.5rem] md:items-end">
                                <div>
                                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                                    圖片網址
                                  </p>
                                  <input
                                    type="text"
                                    value={product.imageUrl ?? ""}
                                    onChange={(event) =>
                                      handleFieldChange(product.id, "imageUrl", event.target.value)
                                    }
                                    placeholder="/image/products/example.jpg"
                                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                                  />
                                </div>
                                <div className="overflow-hidden rounded-[1rem] border border-zinc-200 bg-zinc-100">
                                  <div className="aspect-square">
                                    {product.imageUrl?.trim() ? (
                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                                        IMG
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:content-start">
                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                                  單一價格
                                </p>
                                <input
                                  type="number"
                                  min={0}
                                  value={formatPrice(product.price)}
                                  onChange={(event) =>
                                    handleFieldChange(product.id, "price", event.target.value)
                                  }
                                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                                />
                              </div>
                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                                  商品排序
                                </p>
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    typeof product.sortOrder === "number"
                                      ? product.sortOrder
                                      : 0
                                  }
                                  onChange={(event) =>
                                    handleFieldChange(product.id, "sortOrder", event.target.value)
                                  }
                                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                                />
                              </div>
                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                                  小份價格
                                </p>
                                <input
                                  type="number"
                                  min={0}
                                  value={formatPrice(product.priceSmall)}
                                  onChange={(event) =>
                                    handleFieldChange(
                                      product.id,
                                      "priceSmall",
                                      event.target.value,
                                    )
                                  }
                                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                                />
                              </div>
                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                                  大份價格
                                </p>
                                <input
                                  type="number"
                                  min={0}
                                  value={formatPrice(product.priceLarge)}
                                  onChange={(event) =>
                                    handleFieldChange(
                                      product.id,
                                      "priceLarge",
                                      event.target.value,
                                    )
                                  }
                                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col justify-end gap-3">
                              <Button
                                type="button"
                                onClick={() => void handleSave(product)}
                                disabled={isSaving || isDeleting}
                                className="h-12 rounded-full bg-zinc-900 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                              >
                                {isSaving ? (
                                  "儲存中..."
                                ) : savedProductId === product.id ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    儲存成功
                                  </span>
                                ) : (
                                  "儲存"
                                )}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void handleDelete(product)}
                                disabled={isDeleting || isSaving}
                                className="h-12 rounded-full border-red-200 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isDeleting ? "刪除中..." : "刪除商品"}
                              </Button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/50 px-6 py-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsCreateModalOpen(false);
            }
          }}
        >
          <div className="mx-auto flex h-full max-w-3xl items-center justify-center">
            <div
              className="max-h-full w-full overflow-y-auto rounded-[2rem] bg-white p-7 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
                    商品
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-zinc-900">新增商品</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-500">
                    可一次新增多個商品，但會共用同一個分類。子分類、名稱、價格與排序可逐筆填寫。                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateErrorDialog(null);
                    setIsCreateSuccess(false);
                    setIsCreateModalOpen(false);
                  }}
                  className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  aria-label="關閉新增商品"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div>
                  <input
                    type="text"
                    list="admin-product-category-list"
                    value={draftCategory}
                    onChange={(event) => {
                      const nextCategory = event.target.value;
                      setDraftCategory(nextCategory);
                      setDraftCategoryOrder(
                        groupedProducts.find((group) => group.category === nextCategory)
                          ?.categoryOrder?.toString() ?? "",
                      );
                      setDrafts((currentDrafts) =>
                        currentDrafts.map((draftItem, index) =>
                          draftItem.sortOrder.trim() === ""
                            ? {
                                ...draftItem,
                                sortOrder: getNextDraftSortOrder(
                                  nextCategory,
                                  currentDrafts.slice(0, index),
                                ),
                              }
                            : draftItem,
                        ),
                      );
                    }}
                    placeholder="分類"
                    className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                  />
                  <datalist id="admin-product-category-list">
                    {categorySuggestions.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <input
                  type="number"
                  min={0}
                  value={draftCategoryOrder}
                  onChange={(event) => setDraftCategoryOrder(event.target.value)}
                  placeholder="分類排序"
                  className="h-12 rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                />
              </div>

              <div className="mt-6 space-y-4">
                {drafts.map((draftItem, index) => (
                  <div
                    key={`draft-${index}`}
                    className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-zinc-900">商品 {index + 1}</p>
                      {drafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDrafts((currentDrafts) =>
                              currentDrafts.filter(
                                (_, currentIndex) => currentIndex !== index,
                              ),
                            )
                          }
                          className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white hover:text-red-600"
                          aria-label={`刪除商品 ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          list="admin-product-subcategory-list"
                          value={draftItem.subCategory}
                          onChange={(event) =>
                            handleDraftFieldChange(
                              index,
                              "subCategory",
                              event.target.value,
                            )
                          }
                          placeholder="子分類"
                          className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={draftItem.name}
                        onChange={(event) =>
                          handleDraftFieldChange(index, "name", event.target.value)
                        }
                        placeholder="商品名稱"
                        className="h-12 rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400 md:col-span-2"
                      />
                      <input
                        type="text"
                        value={draftItem.imageUrl}
                        onChange={(event) =>
                          handleDraftFieldChange(index, "imageUrl", event.target.value)
                        }
                        placeholder="/image/products/example.jpg"
                        className="h-12 rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400 md:col-span-2"
                      />
                      <input
                        type="number"
                        min={0}
                        value={draftItem.price}
                        onChange={(event) =>
                          handleDraftFieldChange(index, "price", event.target.value)
                        }
                        placeholder="單一價格"
                        className="h-12 rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                      />
                      <input
                        type="number"
                        min={0}
                        value={draftItem.sortOrder}
                        onChange={(event) =>
                          handleDraftFieldChange(index, "sortOrder", event.target.value)
                        }
                        placeholder="商品排序"
                        className="h-12 rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                      />
                      <input
                        type="number"
                        min={0}
                        value={draftItem.priceSmall}
                        onChange={(event) =>
                          handleDraftFieldChange(index, "priceSmall", event.target.value)
                        }
                        placeholder="小份價格"
                        className="h-12 rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                      />
                      <input
                        type="number"
                        min={0}
                        value={draftItem.priceLarge}
                        onChange={(event) =>
                          handleDraftFieldChange(index, "priceLarge", event.target.value)
                        }
                        placeholder="大份價格"
                        className="h-12 rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-400"
                      />
                    </div>
                  </div>
                ))}

                <datalist id="admin-product-subcategory-list">
                  {draftSubCategorySuggestions.map((subCategory) => (
                    <option key={subCategory} value={subCategory} />
                  ))}
                </datalist>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDrafts((currentDrafts) => [
                      ...currentDrafts,
                      {
                        ...createEmptyDraft(),
                        sortOrder: getNextDraftSortOrder(draftCategory, currentDrafts),
                      },
                    ])
                  }
                  className="h-11 rounded-full border-zinc-200 text-sm text-zinc-900 hover:bg-zinc-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  再新增一個商品                </Button>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={isCreating || isCreateSuccess}
                  className="h-12 flex-1 rounded-full bg-zinc-900 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {isCreating ? ("新增中...") : isCreateSuccess ? (<span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />新增成功</span>) : ("新增商品")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateErrorDialog(null);
                    setIsCreateSuccess(false);
                    setIsCreateModalOpen(false);
                  }}
                  className="h-12 flex-1 rounded-full border-zinc-200 text-sm text-zinc-900 hover:bg-zinc-100"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteCategory && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
              分類
            </p>
            <h3 className="mt-3 text-2xl font-black text-zinc-900">刪除分類</h3>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              確定要刪除分類「{pendingDeleteCategory.category}」嗎？這會一起刪除底下{" "}
              {pendingDeleteCategory.items.length} 個商品。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => void confirmDeleteCategory()}
                disabled={deletingCategory === pendingDeleteCategory.category}
                className="h-11 flex-1 rounded-full bg-red-600 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {deletingCategory === pendingDeleteCategory.category
                  ? "刪除中..."
                  : "確認刪除"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingDeleteCategory(null)}
                disabled={deletingCategory === pendingDeleteCategory.category}
                className="h-11 flex-1 rounded-full border-zinc-200 text-sm text-zinc-900 hover:bg-zinc-100"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {createErrorDialog && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
              提示
            </p>
            <h3 className="mt-3 text-2xl font-black text-zinc-900">新增商品失敗</h3>
            <p className="mt-4 text-sm leading-7 text-zinc-600">{createErrorDialog}</p>
            <div className="mt-6">
              <Button
                type="button"
                onClick={() => setCreateErrorDialog(null)}
                className="h-11 w-full rounded-full bg-zinc-900 text-sm text-white hover:bg-zinc-800"
              >
                我知道了
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
