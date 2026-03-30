import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser } from "../lib/auth";
import { clearSessionAuthGrace, markSessionAuthenticated } from "../lib/session-timeout";
import type { AuthUser } from "../types/auth";
import { AuthContext } from "./AuthContext";

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const isRecoverableAuthError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message === "Request timeout" ||
    error.message.includes("500") ||
    error.message.includes("502") ||
    error.message.includes("503") ||
    error.message.includes("504") ||
    error.message.toLowerCase().includes("bad gateway")
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const hydrateUser = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
    } catch (error) {
      if (isRecoverableAuthError(error)) {
        try {
          await wait(3000);
          const retryResponse = await getCurrentUser();
          setUser(retryResponse.user);
          setIsAuthReady(true);
          return;
        } catch {
          // Fall through and clear the local session if the retry also fails.
        }
      }

      setUser(null);
    } finally {
      setIsAuthReady(true);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateUserSafely = async () => {
      try {
        let response = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        if (!response.user) {
          setUser(null);
          return;
        }

        setUser(response.user);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isRecoverableAuthError(error)) {
          try {
            await wait(3000);

            if (!isMounted) {
              return;
            }

            const retryResponse = await getCurrentUser();

            if (!isMounted) {
              return;
            }

            setUser(retryResponse.user);
            return;
          } catch {
            // Fall through to clear the local session if the retry also fails.
          }
        }

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

    void hydrateUserSafely();

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
        markSessionAuthenticated();
        setUser(nextUser);
        setIsAuthReady(true);
      },
      signOut: () => {
        clearSessionAuthGrace();
        setUser(null);
        setIsAuthReady(true);
      },
      refreshUser: async () => {
        await hydrateUser();
      },
    }),
    [isAuthReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
