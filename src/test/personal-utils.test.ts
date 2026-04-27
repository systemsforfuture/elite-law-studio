import { describe, expect, it } from "vitest";
import {
  countWerktage,
  diffMinutes,
  formatHours,
} from "@/lib/personal-utils";

describe("countWerktage", () => {
  it("counts a single weekday as 1", () => {
    // 2026-04-27 ist ein Montag
    expect(countWerktage("2026-04-27", "2026-04-27")).toBe(1);
  });

  it("skips weekends", () => {
    // 2026-04-25 Sa, 2026-04-26 So
    expect(countWerktage("2026-04-25", "2026-04-26")).toBe(0);
  });

  it("counts a Mo–Fr week as 5", () => {
    expect(countWerktage("2026-04-27", "2026-05-01")).toBe(5);
  });

  it("counts a Mo–Fr week + weekend as 5", () => {
    expect(countWerktage("2026-04-27", "2026-05-03")).toBe(5);
  });

  it("counts two full work weeks as 10", () => {
    expect(countWerktage("2026-04-27", "2026-05-08")).toBe(10);
  });

  it("returns 0 if bis < von", () => {
    expect(countWerktage("2026-05-01", "2026-04-01")).toBe(0);
  });

  it("returns 0 for invalid dates", () => {
    expect(countWerktage("garbage", "2026-05-01")).toBe(0);
    expect(countWerktage("2026-05-01", "garbage")).toBe(0);
  });
});

describe("diffMinutes", () => {
  it("calculates basic differences", () => {
    expect(diffMinutes("09:00", "10:00")).toBe(60);
    expect(diffMinutes("09:00", "09:30")).toBe(30);
    expect(diffMinutes("13:15", "14:45")).toBe(90);
  });

  it("returns 0 if ende <= start", () => {
    expect(diffMinutes("10:00", "10:00")).toBe(0);
    expect(diffMinutes("10:00", "09:00")).toBe(0);
  });

  it("returns 0 for invalid input", () => {
    expect(diffMinutes("nope", "10:00")).toBe(0);
    expect(diffMinutes("09:00", "")).toBe(0);
  });
});

describe("formatHours", () => {
  it("pads minutes to 2 digits", () => {
    expect(formatHours(0)).toBe("0:00 h");
    expect(formatHours(5)).toBe("0:05 h");
    expect(formatHours(60)).toBe("1:00 h");
    expect(formatHours(90)).toBe("1:30 h");
    expect(formatHours(150)).toBe("2:30 h");
    expect(formatHours(481)).toBe("8:01 h");
  });

  it("clamps negative values to 0", () => {
    expect(formatHours(-30)).toBe("0:00 h");
  });

  it("floors fractional minutes", () => {
    expect(formatHours(60.7)).toBe("1:00 h");
  });
});
