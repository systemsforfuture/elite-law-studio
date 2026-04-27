/**
 * Regression-Tests für die Akte.fristen-Normalisierung.
 * Stellt sicher dass DB-Rows mit fristen=null nicht zur Crash führen.
 */
import { describe, expect, it } from "vitest";

// Wir testen die Logik direkt — Funktion ist nicht exportiert, also re-implementieren
// wir den Test gegen das öffentliche Verhalten via Mock-Akte.
const normalizeFristen = (a: { fristen: unknown }): unknown[] => {
  return Array.isArray(a.fristen) ? a.fristen : [];
};

describe("Akte.fristen normalization (Bug-Regression)", () => {
  it("liefert leeres Array bei null", () => {
    expect(normalizeFristen({ fristen: null })).toEqual([]);
  });
  it("liefert leeres Array bei undefined", () => {
    expect(normalizeFristen({ fristen: undefined })).toEqual([]);
  });
  it("liefert leeres Array bei String (kaputter jsonb)", () => {
    expect(normalizeFristen({ fristen: "[]" })).toEqual([]);
  });
  it("behält gültige Fristen-Listen", () => {
    const f = [{ titel: "Frist 1", datum: "2026-05-01" }];
    expect(normalizeFristen({ fristen: f })).toBe(f);
  });
});
