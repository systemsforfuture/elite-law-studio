import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Phone,
  Inbox,
  Users,
  FolderOpen,
  CalendarDays,
  FileSearch,
  Receipt,
  BrainCircuit,
  DatabaseZap,
  Palette,
  CreditCard,
  ShieldCheck,
  UsersRound,
  UserPlus,
  Mail,
  Sparkles,
  PhoneIncoming,
  Building2,
  User,
  Plug,
  HeartPulse,
  Clock4,
} from "lucide-react";
import { useMandantenQuery } from "@/lib/queries/use-mandanten";
import { useAktenQuery } from "@/lib/queries/use-akten";
import { mandantName } from "@/data/mockData";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/voice", icon: Phone, label: "Voice-Agent" },
  { to: "/dashboard/inbox", icon: Inbox, label: "Inbox" },
  { to: "/dashboard/agenten", icon: BrainCircuit, label: "KI-Agenten" },
  { to: "/dashboard/mandanten", icon: Users, label: "Mandanten" },
  { to: "/dashboard/akten", icon: FolderOpen, label: "Akten" },
  { to: "/dashboard/termine", icon: CalendarDays, label: "Termine" },
  { to: "/dashboard/dokumente", icon: FileSearch, label: "Dokumente" },
  { to: "/dashboard/mahnwesen", icon: Receipt, label: "Mahnwesen" },
  { to: "/dashboard/import", icon: DatabaseZap, label: "Daten-Import" },
  { to: "/dashboard/branding", icon: Palette, label: "Branding & White-Label" },
  { to: "/dashboard/team", icon: UsersRound, label: "Team" },
  { to: "/dashboard/personal", icon: Clock4, label: "Personal · Zeit & Urlaub" },
  { to: "/dashboard/integrationen", icon: Plug, label: "Integrationen" },
  { to: "/dashboard/system-status", icon: HeartPulse, label: "System-Status" },
  { to: "/dashboard/abrechnung", icon: CreditCard, label: "Abrechnung" },
  { to: "/dashboard/audit", icon: ShieldCheck, label: "Audit-Log" },
];

export const CommandPalette = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const navigate = useNavigate();
  const { data: mandanten = [] } = useMandantenQuery();
  const { data: akten = [] } = useAktenQuery();
  const [query, setQuery] = useState("");

  // Wenn keine Suche aktiv: nur Top-5 zeigen (UI-rein).
  // Wenn Suche aktiv: alle Mandanten/Akten verfügbar machen, damit
  // cmdk client-seitig matchen kann (z. B. »Müller« findet Müller GmbH).
  const visibleMandanten = useMemo(
    () => (query.trim() ? mandanten : mandanten.slice(0, 5)),
    [mandanten, query],
  );
  const visibleAkten = useMemo(
    () => (query.trim() ? akten : akten.slice(0, 5)),
    [akten, query],
  );

  const go = (path: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Suchen oder Aktion ausführen…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Keine Treffer</CommandEmpty>

        <CommandGroup heading="Schnell-Aktionen">
          <CommandItem onSelect={() => go("/dashboard/mandanten?new=1")}>
            <UserPlus className="mr-2 h-4 w-4 text-accent" />
            Neuer Mandant
            <kbd className="ml-auto text-[10px] text-muted-foreground font-mono">
              N M
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/team?invite=1")}>
            <Mail className="mr-2 h-4 w-4 text-accent" />
            Mitarbeiter einladen
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/voice")}>
            <PhoneIncoming className="mr-2 h-4 w-4 text-accent" />
            Test-Anruf simulieren
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/import")}>
            <DatabaseZap className="mr-2 h-4 w-4 text-accent" />
            Daten importieren
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/agenten")}>
            <Sparkles className="mr-2 h-4 w-4 text-accent" />
            KI-Agenten konfigurieren
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navItems.map((it) => {
            const Icon = it.icon;
            return (
              <CommandItem key={it.to} onSelect={() => go(it.to)}>
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {it.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {visibleMandanten.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Mandanten${query.trim() ? ` (${visibleMandanten.length})` : ""}`}>
              {visibleMandanten.map((m) => {
                const MIcon = m.typ === "unternehmen" ? Building2 : User;
                return (
                  <CommandItem
                    key={m.id}
                    value={`mandant ${mandantName(m)} ${m.email ?? ""} ${m.rechtsgebiet ?? ""}`}
                    onSelect={() => go(`/dashboard/mandanten?id=${m.id}`)}
                  >
                    <MIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {mandantName(m)}
                    <span className="ml-auto text-[10px] text-muted-foreground/70">
                      {m.rechtsgebiet ?? "—"}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {visibleAkten.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Akten${query.trim() ? ` (${visibleAkten.length})` : ""}`}>
              {visibleAkten.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`akte ${a.titel} ${a.aktenzeichen}`}
                  onSelect={() => go(`/dashboard/akten?id=${a.id}`)}
                >
                  <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                  {a.titel}
                  <span className="ml-auto text-[10px] text-muted-foreground/70 font-mono">
                    {a.aktenzeichen}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export const useCommandPalette = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return { open, setOpen };
};
