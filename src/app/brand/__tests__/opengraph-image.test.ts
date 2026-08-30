/**
 * F024 - Brand OG Image Tests
 *
 * Tests the brand opengraph-image metadata exports and generateStaticParams.
 * The actual ImageResponse rendering is tested via build (static generation).
 */

// Mock next/og before imports
jest.mock("next/og", () => ({
  ImageResponse: jest.fn().mockImplementation((element, options) => ({
    _element: element,
    _options: options,
  })),
}));

import { getAllBrandSlugs, getAnalyzedBrandBySlug } from "@/lib/brands";

// Dynamic imports after mock
let ogModule: typeof import("../[slug]/opengraph-image");

beforeAll(async () => {
  ogModule = await import("../[slug]/opengraph-image");
});

describe("Brand OG Image", () => {
  describe("metadata exports", () => {
    it("exports correct alt text", () => {
      expect(ogModule.alt).toBe("PetFoodSmart Brand Safety Grade");
    });

    it("exports standard OG dimensions", () => {
      expect(ogModule.size).toEqual({ width: 1200, height: 630 });
    });

    it("exports png content type", () => {
      expect(ogModule.contentType).toBe("image/png");
    });
  });

  describe("generateStaticParams", () => {
    it("returns all brand slugs", () => {
      const params = ogModule.generateStaticParams();
      const slugs = getAllBrandSlugs();
      expect(params).toHaveLength(slugs.length);
      for (const slug of slugs) {
        expect(params).toContainEqual({ slug });
      }
    });

    it("each param has a slug property", () => {
      const params = ogModule.generateStaticParams();
      for (const param of params) {
        expect(param).toHaveProperty("slug");
        expect(typeof param.slug).toBe("string");
      }
    });
  });

  describe("OgImage function", () => {
    it("returns ImageResponse for valid brand", async () => {
      const slugs = getAllBrandSlugs();
      const result = await ogModule.default({
        params: Promise.resolve({ slug: slugs[0] }),
      });
      expect(result).toBeDefined();
    });

    it("returns fallback for invalid brand", async () => {
      const result = await ogModule.default({
        params: Promise.resolve({ slug: "nonexistent-brand-xyz" }),
      });
      expect(result).toBeDefined();
    });

    it("generates images for all brands without errors", async () => {
      const slugs = getAllBrandSlugs();
      for (const slug of slugs) {
        const result = await ogModule.default({
          params: Promise.resolve({ slug }),
        });
        expect(result).toBeDefined();
      }
    });
  });
});
