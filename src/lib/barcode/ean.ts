/**
 * C1 - EAN/UPC validation and normalization.
 *
 * Pet food sold in the EU uses EAN-13 (occasionally EAN-8 for small packs).
 * US imports may carry UPC-A (12 digits). All are validated with the
 * GS1 modulo-10 checksum so typos are caught before any network call.
 */

/** Normalize user input: strip spaces/dashes, convert UPC-A (12) to EAN-13 */
export function normalizeBarcode(input: string): string {
  const digits = input.replace(/[\s-]+/g, "");
  if (!/^\d+$/.test(digits)) return "";
  // UPC-A (12 digits) -> EAN-13 by prepending a zero
  if (digits.length === 12) return `0${digits}`;
  return digits;
}

/** GS1 modulo-10 checksum validation (works for EAN-13 and EAN-8) */
export function isValidChecksum(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  if (digits.length !== 8 && digits.length !== 13) return false;
  const check = Number(digits[digits.length - 1]);
  const body = digits.slice(0, -1);
  let sum = 0;
  // From the rightmost body digit: weights 3,1,3,1...
  for (let i = 0; i < body.length; i++) {
    const d = Number(body[body.length - 1 - i]);
    sum += d * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Validate a barcode typed or scanned by the user.
 * Returns the normalized EAN or a machine-readable error key.
 */
export function validateBarcode(
  input: string
): { ok: true; ean: string } | { ok: false; error: "empty" | "not-numeric" | "bad-length" | "bad-checksum" } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (!/^[\d\s-]+$/.test(trimmed)) return { ok: false, error: "not-numeric" };
  const digits = normalizeBarcode(trimmed);
  if (digits.length !== 8 && digits.length !== 13) return { ok: false, error: "bad-length" };
  if (!isValidChecksum(digits)) return { ok: false, error: "bad-checksum" };
  return { ok: true, ean: digits };
}
