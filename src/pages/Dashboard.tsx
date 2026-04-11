import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scale, Home, FolderOpen, FileText, Mail, Calendar,
  LogOut, Bell, User, Menu,
} from "lucide-react";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import CasesView from "@/components/dashboard/CasesView";
import DocumentsView from "@/components/dashboard/DocumentsView";
import MessagesView from "@/components/dashboard/MessagesView";
import AppointmentsView from "@/components/dashboard/AppointmentsView";

const sidebarItems = [
  { icon: Home, label: "Übersicht" },
  { icon: FolderOpen, label: "Meine Fälle" },
  { icon: FileText, label: "Dokumente" },
  { icon: Mail, label: "Sichere Nachrichten" },
  { icon: Calendar, label: "Termine" },
];

const viewTitles: Record<string, string> = {
  "Übersicht": "Dashboard",
  "Meine Fälle": "Meine Fälle",
  "Dokumente": "Dokumente",
  "Sichere Nachrichten": "Nachrichten",
  "Termine": "Termine",
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("Übersicht");

  const navigate = (view: string) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const renderView = () => {
    switch (activeView) {
      case "Meine Fälle": return <CasesView />;
      case "Dokumente": return <DocumentsView />;
      case "Sichere Nachrichten": return <MessagesView />;
      case "Termine": return <AppointmentsView />;
      default: return <DashboardOverview onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-navy-dark transform transition-transform duration-500 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-3">
            <Scale className="h-7 w-7 text-accent" />
            <div>
              <span className="text-sm font-serif font-bold text-primary-foreground">KANZLEI BERGMANN</span>
              <span className="block text-[10px] text-primary-foreground/30 tracking-[0.2em]">RECHTSANWÄLTE</span>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => navigate(label)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeView === label
                  ? "bg-accent/10 text-accent"
                  : "text-primary-foreground/40 hover:text-primary-foreground/70 hover:bg-white/[0.03]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
              {activeView === label && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06]">
          <Link to="/">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-primary-foreground/30 hover:text-primary-foreground/60 hover:bg-white/[0.03] transition-all">
              <LogOut className="h-5 w-5" />
              Abmelden
            </button>
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-navy-dark/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-72">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-2xl border-b border-border/50 h-16 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-serif font-bold text-foreground">{viewTitles[activeView]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-5xl">
          {renderView()}
        </main>

        <footer className="border-t border-border/50 px-6 py-4 mt-8">
          <div className="flex gap-6 text-xs text-muted-foreground/60">
            <a href="#" className="hover:text-foreground transition-colors">Datenschutzerklärung</a>
            <a href="#" className="hover:text-foreground transition-colors">Impressum</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
