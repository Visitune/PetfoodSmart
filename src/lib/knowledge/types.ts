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
}

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
