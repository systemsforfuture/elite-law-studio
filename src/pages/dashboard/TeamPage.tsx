import { useState } from "react";
import {
  Plus,
  Mail,
  Shield,
  ArrowLeft,
  TrendingUp,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Activity as ActivityIcon,
} from "lucide-react";
import { mandantName, findMandant, findTeamStats } from "@/data/mockData";
import type { User as UserType } from "@/data/types";
import { Button } from "@/components/ui/button";
import { useTeamQuery, useTeamStats } from "@/lib/queries/use-team";
import { useAktenQuery } from "@/lib/queries/use-akten";
import InviteUserDialog from "@/components/dashboard/InviteUserDialog";

const roleLabel = {
  owner: { label: "Owner", cls: "bg-accent/15 text-accent" },
  anwalt: { label: "Anwalt", cls: "bg-navy/15 text-navy" },
  mitarbeiter: { label: "Mitarbeiter", cls: "bg-sky-500/15 text-sky-700" },
  support: { label: "Support", cls: "bg-muted text-muted-foreground" },
};

const TeamDetail = ({
  user,
  onBack,
}: {
  user: UserType;
  onBack: () => void;
}) => {
  const { data: stats } = useTeamStats(user.id);
  const { data: akten = [] } = useAktenQuery();
  const userAkten = akten.filter((a) => a.zugewiesener_anwalt_id === user.id);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Team
      </button>

      <div className="glass-card p-6 border-border/50">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-primary-foreground flex items-center justify-center font-bold text-xl">
              {user.avatar_initials}
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {user.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${roleLabel[user.role].cls}`}
                >
                  {roleLabel[user.role].label}
                </span>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {user.email}
                </span>
              </div>
              {user.rechtsgebiete && user.rechtsgebiete.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {user.rechtsgebiete.map((rg) => (
                    <span
                      key={rg}
                      className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-accent/10 text-accent"
                    >
                      {rg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              Berechtigungen bearbeiten
            </Button>
            <Button variant="gold" size="sm" className="rounded-xl">
              <Mail className="mr-2 h-3.5 w-3.5" />
              Nachricht
            </Button>
          </div>
        </div>
      </div>

      {stats ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              icon={Briefcase}
              label="Aktive Mandate"
              value={String(stats.aktive_mandate)}
              sub={`Pipeline ${(stats.pipeline_eur / 1000).toFixed(0)}k€`}
            />
            <Stat
              icon={ActivityIcon}
              label="Auslastung"
              value={`${stats.auslastung_pct}%`}
              sub={
                stats.auslastung_pct > 85
                  ? "Sehr hoch"
                  : stats.auslastung_pct > 70
                  ? "Optimal"
                  : "Kapazität frei"
              }
              accent={
                stats.auslastung_pct > 85 ? "amber" : "emerald"
              }
              progress={stats.auslastung_pct}
            />
            <Stat
              icon={Clock}
              label="Ø Reaktionszeit"
              value={`${stats.reaktion_avg_min} min`}
              sub="Erste Antwort an Mandant"
            />
            <Stat
              icon={CheckCircle2}
              label="Erfolgsquote"
              value={`${stats.erfolgsquote_pct}%`}
              sub="Vergleich + Urteil"
              accent="emerald"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 border-border/50 lg:col-span-2">
              <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" />
                Zugewiesene Akten ({userAkten.length})
              </h3>
              {userAkten.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Aktuell keine Akten zugewiesen.
                </p>
              ) : (
                <div className="space-y-2">
                  {userAkten.map((a) => {
                    const md = findMandant(a.mandant_id);
                    const kritisch = a.fristen.some((f) => f.kritisch);
                    return (
                      <div
                        key={a.id}
                        className="p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">
                              {a.titel}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {a.aktenzeichen} · {mandantName(md)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {kritisch && (
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            )}
                            <span className="text-xs font-bold tabular-nums text-foreground">
                              {(a.streitwert_eur ?? 0).toLocaleString("de-DE")}€
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="glass-card p-6 border-border/50">
                <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  KPIs YTD
                </h3>
                <div className="space-y-4">
                  <KpiLine
                    label="Umsatz beigetragen"
                    value={`${stats.umsatz_ytd_eur.toLocaleString("de-DE")}€`}
                  />
                  <KpiLine
                    label="KI-Eskalationen 24h"
                    value={String(stats.ai_eskalationen_24h)}
                  />
                  <KpiLine
                    label="Ø Reaktion"
                    value={`${stats.reaktion_avg_min} min`}
                  />
                </div>
              </div>

              <div className="glass-card p-6 border-accent/20 bg-accent/[0.03]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-display font-bold text-foreground">
                    KI-Routing-Regel
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Eingehende Anfragen mit Tags{" "}
                  {user.rechtsgebiete?.join(" / ") ?? "—"} werden bevorzugt an
                  diese Person geroutet.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-8 border-border/50 text-center text-sm text-muted-foreground">
          Keine Statistiken verfügbar.
        </div>
      )}
    </div>
  );
};

const TeamPage = () => {
  const [selected, setSelected] = useState<UserType | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: users = [] } = useTeamQuery();

  if (selected) {
    return <TeamDetail user={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Team-Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {users.length} Mitglieder · Magic-Link-Einladungen per E-Mail
          </p>
        </div>
        <Button
          variant="gold"
          size="sm"
          className="rounded-xl"
          onClick={() => setInviteOpen(true)}
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Mitglied einladen
        </Button>
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      {users.length === 0 && (
        <div className="glass-card p-12 border-border/50 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 mx-auto mb-3 flex items-center justify-center">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Noch keine Team-Mitglieder
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Lade deine Mitarbeiter per Magic-Link ein.
          </p>
          <Button
            variant="gold"
            size="sm"
            className="rounded-xl"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Mitglied einladen
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const stats = findTeamStats(u.id);
          return (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="glass-card p-5 border-border/50 hover:border-accent/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-navy text-primary-foreground flex items-center justify-center font-bold">
                  {u.avatar_initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">
                    {u.name}
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${roleLabel[u.role].cls}`}
                  >
                    {roleLabel[u.role].label}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mb-4">
                <Mail className="h-3 w-3" />
                {u.email}
              </div>

              {stats && stats.aktive_mandate > 0 ? (
                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border/40">
                  <div>
                    <div className="text-lg font-display font-bold text-foreground tabular-nums">
                      {stats.aktive_mandate}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                      Akten
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-display font-bold text-foreground tabular-nums">
                      {stats.auslastung_pct}%
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                      Auslast.
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-display font-bold text-emerald-600 tabular-nums">
                      {stats.erfolgsquote_pct}%
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                      Erfolg
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground pt-3 border-t border-border/40">
                  Keine aktiven Mandate
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="glass-card p-6 border-accent/20 bg-accent/[0.03]">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-display font-bold text-foreground mb-1">
              Sicherheit & 2FA
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              2-Faktor-Authentifizierung via TOTP (Authenticator App). Pflicht
              für Owner und Anwälte. Audit-Log aller Logins ist für 1 Jahr
              verfügbar.
            </p>
            <Button variant="outline" size="sm" className="rounded-xl">
              2FA-Status verwalten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  progress,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  sub?: string;
  accent?: "amber" | "emerald";
  progress?: number;
}) => {
  const cls =
    accent === "amber"
      ? "text-amber-600"
      : accent === "emerald"
      ? "text-emerald-600"
      : "text-foreground";
  return (
    <div className="glass-card p-5 border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
      <div className={`text-3xl font-display font-black tabular-nums ${cls}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {typeof progress === "number" && (
        <div className="h-1 mt-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${
              progress > 85
                ? "bg-amber-500"
                : progress > 70
                ? "bg-emerald-500"
                : "bg-sky-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

const KpiLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-bold text-foreground tabular-nums">{value}</span>
  </div>
);

export default TeamPage;
