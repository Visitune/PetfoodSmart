/**
 * F005 - Ingredient Analysis Engine Types
 *
 * Pre-implementation thinking:
 * 1. What does this feature do? Match extracted ingredients against knowledge base,
 *    calculate an overall grade (A-F), and flag each ingredient red/yellow/green.
 * 2. Key design decisions:
 *    - Grade uses a 100-point scoring system mapped to A-F letters
 *    - Position in ingredient list matters (first = most abundant = more weight)
 *    - Unknown ingredients get a neutral "unknown" flag (gray in UI)
 * 3. What could go wrong? Empty ingredient lists, all unknown ingredients, OCR garbage
 * 4. Simplest approach: point deduction system with position weighting
 * 5. Acceptance criteria: correct grading for known good/bad foods, handles edge cases
 */

import type { Ingredient, LookupResult, SafetyRating } from "../knowledge/types";

/** Color flag for an individual ingredient in the result */
export type IngredientFlag = "red" | "yellow" | "green" | "unknown";

/** Analysis result for a single ingredient */
export interface AnalyzedIngredient {
  /** Original text from the label */
  original: string;
  /** Normalized name used for matching */
  normalized: string;
  /** Position in the ingredient list (0-based) */
  position: number;
  /** Color flag for UI display */
  flag: IngredientFlag;
  /** Matched ingredient from knowledge base, if found */
  knownIngredient: Ingredient | null;
  /** How the match was found */
  matchInfo: LookupResult | null;
  /** Short explanation for this ingredient */
  explanation: string;
}

/** Letter grade A through F */
export type Grade = "A" | "B" | "C" | "D" | "F";

/** Summary statistics for the analysis */
export interface AnalysisSummary {
  /** Total number of ingredients */
  totalIngredients: number;
  /** Count of harmful (red) ingredients */
  harmfulCount: number;
  /** Count of caution (yellow) ingredients */
  cautionCount: number;
  /** Count of safe (green) ingredients */
  safeCount: number;
  /** Count of unrecognized ingredients */
  unknownCount: number;
  /** Whether the first ingredient is a quality protein */
  topIngredientIsProtein: boolean;
  /** Percentage of harmful + filler + byproduct ingredients */
  concernPercentage: number;
}

/** Full analysis result */
export interface AnalysisResult {
  /** Letter grade A-F */
  grade: Grade;
  /** Numeric score 0-100 */
  score: number;
  /** Per-ingredient analysis results */
  ingredients: AnalyzedIngredient[];
  /** Summary statistics */
  summary: AnalysisSummary;
  /** Short plain-language verdict */
  verdict: string;
  /**
   * True when too few ingredients were recognized (see UNKNOWN_RATIO_THRESHOLD)
   * to make the grade meaningful. UI should prefer showing this over the raw grade.
   */
  insufficientData: boolean;
  /** Personalized warnings based on pet profile (only present when profile is provided) */
  profileWarnings?: string[];
}
