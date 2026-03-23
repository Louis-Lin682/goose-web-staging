export type UserRole = "CUSTOMER" | "ADMIN";

export type RegisterPayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
  remember: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
};

export type RegisterResponse = {
  message?: string;
  token?: string;
  user?: AuthUser;
};

export type LoginResponse = {
  message?: string;
  user?: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser | null;
};

export type LogoutResponse = {
  message?: string;
};

export type AdminUserEntry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  users: AdminUserEntry[];
};

export type UpdateUserRolePayload = {
  role: UserRole;
};

export type UpdateUserRoleResponse = {
  message: string;
  userId: string;
  role: UserRole;
};
