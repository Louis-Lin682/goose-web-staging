import { apiRequest } from "./api";
import type {
  AdminUsersResponse,
  UpdateUserRolePayload,
  UpdateUserRoleResponse,
} from "../types/auth";

export const getAdminUsers = async (): Promise<AdminUsersResponse> => {
  return apiRequest<AdminUsersResponse>("/admin/users");
};

export const updateUserRole = async (
  userId: string,
  payload: UpdateUserRolePayload,
): Promise<UpdateUserRoleResponse> => {
  return apiRequest<UpdateUserRoleResponse>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
