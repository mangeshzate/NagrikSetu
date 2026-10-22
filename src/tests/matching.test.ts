import { describe, it, expect } from "vitest";
import { calculateOpportunityMatch } from "../lib/matching/engine";
import { StudentProfile, Opportunity } from "../types/database";

describe("NagrikSetu Deterministic Matching Engine", () => {
  const mockOpportunity: Opportunity = {
    id: "opp_test_1",
    slug: "test-scholarship",
    title: "Maharashtra Merit Scholarship",
    type: "SCHOLARSHIP",
    provider: "Higher Education Dept",
    shortDescription: "Tuition aid for diploma students",
    description: "Detailed description",
    officialUrl: "https://example.gov.in",
    applicationUrl: "https://example.gov.in/apply",
    deadline: "2026-12-31",
    stateApplicability: ["Maharashtra"],
    educationLevelApplicability: ["Diploma"],
    currentYearApplicability: ["Final Year"],
    incomeMax: 250000,
    active: true,
    verificationStatus: "VERIFIED",
    verifiedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  };

  it("calculates a 100% full match when all 5 criteria match", () => {
    const student: Partial<StudentProfile> = {
      educationLevel: "Diploma",
      currentYear: "Final Year",
      state: "Maharashtra",
      incomeMax: 200000,
    };
    const userInterests = ["SCHOLARSHIP"];

    const result = calculateOpportunityMatch(student, mockOpportunity, userInterests);
    expect(result.score).toBe(100);
    expect(result.category).toBe("EXCELLENT_MATCH");
    expect(result.isHighMatch).toBe(true);
    expect(result.reasons).toHaveLength(5);
  });

  it("deducts 30 points when education level does not match", () => {
    const student: Partial<StudentProfile> = {
      educationLevel: "Postgraduate", // Opp is only for Diploma
      currentYear: "Final Year",
      state: "Maharashtra",
      incomeMax: 200000,
    };
    const userInterests = ["SCHOLARSHIP"];

    const result = calculateOpportunityMatch(student, mockOpportunity, userInterests);
    expect(result.score).toBe(70); // 100 - 30 = 70
    expect(result.category).toBe("POSSIBLE_MATCH");
    expect(result.isHighMatch).toBe(false);
  });

  it("deducts 20 points when income exceeds maximum threshold", () => {
    const student: Partial<StudentProfile> = {
      educationLevel: "Diploma",
      currentYear: "Final Year",
      state: "Maharashtra",
      incomeMax: 500000, // Opp max is 250000
    };
    const userInterests = ["SCHOLARSHIP"];

    const result = calculateOpportunityMatch(student, mockOpportunity, userInterests);
    expect(result.score).toBe(80); // 100 - 20 = 80
    expect(result.category).toBe("STRONG_MATCH");
    expect(result.isHighMatch).toBe(true);
  });

  it("handles null profile gracefully without crashing", () => {
    const result = calculateOpportunityMatch(null, mockOpportunity, []);
    expect(result.score).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
