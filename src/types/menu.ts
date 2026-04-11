export interface MenuItem {
  id: string;
  category: string;
  categoryOrder?: number;
  subCategory: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  priceSmall?: number | null;
  priceLarge?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CartItem extends MenuItem {
  selectedVariant?: string;
  finalPrice: number;
  quantity: number;
}

export type ProductsResponse = {
  products: MenuItem[];
};

export type FeaturedProductEntry = {
  slot: number;
  productId: string | null;
  tag: string | null;
  description: string | null;
  product: MenuItem | null;
};

export type FeaturedProductsResponse = {
  featuredProducts: FeaturedProductEntry[];
};

export type FeaturedProductPayload = {
  slot: number;
  productId?: string | null;
  tag?: string | null;
  description?: string | null;
};

export type UpdateFeaturedProductsPayload = {
  featuredProducts: FeaturedProductPayload[];
};

export type UpdateFeaturedProductsResponse = {
  message: string;
  featuredProducts: FeaturedProductEntry[];
};

export type CreateProductPayload = {
  category: string;
  categoryOrder?: number;
  subCategory: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number | null;
  priceSmall?: number | null;
  priceLarge?: number | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type CreateProductResponse = {
  message: string;
  product: MenuItem;
};

export type UpdateProductPayload = {
  category?: string;
  categoryOrder?: number;
  subCategory?: string;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  priceSmall?: number | null;
  priceLarge?: number | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateProductResponse = {
  message: string;
  product: MenuItem;
};

export type DeleteProductResponse = {
  message: string;
};

export type UpdateCategoryOrderPayload = {
  category: string;
  categoryOrder: number;
};

export type UpdateCategoryOrderResponse = {
  message: string;
};
