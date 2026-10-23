import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedAdminResponse } from "@/lib/auth/adminGuard";
import { dataStore } from "@/lib/database/store";
import { isSafeUrl } from "@/lib/validation/url";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  const { id } = await params;
  try {
    const opp = await dataStore.getOpportunityById(id);
    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const [rules, docs] = await Promise.all([
      dataStore.getRulesForOpportunity(id),
      dataStore.getDocumentsForOpportunity(id),
    ]);

    return NextResponse.json({
      opportunity: opp,
      rules,
      documents: docs,
    });
  } catch (error) {
    console.error("[Admin Opportunity GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity details" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  const { id } = await params;
  try {
    const body = await req.json();

    // Check URLs if provided
    if (body.officialUrl && !isSafeUrl(body.officialUrl)) {
      return NextResponse.json(
        { error: "Security violation: Official URL has an unsafe scheme. Only http:// and https:// are permitted." },
        { status: 400 }
      );
    }

    if (body.applicationUrl && !isSafeUrl(body.applicationUrl)) {
      return NextResponse.json(
        { error: "Security violation: Application URL has an unsafe scheme. Only http:// and https:// are permitted." },
        { status: 400 }
      );
    }

    const updated = await dataStore.updateOpportunity(id, body, auth.user?.id);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin Opportunity PATCH Error]", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";

  try {
    const result = await dataStore.deleteOpportunity(id, force, auth.user?.id);
    if (!result.success && result.journeyCount === 0) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      archived: result.archived,
      journeyCount: result.journeyCount,
      message: result.archived
        ? `Opportunity safely archived because ${result.journeyCount} active student journeys exist.`
        : "Opportunity successfully deleted.",
    });
  } catch (error) {
    console.error("[Admin Opportunity DELETE Error]", error);
    return NextResponse.json(
      { error: "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
