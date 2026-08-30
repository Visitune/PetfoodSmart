/**
 * F035 - Share Image API Route Tests (updated for visual upgrade)
 *
 * Tests the share image generation logic. Since NextRequest requires the
 * Request global (unavailable in jsdom), we test the underlying modules
 * (share-image builder, constants, brand data) directly.
 * The actual API route is tested via build (static generation).
 */

import { buildShareImage } from "@/lib/og/share-image";
import type { ShareImageData } from "@/lib/og/share-image";
import { GRADE_HEX, OG_WIDTH, OG_HEIGHT, SQUARE_WIDTH, SQUARE_HEIGHT } from "@/lib/og/constants";
import { getAnalyzedBrandBySlug, getAllBrandSlugs } from "@/lib/brands";
import type { AnalysisSummary, Grade } from "@/lib/analyzer/types";

function makeSummary(overrides: Partial<AnalysisSummary> = {}): AnalysisSummary {
  return {
    totalIngredients: 10,
    harmfulCount: 1,
    cautionCount: 2,
    safeCount: 6,
    unknownCount: 1,
    topIngredientIsProtein: true,
    concernPercentage: 10,
    ...overrides,
  };
}

function makeData(overrides: Partial<ShareImageData> = {}): ShareImageData {
  return {
    grade: "B" as Grade,
    score: 78,
    summary: makeSummary(),
    verdict: "Good quality food.",
    foodName: "My Pet Food",
    harmfulNames: ["BHA", "BHT"],
    safeNames: ["Chicken", "Rice"],
    ...overrides,
  };
}

/** Recursively extract all style objects from JSX tree, resolving function components */
function collectStyles(element: React.ReactElement): Record<string, unknown>[] {
  const styles: Record<string, unknown>[] = [];

  // If this is a function component, call it to get rendered output
  if (typeof element?.type === "function") {
    const rendered = (element.type as (props: Record<string, unknown>) => React.ReactElement)(element.props);
    if (rendered && typeof rendered === "object" && "props" in rendered) {
      return collectStyles(rendered);
    }
    return styles;
  }

  if (element?.props?.style) {
    styles.push(element.props.style as Record<string, unknown>);
  }
  if (element?.props?.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      if (child && typeof child === "object" && "props" in child) {
        styles.push(...collectStyles(child as React.ReactElement));
      }
    }
  }
  return styles;
}

describe("Share Image API — integration", () => {
  describe("brand share image generation", () => {
    it("generates OG share data for a valid brand", () => {
      const brand = getAnalyzedBrandBySlug("vitalis-naturel-dog");
      expect(brand).toBeDefined();
      if (!brand) return;

      const data: ShareImageData = {
        grade: brand.analysis.grade,
        score: brand.analysis.score,
        summary: brand.analysis.summary,
        verdict: brand.analysis.verdict,
        foodName: `${brand.brand} ${brand.product}`,
        petType: brand.petType,
        harmfulNames: brand.analysis.ingredients
          .filter((i) => i.flag === "red")
          .slice(0, 5)
          .map((i) => i.original),
      };

      const ogImage = buildShareImage(data, "og");
      expect(ogImage).toBeDefined();
      expect(ogImage.props).toBeDefined();
    });

    it("generates square share data for a valid brand", () => {
      const brand = getAnalyzedBrandBySlug("vitalis-naturel-dog");
      expect(brand).toBeDefined();
      if (!brand) return;

      const data: ShareImageData = {
        grade: brand.analysis.grade,
        score: brand.analysis.score,
        summary: brand.analysis.summary,
        verdict: brand.analysis.verdict,
        foodName: `${brand.brand} ${brand.product}`,
        petType: brand.petType,
      };

      const sqImage = buildShareImage(data, "square");
      expect(sqImage).toBeDefined();
    });

    it("generates share images for all brands without errors", () => {
      const slugs = getAllBrandSlugs();
      expect(slugs.length).toBeGreaterThan(0);

      for (const slug of slugs) {
        const brand = getAnalyzedBrandBySlug(slug);
        expect(brand).toBeDefined();
        if (!brand) continue;

        const data: ShareImageData = {
          grade: brand.analysis.grade,
          score: brand.analysis.score,
          summary: brand.analysis.summary,
          verdict: brand.analysis.verdict,
          foodName: `${brand.brand} ${brand.product}`,
          petType: brand.petType,
        };

        // Both formats
        expect(buildShareImage(data, "og")).toBeDefined();
        expect(buildShareImage(data, "square")).toBeDefined();
      }
    });
  });

  describe("scan result share image generation", () => {
    it("generates share image for scan result data", () => {
      const data = makeData();
      expect(buildShareImage(data, "og")).toBeDefined();
      expect(buildShareImage(data, "square")).toBeDefined();
    });

    it("handles empty food name", () => {
      const data = makeData({ foodName: undefined, harmfulNames: undefined, safeNames: undefined });
      expect(buildShareImage(data, "og")).toBeDefined();
      expect(buildShareImage(data, "square")).toBeDefined();
    });

    it("handles all grade values", () => {
      const grades: Grade[] = ["A", "B", "C", "D", "F"];
      for (const grade of grades) {
        const data = makeData({ grade });
        expect(buildShareImage(data, "og")).toBeDefined();
        expect(buildShareImage(data, "square")).toBeDefined();
      }
    });
  });

  describe("format dimensions", () => {
    it("OG format uses 1200x630", () => {
      expect(OG_WIDTH).toBe(1200);
      expect(OG_HEIGHT).toBe(630);
    });

    it("square format uses 1080x1080", () => {
      expect(SQUARE_WIDTH).toBe(1080);
      expect(SQUARE_HEIGHT).toBe(1080);
    });
  });

  describe("grade colors", () => {
    it("all grades have hex colors for share images", () => {
      const grades: Grade[] = ["A", "B", "C", "D", "F"];
      for (const grade of grades) {
        expect(GRADE_HEX[grade]).toMatch(/^#[0-9a-f]{6}$/);
      }
    });
  });

  describe("F035 visual upgrade — gradient background", () => {
    it("OG image root uses gradient backgroundImage", () => {
      const image = buildShareImage(makeData(), "og");
      const rootStyle = image.props.style as Record<string, unknown>;
      expect(rootStyle.backgroundImage).toMatch(/linear-gradient/);
    });

    it("square image root uses gradient backgroundImage", () => {
      const image = buildShareImage(makeData(), "square");
      const rootStyle = image.props.style as Record<string, unknown>;
      expect(rootStyle.backgroundImage).toMatch(/linear-gradient/);
    });
  });

  describe("F035 visual upgrade — glassmorphism card", () => {
    it("OG image contains a glass card with semi-transparent background", () => {
      const image = buildShareImage(makeData(), "og");
      const styles = collectStyles(image);
      const glassCard = styles.find(
        (s) => typeof s.backgroundColor === "string" && s.backgroundColor.startsWith("rgba(255")
      );
      expect(glassCard).toBeDefined();
      expect(glassCard?.borderRadius).toBe("24px");
      expect(glassCard?.border).toMatch(/rgba\(255/);
    });

    it("square image contains a glass card with semi-transparent background", () => {
      const image = buildShareImage(makeData(), "square");
      const styles = collectStyles(image);
      const glassCard = styles.find(
        (s) => typeof s.backgroundColor === "string" && s.backgroundColor.startsWith("rgba(255")
      );
      expect(glassCard).toBeDefined();
      expect(glassCard?.borderRadius).toBe("24px");
    });
  });

  describe("F035 visual upgrade — grade-colored glow", () => {
    it("grade circle has multi-layer box-shadow for each grade", () => {
      const grades: Grade[] = ["A", "B", "C", "D", "F"];
      for (const grade of grades) {
        const image = buildShareImage(makeData({ grade }), "og");
        const styles = collectStyles(image);
        const gradeCircle = styles.find(
          (s) => s.backgroundColor === GRADE_HEX[grade] && typeof s.boxShadow === "string"
        );
        expect(gradeCircle).toBeDefined();
        // Multi-layer shadow (at least 2 shadow layers separated by commas)
        const shadow = gradeCircle?.boxShadow as string;
        expect(shadow.split(",").length).toBeGreaterThanOrEqual(2);
      }
    });

    it("ambient glow element exists behind card", () => {
      const image = buildShareImage(makeData(), "og");
      const styles = collectStyles(image);
      const ambientGlow = styles.find(
        (s) => s.position === "absolute" && s.borderRadius === "50%" && typeof s.boxShadow === "string"
      );
      expect(ambientGlow).toBeDefined();
    });
  });

  describe("F035 visual upgrade — stat pills", () => {
    it("stat indicators use pill-shaped containers with borders", () => {
      const image = buildShareImage(makeData(), "og");
      const styles = collectStyles(image);
      const pills = styles.filter(
        (s) => s.borderRadius === "20px" && typeof s.border === "string"
      );
      // 3 stat pills: harmful, caution, safe
      expect(pills.length).toBe(3);
    });
  });
});
