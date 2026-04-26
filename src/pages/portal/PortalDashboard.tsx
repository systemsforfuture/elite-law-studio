import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Phone,
  Mail,
  CalendarClock,
  Upload,
  ChevronRight,
  Cpu,
  LogOut,
  User,
  Receipt,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  akten,
  konversationen,
  termine,
  dokumente,
  rechnungen,
  findUser,
  mandanten,
} from "@/data/mockData";
import { useTenant } from "@/contexts/TenantContext";
import { useMandantAuth } from "@/contexts/MandantAuthContext";
import type { AktenStufe } from "@/data/types";
import { useStripeCheckout } from "@/lib/queries/use-stripe";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

const stufenSeq: AktenStufe[] = [
  "fallaufnahme",
  "strategie",
  "verfahren",
  "abschluss",
];
const stufeLabel: Record<AktenStufe, string> = {
  fallaufnahme: "Fallaufnahme",
  strategie: "Strategie",
  verfahren: "Verhandlung",
  abschluss: "Abschluss",
};

const PortalDashboard = () => {
  const { tenant } = useTenant();
  const checkout = useStripeCheckout();
  const mandantAuth = useMandantAuth();
  const [tab, setTab] = useState<
    "ueberblick" | "nachrichten" | "termine" | "dokumente" | "rechnungen"
  >("ueberblick");

  // Real mandant aus Auth, oder Demo-Mandant Müller als Fallback
  const mandant =
    mandantAuth.mandant ?? mandanten.find((m) => m.id === "md_1")!;

  // Wenn Supabase konfiguriert + nicht eingeloggt + kein Demo → zurück zum Login
  if (!mandantAuth.isDemoMode && !mandantAuth.mandant && !mandantAuth.loading) {
    return <Navigate to="/portal" replace />;
  }

  const handlePay = async (rechnung_id: string) => {
    const t = toast.loading("Stripe-Checkout wird erstellt…");
    try {
      const result = await checkout.mutateAsync(rechnung_id);
      if (result.mock_mode) {
        toast.success("Demo-Mode", {
          id: t,
          description:
            "STRIPE_SECRET_KEY nicht gesetzt. In Production öffnet sich Stripe-Checkout.",
        });
      } else {
        toast.success("Weiterleitung zu Stripe…", { id: t });
        window.location.href = result.url;
      }
    } catch (e) {
      toast.error("Checkout fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };
  const meineAkten = akten.filter((a) => a.mandant_id === mandant.id);
  const aktiveAkte = meineAkten[0];
  const meineKonv = konversationen.filter((k) => k.mandant_id === mandant.id);
  const meineTermine = termine.filter((t) => t.mandant_id === mandant.id);
  const meineDokumente = dokumente.filter(
    (d) => d.mandant_id === mandant.id || d.akte_id === aktiveAkte?.id,
  );
  const meineRechnungen = rechnungen.filter(
    (r) => r.mandant_id === mandant.id,
  );
  const anwalt = findUser(mandant.zugewiesener_anwalt_id);
  const stufeIdx = aktiveAkte
    ? stufenSeq.indexOf(aktiveAkte.stufe)
    : -1;

  return (
    <div className="min-h-screen bg-background">
      {/* Top-Bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-2xl border-b border-border/50 h-16 flex items-center px-6 justify-between">
        <Link to="/portal" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Cpu className="h-4 w-4 text-accent" />
          </div>
          <div>
            <span className="text-sm font-display font-bold text-foreground">
              {tenant.kanzlei_name}
            </span>
            <span className="block text-[10px] text-muted-foreground/60 tracking-wider">
              Mandanten-Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">
              {mandant.vorname} {mandant.nachname}
            </span>
          </div>
          <Link to="/portal">
            <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Begrüßung */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Guten Tag, {mandant.vorname}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ihr aktueller Fall:{" "}
            <strong className="text-foreground">{aktiveAkte?.titel}</strong> ·{" "}
            {aktiveAkte?.aktenzeichen}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border/50 overflow-x-auto mb-6">
          {(
            [
              { v: "ueberblick" as const, label: "Überblick" },
              { v: "nachrichten" as const, label: "Nachrichten", count: meineKonv.length },
              { v: "termine" as const, label: "Termine", count: meineTermine.length },
              { v: "dokumente" as const, label: "Dokumente", count: meineDokumente.length },
              { v: "rechnungen" as const, label: "Rechnungen", count: meineRechnungen.length },
            ]
          ).map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                tab === t.v
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {"count" in t && typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    tab === t.v
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "ueberblick" && aktiveAkte && (
          <div className="space-y-6">
            {/* Status-Tracker */}
            <section className="glass-card p-8 border-border/50">
              <h2 className="text-lg font-display font-bold text-foreground mb-1">
                Fallstatus-Tracker
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Wo stehen wir gerade in Ihrem Verfahren?
              </p>
              <div className="flex items-center justify-between">
                {stufenSeq.map((st, i) => {
                  const done = i < stufeIdx;
                  const current = i === stufeIdx;
                  return (
                    <div key={st} className="flex items-center flex-1">
                      <div className="flex flex-col items-center text-center flex-1">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                            done
                              ? "bg-navy text-primary-foreground shadow-md shadow-navy/20"
                              : current
                                ? "bg-accent/15 text-accent ring-4 ring-accent/10"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : current ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {i + 1}. {stufeLabel[st]}
                        </span>
                        <span
                          className={`text-[10px] mt-1 font-medium ${
                            done
                              ? "text-navy"
                              : current
                                ? "text-accent"
                                : "text-muted-foreground"
                          }`}
                        >
                          {done
                            ? "(Abgeschlossen)"
                            : current
                              ? "(In Bearbeitung)"
                              : "(Ausstehend)"}
                        </span>
                      </div>
                      {i < stufenSeq.length - 1 && (
                        <div
                          className={`h-px flex-1 mx-3 -mt-6 ${
                            done ? "bg-navy" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {aktiveAkte.next_step && (
                <div className="mt-8 p-4 rounded-xl bg-accent/[0.04] border border-accent/15">
                  <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
                    Nächster Schritt
                  </div>
                  <div className="text-sm text-foreground">
                    {aktiveAkte.next_step}
                  </div>
                </div>
              )}
            </section>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Anwalt-Card */}
              {anwalt && (
                <section className="glass-card p-6 border-border/50">
                  <h3 className="text-sm font-display font-bold text-foreground mb-4">
                    Ihr Anwalt
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-navy text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {anwalt.avatar_initials}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{anwalt.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {anwalt.rechtsgebiete?.join(" · ")}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setTab("nachrichten")}
                    >
                      <Mail className="mr-2 h-3.5 w-3.5" />
                      Nachricht
                    </Button>
                    <Button variant="gold" size="sm" className="rounded-xl">
                      <Phone className="mr-2 h-3.5 w-3.5" />
                      Anrufen
                    </Button>
                  </div>
                </section>
              )}

              {/* Quick-Upload */}
              <section className="glass-card p-6 border-border/50">
                <h3 className="text-sm font-display font-bold text-foreground mb-4">
                  Dokument einreichen
                </h3>
                <div
                  className="border-2 border-dashed border-accent/20 rounded-xl p-6 text-center cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => setTab("dokumente")}
                >
                  <Upload className="h-7 w-7 text-accent mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Klicken oder Datei hierher ziehen
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    PDF · JPG · PNG · max 25 MB
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  Ende-zu-Ende-verschlüsselt
                </div>
              </section>
            </div>

            {/* Anstehende Termine kompakt */}
            {meineTermine.length > 0 && (
              <section>
                <h3 className="text-sm font-display font-bold text-foreground mb-3">
                  Ihre nächsten Termine
                </h3>
                <div className="space-y-2">
                  {meineTermine.slice(0, 3).map((t) => {
                    const d = new Date(t.start_at);
                    return (
                      <div
                        key={t.id}
                        className="glass-card p-4 border-border/50 flex items-center gap-4 hover:border-accent/20 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] uppercase font-semibold text-accent">
                            {d.toLocaleDateString("de-DE", { month: "short" })}
                          </span>
                          <span className="text-base font-display font-bold text-foreground tabular-nums">
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {t.titel}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {d.toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            Uhr
                            {t.ort && ` · ${t.ort}`}
                          </div>
                        </div>
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === "nachrichten" && (
          <div className="space-y-3">
            {meineKonv.length === 0 ? (
              <div className="glass-card p-12 border-border/50 text-center">
                <Mail className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-foreground">
                  Noch keine Nachrichten
                </p>
              </div>
            ) : (
              <>
                {meineKonv.map((k) => (
                  <div
                    key={k.id}
                    className="glass-card p-5 border-border/50 hover:border-accent/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                        {k.kanal === "email" ? (
                          <Mail className="h-4 w-4 text-navy" />
                        ) : (
                          <Phone className="h-4 w-4 text-navy" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {k.richtung === "outbound"
                              ? anwalt?.name ?? tenant.kanzlei_name
                              : `Sie (${mandant.vorname})`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(k.zeitpunkt).toLocaleString("de-DE")}
                          </span>
                        </div>
                        {k.betreff && (
                          <div className="text-sm font-medium text-foreground/90 mb-1">
                            {k.betreff}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {k.preview}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="glass-card p-6 border-accent/20 bg-accent/[0.04] mt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Neue Nachricht senden
                  </h4>
                  <textarea
                    rows={4}
                    placeholder="Ihre Nachricht an die Kanzlei…"
                    className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 mb-3"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Ende-zu-Ende-verschlüsselt
                    </span>
                    <Button variant="gold" size="sm" className="rounded-xl">
                      Senden
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "termine" && (
          <div className="space-y-3">
            {meineTermine.length === 0 ? (
              <div className="glass-card p-12 border-border/50 text-center">
                <CalendarClock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-foreground">Keine Termine</p>
              </div>
            ) : (
              meineTermine.map((t) => {
                const d = new Date(t.start_at);
                const u = findUser(t.anwalt_id);
                return (
                  <div
                    key={t.id}
                    className="glass-card p-5 border-border/50 flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-semibold text-accent">
                        {d.toLocaleDateString("de-DE", { month: "short" })}
                      </span>
                      <span className="text-lg font-display font-bold text-foreground tabular-nums">
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">
                        {t.titel}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {d.toLocaleString("de-DE")}
                        {u && ` · mit ${u.name}`}
                        {t.ort && ` · ${t.ort}`}
                      </div>
                    </div>
                    {t.bestaetigt ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-500/15 px-2 py-1 rounded">
                        Bestätigt
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" className="rounded-xl">
                        Bestätigen
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "dokumente" && (
          <div>
            <div
              className="glass-card border-2 border-dashed border-accent/20 bg-accent/[0.02] p-10 text-center mb-6 cursor-pointer hover:bg-accent/[0.04] transition-colors"
            >
              <Upload className="h-10 w-10 text-accent mx-auto mb-3" />
              <h3 className="text-sm font-display font-bold text-foreground mb-1">
                Dokument hochladen
              </h3>
              <p className="text-xs text-muted-foreground">
                Drag & Drop oder klicken · max 25 MB
              </p>
            </div>

            <div className="space-y-2">
              {meineDokumente.length === 0 ? (
                <div className="glass-card p-12 border-border/50 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-foreground">Keine Dokumente</p>
                </div>
              ) : (
                meineDokumente.map((d) => (
                  <div
                    key={d.id}
                    className="glass-card p-4 border-border/50 flex items-center gap-4 hover:border-accent/20 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {d.dateiname}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Hochgeladen{" "}
                        {new Date(d.uploaded_at).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "rechnungen" && (
          <div className="space-y-2">
            {meineRechnungen.length === 0 ? (
              <div className="glass-card p-12 border-border/50 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-foreground">Keine Rechnungen</p>
              </div>
            ) : (
              meineRechnungen.map((r) => (
                <div
                  key={r.id}
                  className="glass-card p-5 border-border/50 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground font-mono">
                      {r.rechnungsnummer}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Datum {new Date(r.rechnungsdatum).toLocaleDateString("de-DE")} · Fällig{" "}
                      {new Date(r.faelligkeit).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-display font-bold text-foreground tabular-nums">
                      {r.betrag_brutto.toLocaleString("de-DE")}€
                    </div>
                    {r.status === "bezahlt" ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-700">
                        Bezahlt
                      </span>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        className="rounded-lg mt-1"
                        disabled={checkout.isPending}
                        onClick={() => handlePay(r.id)}
                      >
                        {checkout.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Online zahlen"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 px-6 py-6 mt-12">
        <div className="container mx-auto max-w-5xl flex justify-between items-center text-xs text-muted-foreground/60">
          <span>
            Mandanten-Portal · powered by SYSTEMS™
          </span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Datenschutz
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Impressum
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortalDashboard;
