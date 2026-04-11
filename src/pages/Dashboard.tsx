import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scale, Home, FolderOpen, FileText, Mail, Calendar,
  Upload, ChevronRight, CheckCircle, Circle, Clock,
  LogOut, Bell, User, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { label: "Fallaufnahme", status: "done" },
  { label: "Strategie & Vorbereitung", status: "current" },
  { label: "Verhandlung / Verfahren", status: "pending" },
  { label: "Abschluss & Erfolg", status: "pending" },
];

const messages = [
  {
    sender: "RA Max Bergmann",
    time: "Gestern, 14:30 Uhr",
    preview: "Guten Tag, bezüglich Ihres Falles Müller vs. Müller haben wir neue Informationen...",
  },
  {
    sender: "RA Sarah Fischer",
    time: "12. Apr, 09:15 Uhr",
    preview: "Die Dokumente für die Verhandlung am 20. April sind vorbereitet...",
  },
];

const secureThreads = [
  { title: "Scheidungsverfahren Müller vs. Müller", time: "Gestern, 14:30 Uhr" },
  { title: "Unterhaltsvereinbarung", time: "10. Apr, 11:00 Uhr" },
  { title: "Sorgerechtsvereinbarung", time: "08. Apr, 16:45 Uhr" },
];

const sidebarItems = [
  { icon: Home, label: "Übersicht", active: true },
  { icon: FolderOpen, label: "Meine Fälle", active: false },
  { icon: FileText, label: "Dokumente", active: false },
  { icon: Mail, label: "Sichere Nachrichten", active: false },
  { icon: Calendar, label: "Termine", active: false },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <Scale className="h-7 w-7 text-accent" />
            <div>
              <span className="text-sm font-serif font-bold text-sidebar-foreground">KANZLEI BERGMANN</span>
              <span className="block text-[10px] text-gold-light tracking-[0.2em]">RECHTSANWÄLTE</span>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Link to="/">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <LogOut className="h-5 w-5" />
              Abmelden
            </button>
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border h-16 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-serif font-bold text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8 max-w-5xl">
          {/* Case Status Tracker */}
          <div className="bg-card rounded-xl border border-border p-8 animate-fade-in-up">
            <h2 className="text-lg font-serif font-bold text-foreground mb-1">Case Status Tracker</h2>
            <p className="text-sm text-muted-foreground mb-8">Ihr aktueller Fallstatus auf einen Blick</p>

            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                      step.status === "done"
                        ? "bg-navy text-primary-foreground"
                        : step.status === "current"
                        ? "bg-navy text-primary-foreground ring-4 ring-accent/30"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {step.status === "done" ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : step.status === "current" ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground">{i + 1}. {step.label}</span>
                    <span className={`text-[10px] mt-1 ${
                      step.status === "done"
                        ? "text-accent"
                        : step.status === "current"
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}>
                      {step.status === "done" ? "(Abgeschlossen)" : step.status === "current" ? "(In Bearbeitung)" : "(Ausstehend)"}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 -mt-6 ${
                      step.status === "done" ? "bg-navy" : "bg-border"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* My Cases */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-lg font-serif font-bold text-foreground mb-1">Meine Fälle</h2>
            <p className="text-sm text-muted-foreground mb-4">Ihre aktuellen Fälle auf einen Blick</p>
            <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Scheidungsverfahren Müller vs. Müller</h3>
                <p className="text-sm text-muted-foreground">Aktenzeichen 1234/23</p>
              </div>
              <Button variant="navy" size="sm">Fall-Details anzeigen</Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Messages */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-lg font-serif font-bold text-foreground mb-4">Letzte Nachrichten</h2>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.sender} className="bg-card rounded-xl border border-border p-5 hover:border-accent/30 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-navy" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{msg.sender}</span>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{msg.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Upload */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <h2 className="text-lg font-serif font-bold text-foreground mb-4">Sicherer Dokumenten-Upload</h2>
              <div className="bg-card rounded-xl border-2 border-dashed border-border p-10 text-center hover:border-accent/40 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-3">Dateien hierher ziehen oder</p>
                <Button variant="outline" size="sm">Dateien auswählen</Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Max. 25 MB · PDF, JPG, PNG
                </p>
              </div>
            </div>
          </div>

          {/* Secure Messages */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-lg font-serif font-bold text-foreground mb-1">Sichere Nachrichten</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Alle Nachrichten zu Ihren Fällen und Dokumenten
            </p>
            <div className="space-y-2">
              {secureThreads.map((thread) => (
                <div
                  key={thread.title}
                  className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{thread.title}</h3>
                      <p className="text-xs text-muted-foreground">{thread.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-4 mt-8">
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Datenschutzerklärung</a>
            <a href="#" className="hover:text-foreground transition-colors">Impressum</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
