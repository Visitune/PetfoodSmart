/**
 * Tests for BrandSearch component (F015, dropdown animation F036)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrandSearch } from "../BrandSearch";

// Mock framer-motion to avoid animation issues in JSDOM
/* eslint-disable react/display-name */
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(
        (
          { children, className, style, ...rest }: Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>
        ) => {
          const safeProps: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(rest)) {
            if (typeof k === "string" && !k.startsWith("while") && !["variants", "initial", "animate", "exit", "custom", "layout", "viewport", "transition"].includes(k)) {
              safeProps[k] = v;
            }
          }
          return React.createElement("div", { ref, className, style, ...safeProps }, children);
        }
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

describe("BrandSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the search input", () => {
    render(<BrandSearch />);
    expect(screen.getByTestId("brand-search-input")).toBeInTheDocument();
  });

  it("renders placeholder text", () => {
    render(<BrandSearch />);
    const input = screen.getByTestId("brand-search-input");
    expect(input).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Search a brand")
    );
  });

  it("shows brand count when no query", () => {
    render(<BrandSearch />);
    expect(screen.getByText(/brands in database/)).toBeInTheDocument();
  });

  it("does not show results when query is empty", () => {
    render(<BrandSearch />);
    expect(screen.queryByTestId("brand-search-results")).not.toBeInTheDocument();
  });

  it("shows results when user types a query", () => {
    render(<BrandSearch />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "Vitalis" } });
    expect(screen.getByTestId("brand-search-results")).toBeInTheDocument();
  });

  it("displays matching brands with grade badges", () => {
    render(<BrandSearch />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "Vitalis" } });
    // Matching brands should appear with links
    const results = screen.getByTestId("brand-search-results");
    const links = results.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
    // Each link should point to a brand page
    links.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/brand\//);
    });
  });

  it("shows no results message for unmatched query", () => {
    render(<BrandSearch />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "xyznonexistent999" } });
    expect(screen.getByText(/No brands found/)).toBeInTheDocument();
  });

  it("displays brand name and product in results", () => {
    render(<BrandSearch />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "Félin Doré" } });
    const results = screen.getByTestId("brand-search-results");
    expect(results.textContent).toContain("Félin Doré");
  });

  it("shows pet type emoji in results", () => {
    render(<BrandSearch />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "Vitalis" } });
    const results = screen.getByTestId("brand-search-results");
    // Should show cat or dog emoji
    expect(results.textContent).toMatch(/🐱|🐶/);
  });

  it("renders scan own label link when no onScanOwn prop", () => {
    render(<BrandSearch />);
    const link = screen.getByText("or scan your own label");
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders scan own label button when onScanOwn prop provided", () => {
    const onScanOwn = jest.fn();
    render(<BrandSearch onScanOwn={onScanOwn} />);
    const button = screen.getByText("or scan your own label");
    expect(button.tagName.toLowerCase()).toBe("button");
    fireEvent.click(button);
    expect(onScanOwn).toHaveBeenCalledTimes(1);
  });

  it("clears results when input is emptied", () => {
    render(<BrandSearch />);
    const input = screen.getByTestId("brand-search-input");
    fireEvent.change(input, { target: { value: "Vitalis" } });
    expect(screen.getByTestId("brand-search-results")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByTestId("brand-search-results")).not.toBeInTheDocument();
  });
});
