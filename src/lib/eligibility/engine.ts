import { StudentProfile, EligibilityRule } from "@/types/database";
import {
  EligibilityEvaluationResult,
  EvaluatedRuleResult,
  MissingFieldRequirement,
  OverallEligibilityStatus,
  SingleRuleResultStatus,
} from "@/types/eligibility";

/**
 * Known metadata for dynamic profile fields that might be asked if missing.
 */
const FIELD_METADATA: Record<string, Partial<MissingFieldRequirement>> = {
  academic_percentage: {
    labelEn: "Previous Academic Percentage / Marks (%)",
    labelMr: "मागील शैक्षणिक वर्षातील टक्केवारी (%)",
    type: "number",
    placeholder: "e.g. 78.5",
  },
  family_income_max: {
    labelEn: "Annual Family Income (in ₹)",
    labelMr: "वार्षिक कौटुंबिक उत्पन्न (रुपयांमध्ये)",
    type: "number",
    placeholder: "e.g. 150000",
  },
  state: {
    labelEn: "State of Residence",
    labelMr: "रहिवासी राज्य",
    type: "text",
    placeholder: "Maharashtra",
  },
  district: {
    labelEn: "District",
    labelMr: "जिल्हा",
    type: "text",
  },
  category: {
    labelEn: "Social Category / Caste Reservation",
    labelMr: "सामाजिक प्रवर्ग / आरक्षण",
    type: "select",
    options: [
      { value: "OPEN", labelEn: "Open / General", labelMr: "खुला प्रवर्ग (Open)" },
      { value: "OBC", labelEn: "OBC", labelMr: "इतर मागास वर्ग (OBC)" },
      { value: "SC", labelEn: "SC", labelMr: "अनुसूचित जाती (SC)" },
      { value: "ST", labelEn: "ST", labelMr: "अनुसूचित जमाती (ST)" },
      { value: "EWS", labelEn: "EWS", labelMr: "आर्थिक दुर्बल घटक (EWS)" },
      { value: "VJNT", labelEn: "VJNT / SBC", labelMr: "विमुक्त जाती / भटक्या जमाती" },
    ],
  },
  education_level: {
    labelEn: "Education Level",
    labelMr: "शैक्षणिक पातळी",
    type: "select",
  },
  current_year: {
    labelEn: "Current Year of Study",
    labelMr: "चालू वर्ष",
    type: "select",
  },
  domicile_maharashtra: {
    labelEn: "Do you possess a Maharashtra Domicile Certificate?",
    labelMr: "तुमच्याकडे महाराष्ट्र अधिवास (डोमिसिल) दाखला आहे का?",
    type: "boolean",
  },
};

/**
 * Evaluates a single rule value against user input using deterministic operators.
 */
function evaluateSingleRule(rule: EligibilityRule, userValue: any): boolean {
  const { operator, value } = rule;

  switch (operator) {
    case "EQUALS":
      if (typeof userValue === "string" && typeof value === "string") {
        return userValue.trim().toLowerCase() === value.trim().toLowerCase();
      }
      return userValue === value;

    case "NOT_EQUALS":
      if (typeof userValue === "string" && typeof value === "string") {
        return userValue.trim().toLowerCase() !== value.trim().toLowerCase();
      }
      return userValue !== value;

    case "IN": {
      const arr = Array.isArray(value) ? value : [value];
      if (Array.isArray(userValue)) {
        return userValue.some((uv) => arr.includes(uv));
      }
      return arr.some((v) => 
        typeof v === "string" && typeof userValue === "string"
          ? v.toLowerCase() === userValue.toLowerCase()
          : v === userValue
      );
    }

    case "NOT_IN": {
      const arr = Array.isArray(value) ? value : [value];
      if (Array.isArray(userValue)) {
        return !userValue.some((uv) => arr.includes(uv));
      }
      return !arr.some((v) => 
        typeof v === "string" && typeof userValue === "string"
          ? v.toLowerCase() === userValue.toLowerCase()
          : v === userValue
      );
    }

    case "LESS_THAN": {
      const uNum = Number(userValue);
      const rNum = Number(value);
      if (isNaN(uNum) || isNaN(rNum)) return false;
      return uNum < rNum;
    }

    case "LESS_THAN_EQUAL": {
      const uNum = Number(userValue);
      const rNum = Number(value);
      if (isNaN(uNum) || isNaN(rNum)) return false;
      return uNum <= rNum;
    }

    case "GREATER_THAN": {
      const uNum = Number(userValue);
      const rNum = Number(value);
      if (isNaN(uNum) || isNaN(rNum)) return false;
      return uNum > rNum;
    }

    case "GREATER_THAN_EQUAL": {
      const uNum = Number(userValue);
      const rNum = Number(value);
      if (isNaN(uNum) || isNaN(rNum)) return false;
      return uNum >= rNum;
    }

    case "BETWEEN": {
      const val = Number(userValue);
      if (isNaN(val)) return false;
      const min = Array.isArray(value) ? Number(value[0]) : 0;
      const max = Array.isArray(value) ? Number(value[1]) : Number(value);
      if (isNaN(min) || isNaN(max)) return false;
      return val >= min && val <= max;
    }

    case "CONTAINS":
      if (value === undefined || value === null) return false;
      if (typeof userValue === "string") {
        return userValue.toLowerCase().includes(String(value).toLowerCase());
      }
      if (Array.isArray(userValue)) {
        return userValue.includes(value);
      }
      return false;

    case "EXISTS":
      if (Array.isArray(userValue)) {
        return userValue.length > 0;
      }
      return userValue !== undefined && userValue !== null && userValue !== "";

    default:
      return false;
  }
}

/**
 * Resolves user value for a given field from profile and additional answers.
 */
function resolveFieldValue(
  field: string,
  profile: Partial<StudentProfile> | null | undefined,
  additionalAnswers: Record<string, any> = {}
): any {
  // Check explicit additional answers first
  if (additionalAnswers[field] !== undefined) {
    return additionalAnswers[field];
  }

  // Profile field mappings
  switch (field) {
    case "state":
      return profile?.state || "Maharashtra";
    case "district":
      return profile?.district;
    case "education_level":
      return profile?.educationLevel;
    case "current_year":
      return profile?.currentYear;
    case "family_income_max":
    case "income_max":
      return profile?.incomeMax;
    case "academic_percentage":
      return profile?.academicPercentage;
    case "category":
      return profile?.category;
    case "domicile_maharashtra":
      // By default if state is Maharashtra, default to true unless specified
      return profile?.state === "Maharashtra" ? true : undefined;
    default:
      return undefined;
  }
}

/**
 * Evaluates all eligibility rules for an opportunity deterministically.
 */
export function evaluateEligibility(
  opportunityId: string,
  rules: EligibilityRule[],
  profile: Partial<StudentProfile> | null | undefined,
  additionalAnswers: Record<string, any> = {}
): EligibilityEvaluationResult {
  if (!rules || rules.length === 0) {
    // If no rules defined, default to Eligible
    return {
      opportunityId,
      overallStatus: "ELIGIBLE",
      statusLabelEn: "Eligible (Open Opportunity)",
      statusLabelMr: "पात्र (खुली संधी)",
      ruleResults: [],
      missingFields: [],
      canApply: true,
      checkedAt: new Date().toISOString(),
    };
  }

  const evaluatedRules: EvaluatedRuleResult[] = [];
  const missingFieldsMap = new Map<string, MissingFieldRequirement>();
  let hasFailedRequired = false;
  let hasNeedsInfoRequired = false;
  let hasPassedAny = false;

  // Sort rules by sortOrder
  const sortedRules = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const rule of sortedRules) {
    const userVal = resolveFieldValue(rule.field, profile, additionalAnswers);
    let status: SingleRuleResultStatus = "PASSED";
    let explanationEn = "";
    let explanationMr = "";

    // If user value is undefined or empty string
    if (userVal === undefined || userVal === null || userVal === "") {
      status = "NEEDS_INFO";
      explanationEn = `Information required: ${rule.humanReadableLabelEn}`;
      explanationMr = `माहिती आवश्यक: ${rule.humanReadableLabelMr}`;

      if (rule.required) {
        hasNeedsInfoRequired = true;
      }

      // Add to missing fields catalog
      if (!missingFieldsMap.has(rule.field)) {
        const meta = FIELD_METADATA[rule.field] || {};
        missingFieldsMap.set(rule.field, {
          fieldKey: rule.field,
          labelEn: meta.labelEn || rule.humanReadableLabelEn,
          labelMr: meta.labelMr || rule.humanReadableLabelMr,
          type: meta.type || "text",
          options: meta.options,
          placeholder: meta.placeholder,
        });
      }
    } else {
      const isPassed = evaluateSingleRule(rule, userVal);
      if (isPassed) {
        status = "PASSED";
        hasPassedAny = true;
        explanationEn = `Met: ${rule.humanReadableLabelEn}`;
        explanationMr = `अट पूर्ण: ${rule.humanReadableLabelMr}`;
      } else {
        status = "FAILED";
        explanationEn = `Did not meet: ${rule.humanReadableLabelEn}`;
        explanationMr = `अट पूर्ण नाही: ${rule.humanReadableLabelMr}`;
        if (rule.required) {
          hasFailedRequired = true;
        }
      }
    }

    evaluatedRules.push({
      rule,
      status,
      userValue: userVal,
      explanationEn,
      explanationMr,
    });
  }

  // Determine overall status
  let overallStatus: OverallEligibilityStatus = "ELIGIBLE";
  let statusLabelEn = "Eligible";
  let statusLabelMr = "पात्र";

  if (hasFailedRequired) {
    overallStatus = "NOT_ELIGIBLE";
    statusLabelEn = "Not Eligible";
    statusLabelMr = "अपात्र";
  } else if (hasNeedsInfoRequired) {
    overallStatus = "MORE_INFORMATION_REQUIRED";
    statusLabelEn = "More Information Required";
    statusLabelMr = "अधिक माहिती आवश्यक";
  } else if (evaluatedRules.some((r) => r.status === "NEEDS_INFO")) {
    overallStatus = "POSSIBLY_ELIGIBLE";
    statusLabelEn = "Possibly Eligible";
    statusLabelMr = "कदाचित पात्र";
  } else {
    overallStatus = "ELIGIBLE";
    statusLabelEn = "Eligible";
    statusLabelMr = "पात्र";
  }

  const missingFields = Array.from(missingFieldsMap.values());
  const canApply = overallStatus === "ELIGIBLE" || overallStatus === "POSSIBLY_ELIGIBLE";

  return {
    opportunityId,
    overallStatus,
    statusLabelEn,
    statusLabelMr,
    ruleResults: evaluatedRules,
    missingFields,
    canApply,
    checkedAt: new Date().toISOString(),
  };
}
