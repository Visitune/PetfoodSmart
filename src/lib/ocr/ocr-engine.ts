/**
 * OCR Engine - wraps Tesseract.js for ingredient label text extraction.
 *
 * Uses client-side Tesseract.js. The caller picks which language pack(s) to
 * load (see DEFAULT_OCR_LANGUAGES) — kept to at most two languages at a time
 * (the UI's current language + English) rather than always loading every
 * supported language, since each additional pack is a real download/memory
 * cost that has caused OCR to fail outright on some mobile devices.
 *
 * The worker script and core WASM builds are served from our own /public
 * folder (see workerPath/corePath below) instead of Tesseract.js's default
 * jsdelivr CDN. By default, every scan depends on that third-party CDN being
 * reachable from the user's phone/network — if it's blocked or unreachable
 * (ad blocker, carrier content filter, flaky mobile connection), the worker
 * fails before it ever reports a single progress event, surfacing as an
 * opaque `undefined` rejection. Self-hosting removes that dependency.
 * Language traineddata (eng/fra/spa/nld/chi_sim) is self-hosted too, for the
 * same reason.
 */

import type { OcrResult } from './types';
import { detectLanguage } from './parser';

/** Minimum confidence threshold (0-100) to consider OCR successful */
const MIN_CONFIDENCE = 60;

/** Fallback Tesseract.js language string when the caller doesn't specify one */
const DEFAULT_OCR_LANGUAGES = 'eng';

/** Self-hosted worker script, core WASM, and language data (see public/tesseract) */
const WORKER_PATH = '/tesseract/worker.min.js';
const CORE_PATH = '/tesseract/core';
const LANG_PATH = '/tesseract/lang-data';

/**
 * Extract text from an image using Tesseract.js OCR.
 *
 * @param imageDataUrl - Base64 data URL of the image (from camera/upload)
 * @param languages - Tesseract.js language code(s), e.g. "eng+fra". Defaults to "eng".
 * @returns OcrResult with raw text, confidence, and language
 */
export async function recognizeText(
  imageDataUrl: string,
  languages: string = DEFAULT_OCR_LANGUAGES
): Promise<OcrResult> {
  const Tesseract = (await import('tesseract.js')).default;

  // Tesseract runs recognition inside a Web Worker. When something goes wrong
  // in there (OOM, a WASM init failure, a network error loading a language
  // file...) the outer promise can reject with `undefined` and no useful
  // message. logger/errorHandler are the only way to see what actually
  // happened, so we capture both and fold them into the thrown error.
  let lastStatus = 'unknown';
  let workerError: unknown;

  let result;
  try {
    result = await Tesseract.recognize(imageDataUrl, languages, {
      workerPath: WORKER_PATH,
      corePath: CORE_PATH,
      langPath: LANG_PATH,
      logger: (m) => {
        lastStatus = `${m.status} (${Math.round(m.progress * 100)}%)`;
      },
      errorHandler: (err: unknown) => {
        workerError = err;
      },
    });
  } catch (err) {
    const rejection = err instanceof Error ? err.message : String(err);
    const workerDetail =
      workerError instanceof Error
        ? workerError.message
        : workerError !== undefined
          ? JSON.stringify(workerError)
          : null;
    const detail = [rejection, workerDetail].filter((d) => d && d !== '{}').join(' | worker: ');
    throw new Error(
      `Tesseract recognition failed (languages: ${languages}, last stage: ${lastStatus}): ${detail || 'no additional detail'}`
    );
  }

  const rawText = result.data.text.trim();
  const confidence = Math.round(result.data.confidence);
  const language = detectLanguage(rawText);

  return {
    rawText,
    confidence,
    language,
  };
}

/**
 * Check if OCR result meets minimum quality threshold.
 */
export function isConfident(result: OcrResult): boolean {
  return result.confidence >= MIN_CONFIDENCE && result.rawText.length > 0;
}

export { MIN_CONFIDENCE };
