/**
 * F002 - Ingredient Knowledge Base Types
 *
 * Design decisions:
 * 1. safety_rating uses 3 levels (safe/caution/harmful) for clear UX mapping to green/yellow/red
 * 2. category groups ingredients for filtering and analysis weighting
 * 3. common_aliases includes Chinese and (for a growing subset) French names,
 *    for bilingual/multilingual label support
 * 4. Each ingredient has a plain-language explanation for non-expert display
 */

export type SafetyRating = "safe" | "caution" | "harmful";

export type IngredientCategory =
  | "protein"
  | "grain"
  | "vegetable"
  | "fruit"
  | "fat_oil"
  | "fiber"
  | "vitamin"
  | "mineral"
  | "preservative"
  | "additive"
  | "sweetener"
  | "coloring"
  | "filler"
  | "byproduct"
  | "supplement"
  | "thickener"
  | "flavor";

export interface Ingredient {
  name: string;
  category: IngredientCategory;
  safety_rating: SafetyRating;
  explanation: string;
  explanation_zh?: string;
  explanation_fr?: string;
  common_aliases: string[];
  /** Documentary sources (AAFCO, FDA, EFSA, FEDIAF...) — already present in data, now typed */
  sources?: string[];
  /** EU regulatory status (Reg. 1831/2003 feed additives register and related texts) */
  eu_status?: EuStatus;
  /** Short reference of the EU text/decision, e.g. "Règl. (CE) n° 1831/2003 — Registre UE (antioxydant E320)" */
  eu_ref?: string;
  /** Short expert note on the EU status */
  eu_note?: string;
  /** Expert review state — nothing EU-related is shown as verified until reviewed */
  eu_review?: EuReview;
}

/** EU regulatory status of an ingredient/additive */
export type EuStatus =
  | "autorise"
  | "restreint"
  | "non_autorise_ue"
  | "a_evaluer";

/** Expert review state of the EU assessment */
export type EuReview = "valide" | "a_valider";

export interface KnowledgeBase {
  version: string;
  last_updated: string;
  ingredients: Ingredient[];
}

export interface LookupResult {
  ingredient: Ingredient;
  matched_by: "exact" | "alias" | "fuzzy";
  confidence: number;
}
