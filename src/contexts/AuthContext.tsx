import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  bootstrapError: string | null;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Bootstrap: stelle sicher, dass die public.users-Zeile existiert.
  // Wird nach jedem Login einmal aufgerufen.
  useEffect(() => {
    if (!supabase || !session?.user) return;
    let cancelled = false;
    (async () => {
      const { error } = await supabase.rpc("bootstrap_user_self");
      if (cancelled) return;
      if (error) {
        // Migration 0002 vielleicht noch nicht angewendet? Stillschweigend
        // ignorieren — Pages fallen dann auf Mock-Daten zurück.
        const msg = error.message ?? String(error);
        if (
          msg.includes("function") &&
          msg.includes("bootstrap_user_self")
        ) {
          console.warn(
            "[auth] bootstrap_user_self RPC fehlt. Migration 0002 noch nicht angewendet?",
          );
        } else if (msg.includes("Keine offene Einladung")) {
          setBootstrapError(msg);
        } else {
          console.warn("[auth] bootstrap failed:", msg);
        }
      } else {
        setBootstrapError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      bootstrapError,
      signInWithMagicLink: async (email: string) => {
        if (!supabase) {
          return { error: new Error("Supabase nicht konfiguriert.") };
        }
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: true, // erste Anmeldung legt auch auth.users-Eintrag an
          },
        });
        return { error };
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [session, loading, bootstrapError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
