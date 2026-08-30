/**
 * OCR module - extracts and parses ingredient text from pet food label images.
 *
 * Pipeline: Image → Tesseract OCR → Text Parser → Structured Ingredients
 */

export { recognizeText, isConfident, MIN_CONFIDENCE } from './ocr-engine';
export { parseIngredients, detectLanguage, normalizeIngredient, stripHeader, containsChinese } from './parser';
export type { OcrResult, ParsedIngredient, ExtractionResult } from './types';

import { recognizeText, isConfident } from './ocr-engine';
import { parseIngredients, detectLanguage } from './parser';
import type { ExtractionResult } from './types';

/**
 * Full extraction pipeline: image → OCR → parse → structured ingredients.
 *
 * @param imageDataUrl - Base64 data URL from camera capture or file upload
 * @param ocrLanguages - Tesseract.js language code(s) to use, e.g. "eng+fra"
 * @returns ExtractionResult with parsed ingredients or error
 */
export async function extractIngredients(
  imageDataUrl: string,
  ocrLanguages?: string
): Promise<ExtractionResult> {
  try {
    const ocrResult = await recognizeText(imageDataUrl, ocrLanguages);

    if (!isConfident(ocrResult)) {
      return {
        success: false,
        ingredients: [],
        rawText: ocrResult.rawText,
        confidence: ocrResult.confidence,
        error: ocrResult.rawText.length === 0
          ? 'No text detected in image. Please ensure the ingredient label is clearly visible.'
          : `Low confidence (${ocrResult.confidence}%). Please try again with better lighting or a clearer image.`,
      };
    }

    const ingredients = parseIngredients(ocrResult.rawText);

    if (ingredients.length === 0) {
      return {
        success: false,
        ingredients: [],
        rawText: ocrResult.rawText,
        confidence: ocrResult.confidence,
        error: 'Could not identify ingredient list in the extracted text. Make sure the image shows the ingredients section of the label.',
      };
    }

    return {
      success: true,
      ingredients,
      rawText: ocrResult.rawText,
      confidence: ocrResult.confidence,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    if (typeof console !== 'undefined') {
      console.error('[extractIngredients] OCR pipeline failed:', error);
    }
    return {
      success: false,
      ingredients: [],
      rawText: '',
      confidence: 0,
      error: `OCR processing failed: ${message}`,
    };
  }
}
