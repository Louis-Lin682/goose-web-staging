export interface MenuItem {
  id: string;
  category: string;
  categoryOrder?: number;
  subCategory: string;
  name: string;
  imageUrl?: string | null;
  price?: number;
  priceSmall?: number;
  priceLarge?: number;
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

export type CreateProductPayload = {
  category: string;
  categoryOrder?: number;
  subCategory: string;
  name: string;
  imageUrl?: string;
  price?: number;
  priceSmall?: number;
  priceLarge?: number;
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
  imageUrl?: string | null;
  price?: number;
  priceSmall?: number;
  priceLarge?: number;
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
