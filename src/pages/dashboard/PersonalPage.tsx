import { useMemo, useState } from "react";
import {
  Clock,
  CalendarRange,
  Plane,
  Stethoscope,
  Home,
  Plus,
  CheckCircle2,
  XCircle,
  TimerReset,
  TrendingUp,
  Users,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTeamQuery } from "@/lib/queries/use-team";
import {
  useZeiterfassungQuery,
  useUrlaubQuery,
  useKontingenteQuery,
  useCreateZeit,
  useCreateUrlaub,
  useUpdateUrlaubStatus,
} from "@/lib/queries/use-personal";
import type { UrlaubArt, UrlaubStatus, ZeiterfassungArt } from "@/data/types";
import { findUser } from "@/data/mockData";
import { toast } from "sonner";

const eur = (n: number) =>
  n.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

const formatHours = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m.toString().padStart(2, "0")} h`;
};

const artLabel: Record<ZeiterfassungArt, { label: string; cls: string }> = {
  billable: { label: "Mandantenarbeit", cls: "bg-emerald-500/15 text-emerald-700" },
  intern: { label: "Intern", cls: "bg-sky-500/15 text-sky-700" },
  training: { label: "Schulung", cls: "bg-purple-500/15 text-purple-700" },
};

const urlaubArtLabel: Record<UrlaubArt, { label: string; icon: typeof Plane; cls: string }> = {
  urlaub: { label: "Urlaub", icon: Plane, cls: "bg-accent/15 text-accent" },
  krankheit: { label: "Krankheit", icon: Stethoscope, cls: "bg-rose-500/15 text-rose-700" },
  home_office: { label: "Home-Office", icon: Home, cls: "bg-sky-500/15 text-sky-700" },
  sonstiges: { label: "Sonstiges", icon: CalendarRange, cls: "bg-muted text-muted-foreground" },
};

const urlaubStatusLabel: Record<UrlaubStatus, { label: string; cls: string }> = {
  pending: { label: "Offen", cls: "bg-amber-500/15 text-amber-700" },
  approved: { label: "Genehmigt", cls: "bg-emerald-500/15 text-emerald-700" },
  rejected: { label: "Abgelehnt", cls: "bg-rose-500/15 text-rose-700" },
};

type Tab = "uebersicht" | "zeit" | "urlaub";

const PersonalPage = () => {
  const [tab, setTab] = useState<Tab>("uebersicht");
  const [zeitDialog, setZeitDialog] = useState(false);
  const [urlaubDialog, setUrlaubDialog] = useState(false);

  const { data: team = [] } = useTeamQuery();
  const { data: zeiten = [] } = useZeiterfassungQuery();
  const { data: urlaub = [] } = useUrlaubQuery();
  const { data: kontingente = [] } = useKontingenteQuery();
  const updateStatus = useUpdateUrlaubStatus();

  const totalMinHeute = useMemo(() => {
    const heute = new Date().toISOString().slice(0, 10);
    return zeiten.filter((z) => z.datum === heute).reduce((s, z) => s + z.dauer_min, 0);
  }, [zeiten]);

  const totalMinWoche = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const cutoff = start.toISOString().slice(0, 10);
    return zeiten.filter((z) => z.datum >= cutoff).reduce((s, z) => s + z.dauer_min, 0);
  }, [zeiten]);

  const billableEurWoche = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const cutoff = start.toISOString().slice(0, 10);
    return zeiten
      .filter((z) => z.datum >= cutoff && z.art === "billable" && z.tarif_eur)
      .reduce((s, z) => s + ((z.dauer_min / 60) * (z.tarif_eur ?? 0)), 0);
  }, [zeiten]);

  const offene = useMemo(() => urlaub.filter((u) => u.status === "pending"), [urlaub]);

  const handleApprove = async (id: string, approve: boolean) => {
    const t = toast.loading(approve ? "Antrag wird genehmigt…" : "Antrag wird abgelehnt…");
    try {
      await updateStatus.mutateAsync({
        id,
        status: approve ? "approved" : "rejected",
        approver_id: "usr_1",
      });
      toast.success(approve ? "Antrag genehmigt" : "Antrag abgelehnt", { id: t });
    } catch (e) {
      toast.error("Aktion fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Personal</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Zeiterfassung, Urlaub & Abwesenheit für {team.length} Mitarbeiter.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUrlaubDialog(true)}>
            <Plane className="h-4 w-4 mr-2" />
            Urlaub beantragen
          </Button>
          <Button variant="gold" onClick={() => setZeitDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Zeit erfassen
          </Button>
        </div>
      </div>

      {/* KPI-Kacheln */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          label="Heute erfasst"
          value={formatHours(totalMinHeute)}
          icon={Clock}
          tone="navy"
        />
        <KpiTile
          label="7 Tage gesamt"
          value={formatHours(totalMinWoche)}
          icon={TimerReset}
          tone="navy"
        />
        <KpiTile
          label="Billable 7 Tage"
          value={eur(billableEurWoche)}
          icon={TrendingUp}
          tone="gold"
        />
        <KpiTile
          label="Offene Anträge"
          value={offene.length.toString()}
          icon={AlertTriangle}
          tone={offene.length > 0 ? "amber" : "muted"}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {([
          { id: "uebersicht", label: "Übersicht" },
          { id: "zeit", label: "Zeiterfassung" },
          { id: "urlaub", label: `Urlaub & Abwesenheit${offene.length ? ` · ${offene.length}` : ""}` },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "uebersicht" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Mitarbeiter-Übersicht 2026</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {team.map((u) => {
              const k = kontingente.find((x) => x.mitarbeiter_id === u.id);
              const auslastungPct = k
                ? Math.round((k.ist_stunden_woche / k.soll_stunden_woche) * 100)
                : 0;
              return (
                <div key={u.id} className="glass-card p-5 border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-navy text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {u.avatar_initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{u.role}</div>
                    </div>
                  </div>
                  {k ? (
                    <div className="space-y-2.5">
                      <Row
                        label="Urlaubstage"
                        value={`${k.urlaubstage_genommen}/${k.urlaubstage_total}`}
                        sub={`${k.urlaubstage_offen} offen`}
                      />
                      <Row
                        label="Krankheit YTD"
                        value={`${k.kranktage_genommen} ${k.kranktage_genommen === 1 ? "Tag" : "Tage"}`}
                      />
                      <Row
                        label="Wochenstunden"
                        value={`${k.ist_stunden_woche.toFixed(1)} h`}
                        sub={`Soll ${k.soll_stunden_woche} h`}
                      />
                      <Row
                        label="Überstunden YTD"
                        value={formatHours(k.ueberstunden_min)}
                        tone={k.ueberstunden_min > 600 ? "warn" : undefined}
                      />
                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Auslastung</span>
                          <span
                            className={`font-semibold ${
                              auslastungPct > 110
                                ? "text-rose-600"
                                : auslastungPct >= 95
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {auslastungPct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${
                              auslastungPct > 110
                                ? "bg-rose-500"
                                : auslastungPct >= 95
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(auslastungPct, 130)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Keine Kontingent-Daten.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "zeit" && (
        <div className="space-y-3">
          {zeiten.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Noch keine Zeiten erfasst"
              hint="Erfasse deine erste Zeit über »Zeit erfassen« oben rechts."
            />
          ) : (
            zeiten.map((z) => {
              const u = findUser(z.mitarbeiter_id);
              const a = artLabel[z.art];
              const eurValue = z.tarif_eur ? (z.dauer_min / 60) * z.tarif_eur : 0;
              return (
                <div key={z.id} className="glass-card p-4 border-border/50 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-navy/10 text-navy flex items-center justify-center text-xs font-bold shrink-0">
                    {u?.avatar_initials ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{u?.name ?? "—"}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${a.cls}`}>
                        {a.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {z.beschreibung ?? "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground/70 mt-1 font-mono">
                      {z.datum} · {z.start}–{z.ende}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      {formatHours(z.dauer_min)}
                    </div>
                    {z.art === "billable" && z.tarif_eur && (
                      <div className="text-xs text-emerald-600 font-medium">{eur(eurValue)}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "urlaub" && (
        <div className="space-y-3">
          {urlaub.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Keine Anträge"
              hint="Stelle den ersten Urlaubsantrag über »Urlaub beantragen«."
            />
          ) : (
            urlaub.map((u) => {
              const m = findUser(u.mitarbeiter_id);
              const A = urlaubArtLabel[u.art].icon;
              const isPending = u.status === "pending";
              return (
                <div key={u.id} className="glass-card p-4 border-border/50">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${urlaubArtLabel[u.art].cls}`}
                    >
                      <A className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{m?.name ?? "—"}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${urlaubArtLabel[u.art].cls}`}>
                          {urlaubArtLabel[u.art].label}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${urlaubStatusLabel[u.status].cls}`}>
                          {urlaubStatusLabel[u.status].label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5">
                        {u.von === u.bis ? u.von : `${u.von} – ${u.bis}`} · {u.tage}{" "}
                        {u.tage === 1 ? "Tag" : "Tage"}
                      </div>
                      {u.kommentar && (
                        <div className="text-xs text-foreground/70 mt-2 italic">„{u.kommentar}"</div>
                      )}
                    </div>
                    {isPending && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleApprove(u.id, true)}
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors flex items-center justify-center"
                          title="Genehmigen"
                          aria-label="Antrag genehmigen"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(u.id, false)}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 transition-colors flex items-center justify-center"
                          title="Ablehnen"
                          aria-label="Antrag ablehnen"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {zeitDialog && (
        <ZeitDialog
          team={team}
          onClose={() => setZeitDialog(false)}
        />
      )}
      {urlaubDialog && (
        <UrlaubDialog
          team={team}
          onClose={() => setUrlaubDialog(false)}
        />
      )}
    </div>
  );
};

const KpiTile = ({
  label,
  value,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string;
  icon: typeof Clock;
  tone?: "navy" | "gold" | "amber" | "muted";
}) => {
  const tones = {
    navy: "bg-navy/10 text-navy",
    gold: "bg-accent/15 text-accent",
    amber: "bg-amber-500/15 text-amber-700",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="glass-card p-4 border-border/50">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-lg font-bold text-foreground truncate">{value}</div>
        </div>
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "warn";
}) => (
  <div className="flex justify-between items-baseline text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right">
      <span className={`font-semibold ${tone === "warn" ? "text-amber-600" : "text-foreground"}`}>
        {value}
      </span>
      {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
    </span>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Clock;
  title: string;
  hint: string;
}) => (
  <div className="glass-card p-12 border-border/50 text-center">
    <div className="w-12 h-12 rounded-2xl bg-muted/50 mx-auto mb-4 flex items-center justify-center">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{hint}</p>
  </div>
);

const ZeitDialog = ({
  team,
  onClose,
}: {
  team: { id: string; name: string }[];
  onClose: () => void;
}) => {
  const create = useCreateZeit();
  const [mitarbeiter, setMitarbeiter] = useState(team[0]?.id ?? "");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [ende, setEnde] = useState("10:00");
  const [art, setArt] = useState<ZeiterfassungArt>("billable");
  const [beschreibung, setBeschreibung] = useState("");
  const [tarif, setTarif] = useState("280");

  const dauerMin = useMemo(() => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = ende.split(":").map(Number);
    return Math.max(0, eh * 60 + em - (sh * 60 + sm));
  }, [start, ende]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitarbeiter || dauerMin <= 0) return;
    const t = toast.loading("Zeit wird gespeichert…");
    try {
      await create.mutateAsync({
        mitarbeiter_id: mitarbeiter,
        datum,
        start,
        ende,
        dauer_min: dauerMin,
        art,
        beschreibung: beschreibung || undefined,
        tarif_eur: art === "billable" ? Number(tarif) || undefined : undefined,
      });
      toast.success("Zeit erfasst", { id: t });
      onClose();
    } catch (err) {
      toast.error("Speichern fehlgeschlagen", {
        id: t,
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
      });
    }
  };

  return (
    <Dialog title="Zeit erfassen" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Mitarbeiter">
          <select
            value={mitarbeiter}
            onChange={(e) => setMitarbeiter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Datum">
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Start">
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Ende">
            <input
              type="time"
              value={ende}
              onChange={(e) => setEnde(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </Field>
        </div>
        <div className="text-xs text-muted-foreground">
          Dauer: <span className="font-semibold text-foreground">{formatHours(dauerMin)}</span>
        </div>
        <Field label="Art">
          <select
            value={art}
            onChange={(e) => setArt(e.target.value as ZeiterfassungArt)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="billable">Mandantenarbeit (billable)</option>
            <option value="intern">Intern</option>
            <option value="training">Schulung</option>
          </select>
        </Field>
        {art === "billable" && (
          <Field label="Stundensatz (€)">
            <input
              type="number"
              value={tarif}
              onChange={(e) => setTarif(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </Field>
        )}
        <Field label="Beschreibung">
          <textarea
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            placeholder="z.B. Schriftsatz Müller-Akte"
          />
        </Field>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
          <Button type="submit" variant="gold" disabled={create.isPending} className="flex-1">
            {create.isPending ? "…" : "Speichern"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const UrlaubDialog = ({
  team,
  onClose,
}: {
  team: { id: string; name: string }[];
  onClose: () => void;
}) => {
  const create = useCreateUrlaub();
  const [mitarbeiter, setMitarbeiter] = useState(team[0]?.id ?? "");
  const [von, setVon] = useState(new Date().toISOString().slice(0, 10));
  const [bis, setBis] = useState(new Date().toISOString().slice(0, 10));
  const [art, setArt] = useState<UrlaubArt>("urlaub");
  const [kommentar, setKommentar] = useState("");

  const tage = useMemo(() => {
    const v = new Date(von);
    const b = new Date(bis);
    if (b < v) return 0;
    let count = 0;
    const cur = new Date(v);
    while (cur <= b) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [von, bis]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitarbeiter || tage <= 0) return;
    const t = toast.loading("Antrag wird gestellt…");
    try {
      await create.mutateAsync({
        mitarbeiter_id: mitarbeiter,
        von,
        bis,
        tage,
        art,
        kommentar: kommentar || undefined,
      });
      toast.success("Antrag eingereicht", {
        id: t,
        description: "Owner wurde benachrichtigt.",
      });
      onClose();
    } catch (err) {
      toast.error("Antrag fehlgeschlagen", {
        id: t,
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
      });
    }
  };

  return (
    <Dialog title="Urlaub / Abwesenheit beantragen" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Mitarbeiter">
          <select
            value={mitarbeiter}
            onChange={(e) => setMitarbeiter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Art">
          <select
            value={art}
            onChange={(e) => setArt(e.target.value as UrlaubArt)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="urlaub">Urlaub</option>
            <option value="krankheit">Krankheit</option>
            <option value="home_office">Home-Office</option>
            <option value="sonstiges">Sonstiges</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Von">
            <input
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Bis">
            <input
              type="date"
              value={bis}
              onChange={(e) => setBis(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </Field>
        </div>
        <div className="text-xs text-muted-foreground">
          Werktage:{" "}
          <span className="font-semibold text-foreground">
            {tage} {tage === 1 ? "Tag" : "Tage"}
          </span>
        </div>
        <Field label="Kommentar (optional)">
          <textarea
            value={kommentar}
            onChange={(e) => setKommentar(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            placeholder="z.B. Sommerurlaub Italien"
          />
        </Field>
        <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-3 flex gap-2 text-xs text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
          <span>
            Owner erhält Benachrichtigung. Genehmigung blockiert automatisch andere Termine.
          </span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
          <Button type="submit" variant="gold" disabled={create.isPending} className="flex-1">
            {create.isPending ? "…" : "Antrag stellen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const Dialog = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 bg-navy-dark/60 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="bg-background rounded-2xl shadow-2xl border border-border/50 max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-display font-bold text-foreground">{title}</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Schließen"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
    {children}
  </div>
);

export default PersonalPage;
