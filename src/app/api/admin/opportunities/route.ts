import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedAdminResponse } from "@/lib/auth/adminGuard";
import { dataStore } from "@/lib/database/store";
import { isSafeUrl } from "@/lib/validation/url";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const list = await dataStore.getOpportunities({
      search,
      type,
      status,
    });
    return NextResponse.json({ opportunities: list, total: list.length });
  } catch (error) {
    console.error("[Admin Opportunities GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth);
  }

  try {
    const body = await req.json();
    const {
      title,
      titleMr,
      type,
      provider,
      providerMr,
      shortDescription,
      shortDescriptionMr,
      description,
      descriptionMr,
      officialUrl,
      applicationUrl,
      deadline,
      startDate,
      incomeMax,
      stateApplicability,
      educationLevelApplicability,
      currentYearApplicability,
      sourceClassification,
      deadlineSource,
      eligibilitySource,
    } = body;

    // Validate required fields
    if (!title || !provider || !shortDescription || !deadline) {
      return NextResponse.json(
        { error: "Missing required fields: title, provider, shortDescription, and deadline are mandatory." },
        { status: 400 }
      );
    }

    // Security validation of URLs
    if (officialUrl && !isSafeUrl(officialUrl)) {
      return NextResponse.json(
        { error: "Security violation: Official URL has an unsafe scheme. Only http:// and https:// are permitted." },
        { status: 400 }
      );
    }

    if (applicationUrl && !isSafeUrl(applicationUrl)) {
      return NextResponse.json(
        { error: "Security violation: Application URL has an unsafe scheme. Only http:// and https:// are permitted." },
        { status: 400 }
      );
    }

    const slug = (title as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`;

    const newOpp = await dataStore.createOpportunity(
      {
        slug,
        title,
        titleMr: titleMr || title,
        type: type || "SCHOLARSHIP",
        provider,
        providerMr: providerMr || provider,
        shortDescription,
        shortDescriptionMr: shortDescriptionMr || shortDescription,
        description: description || shortDescription,
        descriptionMr: descriptionMr || shortDescriptionMr || description,
        officialUrl: officialUrl || "https://mahadbt.maharashtra.gov.in",
        applicationUrl: applicationUrl || officialUrl || "https://mahadbt.maharashtra.gov.in",
        deadline,
        startDate: startDate || undefined,
        incomeMax: incomeMax ? Number(incomeMax) : undefined,
        stateApplicability: stateApplicability || ["Maharashtra"],
        educationLevelApplicability: educationLevelApplicability || ["Diploma", "Undergraduate"],
        currentYearApplicability: currentYearApplicability || ["Final Year"],
        active: true,
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
        isDemo: false,
        sourceClassification: sourceClassification || "VERIFIED_REAL_DATA",
        deadlineSource: deadlineSource || "Admin Verified Notification",
        eligibilitySource: eligibilitySource || "Official Government Gazette / Department Portal",
      },
      auth.user?.id
    );

    return NextResponse.json(newOpp, { status: 201 });
  } catch (error) {
    console.error("[Admin Opportunities POST Error]", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
