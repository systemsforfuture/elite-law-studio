// SYSTEMS™ — Client-Side AES-256-GCM Encryption
//
// Mandatsgeheimnis-konform (§203 StGB): sensible Anwalts-Daten werden im
// Browser verschlüsselt. Der Master-Key wird aus einer Passphrase des
// Owners abgeleitet (PBKDF2, 600.000 iters, SHA-256) und ist NIEMALS
// auf dem Server. Auch die SYSTEMS-Plattform-Betreiber können
// die verschlüsselten Felder nicht lesen.
//
// Architektur:
//   Master-Key  ←  PBKDF2(passphrase, salt, 600k iters)        (in Memory only)
//   DEK         ←  Random 256-bit, AES-GCM-wrapped mit Master  (in DB als encrypted_dek)
//   Recovery-Master ← PBKDF2(recovery-mnemonic, salt2, ...)     (Anwalt druckt das aus)
//   Recovery-DEK ←  gleicher DEK, gewrappt mit Recovery-Master (in DB als encrypted_dek_recovery)
//   Field-Cipher ← AES-GCM(plaintext, DEK, random-IV)           (pro Feld in DB)
//
// Performance:
//   - PBKDF2 600k iters ~250ms auf M-Series, ~1s auf Mid-Range-PC.
//     Wird nur 1× beim Unlock pro Session ausgeführt.
//   - Pro Feld-Encrypt: <1ms, alle modernen Browser haben Hardware-AES.

const TEXT_ENC = new TextEncoder();
const TEXT_DEC = new TextDecoder();

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_HASH = "SHA-256" as const;
const KEY_BITS = 256;
const IV_BYTES = 12; // GCM standard

// ─────────────────────────────────────────────────────
// Encoding-Helper
// ─────────────────────────────────────────────────────

const toBase64 = (bytes: ArrayBuffer | Uint8Array): string => {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < b.byteLength; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin);
};

const fromBase64 = (s: string): Uint8Array => {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const randomBytes = (n: number): Uint8Array => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
};

// ─────────────────────────────────────────────────────
// Key-Derivation (PBKDF2)
// ─────────────────────────────────────────────────────

/**
 * Leitet aus einer Passphrase einen 256-Bit AES-GCM-Key ab.
 * Salt sollte 16+ Bytes haben und pro Tenant einmalig sein.
 */
export const deriveKey = async (
  passphrase: string,
  saltB64: string,
): Promise<CryptoKey> => {
  const salt = fromBase64(saltB64);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    TEXT_ENC.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: "AES-GCM", length: KEY_BITS },
    false,
    ["wrapKey", "unwrapKey", "encrypt", "decrypt"],
  );
};

/** Neuer 16-byte Salt für PBKDF2. Pro Tenant 1× generieren beim Setup. */
export const generateSalt = (): string => toBase64(randomBytes(16));

// ─────────────────────────────────────────────────────
// DEK-Management (Data Encryption Key)
// ─────────────────────────────────────────────────────

/** Erzeugt einen frischen DEK. Nur intern — wird sofort gewrappt persistiert. */
const generateDek = async (): Promise<CryptoKey> => {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: KEY_BITS },
    true, // extractable für wrap
    ["encrypt", "decrypt"],
  );
};

interface WrappedKey {
  encrypted: string; // base64 ciphertext
  iv: string; // base64 IV
}

/** Wrappt einen DEK mit dem Master-Key. */
const wrapDek = async (
  dek: CryptoKey,
  master: CryptoKey,
): Promise<WrappedKey> => {
  const iv = randomBytes(IV_BYTES);
  const rawDek = await crypto.subtle.exportKey("raw", dek);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    master,
    rawDek,
  );
  return { encrypted: toBase64(ciphertext), iv: toBase64(iv) };
};

/** Unwrappt einen DEK mit dem Master-Key. Wirft bei falscher Passphrase. */
const unwrapDek = async (
  wrapped: WrappedKey,
  master: CryptoKey,
): Promise<CryptoKey> => {
  const ct = fromBase64(wrapped.encrypted);
  const iv = fromBase64(wrapped.iv);
  const rawDek = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    master,
    ct,
  );
  return crypto.subtle.importKey(
    "raw",
    rawDek,
    { name: "AES-GCM", length: KEY_BITS },
    false,
    ["encrypt", "decrypt"],
  );
};

// ─────────────────────────────────────────────────────
// Feld-Encryption (für Anwendung in den Queries)
// ─────────────────────────────────────────────────────

export interface CipherField {
  cipher: string; // base64
  iv: string; // base64
}

/** Verschlüsselt einen String/JSON-Value mit dem DEK. Returnt cipher + iv. */
export const encryptField = async (
  plaintext: string,
  dek: CryptoKey,
): Promise<CipherField> => {
  const iv = randomBytes(IV_BYTES);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dek,
    TEXT_ENC.encode(plaintext),
  );
  return { cipher: toBase64(ct), iv: toBase64(iv) };
};

/**
 * Entschlüsselt ein Feld. Returnt null bei Auth-Fehler (z.B. falscher DEK,
 * korrupter Cipher) statt zu werfen — UI kann dann „Entschlüsselung
 * fehlgeschlagen" anzeigen ohne zu crashen.
 */
export const decryptField = async (
  field: CipherField | { cipher?: string | null; iv?: string | null } | null | undefined,
  dek: CryptoKey,
): Promise<string | null> => {
  if (!field?.cipher || !field?.iv) return null;
  try {
    const ct = fromBase64(field.cipher);
    const iv = fromBase64(field.iv);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      dek,
      ct,
    );
    return TEXT_DEC.decode(plain);
  } catch (e) {
    console.warn("[encryption] decryptField failed", e);
    return null;
  }
};

/** Convenience: Object encrypten (via JSON.stringify) */
export const encryptJson = async (
  obj: unknown,
  dek: CryptoKey,
): Promise<CipherField> => encryptField(JSON.stringify(obj), dek);

export const decryptJson = async <T>(
  field: CipherField | { cipher?: string | null; iv?: string | null } | null | undefined,
  dek: CryptoKey,
): Promise<T | null> => {
  const plain = await decryptField(field, dek);
  if (plain == null) return null;
  try {
    return JSON.parse(plain) as T;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────
// Recovery-Code (BIP39-ähnlich, 12 Wörter)
// ─────────────────────────────────────────────────────

const WORD_LIST = [
  // ~256 Worte — kurze deutsche Substantive für anwaltliche Nutzung.
  // Kein voller BIP39-Wortschatz nötig, 12 Wörter × 8 bit = 96 bit Entropie genug.
  "Akte","Anker","Auge","Berg","Boot","Brand","Bruch","Bund","Burg","Chor",
  "Dach","Dampf","Dank","Disch","Dorf","Drang","Druck","Eber","Ecke","Eiche",
  "Eile","Eis","Ende","Engel","Erbe","Erde","Erz","Esche","Esel","Fall",
  "Feder","Feld","Fels","Feuer","Fink","Floh","Floss","Flug","Fluss","Folge",
  "Frist","Fuchs","Fuge","Gabel","Galle","Garn","Geist","Geld","Gerste","Glanz",
  "Glas","Glied","Gold","Gott","Grab","Grad","Gras","Grube","Grund","Gunst",
  "Hafen","Hagel","Haken","Hals","Hammer","Hand","Harz","Haus","Hauch","Heide",
  "Heim","Held","Helm","Herd","Herz","Himmel","Hirsch","Hof","Horst","Huhn",
  "Hund","Hut","Insel","Jagd","Jahr","Kabel","Kaiser","Kalk","Kamm","Kampf",
  "Kerze","Kette","Kind","Kiosk","Kirsche","Klang","Klee","Klette","Knecht","Kobold",
  "Kohle","Koks","Kolk","Kran","Krug","Kuchen","Kupfer","Lager","Lampe","Land",
  "Last","Laub","Lauch","Lauf","Leben","Leder","Lehm","Leim","Leiter","Licht",
  "Lied","Linde","Linie","Linse","Liste","Lob","Loch","Lohn","Lord","Lorbeer",
  "Luchs","Luft","Mais","Mantel","Markt","Matte","Mauer","Meer","Mehl","Meile",
  "Meister","Messer","Metall","Mond","Moor","Most","Mund","Mut","Mythos","Nabel",
  "Nacht","Nadel","Name","Narbe","Nase","Natur","Nebel","Necke","Nest","Netz",
  "Neuling","Nische","Nord","Note","Nuss","Oase","Ofen","Onkel","Ort","Otter",
  "Paar","Palme","Pappel","Park","Pass","Pause","Pelz","Pfad","Pfahl","Pfanne",
  "Pfeil","Pflanze","Pflicht","Pilz","Plan","Platz","Polster","Punkt","Quelle","Rabe",
  "Rad","Rahm","Rang","Rast","Rat","Raub","Rebe","Recht","Regen","Reich",
  "Reim","Reise","Reiter","Rest","Riese","Rind","Ring","Robbe","Rolle","Rose",
  "Rost","Rotwein","Rubin","Rune","Saal","Saat","Sache","Saft","Sage","Saite",
  "Salbe","Sand","Sankt","Schale","Schatz","Schiff","Schild","Schluss","Schock","Schoss",
  "Schrank","Schwan","See","Segel","Seil","Sieb","Silber","Sinn","Sitz","Skat",
  "Sohn","Speer","Stab","Stadt","Stahl","Stamm","Stein","Stern","Stier","Strom",
  "Sturm","Tag","Tal","Tanne","Tasse","Tau","Teich","Tor","Trog","Tuch",
  "Tumor","Turm","Uhr","Ufer","Vogel","Wache","Wand","Weide","Weste","Wiese",
];

/**
 * Erzeugt einen 12-Wort Recovery-Code. ~96 Bit Entropie — stark genug
 * gegen alle realistischen Angreifer. Anwalt MUSS ihn ausdrucken und
 * sicher verwahren, sonst ist bei Passphrase-Verlust der DEK weg.
 */
export const generateRecoveryMnemonic = (): string => {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = randomBytes(2);
    const n = (idx[0] << 8) | idx[1];
    words.push(WORD_LIST[n % WORD_LIST.length]);
  }
  return words.join(" ");
};

export const isValidMnemonic = (s: string): boolean => {
  const words = s.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12) return false;
  const lower = WORD_LIST.map((w) => w.toLowerCase());
  return words.every((w) => lower.includes(w));
};

// ─────────────────────────────────────────────────────
// High-Level: Setup + Unlock
// ─────────────────────────────────────────────────────

export interface E2eBootstrap {
  /** Wrap-Daten für die DB (encrypted_dek, dek_salt, dek_iv etc.) */
  encrypted_dek: string;
  dek_salt: string;
  dek_iv: string;
  encrypted_dek_recovery: string;
  dek_recovery_salt: string;
  dek_recovery_iv: string;
  /** Recovery-Code zum Ausdrucken — wird sonst verloren */
  recovery_mnemonic: string;
  /** DEK live in Memory — direkt nutzbar für die erste Encrypt-Welle */
  dek: CryptoKey;
}

/**
 * Erst-Setup: erzeugt DEK, wrappt ihn 2× (mit Passphrase + Recovery-Mnemonic).
 * Returnt die DB-Felder + den Recovery-Code (1× anzeigen, nicht erneut!).
 */
export const setupE2eEncryption = async (
  passphrase: string,
): Promise<E2eBootstrap> => {
  if (passphrase.length < 10) {
    throw new Error("Passphrase muss mindestens 10 Zeichen haben.");
  }
  const dek = await generateDek();
  const recoveryMnemonic = generateRecoveryMnemonic();

  const passSalt = generateSalt();
  const passMaster = await deriveKey(passphrase, passSalt);
  const passWrapped = await wrapDek(dek, passMaster);

  const recSalt = generateSalt();
  // Mnemonic case-insensitiv ableiten — Anwalt schreibt evtl. nicht 1:1 ab
  const recMaster = await deriveKey(recoveryMnemonic.toLowerCase(), recSalt);
  const recWrapped = await wrapDek(dek, recMaster);

  return {
    encrypted_dek: passWrapped.encrypted,
    dek_salt: passSalt,
    dek_iv: passWrapped.iv,
    encrypted_dek_recovery: recWrapped.encrypted,
    dek_recovery_salt: recSalt,
    dek_recovery_iv: recWrapped.iv,
    recovery_mnemonic: recoveryMnemonic,
    dek,
  };
};

/** Unlock mit Passphrase. Wirft `Error("invalid_passphrase")` bei Fehler. */
export const unlockWithPassphrase = async (
  passphrase: string,
  tenantDek: {
    encrypted_dek: string;
    dek_salt: string;
    dek_iv: string;
  },
): Promise<CryptoKey> => {
  const master = await deriveKey(passphrase, tenantDek.dek_salt);
  try {
    return await unwrapDek(
      { encrypted: tenantDek.encrypted_dek, iv: tenantDek.dek_iv },
      master,
    );
  } catch {
    throw new Error("invalid_passphrase");
  }
};

/** Unlock mit Recovery-Mnemonic (24-Wörter). */
export const unlockWithRecovery = async (
  mnemonic: string,
  tenantDek: {
    encrypted_dek_recovery: string;
    dek_recovery_salt: string;
    dek_recovery_iv: string;
  },
): Promise<CryptoKey> => {
  const normalized = mnemonic.trim().toLowerCase();
  const master = await deriveKey(normalized, tenantDek.dek_recovery_salt);
  try {
    return await unwrapDek(
      {
        encrypted: tenantDek.encrypted_dek_recovery,
        iv: tenantDek.dek_recovery_iv,
      },
      master,
    );
  } catch {
    throw new Error("invalid_recovery");
  }
};

/**
 * Setzt eine neue Passphrase (z.B. bei Routine-Wechsel). Benötigt
 * den unlocked DEK. Returnt neue encrypted_dek + Salt + IV.
 */
export const rewrapWithNewPassphrase = async (
  dek: CryptoKey,
  newPassphrase: string,
): Promise<{ encrypted_dek: string; dek_salt: string; dek_iv: string }> => {
  if (newPassphrase.length < 10) {
    throw new Error("Passphrase muss mindestens 10 Zeichen haben.");
  }
  const salt = generateSalt();
  const master = await deriveKey(newPassphrase, salt);
  const wrapped = await wrapDek(dek, master);
  return {
    encrypted_dek: wrapped.encrypted,
    dek_salt: salt,
    dek_iv: wrapped.iv,
  };
};
