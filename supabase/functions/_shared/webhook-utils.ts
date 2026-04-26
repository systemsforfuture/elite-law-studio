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
  // Constant-time comparison
  if (hex.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < hex.length; i++) {
    result |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
};

export const normalizePhone = (s: string | null | undefined): string => {
  if (!s) return "";
  return s.replace(/[\s\-()]/g, "").trim();
};
