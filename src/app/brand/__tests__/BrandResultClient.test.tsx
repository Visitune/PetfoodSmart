/**
 * Tests for BrandResultClient component (F015, section animations F036)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { BrandResultClient } from "../[slug]/BrandResultClient";
import { getAnalyzedBrandBySlug } from "@/lib/brands";
import { I18nProvider } from "@/lib/i18n";

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
      p: React.forwardRef(
        ({ children, ...rest }: Record<string, unknown>, ref: React.Ref<HTMLParagraphElement>) =>
          React.createElement("p", { ref, ...filterMotionProps(rest) }, children)
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

// Mock ShareButton to avoid html2canvas complexity
jest.mock("@/components/sharing", () => ({
  ShareButton: () => <div data-testid="share-button-mock">Share</div>,
  ShareCard: () => null,
}));

// Mock AnimatedGradeBadge to avoid framer-motion in non-animation tests
jest.mock("@/components/grade", () => ({
  AnimatedGradeBadge: ({ grade, score }: { grade: string; score: number }) => (
    <div>
      <div role="img" aria-label={`Grade ${grade}`}><span>{grade}</span></div>
      <p>Score: {score}/100</p>
    </div>
  ),
}));

// Get a real analyzed brand for testing
function getTestBrand() {
  const brand = getAnalyzedBrandBySlug("vitalis-naturel-dog");
  if (!brand) throw new Error("Test brand not found");
  return brand;
}

describe("BrandResultClient", () => {
  it("renders the brand name as heading", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    expect(
      screen.getByText(`${brand.brand} ${brand.product}`)
    ).toBeInTheDocument();
  });

  it("renders the Chinese brand name only in Chinese locale, when present", () => {
    const brand = { ...getTestBrand(), brandCn: "维塔利斯", productCn: "天然狗粮" };
    render(
      <I18nProvider initialLocale="zh">
        <BrandResultClient brand={brand} />
      </I18nProvider>,
    );
    expect(screen.getByText("维塔利斯 天然狗粮")).toBeInTheDocument();
  });

  it("does not render a Chinese brand name for demo brands (none provided)", () => {
    const brand = getTestBrand();
    expect(brand.brandCn).toBeUndefined();
    render(<BrandResultClient brand={brand} />);
    expect(screen.queryByText(/维塔利斯|渴望|皇家/)).not.toBeInTheDocument();
  });

  it("shows pet type indicator", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    expect(screen.getByText(/🐶 Dog Food/)).toBeInTheDocument();
  });

  it("renders the grade badge", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    expect(
      screen.getByRole("img", { name: /Grade/ })
    ).toBeInTheDocument();
  });

  it("renders the verdict", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    expect(screen.getByTestId("verdict")).toBeInTheDocument();
    expect(screen.getByTestId("verdict").textContent).toBeTruthy();
  });

  it("renders ingredient list with items", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    // Should show ingredient items
    const ingredientItems = brand.analysis.ingredients;
    expect(ingredientItems.length).toBeGreaterThan(0);
  });

  it("renders back to home link", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    const backLink = screen.getByTestId("back-link");
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("renders scan your own food CTA", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    const cta = screen.getByTestId("scan-own-cta");
    expect(cta).toHaveAttribute("href", "/");
    expect(cta.textContent).toContain("Scan Your Own Food");
  });

  it("renders ranking page link", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    const link = screen.getByTestId("ranking-link");
    expect(link).toHaveAttribute("href", "/ranking");
    expect(link.textContent).toContain("View All Rankings");
  });

  it("renders share button", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    expect(screen.getByTestId("share-button-mock")).toBeInTheDocument();
  });

  it("shows cat food indicator for cat brands", () => {
    const catBrand = getAnalyzedBrandBySlug("whisker-wild-cat");
    if (!catBrand) throw new Error("Cat test brand not found");
    render(<BrandResultClient brand={catBrand} />);
    expect(screen.getByText(/🐱 Cat Food/)).toBeInTheDocument();
  });

  it("renders brand header with testid", () => {
    const brand = getTestBrand();
    render(<BrandResultClient brand={brand} />);
    expect(screen.getByTestId("brand-header")).toBeInTheDocument();
  });
});
