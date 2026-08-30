import { ImageResponse } from "next/og";
import { getAnalyzedBrandBySlug, getAllBrandSlugs } from "@/lib/brands";
import { GRADE_HEX, OG_WIDTH, OG_HEIGHT } from "@/lib/og/constants";
import type { Grade } from "@/lib/analyzer/types";

export const alt = "PetFoodSmart Brand Safety Grade";
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = "image/png";

/** Grade-specific glow color (brighter than badge for radiant effect) */
const GRADE_GLOW: Record<Grade, string> = {
  A: "#34d399",
  B: "#a3e635",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#f87171",
};

export function generateStaticParams(): { slug: string }[] {
  return getAllBrandSlugs().map((slug) => ({ slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getAnalyzedBrandBySlug(slug);

  if (!brand) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "linear-gradient(145deg, #0c0a1d 0%, #0a0a0a 45%, #0d1117 100%)",
            color: "#ffffff",
            fontSize: 48,
          }}
        >
          Brand Not Found
        </div>
      ),
      { ...size }
    );
  }

  const { grade, score, summary } = brand.analysis;
  const gradeColor = GRADE_HEX[grade];
  const glowColor = GRADE_GLOW[grade];
  const petEmoji = brand.petType === "cat" ? "\ud83d\udc31" : "\ud83d\udc36";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(145deg, #0c0a1d 0%, #0a0a0a 45%, #0d1117 100%)",
          padding: "32px 48px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient grade glow */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            backgroundColor: `${glowColor}18`,
            boxShadow: `0 0 120px 60px ${glowColor}12`,
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Glass card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            padding: "28px 48px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            <span style={{ display: "flex", fontSize: 22, color: "#737373", letterSpacing: "0.05em" }}>
              {`${petEmoji} PetFoodSmart`}
            </span>
          </div>

          {/* Grade circle with enhanced glow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              backgroundColor: gradeColor,
              marginBottom: "10px",
              boxShadow: `0 0 40px ${glowColor}55, 0 0 80px ${glowColor}30, 0 4px 20px rgba(0,0,0,0.4)`,
            }}
          >
            <span
              style={{
                display: "flex",
                fontSize: 80,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1,
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {grade}
            </span>
          </div>

          {/* Score */}
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: gradeColor,
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: "14px",
            }}
          >
            {`${score} / 100`}
          </div>

          {/* Brand name */}
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 800,
              color: "#f5f5f5",
              textAlign: "center",
              marginBottom: "18px",
              letterSpacing: "-0.01em",
            }}
          >
            {`${brand.brand} ${brand.product}`}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                borderRadius: "16px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  display: "flex",
                  boxShadow: "0 0 6px #ef4444",
                }}
              />
              <span style={{ display: "flex", color: "#ef4444", fontSize: 17, fontWeight: 600 }}>
                {`${summary.harmfulCount} harmful`}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                borderRadius: "16px",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  display: "flex",
                  boxShadow: "0 0 6px #f59e0b",
                }}
              />
              <span style={{ display: "flex", color: "#f59e0b", fontSize: 17, fontWeight: 600 }}>
                {`${summary.cautionCount} caution`}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                borderRadius: "16px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  display: "flex",
                  boxShadow: "0 0 6px #10b981",
                }}
              />
              <span style={{ display: "flex", color: "#10b981", fontSize: 17, fontWeight: 600 }}>
                {`${summary.safeCount} safe`}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
