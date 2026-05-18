# REFACTOR_PLAN — Hardcoded Bergmann-Strings → KanzleiConfig

**Status:** Phase 1 abgeschlossen — kanzlei-template Components nutzen jetzt `useKanzleiConfig()` statt hardcoded Bergmann-Strings.

## Problem

Der S&R-Skill hat das Lead-Repo `systemsforfuture/itmr-rechtsanwalte` generiert; die
LIVE-Page (https://systemsforfuture.github.io/itmr-rechtsanwalte/) zeigt aber noch
Bergmann-Residue:

- "Bergmann ist Fachanwalt für Erbrecht"
- "Bergmann: Bitte bringen Sie zu unserem Termin..."
- "voice_bergmann_clone_v2"

Root cause: 230+ hardcoded Strings über 10+ Files, die NICHT aus zentraler
Tenant-Quelle gelesen wurden.

## Was wurde refactored (Phase 1) — abgeschlossen

### Zentrale Config-Quelle erweitert

**`src/pages/VorschauPage.tsx`** — `KanzleiConfig` Interface um folgende Felder erweitert:

- `display_name` (string) — Footer-Logo (UPPERCASE)
- `copyright_name` (string) — Footer-Copyright
- `brand_with` (string) — Headlines wie "Mit X" / "Ihr Vorteil mit X"
- `footer_tagline` (string) — Untertitel-Beschreibung im Footer
- `rechtsgebiete` (string[]) — Footer-Spalte Rechtsgebiete
- `contact` ({ address_line, city_line, phone, email, hours }) — Kontaktdaten
- `team` (KanzleiTeamMember[]) — Team-Mitglieder mit Name, Rolle, Specialties, Quote
- `testimonials` (KanzleiTestimonial[]) — 4 Mandanten-Testimonials

`DEFAULT_CONFIG` behält Bergmann-Werte als Dev-Default (Kanzlei Bergmann, Friedrichstr. 123, etc.) — Dashboard/Dev-Verhalten unverändert.

`VorschauPage` (URL-Params-Modus) überschreibt im Preview-Mode `display_name`, `copyright_name`, `brand_with`, `footer_tagline` mit Lead-Daten — und behält generische
Defaults für team/testimonials/contact (denn die kennt der Lead-Skill noch nicht).

### Components umgestellt auf useKanzleiConfig()

| Datei | Was geändert |
|---|---|
| `src/components/kanzlei-template/Footer.tsx` | `display_name`, `copyright_name`, `footer_tagline`, `rechtsgebiete`, `contact` aus Config |
| `src/components/kanzlei-template/Contact.tsx` | Phone/Mail/Address aus `config.contact` |
| `src/components/kanzlei-template/Trust.tsx` | Headline-Brand aus `config.brand_with` |
| `src/components/kanzlei-template/Comparison.tsx` | Headline "Mit X" aus `config.brand_with` |
| `src/components/kanzlei-template/SystemsBadge.tsx` | "White-Label-Funnel für X" aus `config.brand_with` |
| `src/components/kanzlei-template/Team.tsx` | Team-Array aus `config.team`, Fallback-Images für Dev |
| `src/components/kanzlei-template/Testimonials.tsx` | Testimonials aus `config.testimonials` |

**Build-Verifikation:** `npx vite build --base=/test-build/` läuft grün durch.

## Was noch zu tun ist (Phase 2 — für Lead-Repo-Personalisierung)

### Lead-Repo Override-Mechanismus

Damit der S&R-Skill ein generiertes Lead-Repo (z.B. `itmr-rechtsanwalte`)
ohne Bergmann-Residue ausliefern kann, fehlt noch:

**Option A — Static JSON-Override (empfohlen für GitHub-Pages):**

1. `src/pages/KanzleiTemplate.tsx` erweitern: lädt optional `/kanzlei.config.json` von public/ via fetch
2. Wenn vorhanden → mergt es in DEFAULT_CONFIG und wrapped Children in `KanzleiConfigContext.Provider`
3. Lead-Repo packt eine `public/kanzlei.config.json` mit lead-spezifischen Werten

**Option B — Build-Time-Env (komplexer):**

1. `VITE_KANZLEI_FIRMA`, `VITE_KANZLEI_EMAIL` etc als Env-Variables
2. `DEFAULT_CONFIG` liest aus `import.meta.env` mit Fallback

### Andere Files mit Bergmann-Residue (außerhalb kanzlei-template)

Diese sind NICHT live-kritisch (interne Demo-/Dev-Bereiche), können aber später
sauber gemacht werden:

| Datei | Kontext | Priorität |
|---|---|---|
| `src/components/TestimonialsSection.tsx` | SYSTEMS-Marketing-Page (echtes Bergmann-Testimonial — KANN bleiben) | low |
| `src/data/mockData.ts` | Dev-Mock-Daten — Bergmann als Default-Tenant — OK | none |
| `src/pages/Login.tsx` | Login-Placeholder | low |
| `src/pages/Onboarding.tsx` | Onboarding-Placeholder | low |
| `src/pages/portal/PortalLogin.tsx` | "Beispiel-Mandant Maximilian Müller" — Placeholder | low |
| `src/contexts/MandantAuthContext.tsx` | Demo-Mode-Comment | none |
| `src/components/dashboard/InviteUserDialog.tsx` | E-Mail-Placeholder | none |
| `src/components/kanzlei-template/Team.tsx` | Fallback-Image-Imports (`team-bergmann.jpg` etc.) | none — Dateinamen OK |

### Zentrale Tenant-Quelle für Dashboard (Phase 3)

`src/data/mockData.ts` → `currentTenant` ist die Tenant-Quelle für das **Dashboard/Portal**.
Eine vollständige Trennung von Marketing-Page (KanzleiConfig) und
Dashboard-Tenant (Tenant) ist sinnvoll — beide bleiben aber für ihre Domäne
separate Konzepte:

- **KanzleiConfig** (Marketing-Page / Public-Funnel): URL-Params + Static-Override
- **Tenant** (Dashboard / Portal): DB-gestützt via `useTenantQuery()`

Keine weitere Vermischung nötig.

## Test-Plan

- [x] `npx vite build --base=/test-build/` läuft grün
- [ ] `/kanzlei-template` Route lokal aufrufen → muss weiterhin Bergmann-Defaults zeigen (Dev-Mode)
- [ ] `/vorschau?firma=Schalast&ort=Frankfurt&rechtsgebiet=Wirtschaftsrecht` lokal aufrufen → Footer/Headlines zeigen Schalast statt Bergmann
- [ ] Phase 2 implementieren (Static-JSON-Override) für Lead-Repo
- [ ] `itmr-rechtsanwalte` Lead-Repo mit Phase 2 neu generieren und LIVE-Deploy

## Geänderte Files (Phase 1)

```
src/pages/VorschauPage.tsx                            # Config-Interface erweitert
src/components/kanzlei-template/Footer.tsx           # display_name/copyright_name/contact/rechtsgebiete
src/components/kanzlei-template/Contact.tsx          # contact.phone/email/address/hours
src/components/kanzlei-template/Trust.tsx            # brand_with in Headline
src/components/kanzlei-template/Comparison.tsx       # brand_with in Headline
src/components/kanzlei-template/SystemsBadge.tsx     # brand_with in Badge
src/components/kanzlei-template/Team.tsx             # team[] aus Config, Asset-Fallbacks
src/components/kanzlei-template/Testimonials.tsx     # testimonials[] aus Config
```

## Hinweis zum DEFAULT_CONFIG

Der Default ist **bewusst Bergmann** — alle bestehenden Routes (`/kanzlei-template`, Dev-Mode) verhalten sich wie vorher.
Pro Lead/Tenant muss ab Phase 2 nur EIN config-Object (oder eine JSON-Datei) ersetzt werden — keine Component-Edits mehr.
