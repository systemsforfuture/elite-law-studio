import { Plus, Mail, Shield } from "lucide-react";
import { users } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const roleLabel = {
  owner: { label: "Owner", cls: "bg-accent/15 text-accent" },
  anwalt: { label: "Anwalt", cls: "bg-navy/15 text-navy" },
  mitarbeiter: { label: "Mitarbeiter", cls: "bg-sky-500/15 text-sky-700" },
  support: { label: "Support", cls: "bg-muted text-muted-foreground" },
};

const TeamPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Team-Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {users.length} Mitglieder · Magic-Link-Einladungen via Supabase Auth
          </p>
        </div>
        <Button variant="gold" size="sm" className="rounded-xl">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Mitglied einladen
        </Button>
      </div>

      <div className="glass-card border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 bg-muted/20">
              <tr>
                <th className="text-left p-4 font-semibold">Mitglied</th>
                <th className="text-left p-4 font-semibold">E-Mail</th>
                <th className="text-left p-4 font-semibold">Rolle</th>
                <th className="text-left p-4 font-semibold">Rechtsgebiete</th>
                <th className="text-left p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
                        {u.avatar_initials}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Seit{" "}
                          {new Date(u.created_at).toLocaleDateString("de-DE", {
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {u.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${roleLabel[u.role].cls}`}
                    >
                      {roleLabel[u.role].label}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {u.rechtsgebiete?.join(", ") ?? "—"}
                  </td>
                  <td className="p-4">
                    {u.active ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Inaktiv
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

export default TeamPage;
