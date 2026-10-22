import { StudentProfile, Opportunity } from "@/types/database";
import { OpportunityMatchResult, MatchReason, MatchCategory } from "@/types/matching";

/**
 * Deterministic weighted matching calculation for NagrikSetu
 * Formula weights:
 * - Education Match: 30 points
 * - State Match: 20 points
 * - Income Compatibility: 20 points
 * - Interest Match: 20 points
 * - Current Year Match: 10 points
 * Total = 100 points
 */
export function calculateOpportunityMatch(
  profile: Partial<StudentProfile> | null | undefined,
  opportunity: Opportunity,
  userInterestKeys: string[] = []
): OpportunityMatchResult {
  // Guard: Inactive or Expired opportunities must not be recommended with high scores
  if (!opportunity.active || opportunity.verificationStatus === "EXPIRED") {
    const isExpired = opportunity.verificationStatus === "EXPIRED";
    return {
      opportunityId: opportunity.id,
      score: 0,
      category: "LOW_MATCH",
      categoryLabelEn: isExpired ? "Expired Scheme" : "Inactive Scheme",
      categoryLabelMr: isExpired ? "मुदत संपलेली योजना" : "निष्क्रिय योजना",
      reasons: [
        {
          criterion: "state",
          matched: false,
          pointsEarned: 0,
          maxPoints: 0,
          descriptionEn: isExpired
            ? "Application deadline has passed. Archived for reference only."
            : "Scheme is currently inactive and not open for new applications.",
          descriptionMr: isExpired
            ? "अर्जाची अंतिम मुदत संपली आहे. केवळ संदर्भासाठी उपलब्ध."
            : "योजना सध्या निष्क्रिय आहे.",
        },
      ],
      isHighMatch: false,
    };
  }

  const reasons: MatchReason[] = [];
  let totalScore = 0;

  // 1. Education Match (30 pts)
  const maxEducationPts = 30;
  const userEdu = profile?.educationLevel;
  const eduMatched = Boolean(
    userEdu && 
    opportunity.educationLevelApplicability && 
    (opportunity.educationLevelApplicability.length === 0 || 
     opportunity.educationLevelApplicability.includes(userEdu))
  );
  const eduPts = eduMatched ? maxEducationPts : 0;
  totalScore += eduPts;
  reasons.push({
    criterion: "education",
    matched: eduMatched,
    pointsEarned: eduPts,
    maxPoints: maxEducationPts,
    descriptionEn: eduMatched
      ? `Matches your education level (${userEdu || "Any"})`
      : `Opportunity specifies ${opportunity.educationLevelApplicability.join(", ")}; your profile is ${userEdu || "Not specified"}`,
    descriptionMr: eduMatched
      ? `तुमच्या शैक्षणिक पातळीशी जुळते (${userEdu || "सर्व"})`
      : `यासाठी ${opportunity.educationLevelApplicability.join(", ")} आवश्यक आहे; तुमची प्रोफाइल ${userEdu || "नोंदवलेली नाही"} अशी आहे`,
  });

  // 2. State Match (20 pts)
  const maxStatePts = 20;
  const userState = profile?.state || "Maharashtra";
  const stateMatched = Boolean(
    opportunity.stateApplicability.includes("All India") ||
    opportunity.stateApplicability.includes(userState)
  );
  const statePts = stateMatched ? maxStatePts : 0;
  totalScore += statePts;
  reasons.push({
    criterion: "state",
    matched: stateMatched,
    pointsEarned: statePts,
    maxPoints: maxStatePts,
    descriptionEn: stateMatched
      ? `Applicable in ${userState}`
      : `Applicable in: ${opportunity.stateApplicability.join(", ")}`,
    descriptionMr: stateMatched
      ? `${userState} राज्यासाठी लागू`
      : `लागू राज्ये: ${opportunity.stateApplicability.join(", ")}`,
  });

  // 3. Income Compatibility (20 pts)
  const maxIncomePts = 20;
  const userIncomeMax = profile?.incomeMax ?? 9999999;
  let incomeMatched = false;
  let incomeEn = "";
  let incomeMr = "";

  if (!opportunity.incomeMax || opportunity.incomeMax <= 0) {
    // No income cap on this opportunity (e.g. merit scholarship, open exam, competition)
    incomeMatched = true;
    incomeEn = "No family income limit applied (open to all income groups)";
    incomeMr = "कौटुंबिक उत्पन्नाची कोणतीही मर्यादा नाही (सर्वांसाठी उपलब्ध)";
  } else {
    // If student's max range is <= opportunity limit
    if (userIncomeMax <= opportunity.incomeMax) {
      incomeMatched = true;
      incomeEn = `Your income range is within the maximum limit (₹${opportunity.incomeMax.toLocaleString("en-IN")})`;
      incomeMr = `तुमचे उत्पन्न विहित मर्यादेत बसते (कमाल ₹${opportunity.incomeMax.toLocaleString("en-IN")})`;
    } else {
      incomeMatched = false;
      incomeEn = `Opportunity requires family income up to ₹${opportunity.incomeMax.toLocaleString("en-IN")}`;
      incomeMr = `यासाठी कौटुंबिक उत्पन्न ₹${opportunity.incomeMax.toLocaleString("en-IN")} च्या आत असणे आवश्यक आहे`;
    }
  }
  const incomePts = incomeMatched ? maxIncomePts : 0;
  totalScore += incomePts;
  reasons.push({
    criterion: "income",
    matched: incomeMatched,
    pointsEarned: incomePts,
    maxPoints: maxIncomePts,
    descriptionEn: incomeEn,
    descriptionMr: incomeMr,
  });

  // 4. Interest Match (20 pts)
  const maxInterestPts = 20;
  const hasMatchingInterest = userInterestKeys.includes(opportunity.type);
  const interestPts = hasMatchingInterest ? maxInterestPts : (userInterestKeys.length === 0 ? 10 : 0);
  totalScore += interestPts;
  reasons.push({
    criterion: "interest",
    matched: hasMatchingInterest,
    pointsEarned: interestPts,
    maxPoints: maxInterestPts,
    descriptionEn: hasMatchingInterest
      ? `Matches your interest in ${opportunity.type.replace("_", " ").toLowerCase()}s`
      : `Opportunity type is ${opportunity.type.replace("_", " ").toLowerCase()}`,
    descriptionMr: hasMatchingInterest
      ? `तुमच्या आवडीशी सुसंगत (${opportunity.type})`
      : `संधी प्रकार: ${opportunity.type}`,
  });

  // 5. Current Year Match (10 pts)
  const maxYearPts = 10;
  const userYear = profile?.currentYear;
  const yearMatched = Boolean(
    !opportunity.currentYearApplicability ||
    opportunity.currentYearApplicability.length === 0 ||
    opportunity.currentYearApplicability.includes("Not Applicable") ||
    (userYear && opportunity.currentYearApplicability.includes(userYear))
  );
  const yearPts = yearMatched ? maxYearPts : 0;
  totalScore += yearPts;
  reasons.push({
    criterion: "year",
    matched: yearMatched,
    pointsEarned: yearPts,
    maxPoints: maxYearPts,
    descriptionEn: yearMatched
      ? `Current academic year compatible`
      : `Opportunity is for: ${opportunity.currentYearApplicability.join(", ")}`,
    descriptionMr: yearMatched
      ? `चालू शैक्षणिक वर्षाशी सुसंगत`
      : `या वर्षांसाठी लागू: ${opportunity.currentYearApplicability.join(", ")}`,
  });

  // Clamp score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  let category: MatchCategory = "LOW_MATCH";
  let categoryLabelEn = "Low Match";
  let categoryLabelMr = "कमी सुसंगत";

  if (finalScore >= 90) {
    category = "EXCELLENT_MATCH";
    categoryLabelEn = "Excellent Match";
    categoryLabelMr = "अतिशय सुसंगत";
  } else if (finalScore >= 75) {
    category = "STRONG_MATCH";
    categoryLabelEn = "Strong Match";
    categoryLabelMr = "उत्तम सुसंगत";
  } else if (finalScore >= 50) {
    category = "POSSIBLE_MATCH";
    categoryLabelEn = "Possible Match";
    categoryLabelMr = "कदाचित सुसंगत";
  }

  return {
    opportunityId: opportunity.id,
    score: finalScore,
    category,
    categoryLabelEn,
    categoryLabelMr,
    reasons,
    isHighMatch: finalScore >= 75,
  };
}
