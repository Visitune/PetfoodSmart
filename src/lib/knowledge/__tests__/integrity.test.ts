/**
 * Knowledge base integrity tests.
 *
 * Guards the data contract the matcher relies on: every alias listed on an
 * entry must resolve back to that entry through the real lookup precedence
 * (exact > alias > variant > fuzzy). A "dead" alias that resolves elsewhere
 * is misleading data — it can never match its owner — so the suite fails
 * instead of silently accumulating unreachable aliases.
 */
import ingredientsData from "../../../../data/ingredients.json";
import { lookupIngredient } from "../index";
import type { KnowledgeBase } from "../types";

const db = ingredientsData as KnowledgeBase;

describe("knowledge base integrity", () => {
  it("every alias resolves back to its owning entry", () => {
    const failures: string[] = [];
    for (const ingredient of db.ingredients) {
      for (const alias of ingredient.common_aliases) {
        const result = lookupIngredient(alias);
        if (!result || result.ingredient.name !== ingredient.name) {
          failures.push(
            `"${alias}" listed on [${ingredient.name}] resolves to [${
              result ? result.ingredient.name : "null"
            }]`
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("has no duplicate ingredient names", () => {
    const names = db.ingredients.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every entry has a valid category, rating and explanation", () => {
    for (const ingredient of db.ingredients) {
      expect(ingredient.name.length).toBeGreaterThan(0);
      expect(ingredient.category).toBeTruthy();
      expect(["safe", "caution", "harmful"]).toContain(ingredient.safety_rating);
      expect(ingredient.explanation.length).toBeGreaterThan(0);
      expect(ingredient.common_aliases.length).toBeGreaterThan(0);
    }
  });
});
