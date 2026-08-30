import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalysisView } from "../AnalysisView";
import { IngredientList } from "../IngredientList";
import { SummaryBar } from "../SummaryBar";
import type { AnalysisResult, AnalyzedIngredient, AnalysisSummary, Grade } from "@/lib/analyzer/types";

// Mock framer-motion for IngredientList stagger animation (F036)
/* eslint-disable react/display-name */
jest.mock("framer-motion", () => {
  const React = require("react");
  const filterMotionProps = (props: Record<string, unknown>) => {
    const blocked = new Set(["variants", "initial", "animate", "exit", "custom", "layout", "viewport", "transition", "whileTap", "whileHover", "whileInView"]);
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      if (!blocked.has(k)) safe[k] = v;
    }
    return safe;
  };
  return {
    motion: {
      div: React.forwardRef(
        ({ children, ...rest }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) =>
          React.createElement("div", { ref, ...filterMotionProps(rest) }, children)
      ),
      li: React.forwardRef(
        ({ children, ...rest }: Record<string, unknown>, ref: React.Ref<HTMLLIElement>) =>
          React.createElement("li", { ref, ...filterMotionProps(rest) }, children)
      ),
      ul: React.forwardRef(
        ({ children, ...rest }: Record<string, unknown>, ref: React.Ref<HTMLUListElement>) =>
          React.createElement("ul", { ref, ...filterMotionProps(rest) }, children)
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock ShareButton to avoid duplicate text from hidden ShareCard
jest.mock("@/components/sharing", () => ({
  ShareButton: () => <button data-testid="share-button">Share Result</button>,
}));

// Mock AnimatedGradeBadge to avoid framer-motion in non-animation tests
jest.mock("@/components/grade", () => ({
  AnimatedGradeBadge: ({ grade, score }: { grade: string; score: number }) => (
    <div>
      <div role="img" aria-label={`Grade ${grade}: Good`}><span>{grade}</span></div>
      <p>Score: {score}/100</p>
    </div>
  ),
}));

// Mock fetch for AI explanation
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  // Default: return empty explanation (fallback mode)
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ explanation: "", cached: false, fallback: true }),
  });
});

function makeIngredient(
  overrides: Partial<AnalyzedIngredient> = {}
): AnalyzedIngredient {
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
    harmfulCount: 0,
    cautionCount: 1,
    safeCount: 3,
    unknownCount: 1,
    topIngredientIsProtein: true,
    concernPercentage: 0,
    ...overrides,
  };
}

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    grade: "B" as Grade,
    score: 82,
    ingredients: [
      makeIngredient({ original: "Chicken", flag: "green", position: 0 }),
      makeIngredient({ original: "Brown Rice", normalized: "brown rice", flag: "green", position: 1 }),
      makeIngredient({ original: "BHA", normalized: "bha", flag: "red", position: 2, explanation: "Potentially harmful preservative" }),
    ],
    summary: makeSummary({ safeCount: 2, harmfulCount: 1 }),
    verdict: "Good quality food with mostly safe ingredients.",
    insufficientData: false,
    ...overrides,
  };
}

describe("GradeBadge (via AnalysisView)", () => {
  it("renders the grade letter", () => {
    render(<AnalysisView result={makeResult({ grade: "A", score: 95 })} onScanAnother={jest.fn()} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders the score", () => {
    render(<AnalysisView result={makeResult({ score: 82 })} onScanAnother={jest.fn()} />);
    expect(screen.getByText("Score: 82/100")).toBeInTheDocument();
  });

  it("has accessible grade label", () => {
    render(<AnalysisView result={makeResult({ grade: "B" })} onScanAnother={jest.fn()} />);
    expect(screen.getByRole("img", { name: /Grade B/i })).toBeInTheDocument();
  });
});

describe("SummaryBar", () => {
  it("renders all four stat counts", () => {
    render(<SummaryBar summary={makeSummary({ safeCount: 5, cautionCount: 2, harmfulCount: 1, unknownCount: 3 })} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders labels", () => {
    render(<SummaryBar summary={makeSummary()} />);
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Flagged")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});

describe("IngredientList", () => {
  it("renders all ingredients", () => {
    const ingredients = [
      makeIngredient({ original: "Chicken", position: 0 }),
      makeIngredient({ original: "Rice", normalized: "rice", position: 1 }),
    ];
    render(<IngredientList ingredients={ingredients} />);
    expect(screen.getByText("Chicken")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
  });

  it("shows position numbers", () => {
    render(<IngredientList ingredients={[makeIngredient({ position: 0 })]} />);
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("shows explanations", () => {
    render(
      <IngredientList
        ingredients={[makeIngredient({ explanation: "Quality protein source" })]}
      />
    );
    expect(screen.getByText("Quality protein source")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<IngredientList ingredients={[]} />);
    expect(screen.getByTestId("empty-list")).toBeInTheDocument();
  });

  it("shows ingredient count in header", () => {
    const ingredients = [
      makeIngredient({ original: "A", position: 0 }),
      makeIngredient({ original: "B", normalized: "b", position: 1 }),
      makeIngredient({ original: "C", normalized: "c", position: 2 }),
    ];
    render(<IngredientList ingredients={ingredients} />);
    expect(screen.getByText("Ingredients (3)")).toBeInTheDocument();
  });
});

describe("AnalysisView", () => {
  it("renders the localized verdict text for the grade (ignores the raw result.verdict field)", () => {
    render(<AnalysisView result={makeResult({ grade: "B" })} onScanAnother={jest.fn()} />);
    expect(screen.getByTestId("verdict")).toHaveTextContent(
      "Our analysis considers this food to have good ingredient quality."
    );
  });

  it("shows an insufficient-data message instead of the grade when too many ingredients are unrecognized", () => {
    render(
      <AnalysisView
        result={makeResult({
          insufficientData: true,
          summary: makeSummary({ totalIngredients: 4, unknownCount: 3, safeCount: 1 }),
        })}
        onScanAnother={jest.fn()}
      />
    );
    expect(screen.getByTestId("insufficient-data")).toBeInTheDocument();
    expect(screen.queryByTestId("verdict")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Grade/i })).not.toBeInTheDocument();
  });

  it("renders Scan Another button", () => {
    render(<AnalysisView result={makeResult()} onScanAnother={jest.fn()} />);
    expect(screen.getByRole("button", { name: /scan another/i })).toBeInTheDocument();
  });

  it("calls onScanAnother when button is clicked", () => {
    const onScanAnother = jest.fn();
    render(<AnalysisView result={makeResult()} onScanAnother={onScanAnother} />);
    fireEvent.click(screen.getByRole("button", { name: /scan another/i }));
    expect(onScanAnother).toHaveBeenCalledTimes(1);
  });

  it("renders all ingredients with correct flags", () => {
    const result = makeResult();
    render(<AnalysisView result={result} onScanAnother={jest.fn()} />);
    expect(screen.getByText("Chicken")).toBeInTheDocument();
    expect(screen.getByText("Brown Rice")).toBeInTheDocument();
    expect(screen.getByText("BHA")).toBeInTheDocument();
  });

  it("renders different grades correctly", () => {
    const grades: Grade[] = ["A", "B", "C", "D", "F"];
    for (const grade of grades) {
      const { unmount } = render(
        <AnalysisView result={makeResult({ grade })} onScanAnother={jest.fn()} />
      );
      expect(screen.getByText(grade)).toBeInTheDocument();
      unmount();
    }
  });
});

describe("AnalysisView AI Explanation", () => {
  it("shows loading state while fetching AI explanation", () => {
    // Make fetch hang
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<AnalysisView result={makeResult()} onScanAnother={jest.fn()} />);
    expect(screen.getByTestId("ai-loading")).toBeInTheDocument();
    expect(screen.getByText("Generating detailed analysis…")).toBeInTheDocument();
  });

  it("displays AI explanation when available", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        explanation: "BHA is a concerning preservative found in this food.",
        cached: false,
      }),
    });

    render(<AnalysisView result={makeResult()} onScanAnother={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-explanation")).toBeInTheDocument();
    });

    expect(screen.getByText("BHA is a concerning preservative found in this food.")).toBeInTheDocument();
    expect(screen.getByText("AI Analysis")).toBeInTheDocument();
  });

  it("hides AI section when explanation is empty (fallback)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ explanation: "", cached: false, fallback: true }),
    });

    render(<AnalysisView result={makeResult()} onScanAnother={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByTestId("ai-loading")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("ai-explanation")).not.toBeInTheDocument();
  });

  it("hides AI section on fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<AnalysisView result={makeResult()} onScanAnother={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByTestId("ai-loading")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("ai-explanation")).not.toBeInTheDocument();
    // Static verdict should still be visible
    expect(screen.getByTestId("verdict")).toBeInTheDocument();
  });

  it("sends correct payload to /api/explain", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ explanation: "Test", cached: false }),
    });

    render(<AnalysisView result={makeResult()} onScanAnother={jest.fn()} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/explain");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string) as { grade: string; score: number; ingredients: unknown[] };
    expect(body.grade).toBe("B");
    expect(body.score).toBe(82);
    expect(body.ingredients).toHaveLength(3);
  });

  it("hides loading after non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal error" }),
    });

    render(<AnalysisView result={makeResult()} onScanAnother={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByTestId("ai-loading")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("ai-explanation")).not.toBeInTheDocument();
  });
});

describe("AnalysisView Personalize CTA (F020)", () => {
  it("shows personalize CTA when onPersonalize is provided and no profile warnings", () => {
    render(
      <AnalysisView
        result={makeResult()}
        onScanAnother={jest.fn()}
        onPersonalize={jest.fn()}
      />
    );
    expect(screen.getByTestId("personalize-cta")).toBeInTheDocument();
    expect(screen.getByText("Get personalized warnings for your pet")).toBeInTheDocument();
  });

  it("calls onPersonalize when CTA is clicked", () => {
    const onPersonalize = jest.fn();
    render(
      <AnalysisView
        result={makeResult()}
        onScanAnother={jest.fn()}
        onPersonalize={onPersonalize}
      />
    );
    fireEvent.click(screen.getByTestId("personalize-cta"));
    expect(onPersonalize).toHaveBeenCalledTimes(1);
  });

  it("hides personalize CTA when profile warnings are present", () => {
    const result = makeResult({
      profileWarnings: ["Grain sensitivity for your Labrador"],
    });
    render(
      <AnalysisView
        result={result}
        onScanAnother={jest.fn()}
        onPersonalize={jest.fn()}
      />
    );
    expect(screen.queryByTestId("personalize-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("profile-warnings")).toBeInTheDocument();
  });

  it("hides personalize CTA when onPersonalize is not provided", () => {
    render(
      <AnalysisView
        result={makeResult()}
        onScanAnother={jest.fn()}
      />
    );
    expect(screen.queryByTestId("personalize-cta")).not.toBeInTheDocument();
  });

  it("shows description text in personalize CTA", () => {
    render(
      <AnalysisView
        result={makeResult()}
        onScanAnother={jest.fn()}
        onPersonalize={jest.fn()}
      />
    );
    expect(
      screen.getByText(/breed, age, and health conditions/i)
    ).toBeInTheDocument();
  });
});
