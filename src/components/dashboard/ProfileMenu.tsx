import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  CreditCard,
  ShieldCheck,
  LogOut,
  Palette,
  ExternalLink,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ProfileMenu = () => {
  const { tenant } = useTenant();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Abgemeldet");
    navigate("/login");
  };

  // Initialen aus Owner-Name oder User-Email
  const initials = (
    tenant.inhaber_name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "?"
  ).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center shadow-sm text-xs font-bold text-primary-foreground hover:shadow-md transition-all">
          {initials || <User className="h-4 w-4 text-primary-foreground" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="text-sm font-semibold text-foreground">
            {tenant.inhaber_name ?? "—"}
          </div>
          <div className="text-xs font-normal text-muted-foreground truncate mt-0.5">
            {user?.email ?? "Demo-Mode"}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent">
            <ShieldCheck className="h-2.5 w-2.5" />
            Owner · {tenant.subscription_tier}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/dashboard/team">
            <User className="mr-2 h-4 w-4" />
            <span>Team</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/branding">
            <Palette className="mr-2 h-4 w-4" />
            <span>Branding</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/abrechnung">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Abrechnung</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/audit">
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Audit-Log</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Marketing-Seite öffnen</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/template/kanzlei" target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>White-Label-Funnel ansehen</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleLogout}
          className="text-rose-600 focus:text-rose-700 focus:bg-rose-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
