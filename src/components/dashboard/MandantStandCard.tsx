// SYSTEMS™ — Mandanten-Stand-Card
//
// Hero-Block für die MandantDetail-Page. Beantwortet auf einen Blick:
// »Wo stehen wir mit diesem Mandanten?« — letzter Kontakt, offene Akten,
// offene Forderungen, nächster Termin, ungelesene Konversationen.
//
// Bewusst nicht „bunt": jede Kennzahl in eigener dezenter Surface, nur
// kritische Werte (überfällige Rechnungen, anstehende Fristen) bekommen
// einen Status-Akzent.

import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock,
  Folder,
  Inbox,
  Receipt,
} from "lucide-react";
import type { Akte, Konversation, Mandant, Rechnung, Termin } from "@/data/types";
import { useMemo } from "react";
import { formatEur } from "@/lib/queries/use-dashboard-metrics";

interface Props {
  mandant: Mandant;
  akten: Akte[];
  konversationen: Konversation[];
  rechnungen: Rechnung[];
  termine: Termin[];
}

const daysAgo = (iso: string): number => {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86_400_000);
};

const formatRelative = (iso: string): string => {
  const d = daysAgo(iso);
  if (d <= 0) return "heute";
  if (d === 1) return "gestern";
  if (d < 7) return `vor ${d} Tagen`;
  if (d < 30) return `vor ${Math.floor(d / 7)} Wochen`;
  if (d < 365) return `vor ${Math.floor(d / 30)} Monaten`;
  return `vor ${Math.floor(d / 365)} Jahren`;
};

const MandantStandCard = ({
  mandant,
  akten,
  konversationen,
  rechnungen,
  termine,
}: Props) => {
  const summary = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);

    const lastKonv = konversationen
      .slice()
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt))[0];
    const unread = konversationen.filter((k) => k.ungelesen).length;
    const escalated = konversationen.filter((k) => k.status === "escalated")
      .length;

    const aktivAkten = akten.filter(
      (a) => a.status !== "abgeschlossen" && a.status !== "archiviert",
    );
    const akteStreitwert = aktivAkten.reduce(
      (s, a) => s + (a.streitwert_eur ?? 0),
      0,
    );

    const kritischeFristen = aktivAkten
      .flatMap((a) =>
        a.fristen
          .filter((f) => f.kritisch && f.datum >= todayIso.slice(0, 7))
          .map((f) => ({ ...f, akte: a })),
      )
      .sort((a, b) => a.datum.localeCompare(b.datum));

    const offen = rechnungen.filter((r) => r.status !== "bezahlt");
    const offenSum = offen.reduce((s, r) => s + r.betrag_brutto, 0);
    const ueberfaellig = offen.filter(
      (r) => r.faelligkeit < todayIso,
    );
    const mtdSum = rechnungen
      .filter((r) => {
        if (!r.bezahlt_am) return false;
        const d = new Date(r.bezahlt_am);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      })
      .reduce((s, r) => s + r.betrag_brutto, 0);

    const naechsterTermin = termine
      .filter((t) => t.start_at >= todayIso)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))[0];

    // Letzter Stand: KI-Zusammenfassung > preview der letzten Konv > beschreibung erster Akte
    const stand =
      mandant.notes_preview ??
      lastKonv?.preview ??
      aktivAkten[0]?.next_step ??
      null;

    return {
      lastContact: lastKonv?.zeitpunkt ?? mandant.last_contact,
      unread,
      escalated,
      aktivAkten,
      akteStreitwert,
      kritischeFristen,
      offen,
      offenSum,
      ueberfaellig,
      mtdSum,
      naechsterTermin,
      stand,
    };
  }, [mandant, akten, konversationen, rechnungen, termine]);

  return (
    <section className="space-y-4">
      {/* Stand-Zeile */}
      {summary.stand && (
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
            Letzter Stand
          </div>
          <p className="text-sm text-foreground leading-relaxed">{summary.stand}</p>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Letzter Kontakt {formatRelative(summary.lastContact)} ·{" "}
            {new Date(summary.lastContact).toLocaleDateString("de-DE")}
          </div>
        </div>
      )}

      {/* 4-Spalten Kennzahlen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StandTile
          icon={Folder}
          label="Aktive Akten"
          value={summary.aktivAkten.length.toString()}
          sub={
            summary.akteStreitwert > 0
              ? `Σ ${formatEur(summary.akteStreitwert)} Streitwert`
              : undefined
          }
          to="?tab=akten"
        />
        <StandTile
          icon={Inbox}
          label="Konversationen"
          value={konversationen.length.toString()}
          sub={
            summary.unread > 0
              ? `${summary.unread} ungelesen${
                  summary.escalated > 0 ? ` · ${summary.escalated} eskaliert` : ""
                }`
              : "alle gelesen"
          }
          severity={
            summary.escalated > 0
              ? "critical"
              : summary.unread > 0
                ? "warning"
                : undefined
          }
          to="?tab=timeline"
        />
        <StandTile
          icon={Receipt}
          label="Offene Forderungen"
          value={
            summary.offenSum > 0 ? formatEur(summary.offenSum) : "—"
          }
          sub={
            summary.ueberfaellig.length > 0
              ? `${summary.ueberfaellig.length} überfällig`
              : summary.mtdSum > 0
                ? `${formatEur(summary.mtdSum)} bezahlt MtD`
                : undefined
          }
          severity={summary.ueberfaellig.length > 0 ? "warning" : undefined}
          to="?tab=rechnungen"
        />
        <StandTile
          icon={CalendarClock}
          label="Nächster Termin"
          value={
            summary.naechsterTermin
              ? new Date(summary.naechsterTermin.start_at).toLocaleDateString(
                  "de-DE",
                  { day: "2-digit", month: "short" },
                )
              : "—"
          }
          sub={
            summary.naechsterTermin
              ? `${new Date(summary.naechsterTermin.start_at).toLocaleTimeString(
                  "de-DE",
                  { hour: "2-digit", minute: "2-digit" },
                )} · ${summary.naechsterTermin.titel}`
              : "kein Termin"
          }
          to="/dashboard/termine"
        />
      </div>

      {/* Kritische Fristen — nur wenn vorhanden */}
      {summary.kritischeFristen.length > 0 && (
        <div className="surface-warning p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs uppercase tracking-wider font-semibold text-warning">
              Kritische Fristen ({summary.kritischeFristen.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {summary.kritischeFristen.slice(0, 3).map((f, i) => {
              const d = daysAgo(f.datum) * -1; // Tage bis Frist
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-foreground">
                    {f.titel}{" "}
                    <span className="text-muted-foreground font-mono">
                      · {f.akte.aktenzeichen}
                    </span>
                  </span>
                  <span className="tabular-nums font-semibold text-warning">
                    {d <= 0
                      ? `${Math.abs(d)} T überfällig`
                      : d === 0
                        ? "heute"
                        : `in ${d} T`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

const StandTile = ({
  icon: Icon,
  label,
  value,
  sub,
  severity,
  to,
}: {
  icon: typeof Folder;
  label: string;
  value: string;
  sub?: string;
  severity?: "warning" | "critical";
  to: string;
}) => {
  // Note: tab-Switching im Component wird vom Parent gehandhabt (über state),
  // hier nur Optik — die Mini-Tile ist non-clickable wenn `to` ein Fragment ist.
  const isFragment = to.startsWith("?");
  const inner = (
    <div className="surface p-4 hover:border-foreground/20 transition-colors h-full">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
        {!isFragment && (
          <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
        )}
      </div>
      <div
        className="text-xl font-display font-bold tabular-nums leading-none"
        style={{
          color:
            severity === "critical"
              ? "hsl(var(--status-critical))"
              : severity === "warning"
                ? "hsl(var(--status-warning))"
                : undefined,
        }}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1.5">
        {label}
      </div>
      {sub && (
        <div className="text-[11px] text-muted-foreground/80 mt-0.5">{sub}</div>
      )}
    </div>
  );
  return isFragment ? <div>{inner}</div> : <Link to={to}>{inner}</Link>;
};

export default MandantStandCard;
