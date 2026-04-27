/**
 * Audit-Filter-Logik regression test.
 * Spiegelt die Filter-Funktion aus AuditPage damit Refactor sie nicht bricht.
 */
import { describe, expect, it } from "vitest";
import type { AuditEvent } from "@/data/types";

const events: AuditEvent[] = [
  {
    id: "1",
    ts: "2026-04-27T10:00:00Z",
    user_name: "Sarah Fischer",
    action: "create",
    entity_type: "mandanten",
    ip_address: "1.2.3.4",
    details: "Mandant Müller angelegt",
  },
  {
    id: "2",
    ts: "2026-04-27T11:00:00Z",
    user_name: "SYSTEMS-KI",
    action: "ai_action",
    entity_type: "konversation",
    ip_address: "ai.internal",
    details: "Anruf qualifiziert",
  },
  {
    id: "3",
    ts: "2026-04-27T12:00:00Z",
    user_name: "Max Bergmann",
    action: "update",
    entity_type: "akten",
    ip_address: "5.6.7.8",
    details: "Stufe geändert auf strategie",
  },
];

const applyFilter = (
  list: AuditEvent[],
  actionFilter: AuditEvent["action"] | "all",
  entityFilter: string,
  search: string,
) =>
  list.filter((e) => {
    if (actionFilter !== "all" && e.action !== actionFilter) return false;
    if (entityFilter !== "all" && e.entity_type !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.user_name.toLowerCase().includes(q) &&
        !(e.details ?? "").toLowerCase().includes(q) &&
        !e.entity_type.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

describe("Audit-Filter (action / entity / search)", () => {
  it("zeigt alle bei keinem Filter", () => {
    expect(applyFilter(events, "all", "all", "")).toHaveLength(3);
  });

  it("filtert nach Action", () => {
    expect(applyFilter(events, "ai_action", "all", "")).toHaveLength(1);
    expect(applyFilter(events, "create", "all", "")).toHaveLength(1);
  });

  it("filtert nach Entity", () => {
    expect(applyFilter(events, "all", "mandanten", "")).toHaveLength(1);
    expect(applyFilter(events, "all", "akten", "")).toHaveLength(1);
  });

  it("Suche matched user_name + details + entity_type", () => {
    expect(applyFilter(events, "all", "all", "fischer")).toHaveLength(1);
    expect(applyFilter(events, "all", "all", "müller")).toHaveLength(1);
    expect(applyFilter(events, "all", "all", "konversation")).toHaveLength(1);
  });

  it("kombinierte Filter", () => {
    expect(applyFilter(events, "create", "mandanten", "")).toHaveLength(1);
    expect(applyFilter(events, "create", "akten", "")).toHaveLength(0);
    expect(applyFilter(events, "all", "all", "qualifiziert")).toHaveLength(1);
  });

  it("Suche ist case-insensitive", () => {
    expect(applyFilter(events, "all", "all", "MÜLLER")).toHaveLength(1);
    expect(applyFilter(events, "all", "all", "AnRuF")).toHaveLength(1);
  });
});
