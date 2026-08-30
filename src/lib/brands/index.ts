/**
 * F014 - Brand Database Loader
 *
 * Loads brand entries from data/brands.json and computes analysis results
 * at runtime using the existing analysis engine. Results are NOT stored
 * in the JSON — they are always computed fresh to stay consistent with
 * any scoring algorithm changes.
 */

import type { ParsedIngredient } from "../ocr/types";
import { analyzeIngredients } from "../analyzer";
import type { Grade } from "../analyzer/types";
import type { BrandEntry, AnalyzedBrand, BrandPetType, BrandDatabase } from "./types";
import brandsData from "../../../data/brands.json";

const db = brandsData as BrandDatabase;

/** Convert a brand's ingredient list to ParsedIngredient format for the analyzer */
function ingredientsToParsed(ingredients: string[]): ParsedIngredient[] {
  return ingredients.map((name, index) => ({
    original: name,
    normalized: name.toLowerCase().trim(),
    position: index,
  }));
}

/** Get all raw brand entries */
export function getAllBrands(): BrandEntry[] {
  return db.brands;
}

/** Get all brands with computed analysis results */
export function getAllAnalyzedBrands(): AnalyzedBrand[] {
  return db.brands.map(analyzeBrand);
}

/** Analyze a single brand entry */
export function analyzeBrand(brand: BrandEntry): AnalyzedBrand {
  const parsed = ingredientsToParsed(brand.ingredients);
  const analysis = analyzeIngredients(parsed);
  return { ...brand, analysis };
}

/** Look up a brand by slug */
export function getBrandBySlug(slug: string): BrandEntry | null {
  return db.brands.find((b) => b.slug === slug) ?? null;
}

/** Look up and analyze a brand by slug */
export function getAnalyzedBrandBySlug(slug: string): AnalyzedBrand | null {
  const brand = getBrandBySlug(slug);
  if (!brand) return null;
  return analyzeBrand(brand);
}

/** Get all brand slugs (for static generation) */
export function getAllBrandSlugs(): string[] {
  return db.brands.map((b) => b.slug);
}

/** Filter brands by pet type */
export function getBrandsByPetType(petType: BrandPetType): BrandEntry[] {
  return db.brands.filter((b) => b.petType === petType);
}

/** Filter and analyze brands by pet type */
export function getAnalyzedBrandsByPetType(petType: BrandPetType): AnalyzedBrand[] {
  return getBrandsByPetType(petType).map(analyzeBrand);
}

/** Get the grade for a brand entry without full analysis */
export function getBrandGrade(brand: BrandEntry): Grade {
  const parsed = ingredientsToParsed(brand.ingredients);
  return analyzeIngredients(parsed).grade;
}

/** Search brands by name (English or Chinese), case-insensitive */
export function searchBrands(query: string): BrandEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return db.brands.filter(
    (b) =>
      b.brand.toLowerCase().includes(q) ||
      (b.brandCn?.includes(q) ?? false) ||
      b.product.toLowerCase().includes(q) ||
      (b.productCn?.includes(q) ?? false) ||
      b.slug.includes(q)
  );
}

/** Get pet type emoji for display */
export function getPetEmoji(petType: BrandPetType): string {
  return petType === "cat" ? "🐱" : "🐶";
}

/** Get brand database metadata */
export function getBrandDatabaseInfo(): { version: string; lastUpdated: string; totalBrands: number } {
  return {
    version: db.version,
    lastUpdated: db.lastUpdated,
    totalBrands: db.brands.length,
  };
}

export type { BrandEntry, AnalyzedBrand, BrandPetType, BrandDatabase } from "./types";
