/**
 * C1 - Barcode module: EAN validation + Open Pet Food Facts lookup.
 */
export type {
  BarcodeProduct,
  BarcodeLookupResult,
  OffIngredient,
  OffProductResponse,
} from "./types";
export { normalizeBarcode, isValidChecksum, validateBarcode } from "./ean";
export {
  productUrl,
  flattenIngredients,
  mapOffProduct,
  lookupBarcode,
} from "./openpetfoodfacts";
export type { FetchFn } from "./openpetfoodfacts";

import { parseIngredients } from "../ocr/parser";
import type { ParsedIngredient } from "../ocr/types";
import type { BarcodeProduct } from "./types";

/**
 * Convert a looked-up product to parsed ingredients ready for analysis.
 * Structured OFF lists are joined and run through the standard ingredient
 * parser, so FR headers, "(dont Y%)" extraction and % cleanup apply
 * exactly as they do for OCR text. One code path, one behavior.
 */
export function productToParsedIngredients(product: BarcodeProduct): ParsedIngredient[] {
  const text = product.fromTextFallback
    ? product.ingredients[0]
    : product.ingredients.join(", ");
  return parseIngredients(text);
}
