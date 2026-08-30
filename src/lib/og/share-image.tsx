/**
 * F035 - Redesigned share image builder with gradient background,
 * glassmorphism card, grade-colored glow, and premium typography.
 *
 * Renders JSX for both landscape (1200×630 OG) and square (1080×1080 小红书/Instagram)
 * formats. Used by /api/share-image route.
 */

import type { Grade, AnalysisSummary } from "@/lib/analyzer/types";
import { GRADE_HEX } from "./constants";
import type { ShareFormat } from "./constants";

export interface ShareImageData {
  grade: Grade;
  score: number;
  summary: AnalysisSummary;
  verdict: string;
  foodName?: string;
  foodNameCn?: string;
  petType?: "cat" | "dog";
  harmfulNames?: string[];
  safeNames?: string[];
}

/** Background gradient for all share images — deep dark with subtle color shift */
const BG_GRADIENT = "linear-gradient(145deg, #0c0a1d 0%, #0a0a0a 45%, #0d1117 100%)";

/** Grade-specific glow color (brighter than badge for radiant effect) */
const GRADE_GLOW: Record<Grade, string> = {
  A: "#34d399",
  B: "#a3e635",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#f87171",
};

function StatPill({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 14px",
        borderRadius: "20px",
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: color,
          display: "flex",
          flexShrink: 0,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span style={{ display: "flex", color, fontSize: 18, fontWeight: 600 }}>
        {`${count} ${label}`}
      </span>
    </div>
  );
}

function GlassCard({ children, padding }: { children: React.ReactNode; padding: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        padding,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      }}
    >
      {children}
    </div>
  );
}

function buildOgImage(data: ShareImageData) {
  const gradeColor = GRADE_HEX[data.grade];
  const glowColor = GRADE_GLOW[data.grade];
  const petEmoji = data.petType === "cat" ? "\ud83d\udc31" : data.petType === "dog" ? "\ud83d\udc36" : "\ud83d\udc3e";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: BG_GRADIENT,
        padding: "32px 48px",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient grade glow behind card */}
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

      <GlassCard padding="32px 48px">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
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
            marginBottom: "12px",
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
            {data.grade}
          </span>
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: gradeColor,
            fontWeight: 700,
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}
        >
          {`${data.score} / 100`}
        </div>

        {/* Food name */}
        {data.foodName && (
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 800,
              color: "#f5f5f5",
              textAlign: "center",
              marginBottom: data.foodNameCn ? "2px" : "16px",
              letterSpacing: "-0.01em",
            }}
          >
            {data.foodName}
          </div>
        )}
        {data.foodNameCn && (
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#737373",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            {data.foodNameCn}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: "16px" }}>
          <StatPill color="#ef4444" label="flagged" count={data.summary.harmfulCount} />
          <StatPill color="#f59e0b" label="review" count={data.summary.cautionCount} />
          <StatPill color="#10b981" label="safe" count={data.summary.safeCount} />
        </div>
      </GlassCard>
    </div>
  );
}

function buildSquareImage(data: ShareImageData) {
  const gradeColor = GRADE_HEX[data.grade];
  const glowColor = GRADE_GLOW[data.grade];
  const petEmoji = data.petType === "cat" ? "\ud83d\udc31" : data.petType === "dog" ? "\ud83d\udc36" : "\ud83d\udc3e";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: BG_GRADIENT,
        padding: "48px",
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
          top: "30%",
          left: "50%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          backgroundColor: `${glowColor}14`,
          boxShadow: `0 0 160px 80px ${glowColor}10`,
          transform: "translate(-50%, -50%)",
        }}
      />

      <GlassCard padding="40px 52px">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <span style={{ display: "flex", fontSize: 28, color: "#737373", letterSpacing: "0.05em" }}>
            {`${petEmoji} PetFoodSmart`}
          </span>
        </div>

        {/* Grade circle with enhanced glow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            backgroundColor: gradeColor,
            marginBottom: "16px",
            boxShadow: `0 0 50px ${glowColor}55, 0 0 100px ${glowColor}30, 0 4px 24px rgba(0,0,0,0.4)`,
          }}
        >
          <span
            style={{
              display: "flex",
              fontSize: 116,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {data.grade}
          </span>
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: gradeColor,
            fontWeight: 700,
            letterSpacing: "0.08em",
            marginBottom: "24px",
          }}
        >
          {`${data.score} / 100`}
        </div>

        {/* Food name */}
        {data.foodName && (
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 800,
              color: "#f5f5f5",
              textAlign: "center",
              marginBottom: data.foodNameCn ? "4px" : "12px",
              maxWidth: "800px",
              letterSpacing: "-0.01em",
            }}
          >
            {data.foodName}
          </div>
        )}
        {data.foodNameCn && (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#737373",
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            {data.foodNameCn}
          </div>
        )}

        {/* Verdict */}
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#a3a3a3",
            textAlign: "center",
            marginBottom: "28px",
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          {data.verdict}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
          <StatPill color="#ef4444" label="flagged" count={data.summary.harmfulCount} />
          <StatPill color="#f59e0b" label="review" count={data.summary.cautionCount} />
          <StatPill color="#10b981" label="safe" count={data.summary.safeCount} />
        </div>

        {/* Harmful ingredients highlight */}
        {data.harmfulNames && data.harmfulNames.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              padding: "12px 20px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
            }}
          >
            <span style={{ display: "flex", fontSize: 15, color: "#ef4444", fontWeight: 600, letterSpacing: "0.04em" }}>
              {"\u26a0 Flagged Ingredients"}
            </span>
            <span style={{ display: "flex", fontSize: 17, color: "#fca5a5", textAlign: "center" }}>
              {data.harmfulNames.slice(0, 5).join(", ")}
            </span>
          </div>
        )}
      </GlassCard>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "24px",
          fontSize: 15,
          color: "#404040",
          letterSpacing: "0.06em",
        }}
      >
        {"petfoodsmart.com \u00b7 AI-Powered Pet Food Safety"}
      </div>
    </div>
  );
}

export function buildShareImage(data: ShareImageData, format: ShareFormat) {
  return format === "square" ? buildSquareImage(data) : buildOgImage(data);
}
