// Central type definitions for the SYSTEMS™ Platform.
// Mirrors the database schema in DEV SPEC v1.0 §6.

export type SubscriptionTier = "foundation" | "growth" | "premium";
export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled";
export type Tonalitaet = "formal" | "freundlich" | "empathisch" | "direkt";

export interface BrandingConfig {
  logo_url?: string;
  primary_color: string;
  accent_color: string;
  voice_id?: string;
  tonalitaet: Tonalitaet;
  greeting?: string;
}

export interface Tenant {
  id: string;
  kanzlei_name: string;
  domain: string;
  subdomain?: string;
  branding_config: BrandingConfig;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  rechtsgebiete: string[];
  inhaber_name: string;
  notfall_nummer?: string;
  onboarded_at: string;
  mandanten_count: number;
  akten_count: number;
  mrr_eur: number;
}

export interface User {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: "owner" | "anwalt" | "mitarbeiter" | "support";
  avatar_initials: string;
  rechtsgebiete?: string[];
  active: boolean;
  created_at: string;
}

export type MandantTyp = "privat" | "unternehmen";
export type MandantStatus = "aktiv" | "interessent" | "abgeschlossen" | "archiviert";

export interface Mandant {
  id: string;
  tenant_id: string;
  typ: MandantTyp;
  vorname?: string;
  nachname?: string;
  firmenname?: string;
  email: string;
  telefon: string;
  whatsapp?: string;
  adresse?: { strasse: string; plz: string; ort: string };
  status: MandantStatus;
  zugewiesener_anwalt_id?: string;
  rechtsgebiet?: string;
  herkunft: "voice" | "whatsapp" | "email" | "web" | "empfehlung" | "import";
  created_at: string;
  last_contact: string;
  notes_preview?: string;
  open_invoices_eur?: number;
}

export type AktenStatus = "neu" | "in_bearbeitung" | "wartend" | "abgeschlossen" | "archiviert";
export type AktenStufe = "fallaufnahme" | "strategie" | "verfahren" | "abschluss";

export interface Akte {
  id: string;
  tenant_id: string;
  aktenzeichen: string;
  titel: string;
  rechtsgebiet: string;
  status: AktenStatus;
  stufe: AktenStufe;
  mandant_id: string;
  zugewiesener_anwalt_id: string;
  streitwert_eur?: number;
  fristen: { titel: string; datum: string; kritisch?: boolean }[];
  created_at: string;
  last_update: string;
  beschreibung: string;
  next_step?: string;
}

export type Kanal = "voice" | "whatsapp" | "email" | "sms";
export type Richtung = "inbound" | "outbound";
export type KonvStatus = "automated" | "escalated" | "handled" | "pending";

export interface Konversation {
  id: string;
  tenant_id: string;
  mandant_id?: string;
  akte_id?: string;
  kanal: Kanal;
  richtung: Richtung;
  status: KonvStatus;
  intent?: string;
  zeitpunkt: string;
  betreff?: string;
  preview: string;
  ai_handled: boolean;
  eskaliert_an?: string;
  dauer_sek?: number;
  ungelesen?: boolean;
  transcript?: { speaker: "ai" | "mandant" | "anwalt"; text: string; ts: string }[];
}

export type TerminTyp = "erstgespraech" | "gerichtstermin" | "wiedervorlage" | "intern" | "telefon";

export interface Termin {
  id: string;
  tenant_id: string;
  titel: string;
  typ: TerminTyp;
  start_at: string;
  ende_at?: string;
  mandant_id?: string;
  akte_id?: string;
  anwalt_id: string;
  ort?: string;
  notiz?: string;
  bestaetigt: boolean;
}

export type DokumentStatus = "neu" | "ki_analysiert" | "geprueft" | "freigegeben" | "veraltet";

export interface Dokument {
  id: string;
  tenant_id: string;
  mandant_id?: string;
  akte_id?: string;
  dateiname: string;
  mime_type: string;
  groesse_bytes: number;
  status: DokumentStatus;
  uploaded_by: "mandant" | "anwalt" | "ai_import";
  uploaded_at: string;
  ai_extracted?: {
    dokument_typ: string;
    parteien?: string[];
    kritische_klauseln?: { text: string; risiko: "low" | "medium" | "high" }[];
    fristen?: { titel: string; datum: string }[];
    zusammenfassung: string;
    konfidenz: number;
  };
}

export type RechnungStatus =
  | "entwurf"
  | "versendet"
  | "bezahlt"
  | "ueberfaellig"
  | "mahnung_1"
  | "mahnung_2"
  | "mahnung_3"
  | "gerichtlich";

export interface Rechnung {
  id: string;
  tenant_id: string;
  mandant_id: string;
  akte_id?: string;
  rechnungsnummer: string;
  betrag_netto: number;
  betrag_brutto: number;
  rechnungsdatum: string;
  faelligkeit: string;
  bezahlt_am?: string;
  status: RechnungStatus;
  mahnstufe: 0 | 1 | 2 | 3 | 4;
  naechste_aktion_am?: string;
}

export type AgentSlug =
  | "voice_receptionist"
  | "email_triagist"
  | "whatsapp_conversationalist"
  | "dokumenten_analyst"
  | "termin_koordinator"
  | "mahnungs_eskalator";

export interface KIAgent {
  slug: AgentSlug;
  name: string;
  beschreibung: string;
  status: "aktiv" | "pausiert" | "nicht_konfiguriert";
  modell: string;
  letzte_24h: { calls: number; resolved: number; escalated: number };
  konfidenz_threshold: number;
  custom_prompt_addition?: string;
  tonalitaet: Tonalitaet;
}

export interface AuditEvent {
  id: string;
  ts: string;
  user_name: string;
  action: "read" | "create" | "update" | "delete" | "export" | "login" | "ai_action";
  entity_type: string;
  entity_id?: string;
  ip_address: string;
  details?: string;
}
