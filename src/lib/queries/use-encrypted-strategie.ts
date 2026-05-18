// SYSTEMS™ — Encrypted-Field-Decryptor für anwalts_strategien
//
// Wenn der Tenant E2E aktiviert hat und sections_cipher gesetzt ist:
// im Frontend mit dem DEK aus EncryptionContext entschlüsseln.
// Sonst: plain sections-Feld nutzen.
//
// Nutzung in einem Anwalts-Strategie-Detail-View:
//   const { sections, encrypted, locked } = useDecryptedSections(strategie)

import { useEffect, useState } from "react";
import { useEncryption } from "@/contexts/EncryptionContext";
import { decryptJson, encryptJson } from "@/lib/encryption";
import type { AnwaltsStrategie } from "@/data/types";

interface EncryptedStrategie extends AnwaltsStrategie {
  sections_cipher?: string | null;
  sections_iv?: string | null;
}

interface DecryptedResult {
  /** Die entschlüsselten oder plain Sections — oder null bei Lock/Failure */
  sections: AnwaltsStrategie["sections"] | null;
  /** true wenn diese Strategie verschlüsselt gespeichert wurde */
  encrypted: boolean;
  /** true wenn encrypted=true ABER nicht unlocked (DEK fehlt in Memory) */
  locked: boolean;
  /** true wenn encrypted=true UND decrypt fehlgeschlagen (Auth-Error) */
  failed: boolean;
}

export const useDecryptedSections = (
  strategie: EncryptedStrategie | null | undefined,
): DecryptedResult => {
  const enc = useEncryption();
  const [sections, setSections] = useState<AnwaltsStrategie["sections"] | null>(
    strategie?.sections ?? null,
  );
  const [failed, setFailed] = useState(false);

  const cipher = strategie?.sections_cipher ?? null;
  const iv = strategie?.sections_iv ?? null;
  const encrypted = Boolean(cipher && iv);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!strategie) {
        setSections(null);
        setFailed(false);
        return;
      }
      if (!encrypted) {
        setSections(strategie.sections ?? null);
        setFailed(false);
        return;
      }
      if (!enc.dek) {
        setSections(null);
        setFailed(false);
        return;
      }
      try {
        const decrypted = await decryptJson<AnwaltsStrategie["sections"]>(
          { cipher: cipher!, iv: iv! },
          enc.dek,
        );
        if (!cancelled) {
          setSections(decrypted);
          setFailed(decrypted == null);
        }
      } catch {
        if (!cancelled) {
          setSections(null);
          setFailed(true);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [strategie, cipher, iv, encrypted, enc.dek]);

  return {
    sections,
    encrypted,
    locked: encrypted && !enc.dek,
    failed,
  };
};

/**
 * Encrypt-Helper für den Save-Flow. Returnt das Payload das in die
 * anwalts_strategien-Insert/Update Mutation gehört.
 *
 * - Wenn e2e aktiviert + DEK in Memory → sections_cipher + iv, sections=null
 * - Sonst → sections plain, _cipher/_iv null
 */
export const useEncryptStrategieSections = () => {
  const enc = useEncryption();
  return async (
    sections: AnwaltsStrategie["sections"],
  ): Promise<{
    sections: AnwaltsStrategie["sections"] | null;
    sections_cipher: string | null;
    sections_iv: string | null;
  }> => {
    if (enc.enabled && enc.dek) {
      const enc_field = await encryptJson(sections, enc.dek);
      return {
        sections: null,
        sections_cipher: enc_field.cipher,
        sections_iv: enc_field.iv,
      };
    }
    return { sections, sections_cipher: null, sections_iv: null };
  };
};
