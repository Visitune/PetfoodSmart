import { ImageResponse } from "next/og";
import { getAllAnalyzedBrands } from "@/lib/brands";
import { GRADE_HEX, OG_WIDTH, OG_HEIGHT } from "@/lib/og/constants";

export const alt = "PetFoodSmart - Pet Food Ingredient Scanner";
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = "image/png";

export default async function OgImage() {
  const brands = getAllAnalyzedBrands();
  const sorted = [...brands].sort(
    (a, b) => a.analysis.score - b.analysis.score
  );

  const worst = sorted.slice(0, 3);
  const best = sorted.slice(-3).reverse();

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
          padding: "40px 60px",
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
            top: "0",
            left: "50%",
            width: "600px",
            height: "300px",
            borderRadius: "50%",
            backgroundColor: "rgba(99, 102, 241, 0.06)",
            boxShadow: "0 0 120px 60px rgba(99, 102, 241, 0.04)",
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
            padding: "32px 48px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            width: "100%",
            maxWidth: "1000px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 900,
              color: "#f5f5f5",
              marginBottom: "2px",
              letterSpacing: "-0.02em",
            }}
          >
            PetFoodSmart
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#737373",
              marginBottom: "28px",
              letterSpacing: "0.06em",
            }}
          >
            AI-Powered Pet Food Safety Scanner
          </div>

          <div
            style={{
              display: "flex",
              gap: "48px",
              width: "100%",
            }}
          >
            {/* Best column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  color: "#10b981",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  marginBottom: "14px",
                  fontWeight: 700,
                }}
              >
                Best Rated
              </div>
              {best.map((b) => (
                <div
                  key={b.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                    fontSize: 17,
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: GRADE_HEX[b.analysis.grade],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#ffffff",
                      boxShadow: `0 0 12px ${GRADE_HEX[b.analysis.grade]}44`,
                    }}
                  >
                    {b.analysis.grade}
                  </div>
                  <span style={{ display: "flex", color: "#d4d4d4" }}>
                    {`${b.brand} ${b.product}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Worst column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  color: "#ef4444",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  marginBottom: "14px",
                  fontWeight: 700,
                }}
              >
                Worst Rated
              </div>
              {worst.map((b) => (
                <div
                  key={b.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                    fontSize: 17,
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: GRADE_HEX[b.analysis.grade],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#ffffff",
                      boxShadow: `0 0 12px ${GRADE_HEX[b.analysis.grade]}44`,
                    }}
                  >
                    {b.analysis.grade}
                  </div>
                  <span style={{ display: "flex", color: "#d4d4d4" }}>
                    {`${b.brand} ${b.product}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            marginTop: "20px",
            fontSize: 17,
            color: "#525252",
            letterSpacing: "0.04em",
          }}
        >
          {`${brands.length} brands \u00b7 500+ ingredients \u00b7 Free & Open Source`}
        </div>
      </div>
    ),
    { ...size }
  );
}
