/**
 * F002 - Ingredient Knowledge Base
 *
 * Provides lookup, search, and filtering utilities for the ingredient database.
 * Supports exact match, alias match, and fuzzy matching for bilingual labels.
 */

import type {
  Ingredient,
  IngredientCategory,
  KnowledgeBase,
  LookupResult,
  SafetyRating,
} from "./types";
import ingredientsData from "../../../data/ingredients.json";

const knowledgeBase: KnowledgeBase = ingredientsData as KnowledgeBase;

// Pre-build lookup indexes for fast matching
const exactNameIndex = new Map<string, Ingredient>();
const aliasIndex = new Map<string, Ingredient>();
// Normalized variant index for hyphen/space/plural insensitive matching
const normalizedVariantIndex = new Map<string, Ingredient>();

/**
 * Fold a string for accent-insensitive matching:
 * trim, lowercase, strip diacritics (é → e, ç → c, œ → oe...),
 * collapse whitespace, remove trailing punctuation.
 *
 * French/EU labels use accented characters (blé, levûre, céréales) that OCR
 * may or may not preserve, so both the index keys and the queries go
 * through this same folding.
 */
function fold(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normalize an ingredient string for matching:
 * accent-folded, collapsed whitespace, no trailing punctuation
 */
function normalize(input: string): string {
  return fold(input)
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "");
}

/**
 * Singularize a single word for fuzzy matching.
 * Handles English (-s) and French plurals:
 * - trailing -s stripped (légumes → légume, carottes → carotte)
 * - French -aux → -al (animaux → animal, minéraux → minéral)
 * Words whose final -s/-x is not a plural marker are kept:
 * riz, maïs, pois, anchois, radis, cous, jus, os, frais, noix...
 */
function singularizeFr(word: string): string {
  if (word.length <= 3) return word;
  if (/aux$/.test(word)) return word.slice(0, -3) + "al";
  if (/(ois|ais|is|as|os|us|iz|x)$/.test(word)) return word;
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}

/**
 * Deep-normalize for fuzzy matching: accent-folded, strips hyphens,
 * singularizes each word (EN + FR plurals), collapses spaces,
 * removes OCR artifacts (apostrophes)
 */
function deepNormalize(input: string): string {
  return fold(input)
    .replace(/[-–—]/g, " ") // Hyphens/dashes become word separators
    .replace(/[''`]/g, "") // Remove apostrophes/backticks (OCR artifacts)
    .split(/\s+/)
    .filter(Boolean)
    .map(singularizeFr)
    .join("");
}

for (const ingredient of knowledgeBase.ingredients) {
  const nameFolded = fold(ingredient.name);
  exactNameIndex.set(nameFolded, ingredient);
  normalizedVariantIndex.set(deepNormalize(nameFolded), ingredient);

  for (const alias of ingredient.common_aliases) {
    const aliasFolded = fold(alias);
    aliasIndex.set(aliasFolded, ingredient);
    normalizedVariantIndex.set(deepNormalize(aliasFolded), ingredient);
  }
}

/**
 * Look up a single ingredient by name or alias.
 * Returns null if no match is found.
 */
export function lookupIngredient(query: string): LookupResult | null {
  const normalized = normalize(query);

  // 1. Exact name match
  const exactMatch = exactNameIndex.get(normalized);
  if (exactMatch) {
    return { ingredient: exactMatch, matched_by: "exact", confidence: 1.0 };
  }

  // 2. Alias match
  const aliasMatch = aliasIndex.get(normalized);
  if (aliasMatch) {
    return { ingredient: aliasMatch, matched_by: "alias", confidence: 0.95 };
  }

  // 3. Deep-normalized variant match (handles hyphens, spaces, plurals)
  const deepNorm = deepNormalize(normalized);
  const variantMatch = normalizedVariantIndex.get(deepNorm);
  if (variantMatch) {
    return { ingredient: variantMatch, matched_by: "fuzzy", confidence: 0.9 };
  }

  // 4. "X Supplement" pattern: "vitamin e supplement" → "vitamin e"
  const supplementStripped = normalized.replace(/\s+supplement$/, "");
  if (supplementStripped !== normalized) {
    const suppMatch =
      exactNameIndex.get(supplementStripped) ??
      aliasIndex.get(supplementStripped);
    if (suppMatch) {
      return { ingredient: suppMatch, matched_by: "fuzzy", confidence: 0.9 };
    }
  }

  // 5. Fuzzy match: substring containment scoring
  const fuzzyResult = fuzzyMatch(normalized);
  if (fuzzyResult) {
    return fuzzyResult;
  }

  return null;
}

/**
 * Attempt fuzzy matching by checking substring containment
 * and simple word overlap scoring.
 */
function fuzzyMatch(normalized: string): LookupResult | null {
  let bestMatch: Ingredient | null = null;
  let bestScore = 0;

  for (const ingredient of knowledgeBase.ingredients) {
    const name = fold(ingredient.name);

    // Check if the query contains the ingredient name
    if (normalized.includes(name) && name.length > 2) {
      const score = name.length / normalized.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ingredient;
      }
    }

    // Check if the ingredient name contains the query
    if (name.includes(normalized) && normalized.length > 2) {
      const score = normalized.length / name.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ingredient;
      }
    }

    // Check aliases for substring match
    for (const alias of ingredient.common_aliases) {
      const aliasLower = fold(alias);
      if (normalized.includes(aliasLower) && aliasLower.length > 2) {
        const score = aliasLower.length / normalized.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = ingredient;
        }
      }
      if (aliasLower.includes(normalized) && normalized.length > 2) {
        const score = normalized.length / aliasLower.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = ingredient;
        }
      }
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    return {
      ingredient: bestMatch,
      matched_by: "fuzzy",
      confidence: Math.min(bestScore, 0.9),
    };
  }

  return null;
}

/**
 * Look up multiple ingredients at once.
 * Returns results for each query, with null for unmatched ingredients.
 */
export function lookupIngredients(
  queries: string[]
): (LookupResult | null)[] {
  return queries.map(lookupIngredient);
}

/**
 * Search ingredients by partial name match.
 */
export function searchIngredients(query: string): Ingredient[] {
  const normalized = normalize(query);
  if (normalized.length === 0) return [];

  return knowledgeBase.ingredients.filter((ingredient) => {
    const name = fold(ingredient.name);
    if (name.includes(normalized)) return true;
    return ingredient.common_aliases.some((alias) =>
      fold(alias).includes(normalized)
    );
  });
}

/**
 * Get all ingredients filtered by category.
 */
export function getIngredientsByCategory(
  category: IngredientCategory
): Ingredient[] {
  return knowledgeBase.ingredients.filter((i) => i.category === category);
}

/**
 * Get all ingredients filtered by safety rating.
 */
export function getIngredientsByRating(
  rating: SafetyRating
): Ingredient[] {
  return knowledgeBase.ingredients.filter((i) => i.safety_rating === rating);
}

/**
 * Get all harmful ingredients (for quick red-flag checking).
 */
export function getHarmfulIngredients(): Ingredient[] {
  return getIngredientsByRating("harmful");
}

/**
 * Get the total number of ingredients in the knowledge base.
 */
export function getIngredientCount(): number {
  return knowledgeBase.ingredients.length;
}

/**
 * Get all unique categories in the knowledge base.
 */
export function getCategories(): IngredientCategory[] {
  const categories = new Set<IngredientCategory>();
  for (const ingredient of knowledgeBase.ingredients) {
    categories.add(ingredient.category);
  }
  return Array.from(categories);
}

/**
 * Get the knowledge base version and metadata.
 */
export function getKnowledgeBaseInfo(): {
  version: string;
  lastUpdated: string;
  totalIngredients: number;
} {
  return {
    version: knowledgeBase.version,
    lastUpdated: knowledgeBase.last_updated,
    totalIngredients: knowledgeBase.ingredients.length,
  };
}

export type { Ingredient, IngredientCategory, KnowledgeBase, LookupResult, SafetyRating };
