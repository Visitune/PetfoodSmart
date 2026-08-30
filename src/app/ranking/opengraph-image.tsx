import { ImageResponse } from "next/og";
import { getAllAnalyzedBrands } from "@/lib/brands";
import { GRADE_HEX, OG_WIDTH, OG_HEIGHT } from "@/lib/og/constants";
import type { Grade } from "@/lib/analyzer/types";

export const alt = "Pet Food Safety Rankings | PetFoodSmart";
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = "image/png";

export default async function OgImage() {
  const brands = getAllAnalyzedBrands();

  const gradeCount: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const b of brands) {
    gradeCount[b.analysis.grade]++;
  }

  const topBrands = [...brands]
    .sort((a, b) => b.analysis.score - a.analysis.score)
    .slice(0, 5);

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
          padding: "36px 60px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle ambient glow */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "-100px",
            left: "50%",
            width: "700px",
            height: "350px",
            borderRadius: "50%",
            backgroundColor: "rgba(99, 102, 241, 0.05)",
            boxShadow: "0 0 140px 70px rgba(99, 102, 241, 0.03)",
            transform: "translateX(-50%)",
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
            padding: "28px 40px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            width: "100%",
            maxWidth: "1000px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 900,
              color: "#f5f5f5",
              marginBottom: "4px",
              letterSpacing: "-0.02em",
            }}
          >
            Pet Food Safety Rankings
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#737373",
              marginBottom: "24px",
              letterSpacing: "0.04em",
            }}
          >
            {`${brands.length} brands analyzed by PetFoodSmart`}
          </div>

          {/* Grade distribution */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            {(["A", "B", "C", "D", "F"] as Grade[]).map((g) => (
              <div
                key={g}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: GRADE_HEX[g],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#ffffff",
                    boxShadow: `0 0 16px ${GRADE_HEX[g]}44`,
                  }}
                >
                  {g}
                </div>
                <span style={{ display: "flex", fontSize: 18, color: "#a3a3a3", fontWeight: 600 }}>
                  {String(gradeCount[g])}
                </span>
              </div>
            ))}
          </div>

          {/* Top brands */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: "100%",
              maxWidth: "750px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 12,
                color: "#525252",
                textTransform: "uppercase",
                letterSpacing: "3px",
                marginBottom: "4px",
              }}
            >
              Top Rated
            </div>
            {topBrands.map((b, i) => (
              <div
                key={b.slug}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: 18,
                  padding: "4px 0",
                }}
              >
                <span style={{ display: "flex", color: "#525252", width: "22px", fontSize: 15, fontWeight: 600 }}>
                  {`${i + 1}.`}
                </span>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: GRADE_HEX[b.analysis.grade],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#ffffff",
                    boxShadow: `0 0 8px ${GRADE_HEX[b.analysis.grade]}33`,
                  }}
                >
                  {b.analysis.grade}
                </div>
                <span style={{ display: "flex", color: "#d4d4d4", fontWeight: 500 }}>
                  {`${b.brand} ${b.product}`}
                </span>
                <span style={{ display: "flex", color: "#525252", marginLeft: "auto", fontSize: 16, fontWeight: 600 }}>
                  {`${b.analysis.score}/100`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
