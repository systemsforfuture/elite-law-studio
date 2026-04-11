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
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-navy-dark transform transition-transform duration-500 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
          {sidebarItems.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-primary-foreground/40 hover:text-primary-foreground/70 hover:bg-white/[0.03]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
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
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-2xl border-b border-border/50 h-16 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-serif font-bold text-foreground">Dashboard</h1>
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

        <main className="p-6 lg:p-8 space-y-8 max-w-5xl">
          {/* Case Status Tracker */}
          <div className="glass-card p-8 border-border/50">
            <h2 className="text-lg font-serif font-bold text-foreground mb-1">Case Status Tracker</h2>
            <p className="text-sm text-muted-foreground mb-8">Ihr aktueller Fallstatus auf einen Blick</p>

            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                      step.status === "done"
                        ? "bg-navy text-primary-foreground shadow-md shadow-navy/20"
                        : step.status === "current"
                        ? "bg-accent/15 text-accent ring-4 ring-accent/10"
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
                    <span className={`text-[10px] mt-1 font-medium ${
                      step.status === "done"
                        ? "text-navy"
                        : step.status === "current"
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}>
                      {step.status === "done" ? "(Abgeschlossen)" : step.status === "current" ? "(In Bearbeitung)" : "(Ausstehend)"}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-px flex-1 mx-3 -mt-6 ${
                      step.status === "done" ? "bg-navy" : "bg-border"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* My Cases */}
          <div>
            <h2 className="text-lg font-serif font-bold text-foreground mb-1">Meine Fälle</h2>
            <p className="text-sm text-muted-foreground mb-4">Ihre aktuellen Fälle auf einen Blick</p>
            <div className="glass-card p-6 border-border/50 flex items-center justify-between hover:border-accent/20 transition-all duration-300">
              <div>
                <h3 className="font-semibold text-foreground">Scheidungsverfahren Müller vs. Müller</h3>
                <p className="text-sm text-muted-foreground mt-1">Aktenzeichen 1234/23</p>
              </div>
              <Button variant="navy" size="sm" className="rounded-xl">Fall-Details anzeigen</Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Messages */}
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground mb-4">Letzte Nachrichten</h2>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.sender} className="glass-card p-5 border-border/50 hover:border-accent/20 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy/10 to-navy/5 flex items-center justify-center shrink-0">
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
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground mb-4">Sicherer Dokumenten-Upload</h2>
              <div className="glass-card border-2 border-dashed border-border/50 p-10 text-center hover:border-accent/30 transition-all duration-300 cursor-pointer group">
                <div className="w-14 h-14 rounded-2xl bg-accent/[0.08] flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/15 transition-all">
                  <Upload className="h-7 w-7 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Dateien hierher ziehen oder</p>
                <Button variant="outline" size="sm" className="rounded-xl">Dateien auswählen</Button>
                <p className="text-xs text-muted-foreground/60 mt-4">
                  Max. 25 MB · PDF, JPG, PNG
                </p>
              </div>
            </div>
          </div>

          {/* Secure Messages */}
          <div>
            <h2 className="text-lg font-serif font-bold text-foreground mb-1">Sichere Nachrichten</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Alle Nachrichten zu Ihren Fällen und Dokumenten
            </p>
            <div className="space-y-2">
              {secureThreads.map((thread) => (
                <div
                  key={thread.title}
                  className="glass-card p-5 border-border/50 flex items-center justify-between hover:border-accent/20 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{thread.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{thread.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
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
