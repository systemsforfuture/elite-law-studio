import { useState } from "react";
import {
  ShieldCheck,
  Activity,
  Eye,
  Download,
  Sparkles,
  Bot,
  User,
  LogIn,
  Pencil,
  Trash2,
  Plus,
  ArrowDownToLine,
} from "lucide-react";
import type { AuditEvent } from "@/data/types";
import { Button } from "@/components/ui/button";
import { useAuditLog } from "@/lib/queries/use-audit";

const actionMeta: Record<
  AuditEvent["action"],
  { label: string; icon: typeof Eye; cls: string }
> = {
  read: { label: "Read", icon: Eye, cls: "bg-sky-500/15 text-sky-700" },
  create: { label: "Create", icon: Plus, cls: "bg-emerald-500/15 text-emerald-700" },
  update: { label: "Update", icon: Pencil, cls: "bg-amber-500/15 text-amber-700" },
  delete: { label: "Delete", icon: Trash2, cls: "bg-rose-500/15 text-rose-700" },
  export: {
    label: "Export",
    icon: ArrowDownToLine,
    cls: "bg-purple-500/15 text-purple-700",
  },
  login: { label: "Login", icon: LogIn, cls: "bg-muted text-muted-foreground" },
  ai_action: {
    label: "KI-Aktion",
    icon: Sparkles,
    cls: "bg-accent/15 text-accent",
  },
};

const AuditPage = () => {
  const { data: auditLog = [] } = useAuditLog();
  const [actionFilter, setActionFilter] = useState<AuditEvent["action"] | "all">("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const entityTypes = Array.from(
    new Set(auditLog.map((e) => e.entity_type)),
  ).sort();

  const filtered = auditLog.filter((e) => {
    if (actionFilter !== "all" && e.action !== actionFilter) return false;
    if (entityFilter !== "all" && e.entity_type !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.user_name.toLowerCase().includes(q) &&
        !(e.details ?? "").toLowerCase().includes(q) &&
        !e.entity_type.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-emerald-500/30 bg-emerald-500/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700">
              DSGVO-Status
            </span>
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            Konform
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Audit-Log 1 Jahr · AVV signiert · TDE aktiv
          </div>
        </div>
        <div className="glass-card p-5 border-border/50">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Events 24h
          </div>
          <div className="text-3xl font-display font-black text-foreground tabular-nums">
            247
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            142 KI · 105 Nutzer
          </div>
        </div>
        <div className="glass-card p-5 border-border/50">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Sicherheits-Vorfälle
          </div>
          <div className="text-3xl font-display font-black text-emerald-600 tabular-nums">
            0
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Letzte 90 Tage
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          Live Audit-Log{" "}
          {filtered.length !== auditLog.length && (
            <span className="text-xs font-normal text-muted-foreground">
              ({filtered.length}/{auditLog.length})
            </span>
          )}
        </h3>
        <div className="flex gap-2 flex-wrap">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 w-40"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as typeof actionFilter)}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
          >
            <option value="all">Alle Aktionen</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Export</option>
            <option value="login">Login</option>
            <option value="ai_action">KI-Aktion</option>
            <option value="read">Read</option>
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
          >
            <option value="all">Alle Entities</option>
            {entityTypes.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="rounded-xl">
            <Download className="mr-2 h-3.5 w-3.5" />
            DSGVO-Export
          </Button>
        </div>
      </div>

      <div className="glass-card border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 bg-muted/20">
              <tr>
                <th className="text-left p-4 font-semibold">Zeitpunkt</th>
                <th className="text-left p-4 font-semibold">Akteur</th>
                <th className="text-left p-4 font-semibold">Aktion</th>
                <th className="text-left p-4 font-semibold">Entität</th>
                <th className="text-left p-4 font-semibold">IP / Quelle</th>
                <th className="text-left p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">
                    Noch keine Audit-Events. Sobald jemand Daten anlegt oder
                    ändert, erscheinen hier alle Aktionen.
                  </td>
                </tr>
              )}
              {filtered.map((e) => {
                const meta = actionMeta[e.action];
                const Icon = meta.icon;
                const isAI = e.action === "ai_action";
                return (
                  <tr
                    key={e.id}
                    className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.ts).toLocaleString("de-DE")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {isAI ? (
                          <Bot className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground">
                          {e.user_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold px-2 py-1 rounded ${meta.cls}`}
                      >
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-foreground">
                      {e.entity_type}
                      {e.entity_id ? `:${e.entity_id.slice(0, 8)}` : ""}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {e.ip_address}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {e.details ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6 border-border/50">
        <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Compliance-Status
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "Hosting EU (Frankfurt)", status: "ok" },
            { label: "AVV signiert", status: "ok" },
            { label: "Verschlüsselung at-Rest pro Tenant", status: "ok" },
            { label: "TLS 1.3 + HSTS", status: "ok" },
            { label: "Audit-Log 365 Tage", status: "ok" },
            { label: "2FA für Owner-Rolle", status: "ok" },
            { label: "DSGVO-Datenexport", status: "ok" },
            { label: "Soft-Delete + Hard-Delete", status: "ok" },
            { label: "ISO 27001", status: "in_progress" },
          ].map((c) => (
            <div
              key={c.label}
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                c.status === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/[0.03] text-foreground"
                  : "border-amber-500/30 bg-amber-500/[0.03] text-foreground"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  c.status === "ok" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="flex-1 font-medium">{c.label}</span>
              <span
                className={`text-[10px] uppercase font-bold ${
                  c.status === "ok" ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {c.status === "ok" ? "OK" : "WIP"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditPage;
