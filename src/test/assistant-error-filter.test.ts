/**
 * Regression-Test für Bug 34 — Error-Filter in AssistantWidget.submit().
 * Spiegelt die Filter-Logik in einer Pure-Function damit sie testbar ist.
 */
import { describe, expect, it } from "vitest";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const filterErrorMessages = (history: Msg[]): Msg[] =>
  history.filter(
    (m) => m.role !== "assistant" || !m.content.startsWith("Fehler:"),
  );

describe("AssistantWidget Error-Filter (Bug 34 Regression)", () => {
  it("entfernt 'Fehler:' assistant-messages", () => {
    const history: Msg[] = [
      { role: "user", content: "Frage 1" },
      { role: "assistant", content: "Fehler: 503 Service Unavailable" },
      { role: "user", content: "Frage 2" },
    ];
    const cleaned = filterErrorMessages(history);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0].content).toBe("Frage 1");
    expect(cleaned[1].content).toBe("Frage 2");
  });

  it("behält normale assistant-Antworten", () => {
    const history: Msg[] = [
      { role: "user", content: "RVG?" },
      { role: "assistant", content: "RVG: 1,3-Gebühr beträgt …" },
    ];
    expect(filterErrorMessages(history)).toHaveLength(2);
  });

  it("behält user-messages auch wenn sie 'Fehler:' enthalten", () => {
    const history: Msg[] = [
      { role: "user", content: "Fehler: meine Frage hat einen Tippfehler" },
    ];
    expect(filterErrorMessages(history)).toHaveLength(1);
  });

  it("leerer History bleibt leer", () => {
    expect(filterErrorMessages([])).toEqual([]);
  });
});
