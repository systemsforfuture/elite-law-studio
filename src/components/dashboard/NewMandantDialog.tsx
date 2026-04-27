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
import { Loader2, UserPlus, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { useCreateMandant } from "@/lib/queries/use-mandanten";
import { useTenant } from "@/contexts/TenantContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewMandantDialog = ({ open, onOpenChange }: Props) => {
  const { tenant } = useTenant();
  const createMandant = useCreateMandant();
  const [typ, setTyp] = useState<"privat" | "unternehmen">("privat");
  const [form, setForm] = useState({
    vorname: "",
    nachname: "",
    firmenname: "",
    email: "",
    telefon: "",
    rechtsgebiet: "",
    beschreibung: "",
  });

  const reset = () => {
    setForm({
      vorname: "",
      nachname: "",
      firmenname: "",
      email: "",
      telefon: "",
      rechtsgebiet: "",
      beschreibung: "",
    });
    setTyp("privat");
  };

  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isValidPhone = (s: string) => !s.trim() || /^[+\d\s/()-]{6,}$/.test(s.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !isValidEmail(form.email.trim())) {
      toast.error("Bitte gültige E-Mail-Adresse eingeben");
      return;
    }
    if (!isValidPhone(form.telefon)) {
      toast.error("Telefonnummer hat ein ungültiges Format");
      return;
    }
    if (typ === "privat" && !form.nachname.trim()) {
      toast.error("Nachname ist erforderlich");
      return;
    }
    if (typ === "unternehmen" && !form.firmenname.trim()) {
      toast.error("Firmenname ist erforderlich");
      return;
    }

    const t = toast.loading("Mandant wird angelegt…");
    try {
      await createMandant.mutateAsync({
        tenant_id: tenant.id,
        typ,
        vorname: typ === "privat" ? form.vorname.trim() || undefined : undefined,
        nachname: typ === "privat" ? form.nachname.trim() : undefined,
        firmenname: typ === "unternehmen" ? form.firmenname.trim() : undefined,
        email: form.email.trim(),
        telefon: form.telefon.trim(),
        rechtsgebiet: form.rechtsgebiet.trim() || undefined,
        notes_preview: form.beschreibung.trim() || undefined,
        status: "aktiv",
        herkunft: "web",
        // last_contact NICHT setzen — DB-Default greift, sonst überschreiben wir
        // potential RLS-relevante Audit-Daten.
      });
      toast.success("Mandant angelegt", { id: t });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Anlegen fehlgeschlagen", {
        id: t,
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            Neuer Mandant
          </DialogTitle>
          <DialogDescription>
            Stammdaten anlegen. Sie können später Akten verknüpfen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTyp("privat")}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                typ === "privat"
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-border/80"
              }`}
            >
              <User className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Privatperson</span>
            </button>
            <button
              type="button"
              onClick={() => setTyp("unternehmen")}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                typ === "unternehmen"
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-border/80"
              }`}
            >
              <Building2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Unternehmen</span>
            </button>
          </div>

          {typ === "privat" ? (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Vorname"
                value={form.vorname}
                onChange={(v) => setForm({ ...form, vorname: v })}
              />
              <Input
                label="Nachname *"
                value={form.nachname}
                onChange={(v) => setForm({ ...form, nachname: v })}
              />
            </div>
          ) : (
            <Input
              label="Firmenname *"
              value={form.firmenname}
              onChange={(v) => setForm({ ...form, firmenname: v })}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="E-Mail *"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Input
              label="Telefon"
              value={form.telefon}
              onChange={(v) => setForm({ ...form, telefon: v })}
            />
          </div>

          <Input
            label="Rechtsgebiet"
            value={form.rechtsgebiet}
            onChange={(v) => setForm({ ...form, rechtsgebiet: v })}
            placeholder="z.B. Familienrecht, Arbeitsrecht…"
          />

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Notiz
            </label>
            <textarea
              rows={3}
              value={form.beschreibung}
              onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
              placeholder="Kurze Beschreibung des Anliegens…"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={createMandant.isPending}
            >
              {createMandant.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lege an…
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Mandant anlegen
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="text-xs font-medium text-foreground block mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
    />
  </div>
);

export default NewMandantDialog;
