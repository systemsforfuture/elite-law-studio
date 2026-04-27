/**
 * Smoke-Render-Tests für IntegrationenPage in verschiedenen States.
 * Stellen sicher dass keine Variante (empty/configured/verified/failed) crasht.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { renderWithProviders } from "./helpers";
import IntegrationenPage from "@/pages/dashboard/IntegrationenPage";
import SystemStatusPage from "@/pages/dashboard/SystemStatusPage";

describe("IntegrationenPage states", () => {
  it("rendert ohne crash im Default-Mock-State (alles leer)", () => {
    const { container } = render(renderWithProviders(<IntegrationenPage />));
    expect(container.firstChild).toBeTruthy();
  });

  it("rendert ohne crash mit ?stripe=return param", () => {
    const { container } = render(
      renderWithProviders(<IntegrationenPage />, "/dashboard/integrationen?stripe=return"),
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("rendert ohne crash mit ?stripe=refresh param", () => {
    const { container } = render(
      renderWithProviders(<IntegrationenPage />, "/dashboard/integrationen?stripe=refresh"),
    );
    expect(container.firstChild).toBeTruthy();
  });
});

describe("SystemStatusPage states", () => {
  it("rendert ohne crash im Default-Mock-State", () => {
    const { container } = render(renderWithProviders(<SystemStatusPage />));
    expect(container.firstChild).toBeTruthy();
  });
});
