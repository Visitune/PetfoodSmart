/**
 * Tests for analyzer + pet profile integration (F008)
 */

import { analyzeIngredients } from "../index";
import type { ParsedIngredient } from "../../ocr/types";
import type { PetProfile } from "../../profile/types";

function makeIngredient(name: string, position: number): ParsedIngredient {
  return {
    original: name,
    normalized: name.toLowerCase(),
    position,
  };
}

describe("analyzeIngredients with pet profile", () => {
  const grainHeavyFood: ParsedIngredient[] = [
    makeIngredient("Corn", 0),
    makeIngredient("Wheat", 1),
    makeIngredient("Soy", 2),
    makeIngredient("Chicken Meal", 3),
    makeIngredient("Chicken Fat", 4),
  ];

  test("produces lower score for grain-sensitive breed with grain-heavy food", () => {
    const baseResult = analyzeIngredients(grainHeavyFood);
    const profileResult = analyzeIngredients(grainHeavyFood, {
      petType: "dog",
      breed: "Irish Setter",
      ageRange: "adult",
      weightKg: 25,
      healthConditions: [],
    });

    expect(profileResult.score).toBeLessThan(baseResult.score);
  });

  test("includes profile warnings in result", () => {
    const result = analyzeIngredients(grainHeavyFood, {
      petType: "dog",
      breed: "Irish Setter",
      ageRange: "adult",
      weightKg: 25,
      healthConditions: [],
    });

    expect(result.profileWarnings).toBeDefined();
    expect(result.profileWarnings!.length).toBeGreaterThan(0);
  });

  test("no profile warnings when no profile provided", () => {
    const result = analyzeIngredients(grainHeavyFood);

    expect(result.profileWarnings).toBeUndefined();
  });

  test("health condition adjustments affect score", () => {
    const baseResult = analyzeIngredients(grainHeavyFood);
    const profileResult = analyzeIngredients(grainHeavyFood, {
      petType: "dog",
      breed: "",
      ageRange: "adult",
      weightKg: 15,
      healthConditions: ["grain_sensitivity"],
    });

    expect(profileResult.score).toBeLessThan(baseResult.score);
  });

  test("works normally when profile has no relevant sensitivities", () => {
    const safeFoodIngredients: ParsedIngredient[] = [
      makeIngredient("Chicken", 0),
      makeIngredient("Sweet Potato", 1),
      makeIngredient("Peas", 2),
    ];

    const baseResult = analyzeIngredients(safeFoodIngredients);
    const profileResult = analyzeIngredients(safeFoodIngredients, {
      petType: "dog",
      breed: "",
      ageRange: "adult",
      weightKg: 15,
      healthConditions: [],
    });

    expect(profileResult.score).toBe(baseResult.score);
  });
});
