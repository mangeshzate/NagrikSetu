import { describe, it, expect, beforeEach } from "vitest";
import { isSafeUrl, sanitizeUrl } from "../lib/validation/url";
import { dataStore } from "../lib/database/store";

describe("NagrikSetu Security & Isolation Audit Suite", () => {
  describe("URL Safety & XSS Scheme Prevention", () => {
    it("accepts valid https and http government URLs", () => {
      expect(isSafeUrl("https://mahadbt.maharashtra.gov.in")).toBe(true);
      expect(isSafeUrl("https://mpsc.gov.in/exams")).toBe(true);
      expect(isSafeUrl("http://msbte.org.in/results?id=123")).toBe(true);
      expect(sanitizeUrl("https://msins.in")).toBe("https://msins.in");
    });

    it("rejects malicious javascript: URI schemes", () => {
      expect(isSafeUrl("javascript:alert(document.cookie)")).toBe(false);
      expect(isSafeUrl("JAVASCRIPT:alert(1)")).toBe(false);
      expect(isSafeUrl("  javascript:void(0)  ")).toBe(false);
      expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
      expect(sanitizeUrl("javascript:alert(1)", "/fallback")).toBe("/fallback");
    });

    it("rejects data: URI schemes to prevent HTML/SVG injection", () => {
      expect(isSafeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
      expect(isSafeUrl("DATA:image/svg+xml;utf8,<svg></svg>")).toBe(false);
      expect(sanitizeUrl("data:text/html,<script>evil()</script>")).toBe("#");
    });

    it("rejects vbscript: and file: URI schemes", () => {
      expect(isSafeUrl("vbscript:MsgBox(1)")).toBe(false);
      expect(isSafeUrl("file:///C:/Windows/System32/calc.exe")).toBe(false);
    });

    it("handles null, undefined, empty, and malformed inputs safely", () => {
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
      expect(isSafeUrl("")).toBe(false);
      expect(isSafeUrl("   ")).toBe(false);
      expect(isSafeUrl("not a url at all")).toBe(false);
      expect(sanitizeUrl(null)).toBe("#");
    });
  });

  describe("Cross-User Journey IDOR Protection", () => {
    const studentAId = "user_student_alpha";
    const studentBId = "user_student_beta";
    const oppId = "opp_mahadbt_ebc";
    let journeyAId: string;

    beforeEach(async () => {
      // Create a journey for Student A
      const journeyA = await dataStore.createJourney(studentAId, oppId);
      journeyAId = journeyA.id;
    });

    it("allows the owner (Student A) to view their journey", async () => {
      const journey = await dataStore.getJourneyById(journeyAId, studentAId, "STUDENT");
      expect(journey).not.toBeNull();
      expect(journey?.userId).toBe(studentAId);
    });

    it("blocks Student B from viewing Student A's journey by ID (IDOR prevention)", async () => {
      const journey = await dataStore.getJourneyById(journeyAId, studentBId, "STUDENT");
      expect(journey).toBeNull();
    });

    it("blocks Student B from mutating Student A's journey step status", async () => {
      const journeyA = await dataStore.getJourneyById(journeyAId, studentAId, "STUDENT");
      const stepId = journeyA!.steps![1].id; // Step 2 is initially NOT_STARTED

      // Student B attempts to mark Student A's step as COMPLETED
      const mutated = await dataStore.updateJourneyStepStatus(
        journeyAId,
        stepId,
        "COMPLETED",
        studentBId,
        "STUDENT"
      );
      expect(mutated).toBeNull();

      // Verify Student A's step status remained untouched
      const verified = await dataStore.getJourneyById(journeyAId, studentAId, "STUDENT");
      expect(verified?.steps?.[1].status).toBe("NOT_STARTED");
    });

    it("allows an authenticated Administrator to view any student journey for audit support", async () => {
      const journey = await dataStore.getJourneyById(journeyAId, "admin_user_id", "ADMIN");
      expect(journey).not.toBeNull();
      expect(journey?.id).toBe(journeyAId);
    });
  });

  describe("Duplicate Journey Prevention & Expiration Guard", () => {
    it("returns the existing journey when a student requests to start the same scheme twice", async () => {
      const userId = "user_duplicate_test";
      const oppId = "opp_panjabrao_hostel";

      const journey1 = await dataStore.createJourney(userId, oppId);
      const journey2 = await dataStore.createJourney(userId, oppId);

      expect(journey1.id).toBe(journey2.id);

      const allUserJourneys = await dataStore.getUserJourneys(userId);
      const matchingJourneys = allUserJourneys.filter((j) => j.opportunityId === oppId);
      expect(matchingJourneys).toHaveLength(1);
    });

    it("prevents starting a journey for an expired opportunity", async () => {
      const userId = "user_expired_test";
      const expiredOppId = "opp_aicte_expired"; // Active: false, status: EXPIRED

      await expect(dataStore.createJourney(userId, expiredOppId)).rejects.toThrow(
        "Cannot start action journey for an inactive or expired opportunity"
      );
    });
  });

  describe("Truthful Account Deletion Purging", () => {
    it("genuinely purges student profiles, journeys, document states, and answers", async () => {
      const purgeUserId = "user_to_be_purged";

      // Setup user data
      await dataStore.saveStudentProfile(purgeUserId, {
        district: "Nagpur",
        educationLevel: "Undergraduate",
      });
      await dataStore.createJourney(purgeUserId, "opp_mahadbt_ebc");
      await dataStore.setUserDocumentStatus(purgeUserId, "doc_marksheet", "AVAILABLE");
      await dataStore.saveAdditionalAnswer(purgeUserId, "family_income_max", 180000);

      // Verify existence before purge
      expect(await dataStore.getStudentProfile(purgeUserId)).not.toBeNull();
      expect(await dataStore.getUserJourneys(purgeUserId)).toHaveLength(1);
      expect(await dataStore.getUserDocumentStatuses(purgeUserId)).toHaveLength(1);
      expect(await dataStore.getAdditionalAnswers(purgeUserId)).toHaveProperty("family_income_max");

      // Execute account deletion purge
      const deleted = await dataStore.deleteUserAccount(purgeUserId);
      expect(deleted).toBe(true);

      // Verify complete purge
      expect(await dataStore.getStudentProfile(purgeUserId)).toBeNull();
      expect(await dataStore.getUserJourneys(purgeUserId)).toHaveLength(0);
      expect(await dataStore.getUserDocumentStatuses(purgeUserId)).toHaveLength(0);
      expect(await dataStore.getAdditionalAnswers(purgeUserId)).toEqual({});
    });
  });
});
