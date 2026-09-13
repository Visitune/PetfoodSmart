/**
 * Tests for breed sensitivity scoring adjustments (F008)
 */

import type { PetProfile, ProfileAdjustmentResult } from "../types";
import type { AnalyzedIngredient } from "../../analyzer/types";
import type { IngredientCategory } from "../../knowledge/types";

// Will import from implementation once written
import {
  calculateProfileAdjustments,
  BREED_SENSITIVITIES,
  CONDITION_INGREDIENT_PENALTIES,
} from "../sensitivities";

/** Helper to create a minimal analyzed ingredient */
function makeIngredient(
  name: string,
  category: string,
  rating: string,
  position = 0
): AnalyzedIngredient {
  return {
    original: name,
    normalized: name.toLowerCase(),
    position,
    flag: rating === "harmful" ? "red" : rating === "caution" ? "yellow" : "green",
    knownIngredient: {
      name,
      category: category as IngredientCategory,
      safety_rating: rating as "safe" | "caution" | "harmful",
      explanation: `Test ${name}`,
      common_aliases: [],
    },
    matchInfo: null,
    explanation: `Test ${name}`,
  };
}

/** Helper to create a base pet profile */
function makeProfile(overrides: Partial<PetProfile> = {}): PetProfile {
  return {
    petType: "dog",
    breed: "",
    ageRange: "adult",
    weightKg: 15,
    healthConditions: [],
    ...overrides,
  };
}

describe("BREED_SENSITIVITIES", () => {
  test("contains known grain-sensitive breeds", () => {
    expect(BREED_SENSITIVITIES["irish setter"]).toBeDefined();
    expect(BREED_SENSITIVITIES["irish setter"]!.sensitiveCategories).toContain("grain");
  });

  test("contains known breeds for dogs and cats", () => {
    // Should have entries for both species
    const breeds = Object.keys(BREED_SENSITIVITIES);
    expect(breeds.length).toBeGreaterThan(5);
  });
});

describe("CONDITION_INGREDIENT_PENALTIES", () => {
  test("grain sensitivity penalizes grain category", () => {
    const penalties = CONDITION_INGREDIENT_PENALTIES["grain_sensitivity"];
    expect(penalties).toBeDefined();
    expect(penalties!.some((p) => p.category === "grain")).toBe(true);
  });

  test("kidney disease penalizes high protein", () => {
    const penalties = CONDITION_INGREDIENT_PENALTIES["kidney_disease"];
    expect(penalties).toBeDefined();
    expect(penalties!.some((p) => p.category === "protein")).toBe(true);
  });
});

describe("calculateProfileAdjustments", () => {
  test("returns no adjustments for empty profile with safe ingredients", () => {
    const profile = makeProfile();
    const ingredients = [
      makeIngredient("Chicken", "protein", "safe", 0),
      makeIngredient("Rice", "grain", "safe", 1),
    ];

    const result = calculateProfileAdjustments(profile, ingredients);

    expect(result.adjustments).toHaveLength(0);
    expect(result.totalAdjustment).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  test("penalizes grain ingredients for grain-sensitive breed", () => {
    const profile = makeProfile({ breed: "Irish Setter" });
    const ingredients = [
      makeIngredient("Chicken", "protein", "safe", 0),
      makeIngredient("Wheat", "grain", "safe", 1),
      makeIngredient("Corn", "grain", "safe", 2),
    ];

    const result = calculateProfileAdjustments(profile, ingredients);

    expect(result.totalAdjustment).toBeLessThan(0);
    expect(result.adjustments.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test("penalizes grain ingredients for grain_sensitivity health condition", () => {
    const profile = makeProfile({
      healthConditions: ["grain_sensitivity"],
    });
    const ingredients = [
      makeIngredient("Chicken", "protein", "safe", 0),
      makeIngredient("Wheat", "grain", "safe", 1),
    ];

    const result = calculateProfileAdjustments(profile, ingredients);

    expect(result.totalAdjustment).toBeLessThan(0);
    expect(result.adjustments.some((a) => a.ingredientName === "Wheat")).toBe(true);
  });

  test("penalizes chicken for chicken_allergy condition", () => {
    const profile = makeProfile({
      healthConditions: ["chicken_allergy"],
    });
    const ingredients = [
      makeIngredient("Chicken", "protein", "safe", 0),
      makeIngredient("Rice", "grain", "safe", 1),
    ];

    const result = calculateProfileAdjustments(profile, ingredients);

    expect(result.totalAdjustment).toBeLessThan(0);
    expect(result.warnings.some((w) => w.toLowerCase().includes("chicken"))).toBe(true);
  });

  test("applies heavier penalty for sensitive ingredients in top positions", () => {
    const profile = makeProfile({
      healthConditions: ["grain_sensitivity"],
    });

    const topGrain = [
      makeIngredient("Wheat", "grain", "safe", 0),
      makeIngredient("Chicken", "protein", "safe", 1),
    ];

    const bottomGrain = [
      makeIngredient("Chicken", "protein", "safe", 0),
      makeIngredient("Chicken Meal", "protein", "safe", 1),
      makeIngredient("Chicken Fat", "fat_oil", "safe", 2),
      makeIngredient("Rice", "grain", "safe", 3),
      makeIngredient("Wheat", "grain", "safe", 8),
    ];

    const topResult = calculateProfileAdjustments(profile, topGrain);
    const bottomResult = calculateProfileAdjustments(profile, bottomGrain);

    // Top position grain should have more penalty per grain ingredient
    const topPerGrain = topResult.totalAdjustment / 1; // 1 grain
    const bottomPerGrain = bottomResult.totalAdjustment / 2; // 2 grains
    expect(topPerGrain).toBeLessThan(bottomPerGrain);
  });

  test("generates warning for senior pets with high protein", () => {
    const profile = makeProfile({ ageRange: "senior" });
    const ingredients = [
      makeIngredient("Chicken", "protein", "safe", 0),
      makeIngredient("Chicken Meal", "protein", "safe", 1),
      makeIngredient("Beef", "protein", "safe", 2),
      makeIngredient("Fish", "protein", "safe", 3),
    ];

    const result = calculateProfileAdjustments(profile, ingredients);

    // Senior pets with lots of protein should get a warning
    expect(result.warnings.some((w) => w.toLowerCase().includes("senior") || w.toLowerCase().includes("protein"))).toBe(true);
  });

  test("generates warning for puppy with low protein", () => {
    const profile = makeProfile({ ageRange: "puppy" });
    const ingredients = [
      makeIngredient("Corn", "grain", "safe", 0),
      makeIngredient("Wheat", "grain", "safe", 1),
      makeIngredient("Soy", "grain", "safe", 2),
    ];

    const result = calculateProfileAdjustments(profile, ingredients);

    expect(result.warnings.some((w) => w.toLowerCase().includes("puppy") || w.toLowerCase().includes("growing"))).toBe(true);
  });

  test("handles breed name case-insensitively", () => {
    const profile1 = makeProfile({ breed: "IRISH SETTER" });
    const profile2 = makeProfile({ breed: "irish setter" });
    const ingredients = [makeIngredient("Wheat", "grain", "safe", 0)];

    const result1 = calculateProfileAdjustments(profile1, ingredients);
    const result2 = calculateProfileAdjustments(profile2, ingredients);

    expect(result1.totalAdjustment).toBe(result2.totalAdjustment);
  });

  test("combines breed and condition adjustments", () => {
    const breedOnly = makeProfile({ breed: "Irish Setter" });
    const conditionOnly = makeProfile({ healthConditions: ["grain_sensitivity"] });
    const both = makeProfile({
      breed: "Irish Setter",
      healthConditions: ["grain_sensitivity"],
    });
    const ingredients = [makeIngredient("Wheat", "grain", "safe", 0)];

    const breedResult = calculateProfileAdjustments(breedOnly, ingredients);
    const conditionResult = calculateProfileAdjustments(conditionOnly, ingredients);
    const bothResult = calculateProfileAdjustments(both, ingredients);

    // Should not double-count the same category penalty from breed + condition
    // But total should be at least as bad as either alone
    expect(bothResult.totalAdjustment).toBeLessThanOrEqual(
      Math.min(breedResult.totalAdjustment, conditionResult.totalAdjustment)
    );
  });

  test("no adjustments for unknown breed", () => {
    const profile = makeProfile({ breed: "Unknown Fancy Breed" });
    const ingredients = [makeIngredient("Wheat", "grain", "safe", 0)];

    const result = calculateProfileAdjustments(profile, ingredients);

    // Unknown breed alone shouldn't trigger breed-specific adjustments
    expect(result.adjustments.filter((a) => a.reason.includes("breed")).length).toBe(0);
  });

  test("handles empty ingredients list", () => {
    const profile = makeProfile({ healthConditions: ["grain_sensitivity"] });

    const result = calculateProfileAdjustments(profile, []);

    expect(result.adjustments).toHaveLength(0);
    expect(result.totalAdjustment).toBe(0);
  });

  test("obesity condition warns about fat-heavy foods", () => {
    const profile = makeProfile({ healthConditions: ["obesity"] });
    const ingredients = [
      makeIngredient("Chicken Fat", "fat_oil", "safe", 0),
      makeIngredient("Animal Fat", "fat_oil", "caution", 1),
    ];

    const result = calculateProfileAdjustments(profile, ingredients);

    expect(result.totalAdjustment).toBeLessThan(0);
  });
});
