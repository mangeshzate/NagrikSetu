import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedAdminResponse } from "@/lib/auth/adminGuard";
import { dataStore } from "@/lib/database/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  const { id: targetStudentId } = await params;
  if (!targetStudentId) {
    return NextResponse.json({ error: "Target student ID is required." }, { status: 400 });
  }

  // Ensure an admin cannot call this endpoint to delete their own account or another admin
  if (targetStudentId === auth.user?.id) {
    return NextResponse.json(
      { error: "Security violation: Admins cannot delete their own account through student management." },
      { status: 400 }
    );
  }

  try {
    const result = await dataStore.deleteStudentAccountByAdmin(auth.user!.id, targetStudentId);
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    const errorMsg = error?.message || "Failed to delete student account.";
    if (errorMsg.includes("Security Violation")) {
      return NextResponse.json({ error: errorMsg }, { status: 403 });
    }
    if (errorMsg.includes("not found")) {
      return NextResponse.json({ error: errorMsg }, { status: 404 });
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
