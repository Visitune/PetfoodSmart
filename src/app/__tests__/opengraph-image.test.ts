/**
 * F024 - Homepage OG Image Tests
 */

jest.mock("next/og", () => ({
  ImageResponse: jest.fn().mockImplementation((element, options) => ({
    _element: element,
    _options: options,
  })),
}));

let ogModule: typeof import("../opengraph-image");

beforeAll(async () => {
  ogModule = await import("../opengraph-image");
});

describe("Homepage OG Image", () => {
  describe("metadata exports", () => {
    it("exports correct alt text", () => {
      expect(ogModule.alt).toBe("PetFoodSmart - Pet Food Ingredient Scanner");
    });

    it("exports standard OG dimensions", () => {
      expect(ogModule.size).toEqual({ width: 1200, height: 630 });
    });

    it("exports png content type", () => {
      expect(ogModule.contentType).toBe("image/png");
    });
  });

  describe("OgImage function", () => {
    it("returns ImageResponse", async () => {
      const result = await ogModule.default();
      expect(result).toBeDefined();
    });
  });
});
