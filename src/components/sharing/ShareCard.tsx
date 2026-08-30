/**
 * F010 - Social Sharing Card (i18n F019)
 *
 * Styled card component for sharing analysis results as images.
 * 375px wide, dark theme, designed for social media screenshots.
 */

import { forwardRef } from "react";
import type { AnalysisResult } from "@/lib/analyzer/types";
import { GRADE_COLORS } from "@/lib/grade";
import { useTranslation } from "@/lib/i18n";
import { AlertTriangle, Check } from "lucide-react";

interface ShareCardProps {
  result: AnalysisResult;
  foodName?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ result, foodName }, ref) {
    const { t: tg } = useTranslation("grade");
    const { t: ta } = useTranslation("analysis");
    const { t: ts } = useTranslation("sharing");

    const harmfulIngredients = result.ingredients
      .filter((i) => i.flag === "red")
      .slice(0, 3)
      .map((i) => i.original);

    const safeIngredients = result.ingredients
      .filter((i) => i.flag === "green")
      .slice(0, 3)
      .map((i) => i.original);

    return (
      <div
        ref={ref}
        data-testid="share-card"
        className="w-[375px] bg-neutral-900 p-6"
        style={{ fontFamily: "'MiSans', system-ui, -apple-system, sans-serif" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-bold text-red-500">{ts("brandName")}</p>
          <p className="text-xs text-neutral-500">{ts("brandSubtitle")}</p>
        </div>

        {/* Food Name */}
        {foodName && (
          <p
            className="mb-4 truncate text-center text-base font-semibold text-neutral-200"
            data-testid="share-food-name"
          >
            {foodName}
          </p>
        )}

        {/* Grade Circle + Score */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${GRADE_COLORS[result.grade]} shadow-lg`}
          >
            <span className="text-4xl font-black text-white">
              {result.grade}
            </span>
          </div>
          <p className="text-sm font-medium text-neutral-300">
            {tg(result.grade)} · {result.score}/100
          </p>
        </div>

        {/* Verdict */}
        <p
          className="mb-4 text-center text-sm leading-relaxed text-neutral-400"
          data-testid="share-verdict"
        >
          {result.verdict}
        </p>

        {/* Stats Row */}
        <div
          className="mb-4 grid grid-cols-4 gap-2 rounded-xl bg-neutral-800 p-3"
          data-testid="share-stats"
        >
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">
              {result.summary.safeCount}
            </p>
            <p className="text-[10px] text-neutral-500">{ta("safe")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-400">
              {result.summary.cautionCount}
            </p>
            <p className="text-[10px] text-neutral-500">{ta("caution")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">
              {result.summary.harmfulCount}
            </p>
            <p className="text-[10px] text-neutral-500">{ta("harmful")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-neutral-400">
              {result.summary.unknownCount}
            </p>
            <p className="text-[10px] text-neutral-500">{ta("unknown")}</p>
          </div>
        </div>

        {/* Key Findings */}
        {harmfulIngredients.length > 0 && (
          <div className="mb-3" data-testid="share-harmful">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-red-400">
              <AlertTriangle size={12} aria-hidden="true" />
              {ts("harmfulIngredients")}
            </p>
            <p className="text-xs text-neutral-400">
              {harmfulIngredients.join(", ")}
            </p>
          </div>
        )}

        {safeIngredients.length > 0 && (
          <div className="mb-3" data-testid="share-safe">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-400">
              <Check size={12} aria-hidden="true" />
              {ts("qualityIngredients")}
            </p>
            <p className="text-xs text-neutral-400">
              {safeIngredients.join(", ")}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 border-t border-neutral-800 pt-3">
          <p className="text-center text-[10px] text-neutral-600">
            {ts("footer")}
          </p>
        </div>
      </div>
    );
  },
);
