/**
 * F025 - Share Image Builder Tests
 */

import { buildShareImage } from "../share-image";
import type { ShareImageData } from "../share-image";
import type { AnalysisSummary, Grade } from "@/lib/analyzer/types";

function makeData(overrides: Partial<ShareImageData> = {}): ShareImageData {
  return {
    grade: "B" as Grade,
    score: 78,
    summary: {
      totalIngredients: 10,
      harmfulCount: 1,
      cautionCount: 2,
      safeCount: 6,
      unknownCount: 1,
      topIngredientIsProtein: true,
      concernPercentage: 10,
    } as AnalysisSummary,
    verdict: "Good quality food with minor concerns.",
    ...overrides,
  };
}

describe("buildShareImage", () => {
  it("returns JSX for og format", () => {
    const result = buildShareImage(makeData(), "og");
    expect(result).toBeDefined();
    expect(result.props).toBeDefined();
  });

  it("returns JSX for square format", () => {
    const result = buildShareImage(makeData(), "square");
    expect(result).toBeDefined();
    expect(result.props).toBeDefined();
  });

  it("includes food name when provided", () => {
    const result = buildShareImage(
      makeData({ foodName: "Orijen Original" }),
      "square"
    );
    const json = JSON.stringify(result);
    expect(json).toContain("Orijen Original");
  });

  it("includes Chinese food name when provided", () => {
    const result = buildShareImage(
      makeData({ foodNameCn: "渴望原始猎食" }),
      "square"
    );
    const json = JSON.stringify(result);
    expect(json).toContain("渴望原始猎食");
  });

  it("includes harmful ingredients in square format", () => {
    const result = buildShareImage(
      makeData({ harmfulNames: ["BHA", "BHT", "Ethoxyquin"] }),
      "square"
    );
    const json = JSON.stringify(result);
    expect(json).toContain("BHA");
    expect(json).toContain("BHT");
    expect(json).toContain("Ethoxyquin");
  });

  it("includes stat counts", () => {
    const result = buildShareImage(makeData(), "og");
    const json = JSON.stringify(result);
    // Stats are passed as props to StatPill components
    expect(json).toContain('"flagged"');
    expect(json).toContain('"review"');
    expect(json).toContain('"safe"');
  });

  it("includes score display", () => {
    const result = buildShareImage(makeData({ score: 92 }), "square");
    const json = JSON.stringify(result);
    expect(json).toContain("92 / 100");
  });

  it("uses cat emoji for cat pet type", () => {
    const result = buildShareImage(makeData({ petType: "cat" }), "og");
    const json = JSON.stringify(result);
    expect(json).toContain("\ud83d\udc31");
  });

  it("uses dog emoji for dog pet type", () => {
    const result = buildShareImage(makeData({ petType: "dog" }), "og");
    const json = JSON.stringify(result);
    expect(json).toContain("\ud83d\udc36");
  });

  it("uses paw emoji when no pet type", () => {
    const result = buildShareImage(makeData({ petType: undefined }), "og");
    const json = JSON.stringify(result);
    expect(json).toContain("\ud83d\udc3e");
  });

  it("handles all grade values", () => {
    const grades: Grade[] = ["A", "B", "C", "D", "F"];
    for (const grade of grades) {
      const ogResult = buildShareImage(makeData({ grade }), "og");
      const sqResult = buildShareImage(makeData({ grade }), "square");
      expect(ogResult).toBeDefined();
      expect(sqResult).toBeDefined();
    }
  });

  it("square format includes verdict text", () => {
    const result = buildShareImage(
      makeData({ verdict: "Premium quality food." }),
      "square"
    );
    const json = JSON.stringify(result);
    expect(json).toContain("Premium quality food.");
  });

  it("square format includes footer branding", () => {
    const result = buildShareImage(makeData(), "square");
    const json = JSON.stringify(result);
    expect(json).toContain("petfoodsmart.com");
  });

  it("limits harmful ingredients to 5 in display", () => {
    const result = buildShareImage(
      makeData({
        harmfulNames: ["A", "B", "C", "D", "E", "F", "G"],
      }),
      "square"
    );
    const json = JSON.stringify(result);
    expect(json).toContain("A, B, C, D, E");
    expect(json).not.toContain("F, G");
  });
});
