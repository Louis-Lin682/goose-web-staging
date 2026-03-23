import { createContext } from "react";
import type { AuthUser } from "../types/auth";

export type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
