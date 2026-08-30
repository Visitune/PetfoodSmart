"use client";

/**
 * F033 - Scan Analysis Ceremony
 *
 * Multi-stage animation replacing the simple spinner:
 * Stage 1 (0-0.8s): Scan beam sweeps vertically
 * Stage 2 (0.8-2.0s): Ingredients fly in as text particles
 * Stage 3 (2.0-2.8s): Sort into safe/caution/harmful categories
 * Stage 4 (2.8-3.5s): Grade reveal with 3D flip (F032 animation)
 */

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult, AnalyzedIngredient } from "@/lib/analyzer/types";
import type { Grade } from "@/lib/analyzer/types";
import { GRADE_STYLES } from "@/lib/grade";
import { useTranslation } from "@/lib/i18n";
import { CountUp } from "@/components/motion";
import { Search } from "lucide-react";

type CeremonyStage = "scan" | "extract" | "categorize" | "reveal";

const STAGE_TIMINGS: Record<CeremonyStage, { start: number; duration: number }> = {
  scan: { start: 0, duration: 800 },
  extract: { start: 800, duration: 1200 },
  categorize: { start: 2000, duration: 800 },
  reveal: { start: 2800, duration: 700 },
};

/** Total ceremony duration before calling onComplete */
const CEREMONY_TOTAL_MS = 3800;

/** Max ingredients to show in the particle animation */
const MAX_VISIBLE_INGREDIENTS = 12;

/** Glow colors per grade for the reveal stage */
const GLOW_COLORS: Record<Grade, string> = {
  A: "rgba(16, 185, 129, 0.5)",
  B: "rgba(132, 204, 22, 0.5)",
  C: "rgba(245, 158, 11, 0.5)",
  D: "rgba(249, 115, 22, 0.5)",
  F: "rgba(220, 38, 38, 0.5)",
};

const FLAG_COLORS: Record<string, string> = {
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-red-400",
  unknown: "text-neutral-500",
};

const FLAG_DOT_COLORS: Record<string, string> = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-red-400",
  unknown: "bg-neutral-600",
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  green: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  yellow: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  red: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

interface ScanCeremonyProps {
  result: AnalysisResult;
  onComplete: () => void;
}

export function ScanCeremony({ result, onComplete }: ScanCeremonyProps) {
  const [stage, setStage] = useState<CeremonyStage>("scan");
  const { t } = useTranslation("analysis");

  // Select representative ingredients to show (max MAX_VISIBLE_INGREDIENTS)
  const visibleIngredients = useMemo(() => {
    const all = result.ingredients;
    if (all.length <= MAX_VISIBLE_INGREDIENTS) return all;
    // Pick a mix: prioritize harmful, then caution, then safe, then unknown
    const harmful = all.filter((i) => i.flag === "red");
    const caution = all.filter((i) => i.flag === "yellow");
    const safe = all.filter((i) => i.flag === "green");
    const unknown = all.filter((i) => i.flag === "unknown");
    const picked: AnalyzedIngredient[] = [];
    for (const group of [harmful, caution, safe, unknown]) {
      for (const item of group) {
        if (picked.length >= MAX_VISIBLE_INGREDIENTS) break;
        picked.push(item);
      }
    }
    return picked.sort((a, b) => a.position - b.position);
  }, [result.ingredients]);

  // Categorized groups for stage 3
  const categories = useMemo(() => ({
    green: visibleIngredients.filter((i) => i.flag === "green"),
    yellow: visibleIngredients.filter((i) => i.flag === "yellow"),
    red: visibleIngredients.filter((i) => i.flag === "red"),
  }), [visibleIngredients]);

  // Stage progression timers
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setStage("extract"), STAGE_TIMINGS.extract.start));
    timers.push(setTimeout(() => setStage("categorize"), STAGE_TIMINGS.categorize.start));
    timers.push(setTimeout(() => setStage("reveal"), STAGE_TIMINGS.reveal.start));
    timers.push(setTimeout(() => onComplete(), CEREMONY_TOTAL_MS));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-4"
      data-testid="scan-ceremony"
      aria-label={t("ceremonyAriaLabel")}
      role="status"
    >
      <div className="relative w-full max-w-sm">
        <AnimatePresence mode="wait">
          {/* Stage 1: Scan beam */}
          {stage === "scan" && (
            <ScanBeamStage key="scan" label={t("ceremonyScan")} />
          )}

          {/* Stage 2: Ingredients fly in */}
          {stage === "extract" && (
            <ExtractStage
              key="extract"
              ingredients={visibleIngredients}
              label={t("ceremonyExtract")}
            />
          )}

          {/* Stage 3: Categorize */}
          {stage === "categorize" && (
            <CategorizeStage
              key="categorize"
              categories={categories}
              label={t("ceremonyCategorize")}
            />
          )}

          {/* Stage 4: Grade reveal */}
          {stage === "reveal" && (
            <RevealStage
              key="reveal"
              grade={result.grade}
              score={result.score}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/** Stage 1: Animated scan beam sweeping vertically */
function ScanBeamStage({ label }: { label: string }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      data-testid="ceremony-stage-scan"
    >
      {/* Scan area */}
      <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50">
        {/* Scan beam line */}
        <motion.div
          className="absolute left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          initial={{ top: 0 }}
          animate={{ top: "100%" }}
          transition={{
            duration: 0.7,
            ease: "linear",
            repeat: 1,
          }}
          data-testid="scan-beam"
        />
        {/* Scan grid lines */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 h-px w-full bg-red-500"
              style={{ top: `${(i + 1) * 16.67}%` }}
            />
          ))}
        </div>
        {/* Pulsing icon */}
        <div className="flex h-full items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Search size={40} className="text-neutral-300" aria-hidden="true" />
          </motion.div>
        </div>
      </div>
      <p className="text-sm font-medium text-neutral-400">{label}</p>
    </motion.div>
  );
}

/** Stage 2: Ingredients fly in as text particles */
function ExtractStage({
  ingredients,
  label,
}: {
  ingredients: AnalyzedIngredient[];
  label: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      data-testid="ceremony-stage-extract"
    >
      <div className="flex min-h-[10rem] flex-wrap justify-center gap-2 py-2">
        {ingredients.map((ingredient, i) => (
          <motion.span
            key={ingredient.normalized}
            className={`inline-flex items-center gap-1 rounded-full border border-neutral-700/50 bg-neutral-800/80 px-3 py-1 text-xs font-medium ${FLAG_COLORS[ingredient.flag]}`}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: i * 0.07,
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${FLAG_DOT_COLORS[ingredient.flag]}`}
            />
            {ingredient.original}
          </motion.span>
        ))}
      </div>
      <p className="text-sm font-medium text-neutral-400">{label}</p>
    </motion.div>
  );
}

/** Stage 3: Sort into safe/caution/harmful columns */
function CategorizeStage({
  categories,
  label,
}: {
  categories: Record<string, AnalyzedIngredient[]>;
  label: string;
}) {
  const { t } = useTranslation("analysis");
  const categoryOrder: Array<{ key: string; label: string }> = [
    { key: "green", label: t("safe") },
    { key: "yellow", label: t("caution") },
    { key: "red", label: t("harmful") },
  ];

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      data-testid="ceremony-stage-categorize"
    >
      <div className="grid w-full grid-cols-3 gap-2">
        {categoryOrder.map(({ key, label: catLabel }, colIdx) => {
          const items = categories[key] ?? [];
          const colors = CATEGORY_COLORS[key];
          return (
            <motion.div
              key={key}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-2`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIdx * 0.12, duration: 0.3 }}
            >
              <p className={`mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                {catLabel}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, 4).map((ing, i) => (
                  <motion.p
                    key={ing.normalized}
                    className="truncate text-center text-[10px] text-neutral-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: colIdx * 0.12 + i * 0.06 + 0.15, duration: 0.2 }}
                  >
                    {ing.original}
                  </motion.p>
                ))}
                {items.length > 4 && (
                  <p className="text-center text-[9px] text-neutral-600">
                    +{items.length - 4}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-sm font-medium text-neutral-400">{label}</p>
    </motion.div>
  );
}

/** Stage 4: Grade reveal with 3D flip (mirrors F032 AnimatedGradeBadge) */
function RevealStage({ grade, score }: { grade: Grade; score: number }) {
  const style = GRADE_STYLES[grade];
  const { t } = useTranslation("grade");
  const gradeLabel = t(grade);

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      data-testid="ceremony-stage-reveal"
    >
      {/* 3D flip badge */}
      <motion.div
        className={`flex h-28 w-28 items-center justify-center rounded-full ${style.bg} ${style.text} ring-4 ${style.ring} shadow-2xl`}
        role="img"
        aria-label={t("gradeLabel", { grade, label: gradeLabel })}
        data-testid="ceremony-grade-badge"
        initial={{ rotateY: 180, scale: 0.5, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        style={{
          perspective: 800,
          transformStyle: "preserve-3d",
          animation: "glow-pulse 2s ease-in-out 0.6s infinite",
          // @ts-expect-error CSS custom property for glow color
          "--glow-color": GLOW_COLORS[grade],
        }}
      >
        <span className="text-5xl font-black tracking-tight">{grade}</span>
      </motion.div>

      {/* Label + score */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
      >
        <p className="text-lg font-bold text-neutral-100">{gradeLabel}</p>
        <p className="mt-1 text-sm font-medium text-neutral-400">
          <CountUp to={score} duration={0.6} delay={0.4} />
          <span> / 100</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
