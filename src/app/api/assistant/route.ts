import { NextRequest, NextResponse } from "next/server";
import { askNagrikSetu } from "@/lib/ai/provider";

// Basic in-memory rate limiter per IP: max 20 requests per 60 seconds
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
    // 1. IP rate limit check
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

    // 2. Body validation
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmed = query.trim();
    if (trimmed.length > 500) {
      return NextResponse.json(
        { error: "Query exceeds maximum length of 500 characters" },
        { status: 400 }
      );
    }

    // 3. Delegate to server-side AI provider with strict grounding
    const context = body.context || { language: "mr" };
    const result = await askNagrikSetu(trimmed, context);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Assistant API Error]", error);
    return NextResponse.json(
      {
        reply:
          "सध्या सहाय्यक सेवेत व्यत्यय आला आहे. कृपया थेट पोर्टलवरील संधी सूची व अधिकृत लिंक्स तपासा.",
        source: "verified_rules_engine",
      },
      { status: 500 }
    );
  }
}
