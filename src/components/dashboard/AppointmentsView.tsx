import { useState } from "react";
import { Calendar, Clock, MapPin, User, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  lawyer: string;
  type: "hearing" | "consultation" | "meeting";
  notes?: string;
}

const typeConfig = {
  hearing: { label: "Gerichtsverhandlung", color: "bg-red-500/10 text-red-600" },
  consultation: { label: "Beratungsgespräch", color: "bg-accent/10 text-accent" },
  meeting: { label: "Besprechung", color: "bg-navy/10 text-navy" },
};

const initialAppointments: Appointment[] = [
  {
    id: "1",
    title: "Scheidungsverhandlung Müller vs. Müller",
    date: "20. April 2026",
    time: "10:00 – 12:00 Uhr",
    location: "Amtsgericht München, Saal 3",
    lawyer: "RA Max Bergmann",
    type: "hearing",
    notes: "Bitte alle Dokumente zur Vermögensaufteilung mitbringen.",
  },
  {
    id: "2",
    title: "Güteverhandlung Weber",
    date: "25. April 2026",
    time: "14:00 – 15:30 Uhr",
    location: "Arbeitsgericht München, Saal 7",
    lawyer: "RA Sarah Fischer",
    type: "hearing",
  },
  {
    id: "3",
    title: "Beratungsgespräch – Unterhaltsregelung",
    date: "28. April 2026",
    time: "09:00 – 10:00 Uhr",
    location: "Kanzlei Bergmann, Büro 201",
    lawyer: "RA Max Bergmann",
    type: "consultation",
    notes: "Vorab die aktuelle Einkommensbescheinigung hochladen.",
  },
  {
    id: "4",
    title: "Mandantenbesprechung – Sorgerecht",
    date: "02. Mai 2026",
    time: "11:00 – 12:00 Uhr",
    location: "Kanzlei Bergmann, Konferenzraum",
    lawyer: "RA Max Bergmann",
    type: "meeting",
  },
];

const AppointmentsView = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", date: "", time: "", notes: "" });
  const { toast } = useToast();

  const handleRequestAppointment = () => {
    if (!formData.title.trim() || !formData.date.trim()) {
      toast({ title: "Bitte füllen Sie alle Pflichtfelder aus", variant: "destructive" });
      return;
    }
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title: formData.title,
      date: formData.date,
      time: formData.time || "Wird bestätigt",
      location: "Wird bestätigt",
      lawyer: "Wird zugewiesen",
      type: "consultation",
      notes: formData.notes,
    };
    setAppointments((prev) => [...prev, newAppointment]);
    setFormData({ title: "", date: "", time: "", notes: "" });
    setShowForm(false);
    toast({ title: "Terminanfrage gesendet", description: "Ihr Terminwunsch wurde an die Kanzlei übermittelt." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-1">Termine</h2>
          <p className="text-sm text-muted-foreground">Ihre anstehenden Termine und Verhandlungen</p>
        </div>
        <Button variant="navy" size="sm" className="rounded-xl" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? "Abbrechen" : "Termin anfragen"}
        </Button>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="glass-card p-6 border-accent/20 space-y-4 animate-in slide-in-from-top-2">
          <h3 className="font-semibold text-foreground">Neuen Termin anfragen</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Betreff *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
                placeholder="z.B. Beratungsgespräch Familienrecht"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Wunschdatum *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Wunschzeit</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Anmerkungen</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
                placeholder="Optionale Anmerkungen"
              />
            </div>
          </div>
          <Button variant="navy" className="rounded-xl" onClick={handleRequestAppointment}>
            Terminanfrage senden
          </Button>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="glass-card p-6 border-border/50 hover:border-accent/20 transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{apt.title}</h3>
                <span className={`inline-block mt-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${typeConfig[apt.type].color}`}>
                  {typeConfig[apt.type].label}
                </span>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{apt.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{apt.time}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{apt.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{apt.lawyer}</span>
            </div>
            {apt.notes && (
              <div className="mt-3 p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
                💡 {apt.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsView;
