import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { renderWithProviders } from "./helpers";

import PortalLogin from "@/pages/portal/PortalLogin";
import PortalDashboard from "@/pages/portal/PortalDashboard";
import KanzleiTemplate from "@/pages/KanzleiTemplate";
import Index from "@/pages/Index";
import Onboarding from "@/pages/Onboarding";
import NotFound from "@/pages/NotFound";

describe("Marketing + Mandant-Sicht: pages render without crashing", () => {
  it("renders Index (marketing landing)", () => {
    const { container } = render(renderWithProviders(<Index />));
    expect(container.firstChild).toBeTruthy();
  });

  it("renders Onboarding flow", () => {
    const { container } = render(renderWithProviders(<Onboarding />));
    expect(container.firstChild).toBeTruthy();
  });

  it("renders KanzleiTemplate (funnel demo)", () => {
    const { container } = render(renderWithProviders(<KanzleiTemplate />));
    expect(container.firstChild).toBeTruthy();
  });

  it("renders PortalLogin (Mandant)", () => {
    const { container } = render(renderWithProviders(<PortalLogin />, "/portal"));
    expect(container.firstChild).toBeTruthy();
  });

  it("renders PortalDashboard (Mandant logged in / demo)", () => {
    const { container } = render(
      renderWithProviders(<PortalDashboard />, "/portal/dashboard"),
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders NotFound", () => {
    const { container } = render(renderWithProviders(<NotFound />, "/blub"));
    expect(container.firstChild).toBeTruthy();
  });
});
