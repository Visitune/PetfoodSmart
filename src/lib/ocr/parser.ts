/**
 * Ingredient text parser - extracts structured ingredient list from raw OCR text.
 *
 * Pet food labels follow a standard format:
 * "Ingredients: chicken, rice, chicken fat, ..." (English)
 * "成分：鸡肉、大米、鸡脂肪、..." (Chinese)
 *
 * Handles: comma-separated, Chinese comma (、) separated, parenthetical sub-ingredients,
 * multi-line labels, and mixed language text.
 */

import type { ParsedIngredient } from './types';

/** Common ingredient list header patterns */
const HEADER_PATTERNS: RegExp[] = [
  /ingredients?\s*[:：]/i,
  /成\s*分\s*[:：]/,
  /原\s*料\s*[:：]/,
  /配\s*料\s*[:：]/,
  /composition\s*[:：]/i,
];

/** Characters that separate ingredients */
const SEPARATOR_PATTERN = /[,，、;；]+/;

/**
 * Detect if text contains Chinese characters
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Remove the "Ingredients:" header from the text, returning just the ingredient list.
 */
export function stripHeader(text: string): string {
  for (const pattern of HEADER_PATTERNS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      return text.slice(match.index + match[0].length).trim();
    }
  }
  return text.trim();
}

/**
 * Clean and normalize a single ingredient name.
 * Removes extra whitespace, parenthetical info, and normalizes case.
 */
export function normalizeIngredient(raw: string): string {
  let cleaned = raw.trim();

  // Remove leading/trailing punctuation and whitespace
  cleaned = cleaned.replace(/^[\s.,，、;；:：]+|[\s.,，、;；:：]+$/g, '');

  // Collapse multiple spaces/newlines into single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Remove percentage values like "(30%)", "30%", or "5,4%" (French/EU decimal comma)
  cleaned = cleaned.replace(/\(?\s*\d+[.,]?\d*\s*%\s*\)?/g, '').trim();

  // Normalize to lowercase for English text
  if (!containsChinese(cleaned)) {
    cleaned = cleaned.toLowerCase();
  }

  return cleaned;
}

/**
 * Handle parenthetical sub-ingredients.
 * "chicken meal (source of glucosamine)" -> keep as-is
 * But strip pure parenthetical noise like "(preserved with mixed tocopherols)"
 */
export function cleanParenthetical(text: string): string {
  // Remove preservative notes in parens
  return text.replace(
    /\(\s*(?:preserved|source of|a source of|contains|including)\s+[^)]*\)/gi,
    ''
  ).trim();
}

/**
 * Parse raw OCR text into a structured ingredient list.
 */
export function parseIngredients(rawText: string): ParsedIngredient[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Strip header
  let text = stripHeader(rawText);

  // Clean up common OCR artifacts
  text = text
    .replace(/\|/g, 'l')     // pipe often misread for l
    .replace(/0(?=[a-z])/gi, 'o') // zero before letter often misread
    .replace(/\n+/g, ' ')    // join multi-line text
    .trim();

  // Remove trailing period or other sentence-ending punctuation
  text = text.replace(/[.。!！]+\s*$/, '').trim();

  // Protect French/EU-style decimal commas (e.g. "5,4%") from being
  // split as if the comma were an ingredient separator.
  const DECIMAL_COMMA_PLACEHOLDER = '\u0000';
  text = text.replace(/(\d),(\d)/g, `$1${DECIMAL_COMMA_PLACEHOLDER}$2`);

  // Split by separators, then restore the protected decimal commas
  const parts = text
    .split(SEPARATOR_PATTERN)
    .map((p) => p.split(DECIMAL_COMMA_PLACEHOLDER).join(','));

  const ingredients: ParsedIngredient[] = [];

  for (let i = 0; i < parts.length; i++) {
    let part = cleanParenthetical(parts[i]);
    const normalized = normalizeIngredient(part);

    // Skip empty or too-short entries (likely OCR noise)
    if (normalized.length < 2) {
      continue;
    }

    // Skip entries that look like non-ingredient text
    if (/^\d+$/.test(normalized)) {
      continue;
    }

    ingredients.push({
      original: parts[i].trim(),
      normalized,
      position: ingredients.length,
    });
  }

  return ingredients;
}

/**
 * Detect the primary language of the ingredient text.
 */
export function detectLanguage(text: string): 'eng' | 'chi' | 'mixed' | 'unknown' {
  if (!text || !text.trim()) return 'unknown';

  const hasChinese = containsChinese(text);
  const hasEnglish = /[a-zA-Z]{2,}/.test(text);

  if (hasChinese && hasEnglish) return 'mixed';
  if (hasChinese) return 'chi';
  if (hasEnglish) return 'eng';
  return 'unknown';
}
