/**
 * Tests for LanguageSwitcher component (F019 - i18n + EU localization)
 *
 * Covers: rendering, selection behavior, accessibility, all supported locales.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "../LanguageSwitcher";

function renderSwitcher(initialLocale: Locale = "en") {
  return render(
    <I18nProvider initialLocale={initialLocale}>
      <LanguageSwitcher />
    </I18nProvider>,
  );
}

describe("LanguageSwitcher", () => {
  it("renders a select element", () => {
    renderSwitcher();
    const select = screen.getByTestId("language-switcher");
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe("SELECT");
  });

  it("lists all five supported languages as options", () => {
    renderSwitcher();
    const select = screen.getByTestId("language-switcher") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["en", "zh", "fr", "es", "nl"]);
  });

  it.each([
    ["en", "EN"],
    ["zh", "中文"],
    ["fr", "FR"],
    ["es", "ES"],
    ["nl", "NL"],
  ] as const)("reflects %s as the selected value", (locale, label) => {
    renderSwitcher(locale);
    const select = screen.getByTestId("language-switcher") as HTMLSelectElement;
    expect(select.value).toBe(locale);
    expect(
      select.options[select.selectedIndex],
    ).toHaveTextContent(label);
  });

  it("switches locale when a new option is selected", () => {
    renderSwitcher("en");
    const select = screen.getByTestId("language-switcher") as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "fr" } });

    expect(select.value).toBe("fr");
  });

  it("has an accessible label", () => {
    renderSwitcher();
    expect(screen.getByTestId("language-switcher")).toHaveAttribute(
      "aria-label",
      "Select language",
    );
  });
});
