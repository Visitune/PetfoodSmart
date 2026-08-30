/**
 * Tests for HistoryList component (F009)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HistoryList } from "../HistoryList";
import type { ScanHistoryEntry } from "@/lib/history/types";
import type { AnalysisResult } from "@/lib/analyzer/types";

function makeEntry(
  overrides: Partial<ScanHistoryEntry> = {}
): ScanHistoryEntry {
  return {
    id: `test-${Math.random()}`,
    scannedAt: "2026-03-19T10:30:00.000Z",
    foodName: "Test Food",
    result: {
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
      verdict: "Good quality food.",
      insufficientData: false,
    } as AnalysisResult,
    ...overrides,
  };
}

const noop = () => {};

describe("HistoryList", () => {
  test("renders empty state when no entries", () => {
    render(
      <HistoryList
        entries={[]}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
      />
    );
    expect(screen.getByTestId("history-empty")).toBeInTheDocument();
    expect(screen.getByText("No scans yet")).toBeInTheDocument();
  });

  test("renders entries with food names", () => {
    const entries = [
      makeEntry({ id: "1", foodName: "Premium Cat Food" }),
      makeEntry({ id: "2", foodName: "Budget Dog Food" }),
    ];

    render(
      <HistoryList
        entries={entries}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
      />
    );

    expect(screen.getByText("Premium Cat Food")).toBeInTheDocument();
    expect(screen.getByText("Budget Dog Food")).toBeInTheDocument();
  });

  test("shows 'Unnamed Food' for entries without food name", () => {
    render(
      <HistoryList
        entries={[makeEntry({ id: "1", foodName: "" })]}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
      />
    );
    expect(screen.getByText("Unnamed Food")).toBeInTheDocument();
  });

  test("calls onSelect when entry is clicked", () => {
    const onSelect = jest.fn();
    const entry = makeEntry({ id: "1", foodName: "Click Me" });

    render(
      <HistoryList
        entries={[entry]}
        onSelect={onSelect}
        onDelete={noop}
        onClear={noop}
      />
    );

    fireEvent.click(screen.getByTestId("history-entry-button"));
    expect(onSelect).toHaveBeenCalledWith(entry);
  });

  test("calls onDelete when delete button is clicked", () => {
    const onDelete = jest.fn();
    const entry = makeEntry({ id: "del-1" });

    render(
      <HistoryList
        entries={[entry]}
        onSelect={noop}
        onDelete={onDelete}
        onClear={noop}
      />
    );

    fireEvent.click(screen.getByTestId("history-delete"));
    expect(onDelete).toHaveBeenCalledWith("del-1");
  });

  test("calls onClear when clear button is clicked", () => {
    const onClear = jest.fn();

    render(
      <HistoryList
        entries={[makeEntry({ id: "1" })]}
        onSelect={noop}
        onDelete={noop}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByTestId("history-clear"));
    expect(onClear).toHaveBeenCalled();
  });

  test("does not show clear button when empty", () => {
    render(
      <HistoryList
        entries={[]}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
      />
    );
    expect(screen.queryByTestId("history-clear")).not.toBeInTheDocument();
  });

  test("shows grade letter in mini badge", () => {
    const entry = makeEntry({
      id: "1",
      result: {
        grade: "A",
        score: 95,
        ingredients: [],
        summary: {
          totalIngredients: 3,
          harmfulCount: 0,
          cautionCount: 0,
          safeCount: 3,
          unknownCount: 0,
          topIngredientIsProtein: true,
          concernPercentage: 0,
        },
        verdict: "Excellent.",
        insufficientData: false,
      } as AnalysisResult,
    });

    render(
      <HistoryList
        entries={[entry]}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
      />
    );

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  test("compare mode shows selection counter", () => {
    const entries = [
      makeEntry({ id: "1", foodName: "Food A" }),
      makeEntry({ id: "2", foodName: "Food B" }),
    ];

    render(
      <HistoryList
        entries={entries}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
        compareMode
        onCompare={noop}
      />
    );

    expect(screen.getByText(/Select 2 foods to compare/)).toBeInTheDocument();
  });

  test("compare mode hides delete buttons", () => {
    render(
      <HistoryList
        entries={[makeEntry({ id: "1" })]}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
        compareMode
        onCompare={noop}
      />
    );

    expect(screen.queryByTestId("history-delete")).not.toBeInTheDocument();
  });

  test("compare mode calls onCompare when 2 entries selected", () => {
    const onCompare = jest.fn();
    const entries = [
      makeEntry({ id: "1", foodName: "Food A" }),
      makeEntry({ id: "2", foodName: "Food B" }),
    ];

    render(
      <HistoryList
        entries={entries}
        onSelect={noop}
        onDelete={noop}
        onClear={noop}
        compareMode
        onCompare={onCompare}
      />
    );

    const buttons = screen.getAllByTestId("history-entry-button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(onCompare).toHaveBeenCalledWith([entries[0], entries[1]]);
  });
});
