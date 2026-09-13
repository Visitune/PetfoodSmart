/**
 * C1 - Barcode lookup types (Open Pet Food Facts)
 */

/** Normalized product data returned to the app (UI-safe, no OFF internals) */
export interface BarcodeProduct {
  /** EAN code as scanned/typed */
  code: string;
  /** Product name (e.g. "kitten 12mois") */
  productName: string | null;
  /** Brand (e.g. "Royal Canin") */
  brand: string | null;
  /** Packshot image URL */
  imageUrl: string | null;
  /** Ingredient texts in label order (structured list preferred) */
  ingredients: string[];
  /** True when ingredients came from free text fallback, not structured list */
  fromTextFallback: boolean;
}

/** Result of an Open Pet Food Facts lookup */
export type BarcodeLookupResult =
  | { found: true; product: BarcodeProduct }
  | { found: false; reason: "not-found" | "no-ingredients" | "network-error" | "invalid-response" };

/** Raw OFF API v2 product payload (subset we consume) */
export interface OffIngredient {
  id?: string;
  text?: string;
  percent_estimate?: number;
  ingredients?: OffIngredient[];
}

export interface OffProductResponse {
  status: number;
  code?: string;
  product?: {
    code?: string;
    product_name?: string;
    brands?: string;
    lang?: string;
    image_url?: string;
    ingredients_text_fr?: string;
    ingredients_text?: string;
    ingredients?: OffIngredient[];
  };
}
