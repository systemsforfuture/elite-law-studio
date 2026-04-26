import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { renderWithProviders } from "./helpers";

import Login from "@/pages/Login";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import VoicePage from "@/pages/dashboard/VoicePage";
import InboxPage from "@/pages/dashboard/InboxPage";
import MandantenPage from "@/pages/dashboard/MandantenPage";
import AktenPage from "@/pages/dashboard/AktenPage";
import TerminePage from "@/pages/dashboard/TerminePage";
import DokumentePage from "@/pages/dashboard/DokumentePage";
import MahnwesenPage from "@/pages/dashboard/MahnwesenPage";
import AgentenPage from "@/pages/dashboard/AgentenPage";
import ImportPage from "@/pages/dashboard/ImportPage";
import BrandingPage from "@/pages/dashboard/BrandingPage";
import TeamPage from "@/pages/dashboard/TeamPage";
import AbrechnungPage from "@/pages/dashboard/AbrechnungPage";
import AuditPage from "@/pages/dashboard/AuditPage";

const pages: [string, () => JSX.Element][] = [
  ["Login", Login],
  ["OverviewPage", OverviewPage],
  ["VoicePage", VoicePage],
  ["InboxPage", InboxPage],
  ["MandantenPage", MandantenPage],
  ["AktenPage", AktenPage],
  ["TerminePage", TerminePage],
  ["DokumentePage", DokumentePage],
  ["MahnwesenPage", MahnwesenPage],
  ["AgentenPage", AgentenPage],
  ["ImportPage", ImportPage],
  ["BrandingPage", BrandingPage],
  ["TeamPage", TeamPage],
  ["AbrechnungPage", AbrechnungPage],
  ["AuditPage", AuditPage],
];

describe("Anwalt-Sicht: Dashboard pages render without crashing", () => {
  for (const [name, Page] of pages) {
    it(`renders ${name}`, () => {
      const { container } = render(renderWithProviders(<Page />));
      expect(container.firstChild).toBeTruthy();
    });
  }
});
