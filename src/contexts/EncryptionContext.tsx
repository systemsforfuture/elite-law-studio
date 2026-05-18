// SYSTEMS™ — Encryption-Context
//
// Hält den entschlüsselten DEK des aktuellen Tenants in Memory für die
// Lebensdauer der Session. Persistiert NICHT in localStorage — das wäre
// das gesamte E2E-Konzept ad absurdum führen. Bei Page-Reload muss
// erneut unlocked werden.
//
// Optional: "remember in tab" via sessionStorage (nur in-memory der
// Browser-Tab-Lebenszeit) — wird verschlüsselt mit einem random tab-key.
// Default: aus.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTenant } from "@/contexts/TenantContext";
import {
  setupE2eEncryption,
  unlockWithPassphrase,
  unlockWithRecovery,
  type E2eBootstrap,
} from "@/lib/encryption";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface TenantE2eMeta {
  e2e_enabled: boolean;
  encrypted_dek: string | null;
  dek_salt: string | null;
  dek_iv: string | null;
  encrypted_dek_recovery: string | null;
  dek_recovery_salt: string | null;
  dek_recovery_iv: string | null;
}

interface EncryptionContextValue {
  /** true wenn der Tenant E2E aktiviert hat */
  enabled: boolean;
  /** true wenn DEK in Memory ist (unlock erfolgt) */
  unlocked: boolean;
  /** DEK für Encrypt/Decrypt — nur wenn unlocked */
  dek: CryptoKey | null;
  /** true wenn DB-Lookup für e2e_meta noch läuft */
  loading: boolean;
  /** Vom UI aufgerufen wenn der Tenant E2E erstmals aktiviert */
  setup: (passphrase: string) => Promise<E2eBootstrap>;
  /** Unlock mit Passphrase */
  unlock: (passphrase: string) => Promise<void>;
  /** Unlock mit Recovery-Mnemonic (24-Wörter) */
  unlockRecovery: (mnemonic: string) => Promise<void>;
  /** Lock — DEK aus Memory löschen (z.B. bei Logout) */
  lock: () => void;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

export const EncryptionProvider = ({ children }: { children: ReactNode }) => {
  const { tenant } = useTenant();
  const [meta, setMeta] = useState<TenantE2eMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [dek, setDek] = useState<CryptoKey | null>(null);

  // Tenant-Meta laden — bei jedem tenant.id-Wechsel
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      if (!isSupabaseConfigured || !supabase || !tenant.id) {
        // Mock-Modus: e2e aus, kein loading
        if (!cancelled) {
          setMeta({
            e2e_enabled: false,
            encrypted_dek: null,
            dek_salt: null,
            dek_iv: null,
            encrypted_dek_recovery: null,
            dek_recovery_salt: null,
            dek_recovery_iv: null,
          });
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("tenants")
        .select(
          "e2e_enabled, encrypted_dek, dek_salt, dek_iv, encrypted_dek_recovery, dek_recovery_salt, dek_recovery_iv",
        )
        .eq("id", tenant.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setMeta({
          e2e_enabled: false,
          encrypted_dek: null,
          dek_salt: null,
          dek_iv: null,
          encrypted_dek_recovery: null,
          dek_recovery_salt: null,
          dek_recovery_iv: null,
        });
      } else {
        setMeta(data as TenantE2eMeta);
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  // DEK aus Memory löschen wenn der Tenant wechselt — gegen versehentliches
  // Cross-Tenant-Decrypt nach Login-Wechsel.
  useEffect(() => {
    setDek(null);
  }, [tenant.id]);

  const setup = useCallback(
    async (passphrase: string): Promise<E2eBootstrap> => {
      const bootstrap = await setupE2eEncryption(passphrase);

      if (isSupabaseConfigured && supabase && tenant.id) {
        const { error } = await supabase
          .from("tenants")
          .update({
            e2e_enabled: true,
            encrypted_dek: bootstrap.encrypted_dek,
            dek_salt: bootstrap.dek_salt,
            dek_iv: bootstrap.dek_iv,
            encrypted_dek_recovery: bootstrap.encrypted_dek_recovery,
            dek_recovery_salt: bootstrap.dek_recovery_salt,
            dek_recovery_iv: bootstrap.dek_recovery_iv,
            e2e_enabled_at: new Date().toISOString(),
          })
          .eq("id", tenant.id);
        if (error) throw error;
        setMeta({
          e2e_enabled: true,
          encrypted_dek: bootstrap.encrypted_dek,
          dek_salt: bootstrap.dek_salt,
          dek_iv: bootstrap.dek_iv,
          encrypted_dek_recovery: bootstrap.encrypted_dek_recovery,
          dek_recovery_salt: bootstrap.dek_recovery_salt,
          dek_recovery_iv: bootstrap.dek_recovery_iv,
        });
      }

      setDek(bootstrap.dek);
      return bootstrap;
    },
    [tenant.id],
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!meta || !meta.encrypted_dek || !meta.dek_salt || !meta.dek_iv) {
        throw new Error("Kein verschlüsselter DEK gefunden.");
      }
      const k = await unlockWithPassphrase(passphrase, {
        encrypted_dek: meta.encrypted_dek,
        dek_salt: meta.dek_salt,
        dek_iv: meta.dek_iv,
      });
      setDek(k);
    },
    [meta],
  );

  const unlockRecovery = useCallback(
    async (mnemonic: string) => {
      if (
        !meta?.encrypted_dek_recovery ||
        !meta?.dek_recovery_salt ||
        !meta?.dek_recovery_iv
      ) {
        throw new Error("Kein Recovery-DEK gefunden.");
      }
      const k = await unlockWithRecovery(mnemonic, {
        encrypted_dek_recovery: meta.encrypted_dek_recovery,
        dek_recovery_salt: meta.dek_recovery_salt,
        dek_recovery_iv: meta.dek_recovery_iv,
      });
      setDek(k);
    },
    [meta],
  );

  const lock = useCallback(() => setDek(null), []);

  const value = useMemo<EncryptionContextValue>(
    () => ({
      enabled: meta?.e2e_enabled ?? false,
      unlocked: dek !== null,
      dek,
      loading,
      setup,
      unlock,
      unlockRecovery,
      lock,
    }),
    [meta?.e2e_enabled, dek, loading, setup, unlock, unlockRecovery, lock],
  );

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = (): EncryptionContextValue => {
  const ctx = useContext(EncryptionContext);
  if (!ctx) {
    throw new Error("useEncryption muss in <EncryptionProvider> stehen");
  }
  return ctx;
};
