import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { useInviteUser } from "@/lib/queries/use-team";
import type { User } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLES: { v: User["role"]; label: string; desc: string }[] = [
  { v: "owner", label: "Owner", desc: "Voller Zugriff inkl. Abrechnung & Branding" },
  { v: "anwalt", label: "Anwalt", desc: "Akten, Mandanten, Strategien" },
  { v: "mitarbeiter", label: "Mitarbeiter", desc: "Sekretariat, Termine, Inbox" },
  { v: "support", label: "Support", desc: "Read-only" },
];

const InviteUserDialog = ({ open, onOpenChange }: Props) => {
  const invite = useInviteUser();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<User["role"]>("anwalt");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Name und E-Mail erforderlich");
      return;
    }
    const t = toast.loading("Einladung wird verschickt…");
    try {
      await invite.mutateAsync({ email, name, role });
      toast.success("Einladung verschickt", {
        id: t,
        description: `${name} wurde eingeladen. Magic-Link kommt per E-Mail.`,
      });
      setEmail("");
      setName("");
      setRole("anwalt");
      onOpenChange(false);
    } catch (err) {
      toast.error("Einladung fehlgeschlagen", {
        id: t,
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-accent" />
            Mitglied einladen
          </DialogTitle>
          <DialogDescription>
            Magic-Link wird per E-Mail verschickt. Beim ersten Login wird die
            Person automatisch zur Kanzlei hinzugefügt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Sarah Fischer"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@kanzlei-bergmann.de"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              Rolle
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setRole(r.v)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    role === r.v
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="text-sm font-semibold text-foreground">
                    {r.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {r.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" variant="gold" disabled={invite.isPending}>
              {invite.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sende Einladung…
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Einladung senden
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
