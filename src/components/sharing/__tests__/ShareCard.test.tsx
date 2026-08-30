import { render, screen } from "@testing-library/react";
import { ShareCard } from "../ShareCard";
import type { AnalysisResult, AnalyzedIngredient, AnalysisSummary, Grade } from "@/lib/analyzer/types";

function makeIngredient(overrides: Partial<AnalyzedIngredient> = {}): AnalyzedIngredient {
  return {
    original: "Chicken",
    normalized: "chicken",
    position: 0,
    flag: "green",
    knownIngredient: null,
    matchInfo: null,
    explanation: "Quality protein source",
    ...overrides,
  };
}

function makeSummary(overrides: Partial<AnalysisSummary> = {}): AnalysisSummary {
  return {
    totalIngredients: 5,
    harmfulCount: 1,
    cautionCount: 1,
    safeCount: 2,
    unknownCount: 1,
    topIngredientIsProtein: true,
    concernPercentage: 20,
    ...overrides,
  };
}

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    grade: "B" as Grade,
    score: 78,
    ingredients: [
      makeIngredient({ original: "Chicken", flag: "green", position: 0 }),
      makeIngredient({ original: "Brown Rice", flag: "green", position: 1 }),
      makeIngredient({ original: "Corn Syrup", flag: "red", position: 2 }),
      makeIngredient({ original: "Garlic Powder", flag: "yellow", position: 3 }),
      makeIngredient({ original: "Mystery Filler", flag: "unknown", position: 4 }),
    ],
    summary: makeSummary(),
    verdict: "Good quality food with some concerns.",
    insufficientData: false,
    ...overrides,
  };
}

describe("ShareCard", () => {
  it("renders the share card container", () => {
    render(<ShareCard result={makeResult()} />);
    expect(screen.getByTestId("share-card")).toBeInTheDocument();
  });

  it("displays the PetFoodSmart branding", () => {
    render(<ShareCard result={makeResult()} />);
    expect(screen.getByText("PetFoodSmart")).toBeInTheDocument();
    expect(screen.getByText("Pet Food Scanner")).toBeInTheDocument();
  });

  it("shows the grade letter", () => {
    render(<ShareCard result={makeResult({ grade: "A", score: 95 })} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    expect(screen.getByText(/95\/100/)).toBeInTheDocument();
  });

  it("shows grade B styling", () => {
    render(<ShareCard result={makeResult({ grade: "B", score: 78 })} />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText(/Good · 78\/100/)).toBeInTheDocument();
  });

  it("shows grade F styling", () => {
    render(<ShareCard result={makeResult({ grade: "F", score: 25 })} />);
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText(/Poor/)).toBeInTheDocument();
  });

  it("shows the verdict", () => {
    render(<ShareCard result={makeResult({ verdict: "This food is great!" })} />);
    expect(screen.getByTestId("share-verdict")).toHaveTextContent("This food is great!");
  });

  it("shows food name when provided", () => {
    render(<ShareCard result={makeResult()} foodName="Royal Canin Adult" />);
    expect(screen.getByTestId("share-food-name")).toHaveTextContent("Royal Canin Adult");
  });

  it("hides food name when not provided", () => {
    render(<ShareCard result={makeResult()} />);
    expect(screen.queryByTestId("share-food-name")).not.toBeInTheDocument();
  });

  it("shows summary stats", () => {
    const summary = makeSummary({ safeCount: 3, cautionCount: 2, harmfulCount: 1, unknownCount: 0 });
    render(<ShareCard result={makeResult({ summary })} />);
    const statsEl = screen.getByTestId("share-stats");
    expect(statsEl).toBeInTheDocument();
    expect(statsEl).toHaveTextContent("3");
    expect(statsEl).toHaveTextContent("2");
    expect(statsEl).toHaveTextContent("1");
    expect(statsEl).toHaveTextContent("0");
  });

  it("shows harmful ingredients when present", () => {
    render(<ShareCard result={makeResult()} />);
    expect(screen.getByTestId("share-harmful")).toBeInTheDocument();
    expect(screen.getByText("Corn Syrup")).toBeInTheDocument();
  });

  it("hides harmful section when no harmful ingredients", () => {
    const result = makeResult({
      ingredients: [makeIngredient({ flag: "green" })],
      summary: makeSummary({ harmfulCount: 0 }),
    });
    render(<ShareCard result={result} />);
    expect(screen.queryByTestId("share-harmful")).not.toBeInTheDocument();
  });

  it("shows safe ingredients when present", () => {
    render(<ShareCard result={makeResult()} />);
    expect(screen.getByTestId("share-safe")).toBeInTheDocument();
    expect(screen.getByText(/Chicken/)).toBeInTheDocument();
  });

  it("limits harmful ingredients to 3", () => {
    const ingredients = [
      makeIngredient({ original: "Bad1", flag: "red", position: 0 }),
      makeIngredient({ original: "Bad2", flag: "red", position: 1 }),
      makeIngredient({ original: "Bad3", flag: "red", position: 2 }),
      makeIngredient({ original: "Bad4", flag: "red", position: 3 }),
    ];
    render(<ShareCard result={makeResult({ ingredients })} />);
    expect(screen.getByTestId("share-harmful")).toHaveTextContent("Bad1, Bad2, Bad3");
    expect(screen.getByTestId("share-harmful")).not.toHaveTextContent("Bad4");
  });

  it("shows footer branding", () => {
    render(<ShareCard result={makeResult()} />);
    expect(screen.getByText(/Scanned with PetFoodSmart/)).toBeInTheDocument();
  });

  it("forwards ref to the card div", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(<ShareCard ref={ref} result={makeResult()} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute("data-testid")).toBe("share-card");
  });
});
