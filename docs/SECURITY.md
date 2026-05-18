# SYSTEMS™ — Sicherheits-Architektur

## Mandatsgeheimnis-konforme E2E-Verschlüsselung

SYSTEMS™ ermöglicht Kanzleien, die sensibelsten Felder client-side
zu verschlüsseln — auch wir als Plattform-Betreiber können diese
Daten nicht lesen. Damit erfüllen wir §203 StGB im Hinblick auf
„Hilfsperson eines Berufsgeheimnisträgers" (Cloud-Anbieter) wirklich
strukturell, nicht nur durch Vertragsklauseln.

### Welche Felder werden verschlüsselt

Wenn der Owner E2E aktiviert hat:

| Tabelle / Feld | Inhalt | Plain-Fallback wenn E2E aus |
|---|---|---|
| `anwalts_strategien.sections_cipher` | KI-/Anwalts-Strategien (Sachverhalt, Risiken, Handlungsoptionen, Schriftsatz-Skizze) | `sections` |
| `mandanten.notes_preview_cipher` | KI-Zusammenfassung des Mandats | `notes_preview` |
| `akten.beschreibung_cipher` | Akten-Beschreibung | `beschreibung` |
| `akten.next_step_cipher` | nächste Schritte | `next_step` |

**Was NICHT verschlüsselt wird** (und warum):
- `mandanten.vorname`, `nachname`, `firmenname`, `email`, `telefon` —
  Voice-KI muss diese im Anruf nachschlagen können (`lookup_mandant`).
- `aktenzeichen`, `termin_titel`, `rechnungsnummer` — werden für
  PDFs, Kalender, Buchhaltung gebraucht; nicht juristisch sensibel.
- `konversationen.preview`, `transcript`, `recording_url` — sind
  schon Anrufer-Eingaben (kein Mandant-Geheimnis im engen Sinn) und
  KI-Auswertung würde verlieren wenn verschlüsselt.

### Krypto-Stack

| Schicht | Algorithmus | Parameter |
|---|---|---|
| Passphrase → Master | PBKDF2-SHA-256 | 600.000 Iterationen, 16-Byte Salt |
| Master ↔ DEK | AES-GCM 256 | Random 12-Byte IV beim Wrap |
| Feld ↔ DEK | AES-GCM 256 | Random 12-Byte IV pro Feld |
| Recovery-Code | 12 Wörter aus 256-Wort-Liste | ~96 Bit Entropie |

Implementation: `src/lib/encryption.ts` über die Web-Crypto-API
(`SubtleCrypto`). Keine Drittanbieter-Crypto-Lib.

### Schlüssel-Hierarchie

```
                    Passphrase (Owner-Memory)
                            ↓ PBKDF2 600k
                       Master-Key  ─────────────────────┐
                            │                            │
                            ↓ AES-GCM unwrap             │
                                                          │
   ┌─────────────────────  DEK  ────────────────────────┐
   │                  (256-bit, in Browser-Memory)       │
   │                                                     │
   │   AES-GCM(plain, DEK, random IV) → cipher + IV     │
   ▼                                                     │
 sections_cipher    notes_preview_cipher    beschreibung_cipher
                                                          │
                            ↑ AES-GCM unwrap (alternativ) │
                       Recovery-Master ───────────────────┘
                            ↑ PBKDF2 600k
                   12-Wort Recovery-Code (auf Papier)
```

### Was passiert wo

| Aktion | Ort |
|---|---|
| Passphrase setzen | Owner-Browser (Memory) |
| Master-Key ableiten | Owner-Browser (Memory) |
| DEK erzeugen | Owner-Browser (Memory) |
| `encrypted_dek` in DB schreiben | Server (sieht nur Ciphertext) |
| Feld vor Save verschlüsseln | Owner-Browser (Memory) |
| Feld nach Read entschlüsseln | Owner-Browser (Memory) |
| KI generiert Strategie | Server schreibt PLAINTEXT in `sections` → Browser verschlüsselt beim ersten Anwalts-Edit, plain wird gelöscht |

### Recovery-Story

Beim Setup zeigt SYSTEMS dem Owner einen 12-Wort-Code. Diesen
**muss** er ausdrucken oder im Tresor verwahren — SYSTEMS hat
ihn nicht in der DB, nur seinen mit dem Code gewrappten DEK.

| Szenario | Lösung |
|---|---|
| Passphrase vergessen, Recovery-Code vorhanden | Unlock-Dialog → »Recovery-Code« → neue Passphrase setzen |
| Passphrase + Recovery weg | Daten sind weg. **Das ist Feature, nicht Bug** — sonst wäre E2E sinnlos |
| Owner-Wechsel in Kanzlei | Alter Owner muss Passphrase an neuen weitergeben ODER vor seinem Ausstieg neu wrappen lassen |
| Kanzlei verkauft | Käufer kriegt Passphrase + Recovery; Plattform hat keinen Backup |

### Was wir als Plattform NICHT können

- Verschlüsselte Felder entschlüsseln. Auch nicht mit Server-Zugriff.
- Passphrase wiederherstellen. SYSTEMS sieht nie eine Passphrase im
  Klartext (nur den gewrappten DEK).
- Anwalt's E2E zwangsweise deaktivieren — das einzige was wir
  könnten ist die Zeilen löschen. Ein neuer Schlüssel würde die alten
  Cipher unbrauchbar machen.

### Was Audit-Logging sieht

Audit-Events der Form
`entity_type=e2e_setup` / `e2e_unlock` / `e2e_passphrase_changed`
werden geschrieben. Sie enthalten Timestamp + user_id. Sie enthalten
**niemals** Passphrase, Recovery-Code, DEK oder dechiffrierte Inhalte.

### KI-Funktionen + E2E

Edge Functions wie `generate-strategie` laufen serverseitig und können
verschlüsselte Felder nicht lesen. Lösung:

1. KI generiert Strategie → schreibt sie als **plain** in `sections`.
2. Owner öffnet die Strategie → Frontend liest plain, zeigt sie an.
3. Beim ersten Edit/Save → Frontend verschlüsselt in `sections_cipher`,
   setzt `sections = null` via UPDATE.

Damit ist die Strategie **ab dem ersten Speichern verschlüsselt**.
Wer mit „echter Zero-Knowledge" leben will, muss die KI client-side
aufrufen (Anthropic-API direkt vom Browser; das ist möglich, kostet
aber den Server-Side-Streaming-Vorteil).

### Bedrohungsmodell

| Angreifer | Schutz? |
|---|---|
| Datenbank-Leak (Supabase RLS umgangen) | ✅ Ciphertext ohne DEK ist nutzlos |
| Bösartiger SYSTEMS-Admin | ✅ Hat keinen Master-Key |
| Browser-Memory-Dump (Forensik des Owner-PCs) | ⚠️ DEK in RAM während Session — lock when idle einbauen |
| Phishing der Passphrase | ❌ Wie bei jedem Passwort. 2FA für Login schiebt das vor |
| Quanten-Computer (Shor) | ❌ AES-GCM hält Quanten-Brute-Force allerdings stand (Grover halbiert Bit-Sicherheit, 128-Bit GCM bleibt sicher) |
| Server-Side-Code-Injection (NPM Supply-Chain) | ⚠️ Bei kompromittiertem JS-Bundle könnte Passphrase abgegriffen werden. SRI-Pinning + CSP empfohlen |

### Compliance-Mapping

| Regel | Wie erfüllt |
|---|---|
| §203 StGB | Plattform-Betreiber ist nicht „Hilfsperson", da er sensible Daten technisch nicht lesen kann |
| DSGVO Art. 32 (Stand der Technik) | AES-GCM-256 + 600k PBKDF2 entspricht NIST SP 800-132 |
| DSGVO Art. 25 (Privacy by Design) | Default-aus erlaubt schnellen Onboarding, aber Setup ist 1-Klick |
| BAK-Berufsordnung | Geheimnisschutz strukturell, nicht nur durch AVV |

### Aktivierung

Owner-Anwalt klickt auf das Schloss-Icon im Dashboard-Header → 4-Step-Wizard:
1. Intro + Risiko-Hinweis
2. Passphrase setzen (Strength-Meter)
3. Recovery-Code anzeigen (kopieren + drucken)
4. Recovery-Code zur Bestätigung erneut eintippen

Beim nächsten Login: Unlock-Dialog mit Passphrase (oder Recovery).
DEK bleibt in Memory für die Tab-Lebenszeit — kein localStorage.
