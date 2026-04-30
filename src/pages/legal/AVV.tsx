import LegalPage from "./LegalPage";

const AVV = () => (
  <LegalPage
    title="Auftragsverarbeitungs-Vertrag"
    subtitle="AVV nach Art. 28 DSGVO zwischen Kanzlei (Verantwortlicher) und SYSTEMS LLC (Auftragsverarbeiter)."
    lastUpdated="April 2026"
  >
    <h2>Präambel</h2>
    <p>
      Dieser Auftragsverarbeitungs-Vertrag (nachfolgend „AVV") konkretisiert
      die datenschutzrechtlichen Verpflichtungen der Parteien, die sich aus
      der Nutzung der SYSTEMS™ Anwalts-Plattform ergeben. Verantwortlicher
      i. S. d. Art. 4 Nr. 7 DSGVO ist die Kanzlei; Auftragsverarbeiterin
      i. S. d. Art. 4 Nr. 8 DSGVO ist die <strong>SYSTEMS LLC</strong>.
    </p>

    <h2>§ 1 Gegenstand und Dauer</h2>
    <p>
      Gegenstand des Auftrags ist die Verarbeitung personenbezogener Daten
      (insbesondere Mandantendaten) im Rahmen der Plattform-Nutzung. Die
      Dauer entspricht der Laufzeit des Hauptvertrags.
    </p>

    <h2>§ 2 Art und Zweck der Verarbeitung</h2>
    <ul>
      <li>Speicherung, Strukturierung, Anzeige von Mandanten- und Aktendaten</li>
      <li>
        Automatisierte Verarbeitung eingehender Kommunikation
        (Voice-Transkription, E-Mail-Triage, WhatsApp-Inbox)
      </li>
      <li>Dokumenten-Analyse mittels KI-Modellen</li>
      <li>Termin-, Fristen- und Mahnwesen-Verwaltung</li>
      <li>Bereitstellung des Mandanten-Portals</li>
    </ul>

    <h2>§ 3 Art der Daten und Kategorien Betroffener</h2>
    <ul>
      <li>
        <strong>Datenarten</strong>: Stammdaten (Name, Anschrift, Kontakt),
        Kommunikationsdaten, Dokumente, Termine, Abrechnungsdaten,
        ggf. besondere Kategorien personenbezogener Daten gem. Art. 9 DSGVO
        (z. B. im Rahmen anwaltlicher Mandate).
      </li>
      <li>
        <strong>Betroffene</strong>: Mandanten der Kanzlei, Gegner,
        Anspruchsgegner, Zeugen, Mitarbeiter der Kanzlei, sonstige am Mandat
        Beteiligte.
      </li>
    </ul>

    <h2>§ 4 Pflichten des Auftragsverarbeiters</h2>
    <ol>
      <li>
        Verarbeitung ausschließlich auf dokumentierte Weisung des
        Verantwortlichen.
      </li>
      <li>
        Verpflichtung aller mit der Verarbeitung befassten Personen auf
        Vertraulichkeit (Art. 28 Abs. 3 lit. b DSGVO).
      </li>
      <li>
        Umsetzung geeigneter technischer und organisatorischer Maßnahmen nach
        Art. 32 DSGVO (siehe § 7).
      </li>
      <li>
        Unterstützung des Verantwortlichen bei Betroffenenrechten (Auskunft,
        Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit,
        Widerspruch).
      </li>
      <li>
        Meldung von Datenpannen an den Verantwortlichen unverzüglich, in der
        Regel innerhalb von 24 Stunden nach Kenntniserlangung.
      </li>
      <li>
        Unterstützung bei Datenschutz-Folgenabschätzungen nach Art. 35 DSGVO.
      </li>
    </ol>

    <h2>§ 5 Subprozessoren</h2>
    <p>
      Der Verantwortliche stimmt dem Einsatz folgender Subprozessoren zu.
      Sämtliche Subprozessoren wurden nach Art. 28 Abs. 4 DSGVO sorgfältig
      ausgewählt und vertraglich verpflichtet.
    </p>
    <ul>
      <li>
        <strong>EU-Cloud-Hosting</strong> (Server-Standort Frankfurt, DE) –
        Infrastruktur, Datenbank, Storage
      </li>
      <li>
        <strong>EU-Voice-Provider</strong> – Telefonie und Sprachverarbeitung
        für den Voice-Agent
      </li>
      <li>
        <strong>EU-WhatsApp-Business-Provider</strong> – Messaging-API
      </li>
      <li>
        <strong>KI-Modell-Anbieter</strong> – Sprachmodelle ohne Training auf
        Kundendaten, Verarbeitung in der EU oder unter
        EU-Standardvertragsklauseln
      </li>
      <li>
        <strong>Zahlungsdienstleister</strong> – Abrechnung der
        Plattform-Lizenzen
      </li>
    </ul>
    <p>
      Eine aktuelle, vollständige Subprozessoren-Liste wird im
      Kanzlei-Dashboard bereitgestellt. Änderungen werden mit einer Frist
      von 30 Tagen vorab angekündigt; der Verantwortliche kann widersprechen,
      was ein Sonderkündigungsrecht begründet.
    </p>

    <h2>§ 6 Ort der Verarbeitung</h2>
    <p>
      Die Verarbeitung erfolgt ausschließlich innerhalb der Europäischen
      Union bzw. des Europäischen Wirtschaftsraums. Eine Übermittlung in
      Drittländer findet nur unter den Voraussetzungen der Art. 44 ff.
      DSGVO statt.
    </p>

    <h2>§ 7 Technisch-organisatorische Maßnahmen (TOM)</h2>
    <ul>
      <li>
        <strong>Vertraulichkeit</strong>: Zutritts-, Zugangs- und
        Zugriffskontrolle, Multi-Faktor-Authentifizierung, rollenbasiertes
        Berechtigungssystem, Multi-Tenant-Isolation auf DB-Ebene
        (Row-Level Security).
      </li>
      <li>
        <strong>Integrität</strong>: Verschlüsselung in Transit (TLS 1.3),
        at Rest (AES-256), revisionssicheres Audit-Log,
        Eingabekontroll-Protokollierung.
      </li>
      <li>
        <strong>Verfügbarkeit</strong>: Tägliche verschlüsselte Backups,
        georedundante Sicherung innerhalb der EU, Disaster-Recovery-Plan,
        regelmäßige Restore-Tests.
      </li>
      <li>
        <strong>Belastbarkeit</strong>: Monitoring, Lasttests, Schutz vor
        DDoS- und Brute-Force-Angriffen.
      </li>
      <li>
        <strong>Beschlagnahmefreiheit</strong>: Architektur und Vertragslage
        nach <strong>§ 160a StPO</strong> i. V. m. § 53 StPO.
      </li>
      <li>
        <strong>Schulung</strong>: Verpflichtung und regelmäßige
        Datenschutz-Schulung aller Mitarbeiter.
      </li>
    </ul>

    <h2>§ 8 Kontroll- und Auditrechte</h2>
    <p>
      Der Verantwortliche kann die Einhaltung dieses AVV überprüfen.
      Vor-Ort-Audits sind nach angemessener Vorankündigung (mind. 30 Tage)
      möglich. Vorrangig stellt SYSTEMS aktuelle Zertifikate und
      Prüfberichte (z. B. ISO 27001 in Vorbereitung) zur Verfügung.
    </p>

    <h2>§ 9 Löschung & Rückgabe</h2>
    <p>
      Nach Beendigung des Hauptvertrags werden alle personenbezogenen Daten
      auf Weisung des Verantwortlichen herausgegeben (strukturierter Export)
      oder gelöscht. Die Löschung erfolgt spätestens 30 Tage nach
      Vertragsende, sofern keine gesetzlichen Aufbewahrungspflichten
      entgegenstehen. Die Löschung wird auf Anforderung dokumentiert.
    </p>

    <h2>§ 10 Anwaltliches Berufsgeheimnis</h2>
    <p>
      SYSTEMS erkennt das anwaltliche Berufsgeheimnis nach{" "}
      <strong>§ 43a Abs. 2 BRAO</strong> und{" "}
      <strong>§ 43e BRAO</strong> an. Sämtliche Mitarbeiter, die im Auftrag
      mit Daten in Berührung kommen können, sind ausdrücklich zur
      Verschwiegenheit verpflichtet.
    </p>

    <h2>§ 11 Schlussbestimmungen</h2>
    <p>
      Sollten einzelne Bestimmungen dieses AVV unwirksam sein, bleibt die
      Wirksamkeit der übrigen Bestimmungen unberührt. Es gilt das Recht der
      Bundesrepublik Deutschland.
    </p>

    <p>
      Bei Fragen zur Auftragsverarbeitung erreichen Sie uns unter{" "}
      <a href="mailto:systems.future@pm.me">systems.future@pm.me</a>.
    </p>
  </LegalPage>
);

export default AVV;
