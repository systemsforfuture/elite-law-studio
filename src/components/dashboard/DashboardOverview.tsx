import { CheckCircle, Circle, Clock, User, Upload, FileText, ChevronRight } from "lucide-react";
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

interface Props {
  onNavigate: (view: string) => void;
}

const DashboardOverview = ({ onNavigate }: Props) => {
  return (
    <div className="space-y-8">
      {/* Case Status Tracker */}
      <div className="glass-card p-8 border-border/50">
        <h2 className="text-lg font-serif font-bold text-foreground mb-1">Fallstatus-Tracker</h2>
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
                  {step.status === "done" ? <CheckCircle className="h-5 w-5" /> : step.status === "current" ? <Clock className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </div>
                <span className="text-xs font-medium text-foreground">{i + 1}. {step.label}</span>
                <span className={`text-[10px] mt-1 font-medium ${
                  step.status === "done" ? "text-navy" : step.status === "current" ? "text-accent" : "text-muted-foreground"
                }`}>
                  {step.status === "done" ? "(Abgeschlossen)" : step.status === "current" ? "(In Bearbeitung)" : "(Ausstehend)"}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mx-3 -mt-6 ${step.status === "done" ? "bg-navy" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* My Cases */}
      <div>
        <h2 className="text-lg font-serif font-bold text-foreground mb-1">Meine Fälle</h2>
        <p className="text-sm text-muted-foreground mb-4">Ihre aktuellen Fälle auf einen Blick</p>
        <div
          className="glass-card p-6 border-border/50 flex items-center justify-between hover:border-accent/20 transition-all duration-300 cursor-pointer"
          onClick={() => onNavigate("Meine Fälle")}
        >
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
              <div
                key={msg.sender}
                className="glass-card p-5 border-border/50 hover:border-accent/20 transition-all duration-300 cursor-pointer group"
                onClick={() => onNavigate("Sichere Nachrichten")}
              >
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

        {/* Document Upload Quick */}
        <div>
          <h2 className="text-lg font-serif font-bold text-foreground mb-4">Sicherer Dokumenten-Upload</h2>
          <div
            className="glass-card border-2 border-dashed border-border/50 p-10 text-center hover:border-accent/30 transition-all duration-300 cursor-pointer group"
            onClick={() => onNavigate("Dokumente")}
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/[0.08] flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/15 transition-all">
              <Upload className="h-7 w-7 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">Dateien hierher ziehen oder</p>
            <Button variant="outline" size="sm" className="rounded-xl">Dateien auswählen</Button>
            <p className="text-xs text-muted-foreground/60 mt-4">Max. 25 MB · PDF, JPG, PNG</p>
          </div>
        </div>
      </div>

      {/* Secure Messages */}
      <div>
        <h2 className="text-lg font-serif font-bold text-foreground mb-1">Sichere Nachrichten</h2>
        <p className="text-sm text-muted-foreground mb-4">Alle Nachrichten zu Ihren Fällen und Dokumenten</p>
        <div className="space-y-2">
          {secureThreads.map((thread) => (
            <div
              key={thread.title}
              className="glass-card p-5 border-border/50 flex items-center justify-between hover:border-accent/20 transition-all duration-300 cursor-pointer group"
              onClick={() => onNavigate("Sichere Nachrichten")}
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
    </div>
  );
};

export default DashboardOverview;
