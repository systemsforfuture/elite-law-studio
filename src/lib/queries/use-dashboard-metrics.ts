// SYSTEMS™ — Dashboard-Aggregations-Hook
//
// Bündelt KPIs, Trends und Action-Listen für die OverviewPage. Liest aus
// den bestehenden Queries (konversationen, akten, mandanten, rechnungen,
// termine) und derived Felder — kein extra DB-Roundtrip.

import { useMemo } from "react";
import { useKonversationenQuery } from "./use-konversationen";
import { useMandantenQuery } from "./use-mandanten";
import { useAktenQuery } from "./use-akten";
import { useRechnungenQuery } from "./use-rechnungen";
import { useTermineQuery } from "./use-termine";
import type {
  Akte,
  AktenStufe,
  Konversation,
  Mandant,
  Rechnung,
  Termin,
} from "@/data/types";
import {
  isSameDay,
  isWithinLastDays,
  isWithinLastHours,
} from "@/lib/date-utils";

const DAY_MS = 24 * 60 * 60 * 1000;

interface DailyBucket {
  date: string;
  value: number;
}

const buildDailySeries = (
  isoTimestamps: string[],
  days = 14,
): DailyBucket[] => {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const ts of isoTimestamps) {
    const key = ts.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, value]) => ({ date, value }));
};

const stufeOrder: AktenStufe[] = [
  "fallaufnahme",
  "strategie",
  "verfahren",
  "abschluss",
];

const hoursSavedPerCall = 0.25; // 15 Min Receptionist-Arbeit pro KI-Anruf
const hoursSavedPerEmail = 0.1; // 6 Min Triage pro Mail
const hourlyRateEur = 220; // Branchen-Durchschnitt — über Tenant-Setting später

export interface DashboardMetrics {
  /** KPI: KI-Aktionen letzte 24h */
  aiHandled24h: number;
  escalated24h: number;
  /** € geschätzte Einsparung durch KI heute */
  aiSavingsTodayEur: number;
  /** Anruf-Kosten heute (sum cost_eur) */
  voiceCostTodayEur: number;
  /** ROI-Faktor: Savings / Cost. >1 = positiv */
  aiRoiFactor: number;
  /** Mandanten-Wachstum 30 Tage */
  mandantenLast30: number;
  /** Sparklines — 14 Tage Verlauf, je 1 Punkt pro Tag */
  callsSeries: number[];
  mailsSeries: number[];
  mandantenSeries: number[];
  revenueSeries: number[];
  /** Akten-Funnel — Anzahl + summe Streitwert pro Stufe */
  aktenFunnel: { stufe: AktenStufe; count: number; streitwert_eur: number }[];
  /** Mandanten-Pipeline-€: summe offene Rechnungen + Streitwert offener Akten */
  pipelineEur: number;
  /** Forderungen offen (€) — was Mandanten schulden */
  openInvoicesEur: number;
  /** MTD-Umsatz (bezahlte Rechnungen aktueller Monat) */
  mtdRevenueEur: number;
  /** Days-Sales-Outstanding — Durchschnitt-Tage zwischen Rechnung & Zahlung */
  dso: number | null;
  /** Hot-Leads aus Voice structured_data.lead_quality=hot */
  hotLeads: Array<{
    konversation: Konversation;
    mandant: Mandant | null;
  }>;
  /** Eskalationen die noch ungelesen sind und Action brauchen */
  pendingEscalations: Konversation[];
  /** Live-Anruf läuft jetzt gerade (status=pending && !ended_at) */
  liveCalls: Konversation[];
  /** Kritische Fristen ≤ 14 Tage */
  criticalDeadlines: Array<{
    titel: string;
    datum: string;
    akte: Akte;
    daysLeft: number;
  }>;
  /** Heutige Termine */
  todayTermine: Termin[];
  /** Termine die Bestätigung brauchen */
  unconfirmedTermine: Termin[];
}

export const useDashboardMetrics = (): DashboardMetrics => {
  const { data: konversationen = [] } = useKonversationenQuery();
  const { data: mandanten = [] } = useMandantenQuery();
  const { data: akten = [] } = useAktenQuery();
  const { data: rechnungen = [] } = useRechnungenQuery();
  const { data: termine = [] } = useTermineQuery();

  return useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const last24h = konversationen.filter((k) =>
      isWithinLastHours(k.zeitpunkt, 24),
    );
    const todayConvs = konversationen.filter((k) => isSameDay(k.zeitpunkt));
    const callsToday = todayConvs.filter((k) => k.kanal === "voice").length;
    const emailsToday = todayConvs.filter((k) => k.kanal === "email").length;

    const aiHandled24h = last24h.filter((k) => k.ai_handled).length;
    const escalated24h = last24h.filter((k) => k.status === "escalated")
      .length;

    // KI-Savings: konservative Schätzung — Anruf=15min, Mail=6min, hourly=220€
    const aiSavingsTodayEur = Math.round(
      (callsToday * hoursSavedPerCall + emailsToday * hoursSavedPerEmail) *
        hourlyRateEur,
    );
    const voiceCostTodayEur = todayConvs
      .filter((k) => k.kanal === "voice")
      .reduce((s, k) => s + (k.cost_eur ?? 0), 0);
    const aiRoiFactor =
      voiceCostTodayEur > 0 ? aiSavingsTodayEur / voiceCostTodayEur : 0;

    const mandantenLast30 = mandanten.filter((m) =>
      isWithinLastDays(m.created_at, 30),
    ).length;

    // Sparklines — 14 Tage Daily-Buckets
    const callsSeries = buildDailySeries(
      konversationen
        .filter((k) => k.kanal === "voice")
        .map((k) => k.zeitpunkt),
    ).map((b) => b.value);
    const mailsSeries = buildDailySeries(
      konversationen
        .filter((k) => k.kanal === "email")
        .map((k) => k.zeitpunkt),
    ).map((b) => b.value);
    const mandantenSeries = buildDailySeries(
      mandanten.map((m) => m.created_at),
    ).map((b) => b.value);
    const revenueSeries = buildDailySeries(
      rechnungen.filter((r) => r.bezahlt_am).map((r) => r.bezahlt_am as string),
      14,
    ).map(
      (b, _i, all) => {
        // Einnahmen am Tag aufsummieren (statt count) — wir mappen back auf €
        const dateKey = b.date;
        const sum = rechnungen
          .filter((r) => r.bezahlt_am && r.bezahlt_am.slice(0, 10) === dateKey)
          .reduce((s, r) => s + r.betrag_brutto, 0);
        void all;
        return sum;
      },
    );

    // Akten-Funnel
    const aktenFunnel = stufeOrder.map((stufe) => {
      const inStufe = akten.filter((a) => a.stufe === stufe);
      return {
        stufe,
        count: inStufe.length,
        streitwert_eur: inStufe.reduce((s, a) => s + (a.streitwert_eur ?? 0), 0),
      };
    });

    // Pipeline-€: offene Rechnungen + offene Akten-Streitwert (gewichtet)
    const openInvoicesEur = rechnungen
      .filter((r) => r.status !== "bezahlt")
      .reduce((s, r) => s + r.betrag_brutto, 0);
    const openAktenWert = akten
      .filter(
        (a) => a.status !== "abgeschlossen" && a.status !== "archiviert",
      )
      .reduce((s, a) => s + (a.streitwert_eur ?? 0), 0);
    const pipelineEur = openInvoicesEur + openAktenWert * 0.15; // 15% Provision/Schätzung

    // MTD-Umsatz: bezahlte Rechnungen im aktuellen Monat
    const now = new Date();
    const mtdRevenueEur = rechnungen
      .filter((r) => {
        if (!r.bezahlt_am) return false;
        const d = new Date(r.bezahlt_am);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      })
      .reduce((s, r) => s + r.betrag_brutto, 0);

    // DSO: durchschnittliche Tage zwischen Rechnungsdatum & Zahlungseingang
    const paid = rechnungen.filter((r) => r.bezahlt_am && r.rechnungsdatum);
    const dso =
      paid.length === 0
        ? null
        : Math.round(
            paid.reduce((s, r) => {
              const days =
                (new Date(r.bezahlt_am!).getTime() -
                  new Date(r.rechnungsdatum).getTime()) /
                DAY_MS;
              return s + Math.max(0, days);
            }, 0) / paid.length,
          );

    // Hot-Leads — Voice structured_data.lead_quality=hot, ungelesen
    const hotLeads = konversationen
      .filter(
        (k) =>
          k.kanal === "voice" &&
          k.structured_data?.lead_quality === "hot" &&
          k.ungelesen,
      )
      .slice(0, 5)
      .map((k) => ({
        konversation: k,
        mandant: mandanten.find((m) => m.id === k.mandant_id) ?? null,
      }));

    const pendingEscalations = konversationen
      .filter((k) => k.status === "escalated" && k.ungelesen)
      .slice(0, 5);

    const liveCalls = konversationen.filter(
      (k) =>
        k.kanal === "voice" && k.status === "pending" && !k.ended_at,
    );

    // Kritische Fristen ≤ 14 Tage
    const todayMs = new Date().getTime();
    const criticalDeadlines = akten
      .flatMap((a) =>
        a.fristen
          .filter((f) => f.kritisch)
          .map((f) => ({
            titel: f.titel,
            datum: f.datum,
            akte: a,
            daysLeft: Math.ceil(
              (new Date(f.datum).getTime() - todayMs) / DAY_MS,
            ),
          })),
      )
      .filter((f) => f.daysLeft <= 14 && f.daysLeft >= -2)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const todayTermine = termine.filter(
      (t) => t.start_at.slice(0, 10) === todayIso,
    );
    const unconfirmedTermine = termine
      .filter((t) => !t.bestaetigt && t.start_at >= todayIso)
      .slice(0, 5);

    return {
      aiHandled24h,
      escalated24h,
      aiSavingsTodayEur,
      voiceCostTodayEur,
      aiRoiFactor,
      mandantenLast30,
      callsSeries,
      mailsSeries,
      mandantenSeries,
      revenueSeries,
      aktenFunnel,
      pipelineEur,
      openInvoicesEur,
      mtdRevenueEur,
      dso,
      hotLeads,
      pendingEscalations,
      liveCalls,
      criticalDeadlines,
      todayTermine,
      unconfirmedTermine,
    };
  }, [konversationen, mandanten, akten, rechnungen, termine]);
};

// ─────────────────────────────────────────────────────
// Format-Helpers — für €-Werte und kompakte Zahlen
// ─────────────────────────────────────────────────────

const eurFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eurFmtDecimals = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatEur = (n: number, decimals = false): string =>
  decimals ? eurFmtDecimals.format(n) : eurFmt.format(n);

export const formatEurCompact = (n: number): string => {
  if (n === 0) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M €`;
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 1000)} k €`;
  return eurFmt.format(n);
};
