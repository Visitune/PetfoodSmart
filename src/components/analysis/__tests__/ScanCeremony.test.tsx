/**
 * F033 - ScanCeremony tests
 *
 * Tests the multi-stage scan analysis ceremony animation:
 * Stage 1: Scan beam, Stage 2: Extract ingredients,
 * Stage 3: Categorize, Stage 4: Grade reveal
 */

import { render, screen, act } from "@testing-library/react";
import { ScanCeremony } from "../ScanCeremony";
import type {
  AnalysisResult,
  AnalyzedIngredient,
  AnalysisSummary,
  Grade,
} from "@/lib/analyzer/types";

// Mock framer-motion: motion components render as plain divs with data attributes
// AnimatePresence renders children directly
jest.mock("framer-motion", () => {
  const R = require("react");
  const MotionDiv = R.forwardRef(
    (
      {
        children,
        initial,
        animate: animateProp,
        transition,
        exit,
        className,
        style,
        ...rest
      }: Record<string, unknown>,
      ref: unknown
    ) =>
      R.createElement(
        "div",
        {
          ref,
          className,
          style,
          "data-testid": rest["data-testid"] || undefined,
          "data-initial": initial ? JSON.stringify(initial) : undefined,
          "data-animate": animateProp ? JSON.stringify(animateProp) : undefined,
          "data-transition": transition
            ? JSON.stringify(transition)
            : undefined,
          role: rest.role,
          "aria-label": rest["aria-label"],
        },
        children
      )
  );
  MotionDiv.displayName = "MotionDiv";

  const MotionSpan = R.forwardRef(
    (
      {
        children,
        initial,
        animate: animateProp,
        transition,
        className,
        style,
        ...rest
      }: Record<string, unknown>,
      ref: unknown
    ) =>
      R.createElement(
        "span",
        {
          ref,
          className,
          style,
          "data-testid": rest["data-testid"] || undefined,
        },
        children
      )
  );
  MotionSpan.displayName = "MotionSpan";

  const MotionP = R.forwardRef(
    (
      {
        children,
        initial,
        animate: animateProp,
        transition,
        className,
        style,
        ...rest
      }: Record<string, unknown>,
      ref: unknown
    ) =>
      R.createElement(
        "p",
        {
          ref,
          className,
          style,
          "data-testid": rest["data-testid"] || undefined,
        },
        children
      )
  );
  MotionP.displayName = "MotionP";

  return {
    motion: { div: MotionDiv, span: MotionSpan, p: MotionP },
    AnimatePresence: ({ children }: { children: unknown }) => children,
    animate: (...args: unknown[]) => {
      const onUpdate = (args[2] as Record<string, unknown>)?.onUpdate as
        | ((v: number) => void)
        | undefined;
      if (onUpdate) {
        onUpdate(args[1] as number);
      }
      return { stop: jest.fn() };
    },
  };
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

function makeSummary(
  overrides: Partial<AnalysisSummary> = {}
): AnalysisSummary {
  return {
    totalIngredients: 5,
    harmfulCount: 1,
    cautionCount: 1,
    safeCount: 2,
    unknownCount: 1,
    topIngredientIsProtein: true,
    concernPercentage: 10,
    ...overrides,
  };
}

function makeResult(
  overrides: Partial<AnalysisResult> = {}
): AnalysisResult {
  return {
    grade: "B" as Grade,
    score: 82,
    ingredients: [
      makeIngredient({ original: "Chicken", normalized: "chicken", flag: "green", position: 0 }),
      makeIngredient({ original: "Brown Rice", normalized: "brown rice", flag: "green", position: 1 }),
      makeIngredient({ original: "Corn Gluten Meal", normalized: "corn gluten meal", flag: "yellow", position: 2 }),
      makeIngredient({ original: "BHA", normalized: "bha", flag: "red", position: 3, explanation: "Harmful preservative" }),
      makeIngredient({ original: "Mystery Ingredient", normalized: "mystery ingredient", flag: "unknown", position: 4 }),
    ],
    summary: makeSummary(),
    verdict: "Good quality food with mostly safe ingredients.",
    insufficientData: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("ScanCeremony", () => {
  it("renders the ceremony container", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    expect(screen.getByTestId("scan-ceremony")).toBeInTheDocument();
  });

  it("has accessible role and label", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    const container = screen.getByTestId("scan-ceremony");
    expect(container).toHaveAttribute("role", "status");
    expect(container).toHaveAttribute("aria-label", "Analyzing your pet food");
  });

  it("starts at the scan stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    expect(screen.getByTestId("ceremony-stage-scan")).toBeInTheDocument();
    expect(screen.getByText("Scanning ingredient label\u2026")).toBeInTheDocument();
  });

  it("renders scan beam element", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    expect(screen.getByTestId("scan-beam")).toBeInTheDocument();
  });

  it("transitions to extract stage after 800ms", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(screen.getByTestId("ceremony-stage-extract")).toBeInTheDocument();
    expect(screen.getByText("Extracting ingredients\u2026")).toBeInTheDocument();
  });

  it("shows ingredient names during extract stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(screen.getByText("Chicken")).toBeInTheDocument();
    expect(screen.getByText("Brown Rice")).toBeInTheDocument();
    expect(screen.getByText("BHA")).toBeInTheDocument();
  });

  it("transitions to categorize stage after 2000ms", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("ceremony-stage-categorize")).toBeInTheDocument();
    expect(screen.getByText("Categorizing safety\u2026")).toBeInTheDocument();
  });

  it("shows category labels during categorize stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Flagged")).toBeInTheDocument();
  });

  it("shows ingredients in their categories during categorize stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    // Chicken and Brown Rice are green (safe)
    expect(screen.getByText("Chicken")).toBeInTheDocument();
    // BHA is red (harmful)
    expect(screen.getByText("BHA")).toBeInTheDocument();
  });

  it("transitions to reveal stage after 2800ms", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    expect(screen.getByTestId("ceremony-stage-reveal")).toBeInTheDocument();
  });

  it("shows grade letter in reveal stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("shows grade label in reveal stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("shows score counter in reveal stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    // Advance to reveal stage first
    act(() => { jest.advanceTimersByTime(2800); });
    // Then run all remaining timers (CountUp delay + animation)
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
  });

  it("has accessible grade badge in reveal stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    expect(
      screen.getByRole("img", { name: /Grade B/i })
    ).toBeInTheDocument();
  });

  it("applies 3D flip to grade badge in reveal stage", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    const badge = screen.getByTestId("ceremony-grade-badge");
    const initial = JSON.parse(badge.getAttribute("data-initial") ?? "{}");
    expect(initial.rotateY).toBe(180);
    expect(initial.scale).toBe(0.5);
    expect(initial.opacity).toBe(0);
  });

  it("applies glow-pulse animation to grade badge", () => {
    render(<ScanCeremony result={makeResult()} onComplete={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    const badge = screen.getByTestId("ceremony-grade-badge");
    const style = badge.getAttribute("style");
    expect(style).toContain("glow-pulse");
  });

  it("calls onComplete after the full ceremony (~3800ms)", () => {
    const onComplete = jest.fn();
    render(<ScanCeremony result={makeResult()} onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3800);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not call onComplete before the ceremony ends", () => {
    const onComplete = jest.fn();
    render(<ScanCeremony result={makeResult()} onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("renders all grades correctly in reveal stage", () => {
    const grades: Grade[] = ["A", "B", "C", "D", "F"];
    for (const grade of grades) {
      const { unmount } = render(
        <ScanCeremony result={makeResult({ grade })} onComplete={jest.fn()} />
      );
      act(() => {
        jest.advanceTimersByTime(2800);
      });
      expect(screen.getByText(grade)).toBeInTheDocument();
      unmount();
    }
  });

  it("limits visible ingredients to 12 maximum", () => {
    // Create 15 ingredients
    const manyIngredients = Array.from({ length: 15 }, (_, i) =>
      makeIngredient({
        original: `Ingredient ${i}`,
        normalized: `ingredient-${i}`,
        position: i,
        flag: "green",
      })
    );
    render(
      <ScanCeremony
        result={makeResult({ ingredients: manyIngredients })}
        onComplete={jest.fn()}
      />
    );
    act(() => {
      jest.advanceTimersByTime(800);
    });
    // Should show max 12 ingredients
    const ingredientElements = screen.getAllByText(/^Ingredient \d+$/);
    expect(ingredientElements.length).toBeLessThanOrEqual(12);
  });

  it("cleans up timers on unmount", () => {
    const onComplete = jest.fn();
    const { unmount } = render(
      <ScanCeremony result={makeResult()} onComplete={onComplete} />
    );
    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // onComplete should NOT be called after unmount
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("prioritizes harmful ingredients when truncating", () => {
    // 10 safe + 3 harmful = 13 total, should show all 3 harmful
    const ingredients = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeIngredient({
          original: `Safe ${i}`,
          normalized: `safe-${i}`,
          position: i,
          flag: "green",
        })
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeIngredient({
          original: `Harmful ${i}`,
          normalized: `harmful-${i}`,
          position: 10 + i,
          flag: "red",
        })
      ),
    ];
    render(
      <ScanCeremony
        result={makeResult({ ingredients })}
        onComplete={jest.fn()}
      />
    );
    act(() => {
      jest.advanceTimersByTime(800);
    });
    // All 3 harmful should be visible
    expect(screen.getByText("Harmful 0")).toBeInTheDocument();
    expect(screen.getByText("Harmful 1")).toBeInTheDocument();
    expect(screen.getByText("Harmful 2")).toBeInTheDocument();
  });
});
