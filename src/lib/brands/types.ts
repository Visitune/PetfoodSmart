/**
 * F014 - Brand Database Types
 *
 * Schema for pre-analyzed pet food brand entries.
 * Analysis results are computed at build time, not stored in the JSON.
 */

import type { AnalysisResult } from "../analyzer/types";

/** Pet type for a brand product */
export type BrandPetType = "cat" | "dog";

/** Raw brand entry as stored in data/brands.json */
export interface BrandEntry {
  /** URL-safe slug, e.g. "felin-dore-cat" */
  slug: string;
  /** English brand name */
  brand: string;
  /** Chinese brand name (omitted for fictional demo brands) */
  brandCn?: string;
  /** English product line name */
  product: string;
  /** Chinese product line name (omitted for fictional demo brands) */
  productCn?: string;
  /** Target pet type */
  petType: BrandPetType;
  /** Ordered ingredient list from packaging */
  ingredients: string[];
  /** Data source (packaging URL or "packaging") */
  source: string;
}

/** Brand entry with computed analysis result */
export interface AnalyzedBrand extends BrandEntry {
  /** Analysis result computed from ingredients */
  analysis: AnalysisResult;
}

/** Brand database file structure */
export interface BrandDatabase {
  version: string;
  lastUpdated: string;
  brands: BrandEntry[];
}
