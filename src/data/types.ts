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
  /** Mock-only: in DB nicht persistiert; in Production aus useMandantenQuery().length zu lesen */
  mandanten_count?: number;
  /** Mock-only: in DB nicht persistiert; in Production aus useAktenQuery().length zu lesen */
  akten_count?: number;
  /** Mock-only: in DB nicht persistiert; in Production aus useRechnungenQuery() zu summieren */
  mrr_eur?: number;
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
  storage_path?: string;
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

export type ActivityType =
  | "voice_call"
  | "email_in"
  | "email_out"
  | "whatsapp"
  | "document_upload"
  | "document_analyzed"
  | "termin_created"
  | "termin_completed"
  | "rechnung_sent"
  | "rechnung_paid"
  | "mahnung_sent"
  | "akte_status_change"
  | "ai_strategy_generated"
  | "anwalt_note"
  | "mandant_status_change";

export interface Activity {
  id: string;
  tenant_id: string;
  mandant_id?: string;
  akte_id?: string;
  ts: string;
  type: ActivityType;
  actor: "ai" | "anwalt" | "mandant" | "system";
  actor_name: string;
  title: string;
  detail?: string;
  link_to?: { module: string; id: string };
}

export type StrategyStatus = "draft" | "review" | "freigegeben" | "veraltet";

export interface AnwaltsStrategie {
  id: string;
  tenant_id: string;
  akte_id: string;
  version: number;
  status: StrategyStatus;
  generated_by: "ai" | "anwalt";
  generated_at: string;
  modell?: string;
  konfidenz?: number;
  sections: {
    sachverhalt: string;
    rechtliche_einordnung: string;
    risiken: { titel: string; risiko: "low" | "medium" | "high"; detail: string }[];
    handlungsoptionen: { titel: string; pros: string[]; cons: string[]; empfehlung: boolean }[];
    empfohlene_strategie: string;
    schriftsatz_skizze?: string;
    naechste_schritte: { titel: string; bis: string }[];
  };
  iteration_prompt?: string;
}

export interface TeamMemberStats {
  user_id: string;
  aktive_mandate: number;
  pipeline_eur: number;
  auslastung_pct: number;
  ai_eskalationen_24h: number;
  reaktion_avg_min: number;
  erfolgsquote_pct: number;
  umsatz_ytd_eur: number;
}

// HR / Personal-Modul
export type ZeiterfassungArt = "billable" | "intern" | "training";

export interface Zeiterfassung {
  id: string;
  tenant_id: string;
  mitarbeiter_id: string;
  datum: string; // ISO date YYYY-MM-DD
  start: string; // HH:mm
  ende: string;
  dauer_min: number;
  akte_id?: string;
  mandant_id?: string;
  beschreibung?: string;
  art: ZeiterfassungArt;
  tarif_eur?: number;
  created_at: string;
}

export type UrlaubArt = "urlaub" | "krankheit" | "home_office" | "sonstiges";
export type UrlaubStatus = "pending" | "approved" | "rejected";

export interface UrlaubAntrag {
  id: string;
  tenant_id: string;
  mitarbeiter_id: string;
  von: string;
  bis: string;
  tage: number;
  art: UrlaubArt;
  status: UrlaubStatus;
  kommentar?: string;
  approver_id?: string;
  approved_at?: string;
  created_at: string;
}

export interface MitarbeiterKontingent {
  mitarbeiter_id: string;
  jahr: number;
  urlaubstage_total: number;
  urlaubstage_genommen: number;
  urlaubstage_offen: number;
  kranktage_genommen: number;
  ueberstunden_min: number;
  /** Frontend-computed (aus zeiterfassung der letzten 7 Tage); kann undefined sein wenn vom View geladen */
  ist_stunden_woche?: number;
  soll_stunden_woche: number;
}

// Plattform-Managed Integrations (NICHT BYO).
// SYSTEMS betreibt die Provider zentral; Kanzlei sieht keinen Provider-Namen
// und keine API-Keys.
export type IntegrationName = "voice" | "whatsapp" | "email" | "stripe";

export type ProvisionStatus = "not_provisioned" | "provisioning" | "active" | "suspended";
export type VerificationStatus = "pending" | "verified" | "failed";

export interface VoiceIntegration {
  enabled: boolean;
  /** Die KI-Telefonnummer der Kanzlei (international) */
  phone_number: string | null;
  /** Internal ID — vor User versteckt */
  phone_number_id: string | null;
  voice_id: string;
  greeting: string | null;
  provisioned_at: string | null;
  status: ProvisionStatus;
}

export interface WhatsappIntegration {
  enabled: boolean;
  /** Die WhatsApp-Business-Nummer der Kanzlei */
  phone_number: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  requested_at: string | null;
}

export interface EmailDnsRecord {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  value: string;
  ttl?: number;
}

export interface EmailIntegration {
  enabled: boolean;
  custom_domain: string | null;
  from_email: string | null;
  verification_status: VerificationStatus;
  dns_records: EmailDnsRecord[];
  verified_at: string | null;
}

export interface StripeIntegration {
  enabled: boolean;
  /** Connect-Account-ID — vor User versteckt, intern */
  connect_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  connected_at: string | null;
}

export interface ProviderConfig {
  voice: VoiceIntegration;
  whatsapp: WhatsappIntegration;
  email: EmailIntegration;
  stripe: StripeIntegration;
}

export interface IntegrationHealth {
  voice: {
    enabled: boolean;
    configured: boolean;
    phone_number: string | null;
    status: ProvisionStatus;
  };
  whatsapp: {
    enabled: boolean;
    configured: boolean;
    phone_number: string | null;
    verification_status: VerificationStatus;
  };
  email: {
    enabled: boolean;
    configured: boolean;
    custom_domain: string | null;
    from_email: string | null;
    verification_status: VerificationStatus;
  };
  stripe: {
    enabled: boolean;
    configured: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
  };
}
