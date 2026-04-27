import { describe, it, expect } from "vitest";
import { detectAnomaly, DailyPoint } from "@/lib/cost-anomaly";

const buildRows = (tokens: number[]): DailyPoint[] =>
  tokens.map((t, i) => ({ day: `2026-04-${String(i + 1).padStart(2, "0")}`, tokens_sum: t }));

describe("cost-anomaly", () => {
  it("kein Alarm bei zu wenig Daten", () => {
    const result = detectAnomaly(buildRows([100_000, 100_000]));
    expect(result.isAnomaly).toBe(false);
  });

  it("kein Alarm bei stabilem Verlauf", () => {
    const result = detectAnomaly(
      buildRows([100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 110_000]),
    );
    expect(result.isAnomaly).toBe(false);
    expect(result.factor).toBeCloseTo(1.1, 1);
  });

  it("Alarm bei 4× Spike heute", () => {
    const result = detectAnomaly(
      buildRows([100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 400_000]),
    );
    expect(result.isAnomaly).toBe(true);
    expect(result.factor).toBe(4);
  });

  it("kein Alarm wenn heute zwar 4× aber unter Mindest-Volumen", () => {
    const result = detectAnomaly(
      buildRows([5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 20_000]),
    );
    expect(result.isAnomaly).toBe(false);
  });

  it("kein Alarm wenn Baseline 0 (Division durch 0 vermeiden)", () => {
    const result = detectAnomaly(
      buildRows([0, 0, 0, 0, 0, 0, 0, 200_000]),
    );
    expect(result.isAnomaly).toBe(false);
    expect(result.factor).toBe(0);
  });

  it("Median ignoriert einzelne Ausreißer in der Baseline", () => {
    // 6 Tage je 50k, 1 Ausreißer 1M → Median bleibt 50k → heute 200k = 4×
    const result = detectAnomaly(
      buildRows([50_000, 50_000, 50_000, 50_000, 50_000, 50_000, 1_000_000, 200_000]),
    );
    expect(result.baselineMedian).toBe(50_000);
    expect(result.isAnomaly).toBe(true);
  });
});
