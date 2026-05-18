// Encryption-Lib Smoke-Test — verifiziert dass setup → encrypt → decrypt
// roundtrip funktioniert, falsche Passphrase erkannt wird, und
// Recovery-Code-Pfad arbeitet.

import { describe, it, expect } from "vitest";
import {
  decryptField,
  decryptJson,
  encryptField,
  encryptJson,
  generateRecoveryMnemonic,
  isValidMnemonic,
  setupE2eEncryption,
  unlockWithPassphrase,
  unlockWithRecovery,
  rewrapWithNewPassphrase,
} from "@/lib/encryption";

describe("encryption", () => {
  it("setupE2eEncryption + roundtrip", async () => {
    const boot = await setupE2eEncryption("MeinSehrSicheresPasswort2026!");
    expect(boot.encrypted_dek).toBeTruthy();
    expect(boot.recovery_mnemonic.split(" ").length).toBe(12);

    const enc = await encryptField("Mandatsgeheimnis: dringliche Akte X", boot.dek);
    expect(enc.cipher).toBeTruthy();
    expect(enc.iv).toBeTruthy();

    const plain = await decryptField(enc, boot.dek);
    expect(plain).toBe("Mandatsgeheimnis: dringliche Akte X");
  });

  it("unlockWithPassphrase recovers DEK", async () => {
    const passphrase = "AndereSicherePhrase!42";
    const boot = await setupE2eEncryption(passphrase);
    const enc = await encryptJson({ x: 1, name: "Müller" }, boot.dek);

    const dek = await unlockWithPassphrase(passphrase, {
      encrypted_dek: boot.encrypted_dek,
      dek_salt: boot.dek_salt,
      dek_iv: boot.dek_iv,
    });
    const decrypted = await decryptJson<{ x: number; name: string }>(enc, dek);
    expect(decrypted).toEqual({ x: 1, name: "Müller" });
  });

  it("unlockWithPassphrase throws on wrong passphrase", async () => {
    const boot = await setupE2eEncryption("CorrectHorseBatteryStaple9");
    await expect(
      unlockWithPassphrase("WrongOne", {
        encrypted_dek: boot.encrypted_dek,
        dek_salt: boot.dek_salt,
        dek_iv: boot.dek_iv,
      }),
    ).rejects.toThrow("invalid_passphrase");
  });

  it("unlockWithRecovery decrypts same DEK", async () => {
    const boot = await setupE2eEncryption("OriginalSafePassPhrase!");
    const enc = await encryptField("Geheimer Klausel-Text", boot.dek);

    const dek = await unlockWithRecovery(boot.recovery_mnemonic, {
      encrypted_dek_recovery: boot.encrypted_dek_recovery,
      dek_recovery_salt: boot.dek_recovery_salt,
      dek_recovery_iv: boot.dek_recovery_iv,
    });
    const plain = await decryptField(enc, dek);
    expect(plain).toBe("Geheimer Klausel-Text");
  });

  it("rewrapWithNewPassphrase keeps DEK valid", async () => {
    const boot = await setupE2eEncryption("OldPassPhrase!2026");
    const enc = await encryptField("Vor Rotation", boot.dek);
    const rewrap = await rewrapWithNewPassphrase(boot.dek, "NewSafePass!2027");

    const dek = await unlockWithPassphrase("NewSafePass!2027", rewrap);
    const plain = await decryptField(enc, dek);
    expect(plain).toBe("Vor Rotation");
  });

  it("decryptField returns null on tampered cipher", async () => {
    const boot = await setupE2eEncryption("SafePass2026!extra");
    const enc = await encryptField("Original", boot.dek);
    // Cipher-Bytes minimal verfälschen (letztes Byte flippen)
    const tampered = {
      cipher: enc.cipher.slice(0, -2) + (enc.cipher.endsWith("A=") ? "B=" : "A="),
      iv: enc.iv,
    };
    const plain = await decryptField(tampered, boot.dek);
    expect(plain).toBeNull();
  });

  it("generateRecoveryMnemonic yields 12 valid words", () => {
    const m = generateRecoveryMnemonic();
    expect(m.split(" ").length).toBe(12);
    expect(isValidMnemonic(m)).toBe(true);
  });

  it("rejects short passphrase", async () => {
    await expect(setupE2eEncryption("kurz")).rejects.toThrow();
  });
});
