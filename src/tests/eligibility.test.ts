import { describe, it, expect } from "vitest";
import { evaluateEligibility } from "../lib/eligibility/engine";
import { EligibilityRule, StudentProfile } from "../types/database";

describe("NagrikSetu Deterministic Eligibility Engine", () => {
  const mockRules: EligibilityRule[] = [
    {
      id: "r1",
      opportunityId: "opp_1",
      field: "state",
      operator: "EQUALS",
      value: "Maharashtra",
      humanReadableLabelEn: "Must reside in Maharashtra",
      humanReadableLabelMr: "महाराष्ट्राचा रहिवासी असणे आवश्यक",
      required: true,
      sortOrder: 1,
    },
    {
      id: "r2",
      opportunityId: "opp_1",
      field: "family_income_max",
      operator: "LESS_THAN_EQUAL",
      value: 250000,
      humanReadableLabelEn: "Income must be <= 2.5L",
      humanReadableLabelMr: "उत्पन्न २.५ लाखांच्या आत असावे",
      required: true,
      sortOrder: 2,
    },
    {
      id: "r3",
      opportunityId: "opp_1",
      field: "academic_percentage",
      operator: "GREATER_THAN_EQUAL",
      value: 60,
      humanReadableLabelEn: "Minimum 60% marks",
      humanReadableLabelMr: "किमान ६०% गुण आवश्यक",
      required: true,
      sortOrder: 3,
    },
  ];

  it("evaluates student as ELIGIBLE when all rules pass", () => {
    const student: Partial<StudentProfile> = {
      state: "Maharashtra",
      incomeMax: 200000,
      academicPercentage: 75,
    };

    const result = evaluateEligibility("opp_1", mockRules, student);
    expect(result.overallStatus).toBe("ELIGIBLE");
    expect(result.canApply).toBe(true);
    expect(result.missingFields).toHaveLength(0);
    expect(result.ruleResults.every((r) => r.status === "PASSED")).toBe(true);
  });

  it("returns MORE_INFORMATION_REQUIRED without failing when a field is missing", () => {
    const student: Partial<StudentProfile> = {
      state: "Maharashtra",
      incomeMax: 200000,
      // academicPercentage is omitted
    };

    const result = evaluateEligibility("opp_1", mockRules, student);
    expect(result.overallStatus).toBe("MORE_INFORMATION_REQUIRED");
    expect(result.missingFields).toHaveLength(1);
    expect(result.missingFields[0].fieldKey).toBe("academic_percentage");
  });

  it("evaluates dynamically provided additional answers to satisfy missing criteria", () => {
    const student: Partial<StudentProfile> = {
      state: "Maharashtra",
      incomeMax: 200000,
    };
    const additionalAnswers = {
      academic_percentage: 68,
    };

    const result = evaluateEligibility("opp_1", mockRules, student, additionalAnswers);
    expect(result.overallStatus).toBe("ELIGIBLE");
    expect(result.missingFields).toHaveLength(0);
  });

  it("evaluates student as NOT_ELIGIBLE when a mandatory rule fails", () => {
    const student: Partial<StudentProfile> = {
      state: "Maharashtra",
      incomeMax: 500000, // Fails 250000 limit
      academicPercentage: 80,
    };

    const result = evaluateEligibility("opp_1", mockRules, student);
    expect(result.overallStatus).toBe("NOT_ELIGIBLE");
    expect(result.canApply).toBe(false);
  });

  it("correctly evaluates IN, BETWEEN and NOT_EQUALS operators", () => {
    const advancedRules: EligibilityRule[] = [
      {
        id: "r_in",
        opportunityId: "opp_adv",
        field: "education_level",
        operator: "IN",
        value: ["Diploma", "Undergraduate"],
        humanReadableLabelEn: "Diploma or UG",
        humanReadableLabelMr: "डिप्लोमा किंवा पदवी",
        required: true,
        sortOrder: 1,
      },
      {
        id: "r_between",
        opportunityId: "opp_adv",
        field: "academic_percentage",
        operator: "BETWEEN",
        value: [60, 95],
        humanReadableLabelEn: "Marks between 60% and 95%",
        humanReadableLabelMr: "६०% ते ९५% दरम्यान गुण",
        required: true,
        sortOrder: 2,
      },
    ];

    const student: Partial<StudentProfile> = {
      educationLevel: "Diploma",
      academicPercentage: 72,
    };

    const result = evaluateEligibility("opp_adv", advancedRules, student);
    expect(result.overallStatus).toBe("ELIGIBLE");
  });

  it("verifies all remaining operators: NOT_IN, LESS_THAN, GREATER_THAN, CONTAINS, EXISTS", () => {
    const allOpsRules: EligibilityRule[] = [
      {
        id: "r_not_in",
        opportunityId: "opp_all",
        field: "district",
        operator: "NOT_IN",
        value: ["Mumbai", "Thane"],
        humanReadableLabelEn: "Not in Mumbai/Thane",
        humanReadableLabelMr: "मुंबई किंवा ठाण्यात नसावे",
        required: true,
        sortOrder: 1,
      },
      {
        id: "r_lt",
        opportunityId: "opp_all",
        field: "family_income_max",
        operator: "LESS_THAN",
        value: 500000,
        humanReadableLabelEn: "Income < 5L",
        humanReadableLabelMr: "उत्पन्न ५ लाखांपेक्षा कमी",
        required: true,
        sortOrder: 2,
      },
      {
        id: "r_gt",
        opportunityId: "opp_all",
        field: "academic_percentage",
        operator: "GREATER_THAN",
        value: 55,
        humanReadableLabelEn: "Marks > 55%",
        humanReadableLabelMr: "५५% पेक्षा जास्त गुण",
        required: true,
        sortOrder: 3,
      },
      {
        id: "r_contains",
        opportunityId: "opp_all",
        field: "state",
        operator: "CONTAINS",
        value: "Maha",
        humanReadableLabelEn: "State contains Maha",
        humanReadableLabelMr: "राज्यात महा असावे",
        required: true,
        sortOrder: 4,
      },
      {
        id: "r_exists",
        opportunityId: "opp_all",
        field: "category",
        operator: "EXISTS",
        value: true,
        humanReadableLabelEn: "Category must be specified",
        humanReadableLabelMr: "प्रवर्ग नमूद असावा",
        required: true,
        sortOrder: 5,
      },
    ];

    const student: Partial<StudentProfile> = {
      district: "Pune",
      incomeMax: 300000,
      academicPercentage: 70,
      state: "Maharashtra",
      category: "OBC",
    };

    const result = evaluateEligibility("opp_all", allOpsRules, student);
    expect(result.overallStatus).toBe("ELIGIBLE");
    expect(result.ruleResults.every((r) => r.status === "PASSED")).toBe(true);

    // If district is Mumbai, NOT_IN must fail
    const failingStudent = { ...student, district: "Mumbai" };
    const failResult = evaluateEligibility("opp_all", allOpsRules, failingStudent);
    expect(failResult.overallStatus).toBe("NOT_ELIGIBLE");
  });

  it("handles malformed rule values and NaN safely without throwing errors", () => {
    const malformedRules: EligibilityRule[] = [
      {
        id: "r_malformed_num",
        opportunityId: "opp_nan",
        field: "academic_percentage",
        operator: "GREATER_THAN_EQUAL",
        value: "not_a_valid_number" as any,
        humanReadableLabelEn: "Malformed Rule",
        humanReadableLabelMr: "चुकीचा नियम",
        required: true,
        sortOrder: 1,
      },
      {
        id: "r_malformed_between",
        opportunityId: "opp_nan",
        field: "family_income_max",
        operator: "BETWEEN",
        value: ["invalid", "range"] as any,
        humanReadableLabelEn: "Malformed Between",
        humanReadableLabelMr: "चुकीची मर्यादा",
        required: true,
        sortOrder: 2,
      },
    ];

    const student: Partial<StudentProfile> = {
      academicPercentage: 75,
      incomeMax: 200000,
    };

    // Must not throw an unhandled exception
    expect(() => {
      const result = evaluateEligibility("opp_nan", malformedRules, student);
      expect(result.overallStatus).toBe("NOT_ELIGIBLE");
    }).not.toThrow();
  });

  it("marks overall status as POSSIBLY_ELIGIBLE when only optional rules are missing", () => {
    const mixedRules: EligibilityRule[] = [
      {
        id: "r_req",
        opportunityId: "opp_mixed",
        field: "state",
        operator: "EQUALS",
        value: "Maharashtra",
        humanReadableLabelEn: "State",
        humanReadableLabelMr: "राज्य",
        required: true,
        sortOrder: 1,
      },
      {
        id: "r_opt",
        opportunityId: "opp_mixed",
        field: "academic_percentage",
        operator: "GREATER_THAN_EQUAL",
        value: 70,
        humanReadableLabelEn: "Optional Merit Cutoff",
        humanReadableLabelMr: "ऐच्छिक गुणवत्ता गुण",
        required: false, // Optional rule
        sortOrder: 2,
      },
    ];

    const student: Partial<StudentProfile> = {
      state: "Maharashtra",
      // academicPercentage is omitted
    };

    const result = evaluateEligibility("opp_mixed", mixedRules, student);
    expect(result.overallStatus).toBe("POSSIBLY_ELIGIBLE");
    expect(result.canApply).toBe(true);
  });
});
