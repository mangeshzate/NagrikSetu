import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedAdminResponse } from "@/lib/auth/adminGuard";
import { dataStore } from "@/lib/database/store";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  try {
    const metrics = await dataStore.getAdminMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[Admin Metrics API Error]", error);
    return NextResponse.json(
      { error: "Internal server error fetching admin metrics" },
      { status: 500 }
    );
  }
}
