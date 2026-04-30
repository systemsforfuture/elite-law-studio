import LegalPage from "./LegalPage";

const Datenschutz = () => (
  <LegalPage
    title="Datenschutzerklärung"
    subtitle="Information nach Art. 13, 14 DSGVO über die Verarbeitung personenbezogener Daten."
    lastUpdated="April 2026"
  >
    <h2>1. Verantwortlicher</h2>
    <p>
      Verantwortlich für die Verarbeitung personenbezogener Daten im Rahmen
      dieser Website und der SYSTEMS™ Anwalts-Plattform ist:
    </p>
    <p>
      <strong>SYSTEMS LLC</strong>
      <br />
      E-Mail:{" "}
      <a href="mailto:systems.future@pm.me">systems.future@pm.me</a>
    </p>

    <h2>2. Datenverarbeitung im Überblick</h2>
    <p>
      SYSTEMS™ ist eine Software-as-a-Service-Plattform, die ausschließlich an
      Rechtsanwältinnen und Rechtsanwälte sowie Anwaltskanzleien (B2B)
      vertrieben wird. Wir verarbeiten personenbezogene Daten in zwei klar
      getrennten Rollen:
    </p>
    <ul>
      <li>
        <strong>Als Verantwortlicher</strong> – für eigene Zwecke (Marketing-
        und Vertragsverhältnis mit Kanzleien, Website-Besuche, Support).
      </li>
      <li>
        <strong>Als Auftragsverarbeiter</strong> nach Art. 28 DSGVO – für
        Mandantendaten, die unsere Kanzlei-Kunden im Rahmen der Plattform
        verarbeiten. Hierfür schließen wir einen separaten
        Auftragsverarbeitungs-Vertrag (AVV).
      </li>
    </ul>

    <h2>3. Hosting & Standort</h2>
    <p>
      Alle personenbezogenen Daten werden ausschließlich auf Servern innerhalb
      der Europäischen Union gehostet (Frankfurt am Main, Deutschland).
      Es findet kein Transfer in Drittländer statt, der über die
      ausdrücklich in der Auftragsverarbeitung dokumentierten Subprozessoren
      hinausgeht.
    </p>

    <h2>4. Erhobene Daten beim Website-Besuch</h2>
    <p>
      Beim Aufruf unserer Website werden technisch notwendige Server-Logfiles
      verarbeitet (anonymisierte IP, User-Agent, Zeitstempel, Referrer). Diese
      Daten werden nach 14 Tagen gelöscht, sofern keine Sicherheitsvorfälle
      eine längere Speicherung erforderlich machen. Rechtsgrundlage:{" "}
      <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse an
      einem stabilen, sicheren Betrieb).
    </p>

    <h2>5. Kontaktaufnahme</h2>
    <p>
      Wenn Sie uns per E-Mail oder über das Kontaktformular kontaktieren,
      verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage und für den
      Fall von Anschlussfragen. Rechtsgrundlage:{" "}
      <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (vorvertragliche Maßnahmen)
      bzw. <strong>lit. f</strong> (berechtigtes Interesse an effizienter
      Anfrage-Bearbeitung).
    </p>

    <h2>6. Plattform-Nutzung durch Kanzleien</h2>
    <p>
      Im Rahmen des Live-Betriebs der Plattform verarbeiten wir Daten der
      Kanzlei (Stammdaten, Abrechnungsdaten, Nutzungs-Telemetrie) sowie
      Mandantendaten der Kanzlei. Letztere werden ausschließlich nach Weisung
      der Kanzlei verarbeitet (Auftragsverarbeitung, siehe AVV).
    </p>
    <p>
      Wir setzen technische und organisatorische Maßnahmen ein, um die
      Vertraulichkeit (Mandantengeheimnis nach <strong>§ 43e BRAO</strong>),
      Integrität und Verfügbarkeit der Daten sicherzustellen. Hierzu gehören
      insbesondere Verschlüsselung in Transit (TLS 1.3) und at Rest (AES-256),
      Multi-Tenant-Isolation auf Datenbankebene (Row-Level Security),
      Zugriffsprotokollierung und Beschlagnahmefreiheit nach § 160a StPO.
    </p>

    <h2>7. KI-Verarbeitung</h2>
    <p>
      Unsere Plattform nutzt Sprachmodelle für Triage-, Voice- und
      Dokumentenanalyse-Aufgaben. Inhalte werden{" "}
      <strong>nicht zum Training</strong> der Modelle verwendet. Anbieter und
      Subprozessoren sind im AVV transparent aufgeführt; eine Verarbeitung
      findet auf EU-Servern oder unter EU-Standardvertragsklauseln statt.
    </p>

    <h2>8. Speicherdauer</h2>
    <ul>
      <li>Server-Logs: 14 Tage</li>
      <li>Kontaktanfragen: 12 Monate nach Abschluss der Bearbeitung</li>
      <li>
        Plattformdaten der Kanzlei: für die Dauer des Vertragsverhältnisses,
        anschließend nach Weisung (i.d.R. 30 Tage Aufbewahrung, dann
        Löschung), unter Beachtung gesetzlicher Aufbewahrungspflichten
      </li>
      <li>
        Buchhaltungsrelevante Daten: 10 Jahre (§ 147 AO, § 257 HGB analog)
      </li>
    </ul>

    <h2>9. Ihre Rechte</h2>
    <p>
      Sie haben jederzeit das Recht auf Auskunft (Art. 15), Berichtigung
      (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
      Datenübertragbarkeit (Art. 20) sowie Widerspruch (Art. 21 DSGVO).
      Anfragen richten Sie bitte an{" "}
      <a href="mailto:systems.future@pm.me">systems.future@pm.me</a>.
    </p>
    <p>
      Es besteht zudem ein Beschwerderecht bei der zuständigen
      Datenschutzaufsichtsbehörde (Art. 77 DSGVO).
    </p>

    <h2>10. Cookies & Tracking</h2>
    <p>
      Diese Website setzt ausschließlich technisch notwendige Cookies ein, die
      für den Betrieb erforderlich sind. Es findet kein
      Drittanbieter-Tracking, kein Profiling und keine Nutzung von
      Werbe-Pixeln statt.
    </p>

    <h2>11. Änderungen</h2>
    <p>
      Wir passen diese Datenschutzerklärung an, sobald sich die rechtlichen
      Rahmenbedingungen oder die Datenverarbeitung ändern. Die jeweils aktuelle
      Version finden Sie auf dieser Seite.
    </p>
  </LegalPage>
);

export default Datenschutz;
