/**
 * Tests for LandingPage component (F017 - Demo-first homepage redesign)
 *
 * Replaces the F011 marketing page with a demo-first homepage
 * that shows real brand data immediately — top 5 best/worst brands,
 * search bar, and scan CTA.
 * F036 adds: search dropdown animation, scroll-reveal, button whileTap.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "../LandingPage";

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

describe("LandingPage (F017 - Demo-first)", () => {
  const defaultProps = {
    onStartScan: jest.fn(),
    onViewHistory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Hero / Branding ----
  it("renders the app name", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText("Smart")).toBeInTheDocument();
    expect(screen.getByText("PetFood")).toBeInTheDocument();
  });

  it("renders a concise tagline", () => {
    render(<LandingPage {...defaultProps} />);
    expect(
      screen.getByText(/search or scan to find out/i)
    ).toBeInTheDocument();
  });

  // ---- Search Bar ----
  it("renders a brand search input", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByTestId("brand-search-input")).toBeInTheDocument();
  });

  it("search input has placeholder text", () => {
    render(<LandingPage {...defaultProps} />);
    const input = screen.getByTestId("brand-search-input");
    expect(input).toHaveAttribute("placeholder", expect.stringContaining("Search"));
  });

  it("shows search results when user types a query", () => {
    render(<LandingPage {...defaultProps} />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "Orijen" } });
    expect(screen.getByTestId("brand-search-results")).toBeInTheDocument();
  });

  // ---- Top 5 Best Brands ----
  it("renders a top-rated brands section", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByTestId("best-brands")).toBeInTheDocument();
  });

  it("shows exactly 5 best brands", () => {
    render(<LandingPage {...defaultProps} />);
    const section = screen.getByTestId("best-brands");
    const links = section.querySelectorAll("a[href^='/brand/']");
    expect(links.length).toBe(5);
  });

  it("best brands section has a heading", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText(/top rated/i)).toBeInTheDocument();
  });

  // ---- Top 5 Worst Brands ----
  it("renders a worst-rated brands section", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByTestId("worst-brands")).toBeInTheDocument();
  });

  it("shows exactly 5 worst brands", () => {
    render(<LandingPage {...defaultProps} />);
    const section = screen.getByTestId("worst-brands");
    const links = section.querySelectorAll("a[href^='/brand/']");
    expect(links.length).toBe(5);
  });

  it("worst brands section has a heading", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText(/worst rated/i)).toBeInTheDocument();
  });

  // ---- Grade Badges in Brand Lists ----
  it("displays grade badges in brand lists", () => {
    render(<LandingPage {...defaultProps} />);
    const bestSection = screen.getByTestId("best-brands");
    const badges = bestSection.querySelectorAll("[data-testid='mini-grade-badge']");
    expect(badges.length).toBe(5);
  });

  // ---- Brand links point to /brand/[slug] ----
  it("brand links point to /brand/[slug] routes", () => {
    render(<LandingPage {...defaultProps} />);
    const bestSection = screen.getByTestId("best-brands");
    const links = bestSection.querySelectorAll("a[href^='/brand/']");
    links.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/brand\/[\w-]+$/);
    });
  });

  // ---- Scan CTA ----
  it("renders primary scan CTA button", () => {
    render(<LandingPage {...defaultProps} />);
    const btn = screen.getByTestId("hero-scan-button");
    expect(btn).toBeInTheDocument();
  });

  it("fires onStartScan when scan button clicked", () => {
    render(<LandingPage {...defaultProps} />);
    fireEvent.click(screen.getByTestId("hero-scan-button"));
    expect(defaultProps.onStartScan).toHaveBeenCalledTimes(1);
  });

  // ---- View History ----
  it("renders history button", () => {
    render(<LandingPage {...defaultProps} />);
    const btn = screen.getByTestId("history-button");
    expect(btn).toHaveTextContent("View Scan History");
  });

  it("fires onViewHistory when history button clicked", () => {
    render(<LandingPage {...defaultProps} />);
    fireEvent.click(screen.getByTestId("history-button"));
    expect(defaultProps.onViewHistory).toHaveBeenCalledTimes(1);
  });

  // ---- Full Ranking Link ----
  it("renders a link to the full ranking page", () => {
    render(<LandingPage {...defaultProps} />);
    const link = screen.getByTestId("view-full-ranking");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/ranking");
  });

  // ---- Below-fold: Trust Signals ----
  it("renders trust signals section", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText("500+")).toBeInTheDocument();
    expect(screen.getByText("A-F")).toBeInTheDocument();
  });

  // ---- Footer ----
  it("renders footer with disclaimer", () => {
    render(<LandingPage {...defaultProps} />);
    expect(
      screen.getByText(/not a substitute for veterinary advice/i)
    ).toBeInTheDocument();
  });

  // ---- Accessibility ----
  it("has proper section headings", () => {
    render(<LandingPage {...defaultProps} />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThanOrEqual(3);
  });

  // ---- Bottom Scan CTA ----
  it("renders bottom scan CTA", () => {
    render(<LandingPage {...defaultProps} />);
    const btn = screen.getByTestId("bottom-scan-button");
    expect(btn).toBeInTheDocument();
  });

  it("fires onStartScan when bottom scan button clicked", () => {
    render(<LandingPage {...defaultProps} />);
    fireEvent.click(screen.getByTestId("bottom-scan-button"));
    expect(defaultProps.onStartScan).toHaveBeenCalledTimes(1);
  });
});

// ---- F034: Hero section visual overhaul ----
describe("F034 - Hero visual overhaul", () => {
  const defaultProps = {
    onStartScan: jest.fn(),
    onViewHistory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("title Smart has animated gradient class", () => {
    render(<LandingPage {...defaultProps} />);
    const smart = screen.getByText("Smart");
    expect(smart).toHaveClass("hero-gradient-text");
  });

  it("search bar has glow animation when idle", () => {
    render(<LandingPage {...defaultProps} />);
    const input = screen.getByTestId("brand-search-input");
    expect(input).toHaveClass("search-glow");
  });

  it("search bar loses glow on focus", () => {
    render(<LandingPage {...defaultProps} />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.focus(input);
    expect(input).not.toHaveClass("search-glow");
  });

  it("search bar loses glow when query entered", () => {
    render(<LandingPage {...defaultProps} />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "test" } });
    expect(input).not.toHaveClass("search-glow");
  });

  it("brand cards have hover lift classes", () => {
    render(<LandingPage {...defaultProps} />);
    const bestSection = screen.getByTestId("best-brands");
    const firstLink = bestSection.querySelector("a[href^='/brand/']");
    expect(firstLink).toHaveClass("hover:scale-[1.02]");
    expect(firstLink).toHaveClass("hover:-translate-y-0.5");
  });

  it("brand cards have shadow glow on hover", () => {
    render(<LandingPage {...defaultProps} />);
    const worstSection = screen.getByTestId("worst-brands");
    const firstLink = worstSection.querySelector("a[href^='/brand/']");
    expect(firstLink).toHaveClass("hover:shadow-lg");
    expect(firstLink).toHaveClass("hover:shadow-red-500/5");
  });

  it("trust signals section has data-testid", () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByTestId("trust-signals")).toBeInTheDocument();
  });

  it("background accent glows are rendered and accessible", () => {
    render(<LandingPage {...defaultProps} />);
    const glows = screen.getAllByTestId("accent-glow");
    expect(glows.length).toBe(2);
    glows.forEach((glow) => {
      expect(glow).toHaveAttribute("aria-hidden", "true");
      expect(glow).toHaveClass("pointer-events-none");
    });
  });

  it("scan buttons use motion.button for press scale (whileTap)", () => {
    render(<LandingPage {...defaultProps} />);
    const heroBtn = screen.getByTestId("hero-scan-button");
    const bottomBtn = screen.getByTestId("bottom-scan-button");
    // motion.button renders as <button> in mocked framer-motion
    expect(heroBtn.tagName).toBe("BUTTON");
    expect(bottomBtn.tagName).toBe("BUTTON");
  });

  it("main container is positioned for accent glows", () => {
    render(<LandingPage {...defaultProps} />);
    const container = screen.getByTestId("trust-signals").closest(".relative");
    expect(container).toBeInTheDocument();
  });
});
