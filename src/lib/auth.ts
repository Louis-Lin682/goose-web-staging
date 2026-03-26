import { API_BASE_URL, apiRequest } from "./api";
import type {
  CurrentUserResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from "../types/auth";

export const register = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const login = async (
  payload: LoginPayload,
): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  return apiRequest<CurrentUserResponse>("/auth/me");
};

export const logout = async (): Promise<LogoutResponse> => {
  return apiRequest<LogoutResponse>("/auth/logout", {
    method: "POST",
  });
};

export const forgotPassword = async (
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> => {
  return apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> => {
  return apiRequest<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getLineAuthStartUrl = (
  mode: "login" | "register" = "login",
): string => {
  const encodedMode = encodeURIComponent(mode);
  return `${API_BASE_URL}/auth/line/start?mode=${encodedMode}`;
};
