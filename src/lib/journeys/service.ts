import { Journey, JourneyStep, JourneyStepStatus, Opportunity } from "@/types/database";

/**
 * Generates initial action journey steps tailored for an educational opportunity.
 */
export function generateDefaultJourneySteps(
  journeyId: string,
  opportunity: Opportunity
): JourneyStep[] {
  return [
    {
      id: `${journeyId}_step_1`,
      journeyId,
      position: 1,
      title: "Confirm Eligibility & Documents",
      titleMr: "पात्रता व कागदपत्रांची खात्री करा",
      description: "Review rule breakdown on NagrikSetu and ensure all mandatory documents are gathered.",
      descriptionMr: "नागरिकसेतूवरील पात्रता तपासा आणि सर्व आवश्यक कागदपत्रे उपलब्ध असल्याची खात्री करा.",
      status: "COMPLETED", // Completed because user verified eligibility to start
      completedAt: new Date().toISOString(),
      externalUrl: null,
    },
    {
      id: `${journeyId}_step_2`,
      journeyId,
      position: 2,
      title: "Read Official Notification",
      titleMr: "अधिकृत जाहिरात व सूचना वाचा",
      description: `Read the detailed guidelines and dates issued by ${opportunity.provider}.`,
      descriptionMr: `${opportunity.provider} द्वारे जारी केलेल्या सविस्तर मार्गदर्शक सूचना आणि अटी वाचा.`,
      status: "NOT_STARTED",
      completedAt: null,
      externalUrl: opportunity.officialUrl,
    },
    {
      id: `${journeyId}_step_3`,
      journeyId,
      position: 3,
      title: "Prepare Required Documents",
      titleMr: "आवश्यक कागदपत्रांची पूर्वतयारी करा",
      description: "Verify that income certificate, domicile, and marksheet are valid for the current academic session.",
      descriptionMr: "उत्पन्न दाखला, अधिवास प्रमाणपत्र आणि गुणपत्रिका चालू सत्रासाठी वैध असल्याचे तपासा.",
      status: "NOT_STARTED",
      completedAt: null,
      externalUrl: null,
    },
    {
      id: `${journeyId}_step_4`,
      journeyId,
      position: 4,
      title: "Open Official Application Portal",
      titleMr: "अधिकृत अर्ज पोर्टल उघडा",
      description: `Access the verified application portal: ${opportunity.applicationUrl || opportunity.officialUrl}`,
      descriptionMr: `अधिकृत अर्ज पोर्टलवर जा: ${opportunity.applicationUrl || opportunity.officialUrl}`,
      status: "NOT_STARTED",
      completedAt: null,
      externalUrl: opportunity.applicationUrl || opportunity.officialUrl,
    },
    {
      id: `${journeyId}_step_5`,
      journeyId,
      position: 5,
      title: "Submit Online Application",
      titleMr: "ऑनलाइन अर्ज सादर करा",
      description: "Carefully fill in candidate details, upload scanned documents, and submit before the deadline.",
      descriptionMr: "अर्जातील माहिती काळजीपूर्वक भरा, कागदपत्रे जोडा आणि अंतिम मुदतीपूर्वी अर्ज सबमिट करा.",
      status: "NOT_STARTED",
      completedAt: null,
      externalUrl: null,
    },
    {
      id: `${journeyId}_step_6`,
      journeyId,
      position: 6,
      title: "Save Application / Acknowledgement Number",
      titleMr: "अर्ज क्रमांक व पोचपावती जतन करा",
      description: "Download the submitted PDF receipt and note down your registration ID for future correspondence.",
      descriptionMr: "भरलेल्या अर्जाची प्रत डाउनलोड करा आणि भविष्यातील संदर्भासाठी अर्ज क्रमांक लिहून ठेवा.",
      status: "NOT_STARTED",
      completedAt: null,
      externalUrl: null,
    },
    {
      id: `${journeyId}_step_7`,
      journeyId,
      position: 7,
      title: "Track Status & Merit List",
      titleMr: "स्थिती व गुणवत्ता यादी तपासा",
      description: "Keep checking the portal periodically for scrutiny remarks, approval status, or scholarship disbursement.",
      descriptionMr: "अर्जाची छाननी स्थिती, मंजुरी किंवा शिष्यवृत्ती जमा झाल्याची माहिती वेळोवेळी तपासा.",
      status: "NOT_STARTED",
      completedAt: null,
      externalUrl: opportunity.officialUrl,
    },
  ];
}

/**
 * Calculates overall journey completion percentage.
 */
export function calculateJourneyProgress(steps: JourneyStep[]): number {
  if (!steps || steps.length === 0) return 0;
  const completed = steps.filter((s) => s.status === "COMPLETED").length;
  return Math.round((completed / steps.length) * 100);
}
