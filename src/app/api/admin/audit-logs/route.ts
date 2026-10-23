import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedAdminResponse } from "@/lib/auth/adminGuard";
import { dataStore } from "@/lib/database/store";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  try {
    const logs = await dataStore.getAuditLogs(limit);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[Admin Audit Logs GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
