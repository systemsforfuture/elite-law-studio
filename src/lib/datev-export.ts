/**
 * DATEV-/Buchhaltungs-Export.
 *
 * Erzeugt CSV-Strings im DATEV-Format (Buchungsstapel) für Rechnungen
 * sowie eine RVG-Stundenabrechnung aus der Zeiterfassung.
 *
 * Spalten orientieren sich am DATEV-Standardformat. Vollständige
 * Importierbarkeit setzt voraus, dass DATEV-Berater Konten mappt —
 * deshalb keine harten Konto-Nummern, sondern als Stammdaten kompatibel.
 */

import type {
  Mandant,
  Rechnung,
  User,
  Zeiterfassung,
} from "@/data/types";

const DATEV_HEADER = [
  "Umsatz (ohne Soll/Haben-Kz)",
  "Soll/Haben-Kennzeichen",
  "WKZ Umsatz",
  "Konto",
  "Gegenkonto (ohne BU-Schlüssel)",
  "BU-Schlüssel",
  "Belegdatum",
  "Belegfeld 1",
  "Belegfeld 2",
  "Buchungstext",
  "Mandant",
  "Status",
] as const;

const csvEscape = (val: string | number | undefined): string => {
  if (val === undefined || val === null) return "";
  const s = String(val);
  if (s.includes('"') || s.includes(";") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const fmtDateDe = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
};

const fmtAmountDe = (n: number): string =>
  n.toFixed(2).replace(".", ",");

export const mandantNameForExport = (m?: Mandant | null): string => {
  if (!m) return "—";
  return m.typ === "unternehmen"
    ? m.firmenname ?? "—"
    : `${m.vorname ?? ""} ${m.nachname ?? ""}`.trim() || "—";
};

/**
 * Erzeugt einen DATEV-Buchungsstapel für eine Liste von Rechnungen.
 * Jede Rechnung wird als Buchungssatz Konto 1400 (Forderungen) → 8400 (Erlöse 19%) abgebildet.
 */
export const exportRechnungenDatev = (
  rechnungen: Rechnung[],
  mandanten: Mandant[],
): string => {
  const findM = (id: string) => mandanten.find((m) => m.id === id);
  const lines: string[] = [];
  lines.push(DATEV_HEADER.map(csvEscape).join(";"));

  for (const r of rechnungen) {
    const m = findM(r.mandant_id);
    lines.push(
      [
        fmtAmountDe(r.betrag_brutto),
        "S",
        "EUR",
        "1400",
        "8400",
        "9",
        fmtDateDe(r.rechnungsdatum),
        r.rechnungsnummer,
        r.akte_id ?? "",
        `Honorar ${mandantNameForExport(m)}`,
        mandantNameForExport(m),
        r.status,
      ].map(csvEscape).join(";"),
    );
  }
  return lines.join("\n");
};

const ZEIT_HEADER = [
  "Datum",
  "Mitarbeiter",
  "Akte",
  "Mandant",
  "Start",
  "Ende",
  "Dauer (h)",
  "Stundensatz",
  "Honorar netto",
  "Art",
  "Beschreibung",
] as const;

/**
 * RVG-Stundenabrechnung: alle Zeit-Einträge als CSV mit berechnetem Honorar.
 */
export const exportZeiterfassungCsv = (
  zeiten: Zeiterfassung[],
  users: User[],
  mandanten: Mandant[],
): string => {
  const findUser = (id: string) => users.find((u) => u.id === id);
  const findM = (id: string) => mandanten.find((m) => m.id === id);
  const lines: string[] = [];
  lines.push(ZEIT_HEADER.map(csvEscape).join(";"));

  for (const z of zeiten) {
    const u = findUser(z.mitarbeiter_id);
    const m = z.mandant_id ? findM(z.mandant_id) : undefined;
    const dauerH = z.dauer_min / 60;
    const honorar = z.tarif_eur ? dauerH * z.tarif_eur : 0;
    lines.push(
      [
        fmtDateDe(z.datum),
        u?.name ?? "—",
        z.akte_id ?? "",
        mandantNameForExport(m),
        z.start,
        z.ende,
        fmtAmountDe(dauerH),
        z.tarif_eur ? fmtAmountDe(z.tarif_eur) : "",
        z.tarif_eur ? fmtAmountDe(honorar) : "",
        z.art,
        z.beschreibung ?? "",
      ].map(csvEscape).join(";"),
    );
  }
  return lines.join("\n");
};

/** Browser-Download einer CSV (UTF-8 mit BOM für Excel-Kompatibilität). */
export const downloadCsv = (csv: string, filename: string): void => {
  const BOM = "﻿";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
