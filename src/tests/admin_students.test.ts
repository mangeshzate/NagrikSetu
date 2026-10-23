import { describe, it, expect, beforeEach } from "vitest";
import { dataStore } from "../lib/database/store";
import { DEMO_ADMIN_USER, DEMO_STUDENT_USER } from "../lib/database/mockData";

describe("Admin Student Management & Safe Deletion Suite", () => {
  const adminId = DEMO_ADMIN_USER.id;

  it("lists students with privacy-conscious summaries without sensitive auth fields", async () => {
    const result = await dataStore.getAllStudents({ page: 1, limit: 10 });
    expect(result.students.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);

    const firstStudent = result.students[0];
    expect(firstStudent.id).toBeDefined();
    expect(firstStudent.name).toBeDefined();
    expect(firstStudent.email).toBeDefined();
    expect(firstStudent.maskedMobile).toMatch(/^\+91 98\*\*\* \*\*\d{3}$/);

    // Verify sensitive auth fields are NEVER returned
    expect((firstStudent as any).password).toBeUndefined();
    expect((firstStudent as any).token).toBeUndefined();
    expect((firstStudent as any).otp).toBeUndefined();
    expect((firstStudent as any).refreshToken).toBeUndefined();
  });

  it("supports student search by name or district", async () => {
    const result = await dataStore.getAllStudents({ search: "Prathamesh" });
    expect(result.students.some((s) => s.name.includes("Prathamesh"))).toBe(true);

    const nashikResult = await dataStore.getAllStudents({ search: "Nashik" });
    expect(nashikResult.students.some((s) => s.district === "Nashik")).toBe(true);
  });

  it("safely deletes student account and cascade purges all associated records", async () => {
    const testStudentId = "user_student_to_delete_test";

    // Setup student user in directory
    await dataStore.registerUser({
      id: testStudentId,
      userId: testStudentId,
      name: "Student To Delete",
      email: "delete.test@example.com",
      role: "STUDENT",
      preferredLanguage: "mr",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Setup student profile, journey, and document status for this test user
    await dataStore.saveStudentProfile(testStudentId, {
      educationLevel: "Diploma",
      district: "Pune",
      incomeRange: "1_TO_2_5_LAKH",
    });

    await dataStore.createJourney(testStudentId, "opp_mahadbt_ebc");
    await dataStore.setUserDocumentStatus(testStudentId, "doc_marksheet", "AVAILABLE");

    // Admin executes deletion
    const delResult = await dataStore.deleteStudentAccountByAdmin(adminId, testStudentId);
    expect(delResult.success).toBe(true);

    // Verify student profile is purged
    const profile = await dataStore.getStudentProfile(testStudentId);
    expect(profile).toBeNull();

    // Verify journeys are purged
    const journeys = await dataStore.getUserJourneys(testStudentId);
    expect(journeys.length).toBe(0);

    // Verify document statuses are purged
    const docStatuses = await dataStore.getUserDocumentStatuses(testStudentId);
    expect(docStatuses.length).toBe(0);

    // Verify audit log exists
    const logs = await dataStore.getAuditLogs(5);
    const deleteLog = logs.find(
      (l) => l.action === "STUDENT_DELETED" && l.targetResourceId === testStudentId
    );
    expect(deleteLog).toBeDefined();
  });
});
