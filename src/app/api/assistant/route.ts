import { NextRequest, NextResponse } from "next/server";
import { askNagrikSetu, ChatMessage } from "@/lib/ai/provider";

// Basic in-memory sliding window rate limiter: max 20 requests per 60 seconds per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before sending more messages.",
          reply: "विनंत्यांची मर्यादा संपली आहे. कृपया काही सेकंद थांबा आणि पुन्हा प्रयत्न करा.",
          source: "verified_rules_engine",
        },
        { status: 429 }
      );
    }

    // 2. Request Body Validation
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const query = body.query;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query must be a non-empty string." },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length > 500) {
      return NextResponse.json(
        { error: "Query exceeds maximum length of 500 characters." },
        { status: 400 }
      );
    }

    // 3. Conversation History Sanitization (Bounded to last 6 messages)
    let validatedHistory: ChatMessage[] = [];
    if (Array.isArray(body.history)) {
      validatedHistory = body.history
        .slice(-6)
        .filter(
          (m: any) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
        .map((m: any) => ({
          role: m.role,
          content: m.content.slice(0, 500),
        }));
    }

    // 4. Server-Side Execution with Trusted Context
    const rawContext = body.context || {};
    const context = {
      studentProfile: rawContext.studentProfile || null,
      userInterests: rawContext.userInterests || [],
      activeJourneys: rawContext.activeJourneys || [],
      currentOpportunity: rawContext.currentOpportunity || null,
      history: validatedHistory,
      language: rawContext.language === "en" ? "en" : "mr",
    } as const;

    const result = await askNagrikSetu(trimmedQuery, context);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Assistant API Internal Error]", error);
    // Never leak stack trace or internal provider details
    return NextResponse.json(
      {
        reply:
          "नागरिकसेतू डेटाबेसमध्ये याबद्दल पुरेशी खात्रीशीर माहिती उपलब्ध नाही. तुम्ही उपलब्ध संधी, पात्रता, आवश्यक कागदपत्रे, मुदत किंवा अर्जाच्या टप्प्यांबद्दल विचारू शकता.",
        source: "verified_rules_engine",
      },
      { status: 200 }
    );
  }
}
