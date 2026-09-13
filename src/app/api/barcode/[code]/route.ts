/**
 * C1 - Barcode Lookup API Route
 *
 * GET /api/barcode/[code]
 * Validates the EAN checksum, looks the product up on Open Pet Food Facts,
 * and returns normalized product data. Server-side fetch: single egress
 * point (timeout + user-agent), no CORS issues for the client.
 */
import { NextResponse } from "next/server";
import { validateBarcode, lookupBarcode } from "@/lib/barcode";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  if (!rateLimit(_request, { limit: 30 }, "api-barcode")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { code } = await params;
  const validation = validateBarcode(decodeURIComponent(code ?? ""));
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Invalid barcode", reason: validation.error },
      { status: 400 }
    );
  }

  const result = await lookupBarcode(validation.ean);
  if (!result.found) {
    const status = result.reason === "not-found" ? 404 : 502;
    return NextResponse.json(
      { error: "Barcode lookup failed", reason: result.reason },
      { status }
    );
  }

  return NextResponse.json({ product: result.product });
}
