/**
 * Tests for scan history localStorage persistence (F009)
 */

import type { AnalysisResult } from "../../analyzer/types";
import {
  loadHistory,
  saveToHistory,
  deleteFromHistory,
  clearHistory,
  getHistoryEntry,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ENTRIES,
} from "../storage";

/** Create a minimal valid AnalysisResult for testing */
function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    grade: "B",
    score: 78,
    ingredients: [],
    summary: {
      totalIngredients: 5,
      harmfulCount: 0,
      cautionCount: 1,
      safeCount: 3,
      unknownCount: 1,
      topIngredientIsProtein: true,
      concernPercentage: 20,
    },
    verdict: "Good quality food overall.",
    insufficientData: false,
    ...overrides,
  };
}

describe("history storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("loadHistory returns empty array when nothing saved", () => {
    expect(loadHistory()).toEqual([]);
  });

  test("loadHistory returns empty array for corrupted data", () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, "not-json");
    expect(loadHistory()).toEqual([]);
  });

  test("loadHistory returns empty array for non-array data", () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ foo: 1 }));
    expect(loadHistory()).toEqual([]);
  });

  test("saveToHistory stores an entry and returns it", () => {
    const result = makeResult();
    const entry = saveToHistory(result, "Premium Dog Food");

    expect(entry.id).toBeTruthy();
    expect(entry.scannedAt).toBeTruthy();
    expect(entry.foodName).toBe("Premium Dog Food");
    expect(entry.result).toEqual(result);

    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(entry.id);
  });

  test("saveToHistory uses empty string when no food name provided", () => {
    const entry = saveToHistory(makeResult());
    expect(entry.foodName).toBe("");
  });

  test("saveToHistory prepends new entries (most recent first)", () => {
    saveToHistory(makeResult({ score: 60 }), "Food A");
    saveToHistory(makeResult({ score: 90 }), "Food B");

    const history = loadHistory();
    expect(history).toHaveLength(2);
    expect(history[0].foodName).toBe("Food B");
    expect(history[1].foodName).toBe("Food A");
  });

  test("saveToHistory prunes to MAX_HISTORY_ENTRIES", () => {
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i++) {
      saveToHistory(makeResult(), `Food ${i}`);
    }

    const history = loadHistory();
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    // Most recent should be last added
    expect(history[0].foodName).toBe(`Food ${MAX_HISTORY_ENTRIES + 4}`);
  });

  test("deleteFromHistory removes entry by ID", () => {
    const entry1 = saveToHistory(makeResult(), "Keep");
    const entry2 = saveToHistory(makeResult(), "Delete");

    deleteFromHistory(entry2.id);

    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(entry1.id);
  });

  test("deleteFromHistory does nothing for unknown ID", () => {
    saveToHistory(makeResult(), "Food");
    deleteFromHistory("nonexistent-id");

    expect(loadHistory()).toHaveLength(1);
  });

  test("clearHistory removes all entries", () => {
    saveToHistory(makeResult(), "A");
    saveToHistory(makeResult(), "B");

    clearHistory();

    expect(loadHistory()).toEqual([]);
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  test("getHistoryEntry returns entry by ID", () => {
    const entry = saveToHistory(makeResult(), "Target");
    saveToHistory(makeResult(), "Other");

    const found = getHistoryEntry(entry.id);
    expect(found).not.toBeNull();
    expect(found!.foodName).toBe("Target");
  });

  test("getHistoryEntry returns null for unknown ID", () => {
    saveToHistory(makeResult(), "Exists");
    expect(getHistoryEntry("nope")).toBeNull();
  });

  test("entries have unique IDs", () => {
    const e1 = saveToHistory(makeResult(), "A");
    const e2 = saveToHistory(makeResult(), "B");
    expect(e1.id).not.toBe(e2.id);
  });

  test("entries have valid ISO timestamps", () => {
    const entry = saveToHistory(makeResult(), "Test");
    const parsed = new Date(entry.scannedAt);
    expect(parsed.getTime()).not.toBeNaN();
  });
});
