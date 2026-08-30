/**
 * F025 - Share Image API Route
 *
 * Server-side share image generation using Next.js ImageResponse.
 *
 * GET /api/share-image?slug=xxx&format=square — brand share image
 * POST /api/share-image?format=square — scan result share image (body: analysis data)
 *
 * Formats: "og" (1200×630) or "square" (1080×1080, default)
 */

import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAnalyzedBrandBySlug } from "@/lib/brands";
import {
  OG_WIDTH,
  OG_HEIGHT,
  SQUARE_WIDTH,
  SQUARE_HEIGHT,
} from "@/lib/og/constants";
import type { ShareFormat } from "@/lib/og/constants";
import type { Grade, AnalysisSummary } from "@/lib/analyzer/types";
import { buildShareImage } from "@/lib/og/share-image";
import type { ShareImageData } from "@/lib/og/share-image";

const VALID_GRADES = new Set(["A", "B", "C", "D", "F"]);

function getFormatAndSize(searchParams: URLSearchParams): {
  format: ShareFormat;
  width: number;
  height: number;
} {
  const format = searchParams.get("format") === "og" ? "og" : "square";
  return format === "og"
    ? { format, width: OG_WIDTH, height: OG_HEIGHT }
    : { format, width: SQUARE_WIDTH, height: SQUARE_HEIGHT };
}

/** GET — generate share image for a known brand */
export async function GET(request: NextRequest) {
  if (!rateLimit(request, { limit: 60 }, "api-share-image")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug parameter" },
      { status: 400 }
    );
  }

  const brand = getAnalyzedBrandBySlug(slug);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const { format, width, height } = getFormatAndSize(searchParams);
  const { grade, score, summary, verdict, ingredients } = brand.analysis;

  const data: ShareImageData = {
    grade,
    score,
    summary,
    verdict,
    foodName: `${brand.brand} ${brand.product}`,
    petType: brand.petType,
    harmfulNames: ingredients
      .filter((i) => i.flag === "red")
      .slice(0, 5)
      .map((i) => i.original),
    safeNames: ingredients
      .filter((i) => i.flag === "green")
      .slice(0, 5)
      .map((i) => i.original),
  };

  return new ImageResponse(buildShareImage(data, format), { width, height });
}

interface ShareImageBody {
  grade: string;
  score: number;
  summary: AnalysisSummary;
  verdict: string;
  foodName?: string;
  harmfulNames?: string[];
  safeNames?: string[];
}

function isValidBody(body: unknown): body is ShareImageBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.grade === "string" &&
    VALID_GRADES.has(b.grade) &&
    typeof b.score === "number" &&
    b.score >= 0 &&
    b.score <= 100 &&
    typeof b.summary === "object" &&
    b.summary !== null &&
    typeof b.verdict === "string"
  );
}

/** POST — generate share image for arbitrary scan results */
export async function POST(request: NextRequest) {
  if (!rateLimit(request, { limit: 60 }, "api-share-image")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: "Invalid body: requires grade (A-F), score (0-100), summary, verdict" },
      { status: 400 }
    );
  }

  const { searchParams } = request.nextUrl;
  const { format, width, height } = getFormatAndSize(searchParams);

  const data: ShareImageData = {
    grade: body.grade as Grade,
    score: body.score,
    summary: body.summary,
    verdict: body.verdict,
    foodName: body.foodName,
    harmfulNames: body.harmfulNames,
    safeNames: body.safeNames,
  };

  return new ImageResponse(buildShareImage(data, format), { width, height });
}
