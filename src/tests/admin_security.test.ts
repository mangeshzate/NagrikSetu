import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { verifyAdminRequest } from "../lib/auth/adminGuard";
import { dataStore } from "../lib/database/store";
import { DEMO_ADMIN_USER, DEMO_STUDENT_USER } from "../lib/database/mockData";

describe("Admin Security & Multi-Layer Authorization Suite", () => {
  it("rejects unauthenticated requests without session cookie (401)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/metrics");
    const result = await verifyAdminRequest(req);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain("Authentication required");
  });

  it("rejects authenticated students attempting to access admin APIs (403)", async () => {
    const studentSession = {
      id: DEMO_STUDENT_USER.id,
      userId: DEMO_STUDENT_USER.id,
      name: DEMO_STUDENT_USER.name,
      email: DEMO_STUDENT_USER.email,
      role: "STUDENT",
    };

    const req = new NextRequest("http://localhost:3000/api/admin/metrics", {
      headers: {
        cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(studentSession))}`,
      },
    });

    const result = await verifyAdminRequest(req);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain("Forbidden");
  });

  it("allows verified administrators to access admin APIs (200 / authorized)", async () => {
    const adminSession = {
      id: DEMO_ADMIN_USER.id,
      userId: DEMO_ADMIN_USER.id,
      name: DEMO_ADMIN_USER.name,
      email: DEMO_ADMIN_USER.email,
      role: "ADMIN",
    };

    const req = new NextRequest("http://localhost:3000/api/admin/metrics", {
      headers: {
        cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(adminSession))}`,
      },
    });

    const result = await verifyAdminRequest(req);
    expect(result.authorized).toBe(true);
    expect(result.user?.role).toBe("ADMIN");
  });

  it("strictly prohibits spoofing role via request body or query params", async () => {
    const studentSession = {
      id: "student_attacker_99",
      userId: "student_attacker_99",
      name: "Attacker",
      email: "attacker@test.com",
      role: "STUDENT",
    };

    // Attacker crafts request with role: "ADMIN" in body
    const req = new NextRequest("http://localhost:3000/api/admin/opportunities?role=ADMIN", {
      method: "POST",
      headers: {
        cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(studentSession))}`,
      },
    });

    const result = await verifyAdminRequest(req);
    // Server ignores client query/body and verifies cookie session
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
  });

  it("strictly prevents deleting administrator accounts via student management", async () => {
    // Attempting to delete an administrator account must throw a Security Violation
    await expect(
      dataStore.deleteStudentAccountByAdmin(DEMO_ADMIN_USER.id, DEMO_ADMIN_USER.id)
    ).rejects.toThrow("Administrator accounts cannot be deleted through student management");
  });
});
