import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mandanten as mockMandanten } from "@/data/mockData";
import type { Mandant } from "@/data/types";

interface MandantAuthContextValue {
  mandant: Mandant | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
}

const MandantAuthContext = createContext<MandantAuthContextValue | null>(null);

export const MandantAuthProvider = ({ children }: { children: ReactNode }) => {
  const [mandant, setMandant] = useState<Mandant | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setDemoMode] = useState(false);
  // Track whether bootstrap was already attempted for this auth-user-id.
  // Prevents the RPC-loop where every onAuthStateChange (incl. token-refresh + tab-focus)
  // triggers another bootstrap call.
  const bootstrappedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo-Mode: Bergmann-Beispiel-Mandant
      setMandant(mockMandanten.find((m) => m.id === "md_1") ?? null);
      setDemoMode(true);
      return;
    }

    let active = true;

    const tryBootstrap = async (userId: string) => {
      if (bootstrappedFor.current === userId) return;
      bootstrappedFor.current = userId;
      // Wenn der User auch ein Kanzlei-Mitarbeiter ist, würde bootstrap_mandant_self
      // einen Fehler werfen. Den fangen wir und ignorieren ihn — der User ist dann
      // einfach kein Mandant.
      const { data: m, error } = await supabase!.rpc("bootstrap_mandant_self");
      if (!active) return;
      if (error) {
        // 1× pro Session loggen, dann ruhig sein
        console.info("[mandant-auth] kein Mandant (User ist Kanzlei-Mitarbeiter):", error.message);
        setMandant(null);
      } else {
        setMandant((m as unknown as Mandant) ?? null);
      }
      setLoading(false);
    };

    setLoading(true);
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        if (!data.session?.user) {
          setLoading(false);
          return;
        }
        await tryBootstrap(data.session.user.id);
      })
      .catch((e) => {
        console.warn("[mandant-auth] getSession failed:", e);
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!active) return;
      if (!sess?.user) {
        setMandant(null);
        bootstrappedFor.current = null;
        return;
      }
      // Nur bei tatsächlich neuem User bootstrappen, nicht bei Token-Refresh
      if (bootstrappedFor.current !== sess.user.id) {
        void tryBootstrap(sess.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<MandantAuthContextValue>(
    () => ({
      mandant,
      loading,
      isDemoMode,
      signInWithMagicLink: async (email: string) => {
        if (!supabase) {
          return { error: new Error("Supabase nicht konfiguriert.") };
        }
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/portal/dashboard`,
            shouldCreateUser: true,
          },
        });
        return { error };
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setMandant(null);
        bootstrappedFor.current = null;
      },
    }),
    [mandant, loading, isDemoMode],
  );

  return (
    <MandantAuthContext.Provider value={value}>
      {children}
    </MandantAuthContext.Provider>
  );
};

export const useMandantAuth = () => {
  const ctx = useContext(MandantAuthContext);
  if (!ctx) throw new Error("useMandantAuth must be used within MandantAuthProvider");
  return ctx;
};
