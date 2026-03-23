import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser } from "../lib/auth";
import type { AuthUser } from "../types/auth";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      try {
        const response = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        setUser(response.user);
      } catch {
        if (!isMounted) {
          return;
        }

        setUser(null);
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    };

    void hydrateUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAuthReady,
      signIn: (nextUser: AuthUser) => {
        setUser(nextUser);
        setIsAuthReady(true);
      },
      signOut: () => {
        setUser(null);
        setIsAuthReady(true);
      },
    }),
    [isAuthReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
