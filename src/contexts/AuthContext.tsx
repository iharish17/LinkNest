import React, { createContext, useEffect, useState } from "react";
import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CALLBACK_KEYS = [
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "token_hash",
  "token_type",
  "type",
  "code",
  "provider_token",
  "provider_refresh_token",
  "redirect_to",
  "next",
  "mode",
];

const PASSWORD_RESET_MODE = "reset-password";

const isBrowser = typeof window !== "undefined";

const getPasswordResetRedirectUrl = () => {
  if (!isBrowser) {
    return "";
  }

  const redirectUrl = new URL(window.location.origin);
  redirectUrl.searchParams.set("mode", PASSWORD_RESET_MODE);
  return redirectUrl.toString();
};

const hasRecoveryParams = () => {
  if (!isBrowser) {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    searchParams.get("mode") === PASSWORD_RESET_MODE ||
    searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery"
  );
};

const clearAuthCallbackParams = () => {
  if (!isBrowser) {
    return;
  }

  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

  AUTH_CALLBACK_KEYS.forEach((key) => {
    searchParams.delete(key);
    hashParams.delete(key);
  });

  const nextSearch = searchParams.toString();
  const nextHash = hashParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${
    nextHash ? `#${nextHash}` : ""
  }`;

  window.history.replaceState({}, document.title, nextUrl || "/");
};

const shouldEnableRecovery = (event: AuthChangeEvent) =>
  event === "PASSWORD_RECOVERY" || hasRecoveryParams();

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() =>
    hasRecoveryParams()
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setIsPasswordRecovery(hasRecoveryParams());
      setLoading(false);
    };

    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (shouldEnableRecovery(event)) {
        setIsPasswordRecovery(true);
        return;
      }

      if (event === "SIGNED_OUT") {
        setIsPasswordRecovery(false);
        clearAuthCallbackParams();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setIsPasswordRecovery(false);
      clearAuthCallbackParams();

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { error };
    }
  };

  const signOut = async () => {
    setIsPasswordRecovery(false);
    clearAuthCallbackParams();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPasswordRecovery,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
