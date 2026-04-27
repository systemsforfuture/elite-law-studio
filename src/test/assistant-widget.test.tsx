/**
 * AssistantWidget Smoke-Render-Tests:
 * - Mit leerem History (Setup-Vorschläge)
 * - Mit gespeicherter History via localStorage
 */
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithProviders } from "./helpers";
import AssistantWidget from "@/components/dashboard/AssistantWidget";

const STORAGE_KEY = "systems-assistant-history";

describe("AssistantWidget", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it("rendert Launcher-Button bei leerem Zustand", () => {
    render(renderWithProviders(<AssistantWidget />));
    expect(screen.getByLabelText("SYSTEMS-KI öffnen")).toBeInTheDocument();
  });

  it("hydratet History aus localStorage beim Mount", () => {
    const stored = [
      { role: "user", content: "Tagesprios?" },
      { role: "assistant", content: "Hier sind drei Prioritäten: …" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const { container } = render(renderWithProviders(<AssistantWidget />));
    // Drawer ist initial closed → History wird nicht gerendert. Aber das
    // initial-Lese aus localStorage darf nicht crashen.
    expect(container.firstChild).toBeTruthy();
  });

  it("verkraftet kaputtes JSON in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "{not-valid-json");
    const { container } = render(renderWithProviders(<AssistantWidget />));
    expect(container.firstChild).toBeTruthy();
  });
});
