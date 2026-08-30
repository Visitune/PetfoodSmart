/**
 * Tests for RankingClient component (F016, stagger + tab animations F036)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RankingClient } from "../RankingClient";
import { I18nProvider } from "@/lib/i18n";
import type { AnalyzedBrand } from "@/lib/brands/types";
import type { AnalysisResult, Grade } from "@/lib/analyzer/types";

// Mock framer-motion to avoid animation issues in JSDOM
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
      button: React.forwardRef(
        ({ children, ...rest }: Record<string, unknown>, ref: React.Ref<HTMLButtonElement>) =>
          React.createElement("button", { ref, ...filterMotionProps(rest) }, children)
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

function makeBrand(
  slug: string,
  brand: string,
  product: string,
  petType: "cat" | "dog",
  grade: Grade,
  score: number
): AnalyzedBrand {
  return {
    slug,
    brand,
    brandCn: `${brand}中文`,
    product,
    productCn: `${product}中文`,
    petType,
    ingredients: ["chicken", "rice"],
    source: "test",
    analysis: {
      grade,
      score,
      ingredients: [],
      summary: {
        totalIngredients: 2,
        harmfulCount: 0,
        cautionCount: 0,
        safeCount: 2,
        unknownCount: 0,
        topIngredientIsProtein: true,
        concernPercentage: 0,
      },
      verdict: "Good food",
      insufficientData: false,
    } as AnalysisResult,
  };
}

const mockBrands: AnalyzedBrand[] = [
  makeBrand("brand-a-dog", "BrandA", "Premium Dog", "dog", "A", 95),
  makeBrand("brand-b-cat", "BrandB", "Indoor Cat", "cat", "B", 80),
  makeBrand("brand-c-dog", "BrandC", "Budget Dog", "dog", "D", 45),
  makeBrand("brand-d-cat", "BrandD", "Cheap Cat", "cat", "F", 25),
  makeBrand("brand-e-dog", "BrandE", "Good Dog", "dog", "A", 92),
];

describe("RankingClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(
      screen.getByText("Pet Food Safety Rankings")
    ).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(
      screen.getByText("Discover the safest brands for your pet")
    ).toBeInTheDocument();
  });

  it("renders the back link", () => {
    render(<RankingClient brands={mockBrands} />);
    const link = screen.getByTestId("back-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders all pet type filter tabs", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(screen.getByTestId("filter-all")).toBeInTheDocument();
    expect(screen.getByTestId("filter-dog")).toBeInTheDocument();
    expect(screen.getByTestId("filter-cat")).toBeInTheDocument();
  });

  it("shows all brands by default", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(screen.getByText("5 products ranked")).toBeInTheDocument();
    const list = screen.getByTestId("ranking-list");
    expect(list.children).toHaveLength(5);
  });

  it("sorts brands by grade (A first) then by score descending", () => {
    render(<RankingClient brands={mockBrands} />);
    const list = screen.getByTestId("ranking-list");
    const links = list.querySelectorAll("[data-testid^='ranking-item-']");
    // A-grade (95) first, then A-grade (92), then B (80), then D (45), then F (25)
    expect(links[0]).toHaveAttribute("href", "/brand/brand-a-dog");
    expect(links[1]).toHaveAttribute("href", "/brand/brand-e-dog");
    expect(links[2]).toHaveAttribute("href", "/brand/brand-b-cat");
    expect(links[3]).toHaveAttribute("href", "/brand/brand-c-dog");
    expect(links[4]).toHaveAttribute("href", "/brand/brand-d-cat");
  });

  it("displays brand name and product on each card", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(screen.getByText("BrandA Premium Dog")).toBeInTheDocument();
    expect(screen.getByText("BrandB Indoor Cat")).toBeInTheDocument();
  });

  it("displays Chinese names on each card only in Chinese locale", () => {
    render(
      <I18nProvider initialLocale="zh">
        <RankingClient brands={mockBrands} />
      </I18nProvider>,
    );
    expect(screen.getByText("BrandA中文 Premium Dog中文")).toBeInTheDocument();
  });

  it("hides Chinese names on each card in other locales", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(screen.queryByText("BrandA中文 Premium Dog中文")).not.toBeInTheDocument();
  });

  it("displays score on each card", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("displays grade badges with correct grade letters", () => {
    render(<RankingClient brands={mockBrands} />);
    const badges = screen.getAllByLabelText(/^Grade [A-F]$/);
    expect(badges.length).toBe(5);
  });

  it("links each card to the brand page", () => {
    render(<RankingClient brands={mockBrands} />);
    const item = screen.getByTestId("ranking-item-brand-b-cat");
    expect(item).toHaveAttribute("href", "/brand/brand-b-cat");
  });

  it("filters to dog food only", () => {
    render(<RankingClient brands={mockBrands} />);
    fireEvent.click(screen.getByTestId("filter-dog"));
    expect(screen.getByText("3 products ranked")).toBeInTheDocument();
    expect(screen.queryByText("BrandB Indoor Cat")).not.toBeInTheDocument();
    expect(screen.getByText("BrandA Premium Dog")).toBeInTheDocument();
  });

  it("filters to cat food only", () => {
    render(<RankingClient brands={mockBrands} />);
    fireEvent.click(screen.getByTestId("filter-cat"));
    expect(screen.getByText("2 products ranked")).toBeInTheDocument();
    expect(screen.queryByText("BrandA Premium Dog")).not.toBeInTheDocument();
    expect(screen.getByText("BrandB Indoor Cat")).toBeInTheDocument();
  });

  it("returns to all when clicking All tab", () => {
    render(<RankingClient brands={mockBrands} />);
    fireEvent.click(screen.getByTestId("filter-cat"));
    expect(screen.getByText("2 products ranked")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("filter-all"));
    expect(screen.getByText("5 products ranked")).toBeInTheDocument();
  });

  it("marks the active filter tab as pressed", () => {
    render(<RankingClient brands={mockBrands} />);
    expect(screen.getByTestId("filter-all")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByTestId("filter-dog")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    fireEvent.click(screen.getByTestId("filter-dog"));
    expect(screen.getByTestId("filter-dog")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByTestId("filter-all")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("shows rank numbers starting from 1", () => {
    render(<RankingClient brands={mockBrands} />);
    const links = screen.getByTestId("ranking-list").querySelectorAll("[data-testid^='ranking-item-']");
    expect(links[0]).toHaveTextContent("1");
    expect(links[4]).toHaveTextContent("5");
  });

  it("re-ranks when filter changes", () => {
    render(<RankingClient brands={mockBrands} />);
    fireEvent.click(screen.getByTestId("filter-dog"));
    const links = screen.getByTestId("ranking-list").querySelectorAll("[data-testid^='ranking-item-']");
    // Dog only: A(95), A(92), D(45) — rank numbers reset
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent("1");
    expect(links[2]).toHaveTextContent("3");
  });

  it("renders the scan CTA button", () => {
    render(<RankingClient brands={mockBrands} />);
    const cta = screen.getByTestId("scan-cta");
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/");
    expect(cta).toHaveTextContent("Scan Your Own Food");
  });

  it("handles empty brand list", () => {
    render(<RankingClient brands={[]} />);
    expect(screen.getByText("0 products ranked")).toBeInTheDocument();
    const list = screen.getByTestId("ranking-list");
    expect(list.children).toHaveLength(0);
  });
});
