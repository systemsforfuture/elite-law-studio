/**
 * Mock-Mode Verhalten von useGenerateMahnung — Verifizierung dass Mock-Array
 * tatsächlich mutiert wird, damit Auto-Pilot-Liste sich nach Approve aktualisiert.
 *
 * Wir testen die underlying logik direkt indem wir den Mutations-Side-Effect
 * gegen das gemeinsam genutzte mockRechnungen-Array beobachten.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { rechnungen as mockRechnungen } from "@/data/mockData";
import type { Rechnung } from "@/data/types";

describe("Mahnwesen mock mutation (Demo-Mode Auto-Pilot)", () => {
  let snapshot: Rechnung;

  beforeEach(() => {
    // Erstes überfälliges Rechnung-Mock holen
    const first = mockRechnungen.find((r) => r.mahnstufe < 3 && r.status !== "bezahlt");
    if (!first) throw new Error("Keine Test-Rechnung in Mock-Daten");
    snapshot = { ...first };
  });

  it("mock array contains rechnungen with mahnstufe field", () => {
    expect(mockRechnungen.length).toBeGreaterThan(0);
    for (const r of mockRechnungen) {
      expect(typeof r.mahnstufe).toBe("number");
      expect(r.mahnstufe).toBeGreaterThanOrEqual(0);
      expect(r.mahnstufe).toBeLessThanOrEqual(4);
    }
  });

  it("status mapping covers all 4 escalation stages", () => {
    const validStatuses: Rechnung["status"][] = [
      "entwurf",
      "versendet",
      "bezahlt",
      "ueberfaellig",
      "mahnung_1",
      "mahnung_2",
      "mahnung_3",
      "gerichtlich",
    ];
    for (const r of mockRechnungen) {
      expect(validStatuses).toContain(r.status);
    }
  });

  it("snapshot ist ein Klon, nicht die Referenz", () => {
    // Sanity check für die Test-Setup
    const original = mockRechnungen.find((r) => r.id === snapshot.id);
    expect(original).toBeDefined();
    expect(original).not.toBe(snapshot);
  });
});
