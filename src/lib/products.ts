import { apiRequest } from "./api";
import type {
  CreateProductPayload,
  CreateProductResponse,
  DeleteProductResponse,
  ProductsResponse,
  UpdateCategoryOrderPayload,
  UpdateCategoryOrderResponse,
  UpdateProductPayload,
  UpdateProductResponse,
} from "../types/menu";

export const getProducts = async (): Promise<ProductsResponse> => {
  return apiRequest<ProductsResponse>("/products");
};

export const getAdminProducts = async (): Promise<ProductsResponse> => {
  return apiRequest<ProductsResponse>("/admin/products");
};

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<CreateProductResponse> => {
  return apiRequest<CreateProductResponse>("/admin/products", {
    method: "POST",
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
