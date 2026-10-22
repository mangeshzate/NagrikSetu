import { describe, it, expect } from "vitest";
import { calculateDeadlineStatus } from "../lib/deadlines/utils";

describe("NagrikSetu Deadline Utility", () => {
  const refDate = new Date("2026-10-22T10:00:00Z");

  it("identifies a future deadline beyond 7 days as non-urgent", () => {
    const status = calculateDeadlineStatus("2026-11-05", refDate);
    expect(status.daysRemaining).toBe(14);
    expect(status.isUrgent).toBe(false);
    expect(status.isExpired).toBe(false);
    expect(status.badgeColor).toBe("emerald");
  });

  it("flags a deadline within 7 days as urgent with amber badge", () => {
    const status = calculateDeadlineStatus("2026-10-26", refDate);
    expect(status.daysRemaining).toBe(4);
    expect(status.isUrgent).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.badgeColor).toBe("amber");
  });

  it("detects today as closing today (0 days remaining)", () => {
    const status = calculateDeadlineStatus("2026-10-22", refDate);
    expect(status.daysRemaining).toBe(0);
    expect(status.isClosingToday).toBe(true);
    expect(status.badgeColor).toBe("rose");
  });

  it("detects tomorrow as closing tomorrow (1 day remaining)", () => {
    const status = calculateDeadlineStatus("2026-10-23", refDate);
    expect(status.daysRemaining).toBe(1);
    expect(status.isClosingTomorrow).toBe(true);
    expect(status.badgeColor).toBe("rose");
  });

  it("identifies past deadline as expired with slate badge", () => {
    const status = calculateDeadlineStatus("2026-10-15", refDate);
    expect(status.daysRemaining).toBeLessThan(0);
    expect(status.isExpired).toBe(true);
    expect(status.badgeColor).toBe("slate");
  });
});
