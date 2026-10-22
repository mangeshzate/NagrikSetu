import { describe, it, expect } from "vitest";
import { calculateOpportunityMatch } from "../lib/matching/engine";
import { Opportunity, StudentProfile } from "../types/database";

describe("NagrikSetu Matching Engine Boundary & Inactivity Tests", () => {
  const baseOpportunity: Opportunity = {
    id: "opp_bound_test",
    slug: "bound-test-opportunity",
    title: "Maharashtra Merit Scheme",
    titleMr: "महाराष्ट्र गुणवत्ता योजना",
    type: "SCHOLARSHIP",
    provider: "Higher Education Dept",
    shortDescription: "Scholarship for test",
    description: "Detailed description",
    officialUrl: "https://mahadbt.maharashtra.gov.in",
    applicationUrl: "https://mahadbt.maharashtra.gov.in",
    deadline: "2026-12-31",
    stateApplicability: ["Maharashtra"],
    educationLevelApplicability: ["Diploma", "Undergraduate"],
    currentYearApplicability: ["Second Year", "Third Year"],
    incomeMax: 250000,
    active: true,
    verificationStatus: "VERIFIED",
    verifiedAt: "2026-10-15T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-15T00:00:00Z",
  };

  it("never exceeds 100 points even with maximum compatibility", () => {
    const perfectStudent: Partial<StudentProfile> = {
      educationLevel: "Diploma",
      state: "Maharashtra",
      incomeMax: 150000,
      currentYear: "Second Year",
    };
    const interestKeys = ["SCHOLARSHIP"];

    const result = calculateOpportunityMatch(perfectStudent, baseOpportunity, interestKeys);
    expect(result.score).toBe(100);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.category).toBe("EXCELLENT_MATCH");
    expect(result.isHighMatch).toBe(true);
  });

  it("never falls below 0 points even with completely mismatched criteria", () => {
    const mismatchedStudent: Partial<StudentProfile> = {
      educationLevel: "10th", // Mismatched (requires Diploma/UG)
      state: "Karnataka", // Mismatched (requires Maharashtra)
      incomeMax: 1500000, // Incompatible (15L > 2.5L)
      currentYear: "First Year", // Mismatched
    };
    const interestKeys = ["COMPETITION"]; // Mismatched

    const result = calculateOpportunityMatch(mismatchedStudent, baseOpportunity, interestKeys);
    expect(result.score).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.category).toBe("LOW_MATCH");
    expect(result.isHighMatch).toBe(false);
  });

  it("handles null or undefined student profiles safely without crashing", () => {
    expect(() => {
      const resNull = calculateOpportunityMatch(null, baseOpportunity, []);
      expect(resNull.score).toBeGreaterThanOrEqual(0);
      expect(resNull.score).toBeLessThanOrEqual(100);

      const resUndef = calculateOpportunityMatch(undefined, baseOpportunity, []);
      expect(resUndef.score).toBeGreaterThanOrEqual(0);
      expect(resUndef.score).toBeLessThanOrEqual(100);
    }).not.toThrow();
  });

  it("assigns 0 score and marks inactive opportunities as non-recommended", () => {
    const inactiveOpp: Opportunity = {
      ...baseOpportunity,
      active: false,
    };
    const perfectStudent: Partial<StudentProfile> = {
      educationLevel: "Diploma",
      state: "Maharashtra",
      incomeMax: 150000,
      currentYear: "Second Year",
    };

    const result = calculateOpportunityMatch(perfectStudent, inactiveOpp, ["SCHOLARSHIP"]);
    expect(result.score).toBe(0);
    expect(result.isHighMatch).toBe(false);
    expect(result.categoryLabelEn).toContain("Inactive");
  });

  it("assigns 0 score and marks expired opportunities as non-recommended", () => {
    const expiredOpp: Opportunity = {
      ...baseOpportunity,
      verificationStatus: "EXPIRED",
      deadline: "2026-01-01",
    };
    const perfectStudent: Partial<StudentProfile> = {
      educationLevel: "Diploma",
      state: "Maharashtra",
      incomeMax: 150000,
      currentYear: "Second Year",
    };

    const result = calculateOpportunityMatch(perfectStudent, expiredOpp, ["SCHOLARSHIP"]);
    expect(result.score).toBe(0);
    expect(result.isHighMatch).toBe(false);
    expect(result.categoryLabelEn).toContain("Expired");
  });

  it("verifies mathematical point breakdown (30/20/20/20/10)", () => {
    const partialStudent: Partial<StudentProfile> = {
      educationLevel: "Diploma", // +30
      state: "Maharashtra", // +20
      incomeMax: 500000, // 0 (over limit of 2.5L)
      currentYear: "First Year", // 0 (requires 2nd or 3rd)
    };
    // No matching interest: when list has interests, mismatched type gives 0
    const interestKeys = ["INTERNSHIP"]; // 0 (opportunity is SCHOLARSHIP)

    const result = calculateOpportunityMatch(partialStudent, baseOpportunity, interestKeys);
    expect(result.score).toBe(50); // 30 + 20 + 0 + 0 + 0 = 50
    expect(result.category).toBe("POSSIBLE_MATCH");
  });
});
