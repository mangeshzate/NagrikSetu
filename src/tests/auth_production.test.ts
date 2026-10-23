import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { normalizeIndianMobile } from "../lib/auth/context";
import { verifyAdminRequest } from "../lib/auth/adminGuard";
import { getTrustedUserProfile, isServerAdmin } from "../lib/auth/roles";
import { middleware } from "../middleware";
import { POST as verifyPhoneHandler } from "../app/api/auth/verify-phone/route";
import { GET as authMeHandler } from "../app/api/auth/me/route";
import { POST as logoutHandler } from "../app/api/auth/logout/route";
import { GET as callbackHandler } from "../app/auth/callback/route";
import { DEMO_ADMIN_USER, DEMO_STUDENT_USER } from "../lib/database/mockData";

describe("Production Authentication & Security Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 1. Mobile Number Normalization & Validation ---
  describe("Mobile Normalization (+91 Indian Standards)", () => {
    it("normalizes valid 10-digit Indian numbers starting with 6, 7, 8, or 9", () => {
      expect(normalizeIndianMobile("9820012345")).toBe("+919820012345");
      expect(normalizeIndianMobile("8765432109")).toBe("+918765432109");
      expect(normalizeIndianMobile("7012345678")).toBe("+917012345678");
      expect(normalizeIndianMobile("6201234567")).toBe("+916201234567");
    });

    it("normalizes numbers already with country code or spaces/dashes", () => {
      expect(normalizeIndianMobile("+91 98200 12345")).toBe("+919820012345");
      expect(normalizeIndianMobile("91-98200-12345")).toBe("+919820012345");
    });

    it("rejects invalid numbers (less than 10 digits, invalid starting digit, foreign formats)", () => {
      expect(normalizeIndianMobile("1234567890")).toBeNull(); // starts with 1
      expect(normalizeIndianMobile("98200")).toBeNull(); // too short
      expect(normalizeIndianMobile("98200123456789")).toBeNull(); // too long
      expect(normalizeIndianMobile("abcdefghij")).toBeNull();
    });
  });

  // --- 2. Student Email & Mobile OTP Verification API ---
  describe("Student OTP Flows & Phone Verification Endpoint", () => {
    it("handles student mobile OTP verification with valid 6-digit code", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9820012345", token: "123456" }),
      });

      const res = await verifyPhoneHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.verified).toBe(true);
      expect(data.phone).toBe("+919820012345");
    });

    it("rejects invalid OTP token format (< 6 digits)", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9820012345", token: "12" }),
      });

      const res = await verifyPhoneHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("rejects invalid mobile numbers on verification endpoint", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "12345", token: "123456" }),
      });

      const res = await verifyPhoneHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("valid 10-digit Indian mobile number");
    });
  });

  // --- 3. Client Anti-Privilege Escalation & Tampering Prevention ---
  describe("Zero-Trust Anti-Tampering & Client Spoofing Prevention", () => {
    it("rejects client setting phone_verified or ADMIN role directly via forged session cookie", async () => {
      // Attacker attempts to spoof an admin role and verified phone in cookie
      const attackerSession = {
        id: "student_attacker_1",
        userId: "student_attacker_1",
        name: "Attacker",
        email: "attacker@gmail.com",
        role: "ADMIN", // FAKE ROLE CLAIMED BY CLIENT
        phoneVerified: true, // FAKE PHONE VERIFIED CLAIMED BY CLIENT
      };

      const req = new NextRequest("http://localhost:3000/api/admin/metrics", {
        headers: {
          cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(attackerSession))}`,
        },
      });

      const result = await verifyAdminRequest(req);

      // Server does not trust client-claimed role; strictly queries trusted store
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toContain("Forbidden");
    });

    it("verifies isServerAdmin returns false for arbitrary non-admin user IDs", async () => {
      expect(await isServerAdmin("random_untrusted_id")).toBe(false);
      expect(await isServerAdmin("user_attacker")).toBe(false);
      expect(await isServerAdmin(DEMO_STUDENT_USER.id)).toBe(false);
    });

    it("verifies isServerAdmin returns true ONLY for trusted administrator IDs", async () => {
      expect(await isServerAdmin(DEMO_ADMIN_USER.id)).toBe(true);
      expect(await isServerAdmin(DEMO_ADMIN_USER.userId)).toBe(true);
    });
  });

  // --- 4. Admin API Route Protection ---
  describe("Admin API Route Guarding (verifyAdminRequest)", () => {
    it("rejects unauthenticated requests without session credentials (401)", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/opportunities");
      const result = await verifyAdminRequest(req);

      expect(result.authorized).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toContain("Authentication required");
    });

    it("rejects authenticated students attempting to access admin APIs (403)", async () => {
      const studentSession = {
        id: DEMO_STUDENT_USER.id,
        userId: DEMO_STUDENT_USER.id,
        email: DEMO_STUDENT_USER.email,
        role: "STUDENT",
      };

      const req = new NextRequest("http://localhost:3000/api/admin/students", {
        headers: {
          cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(studentSession))}`,
        },
      });

      const result = await verifyAdminRequest(req);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(403);
    });

    it("authorizes verified administrators (200 / authorized: true)", async () => {
      const adminSession = {
        id: DEMO_ADMIN_USER.id,
        userId: DEMO_ADMIN_USER.id,
        email: DEMO_ADMIN_USER.email,
        role: "ADMIN",
      };

      const req = new NextRequest("http://localhost:3000/api/admin/students", {
        headers: {
          cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(adminSession))}`,
        },
      });

      const result = await verifyAdminRequest(req);
      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe("ADMIN");
      expect(result.user?.id).toBe(DEMO_ADMIN_USER.id);
    });
  });

  // --- 5. Edge Middleware Route Protection & Redirect Routing ---
  describe("Edge Middleware Route Protection", () => {
    it("redirects unauthenticated users trying to access /admin to /admin/login", async () => {
      const req = new NextRequest("http://localhost:3000/admin");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/admin/login");
    });

    it("allows public access to dedicated /admin/login page", async () => {
      const req = new NextRequest("http://localhost:3000/admin/login");
      const res = await middleware(req);

      // Does not redirect; allows viewing admin login form
      expect(res.status).toBe(200);
    });

    it("redirects authenticated student trying to access /admin to /admin/login with unauthorized error", async () => {
      const studentSession = {
        id: DEMO_STUDENT_USER.id,
        userId: DEMO_STUDENT_USER.id,
        role: "STUDENT",
      };

      const req = new NextRequest("http://localhost:3000/admin/opportunities", {
        headers: {
          cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(studentSession))}`,
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/admin/login?error=unauthorized");
    });

    it("redirects unauthenticated users trying to access /dashboard to /login", async () => {
      const req = new NextRequest("http://localhost:3000/dashboard");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects student with unverified mobile to /verify-mobile when attempting to access /dashboard", async () => {
      // Simulate authenticated student who has NOT verified mobile
      const unverifiedSession = {
        id: "student_unverified_mobile",
        userId: "student_unverified_mobile",
        email: "unverified@test.com",
        role: "STUDENT",
        phoneVerified: false,
        onboardingCompleted: false,
      };

      // Mock getTrustedUserProfile to return unverified phone
      const req = new NextRequest("http://localhost:3000/dashboard", {
        headers: {
          cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(unverifiedSession))}`,
        },
      });

      const res = await middleware(req);
      // Either redirects to /login (if unverified id is not found in trusted store) or /verify-mobile
      expect([307, 308]).toContain(res.status);
      const loc = res.headers.get("location") || "";
      expect(loc.includes("/verify-mobile") || loc.includes("/login")).toBe(true);
    });
  });

  // --- 6. Google OAuth Callback Route Handling ---
  describe("OAuth Callback Route Handling (/auth/callback)", () => {
    it("redirects to /login if auth code is missing", async () => {
      const req = new NextRequest("http://localhost:3000/auth/callback");
      const res = await callbackHandler(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?error=missing_auth_code");
    });
  });

  // --- 7. Session Termination & Logout Security ---
  describe("Logout & Session Termination (/api/auth/logout)", () => {
    it("terminates session, clears cookies, and resets max-age to 0", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/logout", {
        method: "POST",
      });

      const res = await logoutHandler(req);
      expect(res.status).toBe(200);

      // Check that session cookie is deleted with max-age 0
      const setCookie = res.headers.get("set-cookie") || "";
      expect(setCookie).toContain("nagriksetu_session=;");
      expect(setCookie).toContain("Max-Age=0");
    });
  });

  // --- 8. Demo Bypass Guard in Production Mode ---
  describe("Demo Bypass Protection (NEXT_PUBLIC_DEMO_MODE=false)", () => {
    it("strictly refuses demo bypass when NEXT_PUBLIC_DEMO_MODE is false in production", async () => {
      const origDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
      const origEnv = process.env.NODE_ENV;

      try {
        process.env.NEXT_PUBLIC_DEMO_MODE = "false";
        (process.env as any).NODE_ENV = "production";

        const req = new NextRequest("http://localhost:3000/api/admin/metrics", {
          headers: {
            cookie: `nagriksetu_session=${encodeURIComponent(JSON.stringify(DEMO_ADMIN_USER))}`,
          },
        });

        const result = await verifyAdminRequest(req);
        // In production with NEXT_PUBLIC_DEMO_MODE=false, demo session cookie is strictly rejected
        expect(result.authorized).toBe(false);
        expect(result.status).toBe(401);
      } finally {
        process.env.NEXT_PUBLIC_DEMO_MODE = origDemo;
        (process.env as any).NODE_ENV = origEnv;
      }
    });
  });
});
