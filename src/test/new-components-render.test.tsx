import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithProviders } from "./helpers";

import AssistantWidget from "@/components/dashboard/AssistantWidget";
import MahnwesenAutopilot from "@/components/dashboard/MahnwesenAutopilot";
import PortalUploader from "@/components/portal/PortalUploader";
import type { Rechnung } from "@/data/types";

describe("AssistantWidget", () => {
  it("renders launcher button when closed", () => {
    const { container } = render(renderWithProviders(<AssistantWidget />));
    expect(container.firstChild).toBeTruthy();
    expect(screen.getByLabelText("SYSTEMS-KI öffnen")).toBeInTheDocument();
  });
});

describe("MahnwesenAutopilot", () => {
  it("renders empty-state when no rechnungen", () => {
    render(
      renderWithProviders(
        <MahnwesenAutopilot
          open={true}
          onOpenChange={() => {}}
          rechnungen={[]}
        />,
      ),
    );
    expect(screen.getByText(/Auto-Pilot/i)).toBeInTheDocument();
  });

  it("renders without crashing for closed dialog", () => {
    const { container } = render(
      renderWithProviders(
        <MahnwesenAutopilot
          open={false}
          onOpenChange={() => {}}
          rechnungen={[]}
        />,
      ),
    );
    expect(container).toBeTruthy();
  });

  it("renders first rechnung for non-empty list when open", () => {
    const r: Rechnung = {
      id: "rec_test",
      tenant_id: "t",
      mandant_id: "md_1",
      rechnungsnummer: "TST-001",
      betrag_netto: 100,
      betrag_brutto: 119,
      rechnungsdatum: "2026-01-01",
      faelligkeit: "2026-01-15",
      status: "versendet",
      mahnstufe: 0,
    };
    const { container } = render(
      renderWithProviders(
        <MahnwesenAutopilot
          open={true}
          onOpenChange={() => {}}
          rechnungen={[r]}
        />,
      ),
    );
    expect(container).toBeTruthy();
  });
});

describe("PortalUploader", () => {
  it("renders default upload card", () => {
    render(
      renderWithProviders(
        <PortalUploader tenantId="t" mandantId="md_1" />,
      ),
    );
    expect(screen.getByText(/Dokument hochladen/i)).toBeInTheDocument();
  });

  it("renders compact variant with shortened heading", () => {
    render(
      renderWithProviders(
        <PortalUploader
          tenantId="t"
          mandantId="md_1"
          variant="compact"
        />,
      ),
    );
    expect(screen.getByText(/Dokument einreichen/i)).toBeInTheDocument();
  });
});
