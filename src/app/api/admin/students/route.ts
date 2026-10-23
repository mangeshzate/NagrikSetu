import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedAdminResponse } from "@/lib/auth/adminGuard";
import { dataStore } from "@/lib/database/store";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const result = await dataStore.getAllStudents({ search, page, limit });
    return NextResponse.json({
      students: result.students,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error("[Admin Students GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch student directory" },
      { status: 500 }
    );
  }
}
