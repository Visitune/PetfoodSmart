/**
 * F005 - Ingredient Analysis Engine
 *
 * Matches extracted ingredients against the knowledge base and calculates
 * an overall safety grade (A-F). Each ingredient is flagged red/yellow/green/unknown.
 *
 * Scoring algorithm:
 * - Start at 100 points
 * - Harmful ingredients: -15 base, +5 extra if in top 5 positions
 * - Caution ingredients: -5 base, +3 extra if in top 5 positions
 * - Fillers/byproducts (even if "safe"): -3 each
 * - Bonus: +5 if first ingredient is quality protein
 * - Penalty: -10 if no protein in top 3
 * - Cap score at 0-100
 *
 * Grade mapping: A (90-100), B (75-89), C (60-74), D (40-59), F (0-39)
 */

import type { ParsedIngredient } from "../ocr/types";
import { lookupIngredient } from "../knowledge";
import type { LookupResult } from "../knowledge/types";
import type { PetProfile } from "../profile/types";
import { calculateProfileAdjustments } from "../profile/sensitivities";
import type {
  AnalysisResult,
  AnalyzedIngredient,
  AnalysisSummary,
  Grade,
  IngredientFlag,
} from "./types";

/** Map a safety rating to a display flag color */
function ratingToFlag(rating: string): IngredientFlag {
  switch (rating) {
    case "harmful":
      return "red";
    case "caution":
      return "yellow";
    case "safe":
      return "green";
    default:
      return "unknown";
  }
}

/**
 * If at least this fraction of ingredients are unrecognized, the grade is not
 * meaningful — most of the label wasn't understood, and unknowns are neutral
 * in the scoring formula, so a badly-matched label can otherwise still score
 * high by default. UI should show "insufficient data" instead of the grade.
 */
const UNKNOWN_RATIO_THRESHOLD = 0.5;

/** Categories that count as "concerning" even if rated safe */
const CONCERN_CATEGORIES = new Set(["filler", "byproduct", "coloring", "sweetener"]);

/** Categories that count as quality protein */
const PROTEIN_CATEGORIES = new Set(["protein"]);

/** Analyze a single parsed ingredient against the knowledge base */
function analyzeIngredient(parsed: ParsedIngredient): AnalyzedIngredient {
  const matchResult: LookupResult | null = lookupIngredient(parsed.normalized);

  if (!matchResult) {
    return {
      original: parsed.original,
      normalized: parsed.normalized,
      position: parsed.position,
      flag: "unknown",
      knownIngredient: null,
      matchInfo: null,
      explanation: "Not found in our ingredient database",
    };
  }

  const { ingredient } = matchResult;
  return {
    original: parsed.original,
    normalized: parsed.normalized,
    position: parsed.position,
    flag: ratingToFlag(ingredient.safety_rating),
    knownIngredient: ingredient,
    matchInfo: matchResult,
    explanation: ingredient.explanation,
  };
}

/** Calculate numeric score from analyzed ingredients */
function calculateScore(analyzed: AnalyzedIngredient[]): number {
  if (analyzed.length === 0) return 0;

  let score = 100;

  for (const item of analyzed) {
    const inTopPositions = item.position < 5;
    const ingredient = item.knownIngredient;

    if (item.flag === "red") {
      score -= 15;
      if (inTopPositions) score -= 5;
    } else if (item.flag === "yellow") {
      score -= 5;
      if (inTopPositions) score -= 3;
    }

    // Penalize concerning categories even if rated safe
    if (ingredient && CONCERN_CATEGORIES.has(ingredient.category)) {
      score -= 3;
    }
  }

  // Bonus: first ingredient is quality protein
  const first = analyzed[0];
  if (
    first?.knownIngredient &&
    PROTEIN_CATEGORIES.has(first.knownIngredient.category)
  ) {
    score += 5;
  }

  // Penalty: no protein in top 3
  const top3 = analyzed.slice(0, 3);
  const hasProteinInTop3 = top3.some(
    (item) =>
      item.knownIngredient &&
      PROTEIN_CATEGORIES.has(item.knownIngredient.category)
  );
  if (!hasProteinInTop3 && analyzed.length >= 3) {
    score -= 10;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/** Map a numeric score to a letter grade */
export function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

/** Build summary statistics from analyzed ingredients */
function buildSummary(analyzed: AnalyzedIngredient[]): AnalysisSummary {
  const harmfulCount = analyzed.filter((i) => i.flag === "red").length;
  const cautionCount = analyzed.filter((i) => i.flag === "yellow").length;
  const safeCount = analyzed.filter((i) => i.flag === "green").length;
  const unknownCount = analyzed.filter((i) => i.flag === "unknown").length;

  const first = analyzed[0];
  const topIngredientIsProtein = !!(
    first?.knownIngredient &&
    PROTEIN_CATEGORIES.has(first.knownIngredient.category)
  );

  const concernCount = analyzed.filter(
    (i) =>
      i.flag === "red" ||
      (i.knownIngredient && CONCERN_CATEGORIES.has(i.knownIngredient.category))
  ).length;
  const concernPercentage =
    analyzed.length > 0
      ? Math.round((concernCount / analyzed.length) * 100)
      : 0;

  return {
    totalIngredients: analyzed.length,
    harmfulCount,
    cautionCount,
    safeCount,
    unknownCount,
    topIngredientIsProtein,
    concernPercentage,
  };
}

/** Generate a short plain-language verdict based on grade and summary */
function generateVerdict(grade: Grade, summary: AnalysisSummary): string {
  if (summary.totalIngredients === 0) {
    return "No ingredients found to analyze.";
  }

  switch (grade) {
    case "A":
      return "Our analysis considers this food to have excellent ingredient quality.";
    case "B":
      return "Our analysis considers this food to have good ingredient quality.";
    case "C":
      return "Our analysis finds average ingredient quality. Some ingredients are flagged for review.";
    case "D":
      return `Our analysis flags several ingredients for review. Consult your veterinarian for personalized advice.`;
    case "F":
      return `Our analysis flags ${summary.harmfulCount} ingredient${summary.harmfulCount !== 1 ? "s" : ""} for review. We recommend consulting your veterinarian.`;
  }
}

/**
 * Analyze an array of parsed ingredients and produce a full analysis result.
 * This is the main entry point for the analysis engine.
 * Optionally accepts a pet profile for personalized scoring adjustments.
 */
export function analyzeIngredients(
  parsedIngredients: ParsedIngredient[],
  profile?: PetProfile
): AnalysisResult {
  const analyzed = parsedIngredients.map(analyzeIngredient);
  let score = calculateScore(analyzed);

  let profileWarnings: string[] | undefined;

  if (profile) {
    const adjustments = calculateProfileAdjustments(profile, analyzed);
    score = Math.max(0, Math.min(100, score + adjustments.totalAdjustment));
    if (adjustments.warnings.length > 0) {
      profileWarnings = adjustments.warnings;
    }
  }

  const grade = scoreToGrade(score);
  const summary = buildSummary(analyzed);
  const verdict = generateVerdict(grade, summary);
  const insufficientData =
    summary.totalIngredients > 0 &&
    summary.unknownCount / summary.totalIngredients >= UNKNOWN_RATIO_THRESHOLD;

  return {
    grade,
    score,
    ingredients: analyzed,
    summary,
    verdict,
    insufficientData,
    profileWarnings,
  };
}

export type {
  AnalysisResult,
  AnalyzedIngredient,
  AnalysisSummary,
  Grade,
  IngredientFlag,
} from "./types";
