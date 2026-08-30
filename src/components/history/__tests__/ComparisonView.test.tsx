/**
 * Tests for ComparisonView component (F009)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparisonView } from "../ComparisonView";
import type { ScanHistoryEntry } from "@/lib/history/types";
import type { AnalysisResult } from "@/lib/analyzer/types";

function makeEntry(
  grade: "A" | "B" | "C" | "D" | "F",
  score: number,
  foodName: string,
  overrides: Partial<ScanHistoryEntry> = {}
): ScanHistoryEntry {
  return {
    id: `test-${Math.random()}`,
    scannedAt: "2026-03-19T10:30:00.000Z",
    foodName,
    result: {
      grade,
      score,
      ingredients: [],
      summary: {
        totalIngredients: 10,
        harmfulCount: grade === "F" ? 3 : 0,
        cautionCount: 2,
        safeCount: grade === "A" ? 8 : 5,
        unknownCount: 0,
        topIngredientIsProtein: true,
        concernPercentage: grade === "F" ? 50 : 10,
      },
      verdict:
        grade === "A" ? "Excellent food!" : "Could be better.",
      insufficientData: false,
    } as AnalysisResult,
    ...overrides,
  };
}

describe("ComparisonView", () => {
  const left = makeEntry("A", 95, "Premium Brand");
  const right = makeEntry("C", 62, "Budget Brand");

  test("renders comparison view", () => {
    render(
      <ComparisonView left={left} right={right} onClose={jest.fn()} />
    );
    expect(screen.getByTestId("comparison-view")).toBeInTheDocument();
    expect(screen.getByText("Food Comparison")).toBeInTheDocument();
  });

  test("displays both food names", () => {
    render(
      <ComparisonView left={left} right={right} onClose={jest.fn()} />
    );
    // Names appear in badge area and verdict section
    expect(screen.getAllByText("Premium Brand").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Budget Brand").length).toBeGreaterThanOrEqual(1);
  });

  test("displays both grade letters", () => {
    render(
      <ComparisonView left={left} right={right} onClose={jest.fn()} />
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  test("shows vs separator", () => {
    render(
      <ComparisonView left={left} right={right} onClose={jest.fn()} />
    );
    expect(screen.getByText("vs")).toBeInTheDocument();
  });

  test("displays stat rows", () => {
    render(
      <ComparisonView left={left} right={right} onClose={jest.fn()} />
    );
    const statRows = screen.getAllByTestId("stat-row");
    expect(statRows.length).toBe(5); // Score, Safe, Caution, Harmful, Total
  });

  test("displays verdicts for both foods", () => {
    render(
      <ComparisonView left={left} right={right} onClose={jest.fn()} />
    );
    expect(screen.getByTestId("left-verdict")).toHaveTextContent(
      "Excellent food!"
    );
    expect(screen.getByTestId("right-verdict")).toHaveTextContent(
      "Could be better."
    );
  });

  test("calls onClose when back button clicked", () => {
    const onClose = jest.fn();
    render(
      <ComparisonView left={left} right={right} onClose={onClose} />
    );

    fireEvent.click(screen.getByText("Back to History"));
    expect(onClose).toHaveBeenCalled();
  });

  test("uses default names when food names are empty", () => {
    const noNameLeft = makeEntry("B", 80, "");
    const noNameRight = makeEntry("D", 45, "");

    render(
      <ComparisonView
        left={noNameLeft}
        right={noNameRight}
        onClose={jest.fn()}
      />
    );

    // Fallback names appear in both badge area and verdict section
    expect(screen.getAllByText("Food 1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Food 2").length).toBeGreaterThanOrEqual(1);
  });
});
