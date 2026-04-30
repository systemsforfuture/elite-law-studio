import { describe, expect, it } from "vitest";
import {
  exportRechnungenDatev,
  exportZeiterfassungCsv,
  mandantNameForExport,
} from "@/lib/datev-export";
import type { Mandant, Rechnung, User, Zeiterfassung } from "@/data/types";

const mandanten: Mandant[] = [
  {
    id: "md_1",
    tenant_id: "tnt_1",
    typ: "privat",
    vorname: "Max",
    nachname: "Müller",
    email: "max@example.de",
    telefon: "+49 123",
    status: "aktiv",
    rechtsgebiet: "Familienrecht",
    herkunft: "voice",
    created_at: "2026-01-01",
    last_contact: "2026-04-01",
    open_invoices_eur: 0,
  },
  {
    id: "md_2",
    tenant_id: "tnt_1",
    typ: "unternehmen",
    firmenname: "Schmidt GmbH",
    email: "info@schmidt.de",
    telefon: "+49 456",
    status: "aktiv",
    rechtsgebiet: "Vertragsrecht",
    herkunft: "email",
    created_at: "2026-01-01",
    last_contact: "2026-04-01",
    open_invoices_eur: 0,
  },
];

const rechnungen: Rechnung[] = [
  {
    id: "rec_1",
    tenant_id: "tnt_1",
    mandant_id: "md_1",
    akte_id: "akt_1",
    rechnungsnummer: "2026-0001",
    betrag_netto: 840.34,
    betrag_brutto: 1000,
    rechnungsdatum: "2026-04-15",
    faelligkeit: "2026-04-29",
    status: "versendet",
    mahnstufe: 0,
  },
  {
    id: "rec_2",
    tenant_id: "tnt_1",
    mandant_id: "md_2",
    rechnungsnummer: "2026-0002",
    betrag_netto: 2100,
    betrag_brutto: 2499,
    rechnungsdatum: "2026-04-16",
    faelligkeit: "2026-04-30",
    status: "bezahlt",
    bezahlt_am: "2026-04-22",
    mahnstufe: 0,
  },
];

const users: User[] = [
  {
    id: "u_1",
    tenant_id: "tnt_1",
    name: "Sarah Fischer",
    email: "sf@k.de",
    role: "anwalt",
    avatar_initials: "SF",
    active: true,
    created_at: "2026-01-01",
  },
];

const zeiten: Zeiterfassung[] = [
  {
    id: "z_1",
    tenant_id: "tnt_1",
    mitarbeiter_id: "u_1",
    datum: "2026-04-20",
    start: "09:00",
    ende: "11:30",
    dauer_min: 150,
    akte_id: "akt_1",
    mandant_id: "md_1",
    beschreibung: "Schriftsatz",
    art: "billable",
    tarif_eur: 280,
    created_at: "2026-04-20T09:00:00Z",
  },
];

describe("mandantNameForExport", () => {
  it("returns dash for null/undefined", () => {
    expect(mandantNameForExport(null)).toBe("—");
    expect(mandantNameForExport(undefined)).toBe("—");
  });
  it("uses firmenname for unternehmen", () => {
    expect(mandantNameForExport(mandanten[1])).toBe("Schmidt GmbH");
  });
  it("uses vorname + nachname for privat", () => {
    expect(mandantNameForExport(mandanten[0])).toBe("Max Müller");
  });
});

describe("exportRechnungenDatev", () => {
  it("emits header + correct row count", () => {
    const csv = exportRechnungenDatev(rechnungen, mandanten);
    const rows = csv.split("\n");
    expect(rows.length).toBe(3); // header + 2
    expect(rows[0]).toContain("Belegfeld 1");
  });

  it("formats amounts in DE notation with comma", () => {
    const csv = exportRechnungenDatev(rechnungen, mandanten);
    expect(csv).toContain("1000,00");
    expect(csv).toContain("2499,00");
  });

  it("formats date in DD.MM.YYYY", () => {
    const csv = exportRechnungenDatev(rechnungen, mandanten);
    expect(csv).toContain("15.04.2026");
  });

  it("includes Buchungstext with Mandant-name", () => {
    const csv = exportRechnungenDatev(rechnungen, mandanten);
    expect(csv).toContain("Honorar Max Müller");
    expect(csv).toContain("Honorar Schmidt GmbH");
  });

  it("escapes semicolons in fields", () => {
    const m = [{ ...mandanten[0], vorname: "Max;Maria" }];
    const r = [rechnungen[0]];
    const csv = exportRechnungenDatev(r, m);
    expect(csv).toContain('"Honorar Max;Maria Müller"');
  });

  it("emits empty header-only when no invoices", () => {
    const csv = exportRechnungenDatev([], mandanten);
    expect(csv.split("\n").length).toBe(1);
  });
});

describe("exportZeiterfassungCsv", () => {
  it("computes hours and honorar correctly", () => {
    const csv = exportZeiterfassungCsv(zeiten, users, mandanten);
    const rows = csv.split("\n");
    expect(rows.length).toBe(2);
    // 150 min = 2.5h, 2.5*280 = 700
    expect(rows[1]).toContain("2,50");
    expect(rows[1]).toContain("700,00");
    expect(rows[1]).toContain("Sarah Fischer");
    expect(rows[1]).toContain("Max Müller");
  });

  it("leaves Stundensatz/Honorar empty if no tarif", () => {
    const z = [{ ...zeiten[0], tarif_eur: undefined, art: "intern" as const }];
    const csv = exportZeiterfassungCsv(z, users, mandanten);
    const fields = csv.split("\n")[1].split(";");
    // Stundensatz und Honorar netto = leer
    expect(fields[7]).toBe("");
    expect(fields[8]).toBe("");
  });
});
