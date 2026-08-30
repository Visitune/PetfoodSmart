/**
 * F006 - Analysis Result Display (polished F013, i18n F019)
 *
 * Shows grade badge, verdict, AI explanation, summary bar, and ingredient list.
 * Refined spacing and visual hierarchy for screenshot-worthy mobile UI.
 */

"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/lib/analyzer/types";
import type { ExplainRequest, ExplainIngredient } from "@/lib/explainer/types";
import { AnimatedGradeBadge } from "@/components/grade";
import { ShareButton } from "@/components/sharing";
import { useTranslation } from "@/lib/i18n";
import { IngredientList } from "./IngredientList";
import { SummaryBar } from "./SummaryBar";
import { Disclaimer } from "@/components/shared/Disclaimer";

interface AnalysisViewProps {
  result: AnalysisResult;
  onScanAnother: () => void;
  onSaveToHistory?: (foodName: string) => void;
  onPersonalize?: () => void;
  saved?: boolean;
}

/** Build the request payload for /api/explain */
function buildExplainPayload(result: AnalysisResult): ExplainRequest {
  const ingredients: ExplainIngredient[] = result.ingredients.map((i) => ({
    name: i.original,
    flag: i.flag,
    explanation: i.explanation,
  }));

  return {
    grade: result.grade,
    score: result.score,
    ingredients,
    summary: {
      harmfulCount: result.summary.harmfulCount,
      cautionCount: result.summary.cautionCount,
      safeCount: result.summary.safeCount,
      unknownCount: result.summary.unknownCount,
      topIngredientIsProtein: result.summary.topIngredientIsProtein,
    },
  };
}

export function AnalysisView({ result, onScanAnother, onSaveToHistory, onPersonalize, saved = false }: AnalysisViewProps) {
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(true);
  const [foodName, setFoodName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const { t } = useTranslation("analysis");
  const { t: tg } = useTranslation("grade");

  const verdictKey =
    result.summary.totalIngredients === 0 ? "verdictNone" : `verdict${result.grade}`;
  const localizedVerdict = tg(verdictKey, {
    harmfulCount: String(result.summary.harmfulCount),
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchExplanation(): Promise<void> {
      try {
        const payload = buildExplainPayload(result);
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          setAiLoading(false);
          return;
        }

        const data = (await response.json()) as { explanation: string };
        if (!cancelled && data.explanation) {
          setAiExplanation(data.explanation);
        }
      } catch {
        // Silently fail — static verdict is always visible
      } finally {
        if (!cancelled) {
          setAiLoading(false);
        }
      }
    }

    fetchExplanation();

    return () => {
      cancelled = true;
    };
  }, [result]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      {result.insufficientData ? (
        /* Too few ingredients were recognized for the grade to be meaningful */
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border border-amber-700/50 bg-amber-900/20 px-4 py-6 text-center"
          data-testid="insufficient-data"
        >
          <p className="text-lg font-bold text-amber-200">
            {tg("insufficientDataLabel")}
          </p>
          <p className="text-sm leading-relaxed text-amber-100/80">
            {tg("verdictInsufficientData", {
              unknownCount: String(result.summary.unknownCount),
              totalIngredients: String(result.summary.totalIngredients),
            })}
          </p>
        </div>
      ) : (
        <>
          {/* Grade Badge */}
          <AnimatedGradeBadge grade={result.grade} score={result.score} />

          {/* Verdict */}
          <p
            className="text-center text-base leading-relaxed text-neutral-300"
            data-testid="verdict"
          >
            {localizedVerdict}
          </p>
        </>
      )}

      {/* Legal Disclaimer */}
      <div className="text-center">
        <Disclaimer />
      </div>

      {/* AI Explanation */}
      {aiLoading && (
        <p
          className="text-center text-sm text-neutral-500 italic"
          data-testid="ai-loading"
        >
          {t("generatingAnalysis")}
        </p>
      )}
      {!aiLoading && aiExplanation && (
        <div
          className="rounded-2xl border border-neutral-800 bg-neutral-900/50 px-4 py-4"
          data-testid="ai-explanation"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {t("aiAnalysis")}
          </p>
          <p className="text-sm leading-relaxed text-neutral-300">
            {aiExplanation}
          </p>
        </div>
      )}

      {/* Profile Warnings */}
      {result.profileWarnings && result.profileWarnings.length > 0 && (
        <div
          className="rounded-2xl border border-amber-700/50 bg-amber-900/20 px-4 py-4"
          data-testid="profile-warnings"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            {t("personalizedAlerts")}
          </p>
          <ul className="space-y-1.5">
            {result.profileWarnings.map((warning, idx) => (
              <li
                key={idx}
                className="text-sm leading-relaxed text-amber-200"
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Personalize CTA — shown when no profile warnings and handler is provided */}
      {onPersonalize && (!result.profileWarnings || result.profileWarnings.length === 0) && (
        <button
          type="button"
          onClick={onPersonalize}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/50 px-4 py-4 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-900"
          data-testid="personalize-cta"
        >
          <p className="text-sm font-semibold text-neutral-200">
            {t("personalizeTitle")}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {t("personalizeDesc")}
          </p>
        </button>
      )}

      {/* Summary Stats */}
      <SummaryBar summary={result.summary} />

      {/* Ingredient List */}
      <IngredientList ingredients={result.ingredients} />

      {/* Save to History */}
      {onSaveToHistory && !saved && !showSaveInput && (
        <button
          type="button"
          onClick={() => setShowSaveInput(true)}
          className="mt-2 w-full rounded-full bg-red-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 hover:shadow-red-500/30 active:scale-[0.98]"
          data-testid="save-button"
        >
          {t("saveToHistory")}
        </button>
      )}

      {onSaveToHistory && showSaveInput && !saved && (
        <div className="mt-2 flex gap-2" data-testid="save-input">
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder={t("foodNamePlaceholder")}
            aria-label={t("foodNamePlaceholder")}
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
            data-testid="food-name-input"
          />
          <button
            type="button"
            onClick={() => onSaveToHistory(foodName)}
            className="shrink-0 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-400 active:scale-[0.98]"
            data-testid="confirm-save"
          >
            {t("save")}
          </button>
        </div>
      )}

      {saved && (
        <p className="mt-2 text-center text-sm font-medium text-emerald-400" data-testid="saved-confirmation">
          {t("savedToHistory")}
        </p>
      )}

      {/* Share */}
      <ShareButton result={result} foodName={foodName || undefined} />

      {/* Actions */}
      <button
        type="button"
        onClick={onScanAnother}
        className="w-full rounded-full border border-neutral-700 bg-neutral-800 px-8 py-3.5 font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 active:scale-[0.98]"
      >
        {t("scanAnother")}
      </button>
    </div>
  );
}
