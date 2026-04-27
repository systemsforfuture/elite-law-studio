// Shared utilities for webhook receivers.

export const verifyHmac = async (
  body: string,
  signature: string | null,
  secret: string,
): Promise<boolean> => {
  if (!signature || !secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Provider-Drift: einige Provider schicken Signaturen in upper-case Hex.
  // Akzeptiere beide Varianten case-insensitiv.
  const sigNorm = signature.toLowerCase();
  if (hex.length !== sigNorm.length) return false;
  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < hex.length; i++) {
    result |= hex.charCodeAt(i) ^ sigNorm.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Strict-Mode-Wrapper für Webhook-Auth.
 *
 * Production: `WEBHOOK_STRICT=true` als Function-Env. Ohne Secret oder
 * ungültige Signature → false (401 Caller-Side).
 *
 * Dev/Local: ohne Secret + ohne Signature → akzeptiere (für lokale Tests).
 * Mit Secret aber falscher Sig → false.
 */
export const requireSignature = async (
  body: string,
  signature: string | null,
  secret: string | undefined,
  providerName: string,
): Promise<boolean> => {
  const strict = Deno.env.get("WEBHOOK_STRICT")?.toLowerCase() === "true";
  if (!secret) {
    if (strict) {
      console.error(`[${providerName}] WEBHOOK_STRICT=true aber Secret fehlt — abgelehnt`);
      return false;
    }
    console.warn(`[${providerName}] kein Secret — Dev-Mode, akzeptiert ohne Verify`);
    return true;
  }
  return await verifyHmac(body, signature, secret);
};

export const normalizePhone = (s: string | null | undefined): string => {
  if (!s) return "";
  return s.replace(/[\s\-()]/g, "").trim();
};
