export type MatchCategory = 
  | "EXCELLENT_MATCH" // 90-100
  | "STRONG_MATCH"    // 75-89
  | "POSSIBLE_MATCH"  // 50-74
  | "LOW_MATCH";      // < 50

export interface MatchReason {
  criterion: "education" | "state" | "income" | "interest" | "year";
  matched: boolean;
  pointsEarned: number;
  maxPoints: number;
  descriptionEn: string;
  descriptionMr: string;
}

export interface OpportunityMatchResult {
  opportunityId: string;
  score: number; // 0 to 100
  category: MatchCategory;
  categoryLabelEn: string;
  categoryLabelMr: string;
  reasons: MatchReason[];
  isHighMatch: boolean;
}
