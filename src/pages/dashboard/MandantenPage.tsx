import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  User,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  mandanten,
  akten,
  konversationen,
  rechnungen,
  findUser,
  mandantName,
} from "@/data/mockData";
import type { Mandant, MandantStatus } from "@/data/types";
import { Button } from "@/components/ui/button";

const statusBadge: Record<MandantStatus, { label: string; cls: string }> = {
  aktiv: {
    label: "Aktiv",
    cls: "bg-emerald-500/15 text-emerald-700",
  },
  interessent: {
    label: "Interessent",
    cls: "bg-accent/15 text-accent",
  },
  abgeschlossen: {
    label: "Abgeschlossen",
    cls: "bg-muted text-muted-foreground",
  },
  archiviert: {
    label: "Archiviert",
    cls: "bg-muted text-muted-foreground/60",
  },
};

const herkunftLabel: Record<Mandant["herkunft"], string> = {
  voice: "KI-Anruf",
  whatsapp: "WhatsApp",
  email: "E-Mail",
  web: "Web-Form",
  empfehlung: "Empfehlung",
  import: "Migration",
};

const MandantenPage = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MandantStatus | "all">(
    "all",
  );
  const [selected, setSelected] = useState<Mandant | null>(null);

  const filtered = useMemo(() => {
    return mandanten.filter((m) => {
      const q = query.toLowerCase();
      const hit =
        !q ||
        mandantName(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.telefon ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return hit && matchStatus;
    });
  }, [query, statusFilter]);

  if (selected) {
    const aktenForMandant = akten.filter((a) => a.mandant_id === selected.id);
    const konvForMandant = konversationen.filter(
      (k) => k.mandant_id === selected.id,
    );
    const rechForMandant = rechnungen.filter(
      (r) => r.mandant_id === selected.id,
    );
    const anwalt = findUser(selected.zugewiesener_anwalt_id);
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Mandantenliste
        </button>

        <div className="glass-card p-6 border-border/50">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-navy/10 flex items-center justify-center">
                {selected.typ === "unternehmen" ? (
                  <Building2 className="h-6 w-6 text-navy" />
                ) : (
                  <User className="h-6 w-6 text-navy" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">
                  {mandantName(selected)}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[selected.status].cls}`}
                  >
                    {statusBadge[selected.status].label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selected.rechtsgebiet ?? "—"} ·{" "}
                    {herkunftLabel[selected.herkunft]} · seit{" "}
                    {new Date(selected.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl">
                <Phone className="mr-2 h-3.5 w-3.5" /> Anrufen
              </Button>
              <Button variant="gold" size="sm" className="rounded-xl">
                <MessageCircle className="mr-2 h-3.5 w-3.5" /> Nachricht
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <FieldBlock label="E-Mail" value={selected.email} icon={Mail} />
            <FieldBlock label="Telefon" value={selected.telefon} icon={Phone} />
            <FieldBlock
              label="Zuständig"
              value={anwalt?.name ?? "Nicht zugewiesen"}
              icon={User}
            />
          </div>

          {selected.notes_preview && (
            <div className="mt-6 p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">
                KI-Zusammenfassung
              </div>
              <p className="text-sm text-foreground">{selected.notes_preview}</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="glass-card p-6 border-border/50">
            <h3 className="font-display font-bold text-foreground mb-4">
              Akten ({aktenForMandant.length})
            </h3>
            {aktenForMandant.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Keine Akten verknüpft.
              </p>
            ) : (
              <div className="space-y-2">
                {aktenForMandant.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {a.titel}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {a.aktenzeichen} · {a.rechtsgebiet}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card p-6 border-border/50">
            <h3 className="font-display font-bold text-foreground mb-4">
              Konversationen ({konvForMandant.length})
            </h3>
            {konvForMandant.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Noch keine Konversation.
              </p>
            ) : (
              <div className="space-y-2">
                {konvForMandant.map((k) => (
                  <div
                    key={k.id}
                    className="p-3 rounded-xl border border-border/50 bg-muted/20"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                        {k.kanal}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(k.zeitpunkt).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">
                      {k.preview}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card p-6 border-border/50 lg:col-span-2">
            <h3 className="font-display font-bold text-foreground mb-4">
              Rechnungen ({rechForMandant.length})
            </h3>
            {rechForMandant.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Keine Rechnungen.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
                    <tr>
                      <th className="text-left py-2 font-semibold">Rechnung</th>
                      <th className="text-left py-2 font-semibold">Datum</th>
                      <th className="text-right py-2 font-semibold">Betrag</th>
                      <th className="text-right py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechForMandant.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="py-3 font-mono text-foreground">
                          {r.rechnungsnummer}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(r.rechnungsdatum).toLocaleDateString(
                            "de-DE",
                          )}
                        </td>
                        <td className="py-3 text-right font-semibold text-foreground tabular-nums">
                          {r.betrag_brutto.toLocaleString("de-DE")}€
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              r.status === "bezahlt"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : r.status.startsWith("mahnung")
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mandant suchen…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(["all", "aktiv", "interessent", "abgeschlossen"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-navy text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {s === "all" ? "Alle" : statusBadge[s as MandantStatus].label}
              </button>
            ),
          )}
        </div>
        <Button variant="gold" size="sm" className="rounded-xl">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Neuer Mandant
        </Button>
      </div>

      <div className="glass-card border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 bg-muted/20">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Kontakt</th>
                <th className="text-left p-4 font-semibold">Rechtsgebiet</th>
                <th className="text-left p-4 font-semibold">Herkunft</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Offene Rechnung</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="border-t border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center">
                        {m.typ === "unternehmen" ? (
                          <Building2 className="h-4 w-4 text-navy" />
                        ) : (
                          <User className="h-4 w-4 text-navy" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {mandantName(m)}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize">
                          {m.typ}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    <div>{m.email}</div>
                    <div>{m.telefon}</div>
                  </td>
                  <td className="p-4 text-foreground">
                    {m.rechtsgebiet ?? "—"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {herkunftLabel[m.herkunft]}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${statusBadge[m.status].cls}`}
                    >
                      {statusBadge[m.status].label}
                    </span>
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    {m.open_invoices_eur ? (
                      <span className="font-semibold text-amber-700">
                        {m.open_invoices_eur.toLocaleString("de-DE")}€
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground">
          <span>{filtered.length} von {mandanten.length} Mandanten</span>
        </div>
      </div>
    </div>
  );
};

const FieldBlock = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) => (
  <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
      {label}
    </div>
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground truncate">
        {value}
      </span>
    </div>
  </div>
);

export default MandantenPage;
