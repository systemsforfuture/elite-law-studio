import { describe, it, expect } from "vitest";
import { isSameDay, isWithinLastHours, isWithinLastDays, greetingForTime } from "@/lib/date-utils";

describe("date-utils", () => {
  it("isSameDay erkennt heute", () => {
    const now = new Date();
    expect(isSameDay(now.toISOString())).toBe(true);
  });

  it("isSameDay false für gestern", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isSameDay(yesterday.toISOString())).toBe(false);
  });

  it("isSameDay vergleicht gegen gegebene Referenz", () => {
    const ref = new Date("2026-04-15T12:00:00Z");
    expect(isSameDay("2026-04-15T01:30:00Z", ref)).toBe(true);
    expect(isSameDay("2026-04-16T00:30:00Z", ref)).toBe(false);
  });

  it("isWithinLastHours korrekt", () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600_000);
    expect(isWithinLastHours(oneHourAgo.toISOString(), 2)).toBe(true);
    expect(isWithinLastHours(oneHourAgo.toISOString(), 0.5)).toBe(false);
  });

  it("isWithinLastDays korrekt", () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    expect(isWithinLastDays(fiveDaysAgo.toISOString(), 7)).toBe(true);
    expect(isWithinLastDays(fiveDaysAgo.toISOString(), 3)).toBe(false);
  });

  describe("greetingForTime", () => {
    const at = (h: number) => new Date(2026, 3, 15, h, 0, 0);
    it("3 Uhr → Noch wach", () => {
      expect(greetingForTime(at(3))).toBe("Noch wach");
    });
    it("8 Uhr → Guten Morgen", () => {
      expect(greetingForTime(at(8))).toBe("Guten Morgen");
    });
    it("13 Uhr → Guten Tag", () => {
      expect(greetingForTime(at(13))).toBe("Guten Tag");
    });
    it("20 Uhr → Guten Abend", () => {
      expect(greetingForTime(at(20))).toBe("Guten Abend");
    });
  });
});
