import {
  productUrl,
  flattenIngredients,
  mapOffProduct,
  lookupBarcode,
} from "../openpetfoodfacts";
import { productToParsedIngredients } from "../index";
import type { OffProductResponse } from "../types";
import fixture from "../fixtures/royal-canin-kitten.json";

const EAN = "3182550702423";

function mockFetch(data: unknown, ok = true, status = 200) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
}

describe("productUrl", () => {
  it("builds the v2 API URL with minimal fields", () => {
    const url = productUrl(EAN);
    expect(url).toContain(`openpetfoodfacts.org/api/v2/product/${EAN}.json`);
    expect(url).toContain("fields=");
  });
});

describe("flattenIngredients", () => {
  it("flattens nested sub-ingredients in order", () => {
    const flat = flattenIngredients([
      { text: "poulet" },
      { text: "mélange", ingredients: [{ text: "riz" }, { text: "maïs" }] },
      { text: "x" }, // too short: skipped
      {} as never, // no text: skipped
    ]);
    expect(flat).toEqual(["poulet", "mélange", "riz", "maïs"]);
  });
});

describe("mapOffProduct (real Royal Canin fixture)", () => {
  const data = fixture as unknown as OffProductResponse;

  it("maps product metadata", () => {
    const product = mapOffProduct(data, EAN);
    expect(product).not.toBeNull();
    expect(product!.code).toBe(EAN);
    expect(product!.brand?.toLowerCase()).toContain("royal");
    expect(product!.imageUrl).toContain("http");
    expect(product!.fromTextFallback).toBe(false);
  });

  it("extracts a usable ingredient list", () => {
    const product = mapOffProduct(data, EAN);
    expect(product!.ingredients.length).toBeGreaterThan(5);
    expect(product!.ingredients[0].toLowerCase()).toContain("volaille");
  });

  it("returns null when product is missing", () => {
    expect(mapOffProduct({ status: 0 } as OffProductResponse, EAN)).toBeNull();
  });

  it("falls back to free text when no structured list", () => {
    const product = mapOffProduct(
      {
        status: 1,
        product: { product_name: "X", ingredients_text_fr: "poulet, riz" },
      },
      EAN
    );
    expect(product!.fromTextFallback).toBe(true);
    expect(product!.ingredients).toEqual(["poulet, riz"]);
  });

  it("returns null when no ingredient data at all", () => {
    expect(
      mapOffProduct({ status: 1, product: { product_name: "X" } }, EAN)
    ).toBeNull();
  });
});

describe("lookupBarcode", () => {
  it("returns the product on success", async () => {
    const res = await lookupBarcode(EAN, mockFetch(fixture));
    expect(res.found).toBe(true);
  });

  it("maps 404 to not-found", async () => {
    const res = await lookupBarcode(
      EAN,
      mockFetch({ status: 0 }, false, 404)
    );
    expect(res).toEqual({ found: false, reason: "not-found" });
  });

  it("maps status 0 to not-found", async () => {
    const res = await lookupBarcode(EAN, mockFetch({ status: 0 }));
    expect(res).toEqual({ found: false, reason: "not-found" });
  });

  it("maps network failure to network-error (never throws)", async () => {
    const res = await lookupBarcode(EAN, jest.fn().mockRejectedValue(new Error("down")));
    expect(res).toEqual({ found: false, reason: "network-error" });
  });

  it("maps bad JSON to invalid-response", async () => {
    const res = await lookupBarcode(
      EAN,
      jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new Error("bad")) })
    );
    expect(res).toEqual({ found: false, reason: "invalid-response" });
  });
});

describe("productToParsedIngredients", () => {
  it("converts the real fixture to parsed ingredients", () => {
    const product = mapOffProduct(fixture as unknown as OffProductResponse, EAN)!;
    const parsed = productToParsedIngredients(product);
    expect(parsed.length).toBeGreaterThan(5);
    expect(parsed[0].position).toBe(0);
    // positions are sequential
    parsed.forEach((p, i) => expect(p.position).toBe(i));
  });

  it("parses free-text fallback through the ingredient parser", () => {
    const parsed = productToParsedIngredients({
      code: EAN,
      productName: "X",
      brand: null,
      imageUrl: null,
      ingredients: ["Composition : poulet, riz"],
      fromTextFallback: true,
    });
    expect(parsed.map((p) => p.normalized)).toEqual(["poulet", "riz"]);
  });
});
