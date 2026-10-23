import { describe, it, expect, beforeEach } from "vitest";
import { dataStore } from "../lib/database/store";
import { isSafeUrl } from "../lib/validation/url";
import { calculateOpportunityMatch } from "../lib/matching/engine";
import { DEMO_ADMIN_USER, DEMO_STUDENT_PROFILE } from "../lib/database/mockData";

describe("Admin Opportunity CRUD & Safe Deletion Suite", () => {
  const adminId = DEMO_ADMIN_USER.id;
  let createdOppId: string;

  it("allows admin to create a new opportunity with audit logging", async () => {
    const opp = await dataStore.createOpportunity(
      {
        slug: `test-scheme-${Date.now()}`,
        title: "Maharashtra Minority Higher Education Scholarship",
        titleMr: "महाराष्ट्र अल्पसंख्याक उच्च शिक्षण शिष्यवृत्ती",
        type: "SCHOLARSHIP",
        provider: "Minority Development Department, Maharashtra",
        shortDescription: "Tuition support for minority community students.",
        description: "Full scheme details for minority community scholarship.",
        officialUrl: "https://mdd.maharashtra.gov.in",
        applicationUrl: "https://mahadbt.maharashtra.gov.in",
        deadline: "2026-12-31",
        stateApplicability: ["Maharashtra"],
        educationLevelApplicability: ["Undergraduate", "Postgraduate"],
        currentYearApplicability: ["Final Year"],
        incomeMax: 800000,
        active: true,
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
        sourceClassification: "VERIFIED_REAL_DATA",
      },
      adminId
    );

    expect(opp.id).toBeDefined();
    expect(opp.title).toBe("Maharashtra Minority Higher Education Scholarship");
    createdOppId = opp.id;

    // Verify audit log
    const logs = await dataStore.getAuditLogs(5);
    const createLog = logs.find((l) => l.targetResourceId === opp.id);
    expect(createLog).toBeDefined();
    expect(createLog?.action).toBe("OPPORTUNITY_CREATED");
  });

  it("allows admin to update an existing opportunity", async () => {
    const updated = await dataStore.updateOpportunity(
      createdOppId,
      {
        title: "Maharashtra Minority Higher Education Scholarship (Updated)",
        incomeMax: 600000,
      },
      adminId
    );

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe("Maharashtra Minority Higher Education Scholarship (Updated)");
    expect(updated?.incomeMax).toBe(600000);

    const logs = await dataStore.getAuditLogs(5);
    const updateLog = logs.find((l) => l.targetResourceId === createdOppId && l.action === "OPPORTUNITY_UPDATED");
    expect(updateLog).toBeDefined();
  });

  it("rejects dangerous URL schemes for official and application links", () => {
    expect(isSafeUrl("javascript:alert('pwned')")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript:MsgBox(1)")).toBe(false);
    expect(isSafeUrl("https://mahadbt.maharashtra.gov.in")).toBe(true);
  });

  it("safely archives opportunity instead of deleting when active student journeys exist", async () => {
    const studentId = "student_journey_tester_1";
    // Student starts a journey for this opportunity
    await dataStore.createJourney(studentId, createdOppId);

    // Admin attempts standard delete (force = false)
    const result = await dataStore.deleteOpportunity(createdOppId, false, adminId);
    expect(result.success).toBe(true);
    expect(result.archived).toBe(true);
    expect(result.journeyCount).toBeGreaterThanOrEqual(1);

    // Opportunity should now be inactive and not shown as active recommendation
    const opp = await dataStore.getOpportunityById(createdOppId);
    expect(opp?.active).toBe(false);
    expect(opp?.verificationStatus).toBe("INACTIVE");

    // Matching score for inactive opportunity must be 0
    const match = calculateOpportunityMatch(DEMO_STUDENT_PROFILE, opp!);
    expect(match.score).toBe(0);
    expect(match.isHighMatch).toBe(false);
  });

  it("force deletes opportunity when explicitly confirmed", async () => {
    const result = await dataStore.deleteOpportunity(createdOppId, true, adminId);
    expect(result.success).toBe(true);
    expect(result.archived).toBe(false);

    const opp = await dataStore.getOpportunityById(createdOppId);
    expect(opp).toBeNull();
  });
});
