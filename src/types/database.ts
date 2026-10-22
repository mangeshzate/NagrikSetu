export type UserRole = "STUDENT" | "ADMIN";
export type LanguageCode = "en" | "mr";

export type OpportunityType = 
  | "SCHOLARSHIP" 
  | "INTERNSHIP" 
  | "GOVERNMENT_EXAM" 
  | "COMPETITION" 
  | "COURSE";

export type VerificationStatus = 
  | "VERIFIED" 
  | "NEEDS_REVIEW" 
  | "EXPIRED" 
  | "INACTIVE";

export type JourneyStatus = 
  | "NOT_STARTED" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "BLOCKED";

export type JourneyStepStatus = 
  | "NOT_STARTED" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "BLOCKED";

export type DocumentStatus = 
  | "AVAILABLE" 
  | "MISSING" 
  | "NOT_APPLICABLE";

export type EducationLevel = 
  | "10th" 
  | "12th" 
  | "Diploma" 
  | "Undergraduate" 
  | "Postgraduate";

export type CurrentYear = 
  | "First Year" 
  | "Second Year" 
  | "Third Year" 
  | "Fourth Year" 
  | "Final Year" 
  | "Not Applicable";

export type IncomeRange = 
  | "BELOW_1_LAKH" 
  | "1_TO_2_5_LAKH" 
  | "2_5_TO_5_LAKH" 
  | "ABOVE_5_LAKH" 
  | "PREFER_NOT_TO_SAY";

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage: LanguageCode;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  educationLevel: EducationLevel;
  currentYear: CurrentYear;
  state: string; // e.g. "Maharashtra"
  district: string; // e.g. "Pune"
  incomeRange: IncomeRange;
  incomeMin: number;
  incomeMax: number;
  academicPercentage?: number;
  category?: string; // e.g. General, OBC, SC, ST, EWS
  createdAt: string;
  updatedAt: string;
}

export interface Interest {
  id: string;
  key: string;
  nameEn: string;
  nameMr: string;
}

export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  titleMr?: string;
  type: OpportunityType;
  provider: string;
  providerMr?: string;
  shortDescription: string;
  shortDescriptionMr?: string;
  description: string;
  descriptionMr?: string;
  officialUrl: string;
  applicationUrl: string;
  deadline: string; // ISO date string: YYYY-MM-DD
  startDate?: string;
  stateApplicability: string[]; // ["Maharashtra"] or ["All India"]
  educationLevelApplicability: EducationLevel[];
  currentYearApplicability: CurrentYear[];
  incomeMax?: number;
  active: boolean;
  verificationStatus: VerificationStatus;
  verifiedAt: string; // ISO string
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  sourceClassification?: "VERIFIED_REAL_DATA" | "DEMO_DATA" | "NEEDS_MANUAL_VERIFICATION";
  deadlineSource?: string;
  eligibilitySource?: string;
}

export type OpportunitySourceClassification = 
  | "VERIFIED_REAL_DATA" 
  | "DEMO_DATA" 
  | "NEEDS_MANUAL_VERIFICATION";

export type RuleOperator = 
  | "EQUALS" 
  | "NOT_EQUALS" 
  | "IN" 
  | "NOT_IN" 
  | "LESS_THAN" 
  | "LESS_THAN_EQUAL" 
  | "GREATER_THAN" 
  | "GREATER_THAN_EQUAL" 
  | "BETWEEN" 
  | "CONTAINS" 
  | "EXISTS";

export interface EligibilityRule {
  id: string;
  opportunityId: string;
  field: string;
  operator: RuleOperator;
  value: any; // string, number, string[], or [number, number]
  humanReadableLabelEn: string;
  humanReadableLabelMr: string;
  required: boolean;
  sortOrder: number;
}

export interface DocumentItem {
  id: string;
  key: string;
  nameEn: string;
  nameMr: string;
  descriptionEn?: string;
  descriptionMr?: string;
}

export interface OpportunityDocument {
  id: string;
  opportunityId: string;
  documentId: string;
  required: boolean;
  sortOrder: number;
  document?: DocumentItem;
}

export interface UserDocumentState {
  id: string;
  userId: string;
  documentId: string;
  status: DocumentStatus;
  updatedAt: string;
}

export interface Journey {
  id: string;
  userId: string;
  opportunityId: string;
  status: JourneyStatus;
  progress: number; // 0 to 100
  startedAt: string;
  updatedAt: string;
  opportunity?: Opportunity;
  steps?: JourneyStep[];
}

export interface JourneyStep {
  id: string;
  journeyId: string;
  title: string;
  titleMr?: string;
  description: string;
  descriptionMr?: string;
  position: number;
  status: JourneyStepStatus;
  completedAt?: string | null;
  externalUrl?: string | null;
}

export interface AdditionalProfileAnswer {
  userId: string;
  fieldKey: string;
  value: any;
  updatedAt: string;
}
