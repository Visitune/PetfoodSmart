import { normalizeBarcode, isValidChecksum, validateBarcode } from "../ean";

describe("normalizeBarcode", () => {
  it("strips spaces and dashes", () => {
    expect(normalizeBarcode("3182 5507 0242 3")).toBe("3182550702423");
    expect(normalizeBarcode("3182-5507-0242-3")).toBe("3182550702423");
  });

  it("converts UPC-A (12 digits) to EAN-13", () => {
    expect(normalizeBarcode("012345678905")).toBe("0012345678905");
  });

  it("rejects non-numeric input", () => {
    expect(normalizeBarcode("ABC123")).toBe("");
  });
});

describe("isValidChecksum", () => {
  it("accepts a real EAN-13 (Royal Canin Kitten)", () => {
    expect(isValidChecksum("3182550702423")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidChecksum("3182550702424")).toBe(false);
  });

  it("accepts EAN-8", () => {
    expect(isValidChecksum("96385074")).toBe(true);
    expect(isValidChecksum("96385075")).toBe(false);
  });

  it("rejects bad lengths", () => {
    expect(isValidChecksum("12345")).toBe(false);
    expect(isValidChecksum("")).toBe(false);
  });
});

describe("validateBarcode", () => {
  it("validates a correct barcode", () => {
    expect(validateBarcode("3182550702423")).toEqual({ ok: true, ean: "3182550702423" });
  });

  it("reports empty input", () => {
    expect(validateBarcode("   ")).toEqual({ ok: false, error: "empty" });
  });

  it("reports non-numeric input", () => {
    expect(validateBarcode("ABC")).toEqual({ ok: false, error: "not-numeric" });
  });

  it("reports bad length", () => {
    expect(validateBarcode("12345")).toEqual({ ok: false, error: "bad-length" });
  });

  it("reports bad checksum", () => {
    expect(validateBarcode("3182550702424")).toEqual({ ok: false, error: "bad-checksum" });
  });

  it("normalizes UPC-A then validates", () => {
    const r = validateBarcode("036000291452");
    expect(r).toEqual({ ok: true, ean: "0036000291452" });
  });
});
