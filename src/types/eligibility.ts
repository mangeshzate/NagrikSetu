import { EligibilityRule } from "./database";

export type OverallEligibilityStatus = 
  | "ELIGIBLE"
  | "POSSIBLY_ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "MORE_INFORMATION_REQUIRED"
  | "NOT_CHECKED";

export type SingleRuleResultStatus = 
  | "PASSED"
  | "FAILED"
  | "NEEDS_INFO";

export interface EvaluatedRuleResult {
  rule: EligibilityRule;
  status: SingleRuleResultStatus;
  userValue: any;
  explanationEn: string;
  explanationMr: string;
}

export interface MissingFieldRequirement {
  fieldKey: string;
  labelEn: string;
  labelMr: string;
  type: "number" | "text" | "select" | "boolean";
  options?: { value: string; labelEn: string; labelMr: string }[];
  placeholder?: string;
}

export interface EligibilityEvaluationResult {
  opportunityId: string;
  overallStatus: OverallEligibilityStatus;
  statusLabelEn: string;
  statusLabelMr: string;
  ruleResults: EvaluatedRuleResult[];
  missingFields: MissingFieldRequirement[];
  canApply: boolean;
  checkedAt: string;
}
