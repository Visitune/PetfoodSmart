/**
 * C1 - Open Pet Food Facts client.
 *
 * Free, no-key, community database (https://world.openpetfoodfacts.org).
 * The fetch function is injectable so tests run offline against fixtures.
 */

import type {
  BarcodeLookupResult,
  BarcodeProduct,
  OffIngredient,
  OffProductResponse,
} from "./types";

const API_BASE = "https://world.openpetfoodfacts.org/api/v2/product";
const FIELDS =
  "code,status,product_name,brands,lang,image_url,ingredients_text_fr,ingredients_text,ingredients";

/** Fields requested from OFF (kept small: no nutriments/images payload) */
export function productUrl(ean: string): string {
  return `${API_BASE}/${ean}.json?fields=${FIELDS}`;
}

/** Flatten structured ingredients (incl. nested sub-ingredients) to texts */
export function flattenIngredients(list: OffIngredient[] | undefined): string[] {
  if (!list) return [];
  const out: string[] = [];
  const walk = (items: OffIngredient[]) => {
    for (const item of items) {
      if (typeof item.text === "string" && item.text.trim().length >= 2) {
        out.push(item.text.trim());
      }
      if (Array.isArray(item.ingredients)) walk(item.ingredients);
    }
  };
  walk(list);
  return out;
}

/** Map a raw OFF response to a BarcodeProduct (null when unusable) */
export function mapOffProduct(data: OffProductResponse, ean: string): BarcodeProduct | null {
  if (!data || data.status !== 1 || !data.product) return null;
  const p = data.product;

  let ingredients = flattenIngredients(p.ingredients);
  let fromTextFallback = false;
  if (ingredients.length === 0) {
    const text = (p.ingredients_text_fr || p.ingredients_text || "").trim();
    if (!text) return null;
    // Free-text fallback: the caller splits it with the ingredient parser
    ingredients = [text];
    fromTextFallback = true;
  }

  return {
    code: p.code || ean,
    productName: p.product_name?.trim() || null,
    brand: p.brands?.split(",")[0]?.trim() || null,
    imageUrl: p.image_url || null,
    ingredients,
    fromTextFallback,
  };
}

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Look up a barcode on Open Pet Food Facts.
 * Never throws: all failures are encoded in the result.
 */
export async function lookupBarcode(
  ean: string,
  fetchFn: FetchFn = fetch,
  timeoutMs = 8000
): Promise<BarcodeLookupResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(productUrl(ean), {
      signal: controller.signal,
      headers: { "User-Agent": "PetFoodSmart/1.0 (pet food safety scanner)" },
    });
    if (!res.ok) {
      return { found: false, reason: res.status === 404 ? "not-found" : "network-error" };
    }
    let data: OffProductResponse;
    try {
      data = (await res.json()) as OffProductResponse;
    } catch {
      return { found: false, reason: "invalid-response" };
    }
    if (!data || data.status !== 1) return { found: false, reason: "not-found" };
    const product = mapOffProduct(data, ean);
    if (!product) return { found: false, reason: "no-ingredients" };
    return { found: true, product };
  } catch {
    return { found: false, reason: "network-error" };
  } finally {
    clearTimeout(timer);
  }
}
