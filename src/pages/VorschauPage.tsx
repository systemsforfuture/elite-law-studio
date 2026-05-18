/**
 * VorschauPage — /vorschau
 *
 * Personalisierte Kanzlei-Demo, aufgerufen via URL-Parameter aus der
 * JARVIS Sales-Email. Zeigt das vollständige KanzleiTemplate mit den
 * Daten der Ziel-Kanzlei.
 *
 * URL-Params:
 *   ?firma=Schalast+%26+Partner   → Kanzlei-Name
 *   ?ort=Frankfurt                 → Standort
 *   ?rechtsgebiet=Wirtschaftsrecht → Hauptrechtsgebiet
 *   ?anwaelte=22                   → Kanzlei-Größe
 *   ?domain=schalast.de            → Aktuelle Domain (für Vorher-Vergleich)
 *   ?lead=abc123                   → Lead-ID für Tracking
 *
 * Alle Params sind optional — Fallbacks greifen auf "Ihre Kanzlei".
 */

import { useSearchParams } from "react-router-dom";
import { createContext, useContext, useEffect } from "react";
import Navbar from "@/components/kanzlei-template/Navbar";
import Hero from "@/components/kanzlei-template/Hero";
import PainPoints from "@/components/kanzlei-template/PainPoints";
import PracticeAreas from "@/components/kanzlei-template/PracticeAreas";
import CaseResults from "@/components/kanzlei-template/CaseResults";
import Process from "@/components/kanzlei-template/Process";
import Comparison from "@/components/kanzlei-template/Comparison";
import Testimonials from "@/components/kanzlei-template/Testimonials";
import About from "@/components/kanzlei-template/About";
import Team from "@/components/kanzlei-template/Team";
import Trust from "@/components/kanzlei-template/Trust";
import CtaBanner from "@/components/kanzlei-template/CtaBanner";
import Faq from "@/components/kanzlei-template/Faq";
import Contact from "@/components/kanzlei-template/Contact";
import Footer from "@/components/kanzlei-template/Footer";
import StickyCta from "@/components/kanzlei-template/StickyCta";
import ExitIntent from "@/components/kanzlei-template/ExitIntent";
import SystemsBadge from "@/components/kanzlei-template/SystemsBadge";

// ── Preview Config Context ────────────────────────────────────────────────────

export interface KanzleiTeamMember {
  name: string;
  role: string;
  image?: string;
  specialties: string[];
  quote: string;
}

export interface KanzleiTestimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  image: string;
  caseType: string;
  verified: boolean;
  date: string;
  platform: string;
}

export interface KanzleiContact {
  address_line: string;
  city_line: string;
  phone: string;
  email: string;
  hours: string;
}

export interface KanzleiConfig {
  firma: string;
  ort: string;
  rechtsgebiet: string;
  anwaelte: number;
  domain: string | null;
  leadId: string | null;
  isPreview: boolean;
  /** Anzeigename im Footer-Logo (UPPERCASE) */
  display_name: string;
  /** Anzeigename im Copyright-Footer */
  copyright_name: string;
  /** Brand-Name für Headlines wie "Mit X" / "Ihr Vorteil mit X" */
  brand_with: string;
  /** Spezialisierung-Untertitel (Footer) */
  footer_tagline: string;
  /** Liste der Rechtsgebiete (Footer-Spalte) */
  rechtsgebiete: string[];
  /** Kontakt-Daten (Footer + Contact-Section) */
  contact: KanzleiContact;
  /** Team-Mitglieder (Team-Section) */
  team: KanzleiTeamMember[];
  /** Mandanten-Testimonials (Testimonials-Section) */
  testimonials: KanzleiTestimonial[];
}

const DEFAULT_CONTACT: KanzleiContact = {
  address_line: "Friedrichstraße 123",
  city_line: "10117 Berlin",
  phone: "+49 30 123 456 78",
  email: "info@kanzlei-bergmann.de",
  hours: "Mo–Fr: 09:00 – 18:00 Uhr",
};

const DEFAULT_TEAM: KanzleiTeamMember[] = [
  {
    name: "Dr. Alexander Bergmann",
    role: "Gründungspartner · Fachanwalt für Handelsrecht",
    specialties: ["Unternehmensrecht", "M&A", "Gesellschaftsrecht"],
    quote: "Ihr Recht ist keine Verhandlungssache.",
  },
  {
    name: "Dr. Katharina Weber",
    role: "Partnerin · Fachanwältin für Familienrecht",
    specialties: ["Familienrecht", "Erbrecht", "Mediation"],
    quote: "Familien verdienen Lösungen, keine Schlachtfelder.",
  },
  {
    name: "Maximilian Richter",
    role: "Senior Associate · Fachanwalt für Arbeitsrecht",
    specialties: ["Arbeitsrecht", "Kündigungsschutz", "Abfindungen"],
    quote: "Kein Arbeitnehmer sollte Unrecht hinnehmen.",
  },
  {
    name: "Dr. Sophie Müller",
    role: "Partnerin · Fachanwältin für Strafrecht",
    specialties: ["Strafrecht", "Wirtschaftsstrafrecht", "Compliance"],
    quote: "Jeder verdient eine Verteidigung auf Augenhöhe.",
  },
];

const DEFAULT_TESTIMONIALS: KanzleiTestimonial[] = [
  {
    name: "Dr. Michael Schneider",
    role: "Geschäftsführer, Schneider GmbH",
    text: "Unsere Kanzlei hat unsere Unternehmensrestrukturierung mit beeindruckender Expertise begleitet. Die strategische Beratung war erstklassig – wir konnten über 2,3 Mio. Euro sichern.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/42.jpg",
    caseType: "Unternehmensrecht",
    verified: true,
    date: "vor 2 Wochen",
    platform: "Google",
  },
  {
    name: "Sarah Keller",
    role: "Marketing Direktorin",
    text: "Nach meiner Kündigung fühlte ich mich hilflos. Mein Anwalt hat nicht nur eine faire Abfindung von 85.000€ verhandelt, sondern mir auch menschlich Halt gegeben. Absolute Empfehlung.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    caseType: "Arbeitsrecht",
    verified: true,
    date: "vor 1 Monat",
    platform: "Google",
  },
  {
    name: "Thomas Braun",
    role: "Unternehmer",
    text: "Die Erbschaftsangelegenheit unserer Familie war komplex und emotional. Mit Fingerspitzengefühl wurde eine Lösung gefunden, die alle Seiten zufriedenstellt.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/55.jpg",
    caseType: "Erbrecht",
    verified: true,
    date: "vor 3 Wochen",
    platform: "Google",
  },
  {
    name: "Anna-Lena Fischer",
    role: "Ärztin, Praxisinhaberin",
    text: "Bei meinem Mietrechtsstreit ging es um meine Praxisräume – meine Existenz. Mein Anwalt hat vor Gericht alles gegeben und gewonnen. Professionell, schnell, souverän.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    caseType: "Immobilienrecht",
    verified: true,
    date: "vor 5 Tagen",
    platform: "Google",
  },
];

const DEFAULT_CONFIG: KanzleiConfig = {
  firma: "Ihre Kanzlei",
  ort: "Deutschland",
  rechtsgebiet: "Wirtschaftsrecht",
  anwaelte: 15,
  domain: null,
  leadId: null,
  isPreview: false,
  display_name: "KANZLEI BERGMANN",
  copyright_name: "Kanzlei Bergmann",
  footer_tagline:
    "Ihre vertrauenswürdige Kanzlei für Familienrecht, Arbeitsrecht und Vertragsrecht seit 1998.",
  brand_with: "Kanzlei Bergmann",
  rechtsgebiete: ["Familienrecht", "Arbeitsrecht", "Vertragsrecht", "Erbrecht"],
  contact: DEFAULT_CONTACT,
  team: DEFAULT_TEAM,
  testimonials: DEFAULT_TESTIMONIALS,
};

export const KanzleiConfigContext = createContext<KanzleiConfig>(DEFAULT_CONFIG);
export const useKanzleiConfig = () => useContext(KanzleiConfigContext);

// ── Preview Banner ────────────────────────────────────────────────────────────

function PreviewBanner({ config }: { config: KanzleiConfig }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "linear-gradient(90deg, #0E9FB8, #085461)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 20px",
      fontSize: "13px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontWeight: 700, letterSpacing: "0.05em" }}>SYSTEMS™</span>
        <span style={{ opacity: 0.7 }}>·</span>
        <span>
          Ihre personalisierte Demo für{" "}
          <strong>{config.firma}</strong>
          {config.ort !== "Deutschland" ? `, ${config.ort}` : ""}
        </span>
        <span style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: "99px",
          padding: "2px 10px",
          fontSize: "11px",
        }}>
          {config.rechtsgebiet}
        </span>
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <a
          href="mailto:systems.future@pm.me?subject=Preise%20Anfrage"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            transition: "background 0.15s",
          }}
        >
          → Preise ansehen
        </a>
        <a
          href="mailto:systems.future@pm.me?subject=Anfrage%20SYSTEMS%20Demo"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#fff",
            color: "#0E9FB8",
            textDecoration: "none",
            borderRadius: "8px",
            padding: "6px 16px",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          15 Min Demo buchen
        </a>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const VorschauPage = () => {
  const [searchParams] = useSearchParams();

  const firma = decodeURIComponent(searchParams.get("firma") ?? "Ihre Kanzlei");
  const ort = decodeURIComponent(searchParams.get("ort") ?? "Deutschland");
  const rechtsgebiet = decodeURIComponent(searchParams.get("rechtsgebiet") ?? "Wirtschaftsrecht");
  const anwaelte = (() => { const n = parseInt(searchParams.get("anwaelte") ?? "15", 10); return isNaN(n) || n < 1 ? 15 : n; })();

  const config: KanzleiConfig = {
    firma,
    ort,
    rechtsgebiet,
    anwaelte,
    domain: searchParams.get("domain"),
    leadId: searchParams.get("lead"),
    isPreview: true,
    // In preview-mode generic strings ablöst durch Lead-Daten,
    // damit kein "Bergmann"-Residue auf personalisierter Lead-Seite.
    display_name: firma.toUpperCase(),
    copyright_name: firma,
    brand_with: firma,
    footer_tagline: `Ihre Kanzlei für ${rechtsgebiet} in ${ort}.`,
    rechtsgebiete: DEFAULT_CONFIG.rechtsgebiete,
    contact: DEFAULT_CONFIG.contact,
    team: DEFAULT_CONFIG.team,
    testimonials: DEFAULT_CONFIG.testimonials,
  };

  // Track preview view for JARVIS lead pipeline
  const leadId = searchParams.get("lead")
  useEffect(() => {
    const apiBase =
      import.meta.env.VITE_JARVIS_API_URL ??
      (window.location.hostname.endsWith("trycloudflare.com") ? window.location.origin : "");

    if (leadId && apiBase) {
      fetch(`${apiBase.replace(/\/$/u, "")}/api/leads/preview-view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, firma }),
      }).catch(() => {/* non-critical — tracking, not blocking */});
    }
    document.title = `${config.firma} — Ihre neue Kanzlei-Website | SYSTEMS™ Demo`;
  }, [leadId, firma]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <KanzleiConfigContext.Provider value={config}>
      <PreviewBanner config={config} />
      {/* Push content below the fixed banner */}
      <div style={{ paddingTop: "44px" }}>
        <Navbar />
        <Hero />
        <PainPoints />
        <PracticeAreas />
        <CaseResults />
        <Process />
        <Comparison />
        <Testimonials />
        <About />
        <Team />
        <Trust />
        <CtaBanner />
        <Faq />
        <Contact />
        <Footer />
        <StickyCta />
        <ExitIntent />
        <SystemsBadge />
      </div>
    </KanzleiConfigContext.Provider>
  );
};

export default VorschauPage;
