import { apiRequest } from "./api";
import type {
  CreateProductPayload,
  CreateProductResponse,
  DeleteProductResponse,
  FeaturedProductsResponse,
  ProductsResponse,
  UpdateCategoryOrderPayload,
  UpdateCategoryOrderResponse,
  UpdateFeaturedProductsPayload,
  UpdateFeaturedProductsResponse,
  UpdateProductPayload,
  UpdateProductResponse,
} from "../types/menu";

export const getProducts = async (): Promise<ProductsResponse> => {
  return apiRequest<ProductsResponse>("/products");
};

export const getAdminProducts = async (): Promise<ProductsResponse> => {
  return apiRequest<ProductsResponse>("/admin/products");
};

export const getFeaturedProducts = async (): Promise<FeaturedProductsResponse> => {
  return apiRequest<FeaturedProductsResponse>("/products/featured");
};

export const getAdminFeaturedProducts = async (): Promise<FeaturedProductsResponse> => {
  return apiRequest<FeaturedProductsResponse>("/admin/products/featured");
};

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<CreateProductResponse> => {
  return apiRequest<CreateProductResponse>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateFeaturedProducts = async (
  payload: UpdateFeaturedProductsPayload,
): Promise<UpdateFeaturedProductsResponse> => {
  return apiRequest<UpdateFeaturedProductsResponse>("/admin/products/featured", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const updateCategoryOrder = async (
  payload: UpdateCategoryOrderPayload,
): Promise<UpdateCategoryOrderResponse> => {
  return apiRequest<UpdateCategoryOrderResponse>("/admin/products/category-order", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const updateProduct = async (
  productId: string,
  payload: UpdateProductPayload,
): Promise<UpdateProductResponse> => {
  return apiRequest<UpdateProductResponse>(`/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteProduct = async (
  productId: string,
): Promise<DeleteProductResponse> => {
  return apiRequest<DeleteProductResponse>(`/admin/products/${productId}`, {
    method: "DELETE",
  });
};

export const deleteCategory = async (
  category: string,
): Promise<DeleteProductResponse> => {
  return apiRequest<DeleteProductResponse>(
    `/admin/products/category/${encodeURIComponent(category)}`,
    {
      method: "DELETE",
    },
  );
};
