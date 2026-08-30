/**
 * Tests for i18n framework (F019 - i18n + Chinese localization)
 *
 * Covers: I18nProvider, useTranslation, useLocale, useSetLocale,
 * locale detection, interpolation, namespace resolution, fallback behavior.
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import { I18nProvider, useTranslation, useLocale, useSetLocale } from "../context";
import type { Locale } from "../types";

// Helper component to expose hook values
function TranslationDisplay({
  namespace,
  tKey,
  params,
}: {
  namespace?: string;
  tKey: string;
  params?: Record<string, string | number>;
}) {
  const { t, locale } = useTranslation(namespace);
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="translated">{t(tKey, params)}</span>
    </div>
  );
}

function LocaleDisplay() {
  const locale = useLocale();
  return <span data-testid="locale">{locale}</span>;
}

function LocaleSwitcher() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale(locale === "en" ? "zh" : "en")}>
        Switch
      </button>
    </div>
  );
}

describe("I18nProvider", () => {
  it("defaults to English locale", () => {
    render(
      <I18nProvider>
        <LocaleDisplay />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("accepts initialLocale override", () => {
    render(
      <I18nProvider initialLocale="zh">
        <LocaleDisplay />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("zh");
  });

  it("allows locale switching", () => {
    render(
      <I18nProvider initialLocale="en">
        <LocaleSwitcher />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");

    act(() => {
      screen.getByText("Switch").click();
    });
    expect(screen.getByTestId("locale")).toHaveTextContent("zh");
  });
});

describe("useTranslation", () => {
  it("translates English keys with namespace", () => {
    render(
      <I18nProvider initialLocale="en">
        <TranslationDisplay namespace="common" tKey="back" />
      </I18nProvider>,
    );
    expect(screen.getByTestId("translated")).toHaveTextContent("← Back");
  });

  it("translates Chinese keys with namespace", () => {
    render(
      <I18nProvider initialLocale="zh">
        <TranslationDisplay namespace="common" tKey="back" />
      </I18nProvider>,
    );
    expect(screen.getByTestId("translated")).toHaveTextContent("← 返回");
  });

  it("interpolates parameters", () => {
    render(
      <I18nProvider initialLocale="en">
        <TranslationDisplay
          namespace="analysis"
          tKey="ingredientsCount"
          params={{ count: 42 }}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId("translated")).toHaveTextContent("Ingredients (42)");
  });

  it("interpolates Chinese parameters", () => {
    render(
      <I18nProvider initialLocale="zh">
        <TranslationDisplay
          namespace="analysis"
          tKey="ingredientsCount"
          params={{ count: 42 }}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId("translated")).toHaveTextContent("成分（42）");
  });

  it("returns key as fallback for missing translations", () => {
    render(
      <I18nProvider initialLocale="en">
        <TranslationDisplay namespace="common" tKey="nonExistentKey" />
      </I18nProvider>,
    );
    expect(screen.getByTestId("translated")).toHaveTextContent("common.nonExistentKey");
  });

  it("falls back to English without I18nProvider", () => {
    render(<TranslationDisplay namespace="common" tKey="back" />);
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("translated")).toHaveTextContent("← Back");
  });

  it("resolves all namespaces correctly", () => {
    const namespaces = [
      { ns: "landing", key: "tagline" },
      { ns: "scanner", key: "title" },
      { ns: "analysis", key: "analyzing" },
      { ns: "grade", key: "A" },
      { ns: "profile", key: "title" },
      { ns: "history", key: "title" },
      { ns: "sharing", key: "brandName" },
      { ns: "brand", key: "notFound" },
      { ns: "ranking", key: "title" },
    ];

    for (const { ns, key } of namespaces) {
      const { unmount } = render(
        <I18nProvider initialLocale="en">
          <TranslationDisplay namespace={ns} tKey={key} />
        </I18nProvider>,
      );
      // Should not fall back to raw key
      const text = screen.getByTestId("translated").textContent;
      expect(text).not.toBe(`${ns}.${key}`);
      unmount();
    }
  });

  it("switches translations when locale changes", () => {
    function SwitchableTranslation() {
      const { t, locale } = useTranslation("analysis");
      const setLocale = useSetLocale();
      return (
        <div>
          <span data-testid="label">{t("safe")}</span>
          <span data-testid="locale">{locale}</span>
          <button onClick={() => setLocale(locale === "en" ? "zh" : "en")}>
            Switch
          </button>
        </div>
      );
    }

    render(
      <I18nProvider initialLocale="en">
        <SwitchableTranslation />
      </I18nProvider>,
    );
    expect(screen.getByTestId("label")).toHaveTextContent("Safe");

    act(() => {
      screen.getByText("Switch").click();
    });
    expect(screen.getByTestId("label")).toHaveTextContent("安全");
  });
});

describe("useLocale", () => {
  it("returns en without provider", () => {
    render(<LocaleDisplay />);
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("returns provider locale", () => {
    render(
      <I18nProvider initialLocale="zh">
        <LocaleDisplay />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("zh");
  });
});

describe("useSetLocale", () => {
  it("returns noop without provider", () => {
    function NoopSetter() {
      const setLocale = useSetLocale();
      // Should not throw
      return <button onClick={() => setLocale("zh")}>Set</button>;
    }
    render(<NoopSetter />);
    expect(() => {
      act(() => {
        screen.getByText("Set").click();
      });
    }).not.toThrow();
  });

  it("persists locale to localStorage", () => {
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    render(
      <I18nProvider initialLocale="en">
        <LocaleSwitcher />
      </I18nProvider>,
    );

    act(() => {
      screen.getByText("Switch").click();
    });

    expect(setItemSpy).toHaveBeenCalledWith("petfoodsmart-locale", "zh");
    setItemSpy.mockRestore();
  });
});

describe("message completeness", () => {
  const en = jest.requireActual("../../../../messages/en.json") as Record<string, Record<string, string>>;
  const zh = jest.requireActual("../../../../messages/zh.json") as Record<string, Record<string, string>>;

  it("en and zh have the same top-level namespaces", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
  });

  it("every en key exists in zh", () => {
    for (const ns of Object.keys(en)) {
      const enKeys = Object.keys(en[ns]).sort();
      const zhKeys = Object.keys(zh[ns]).sort();
      expect(zhKeys).toEqual(enKeys);
    }
  });

  it("no empty string values in en messages", () => {
    for (const ns of Object.keys(en)) {
      for (const val of Object.values(en[ns])) {
        expect(val).not.toBe("");
        expect(typeof val).toBe("string");
        if (typeof val !== "string") continue;
        expect(val.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("no empty string values in zh messages", () => {
    for (const ns of Object.keys(zh)) {
      for (const val of Object.values(zh[ns])) {
        expect(val).not.toBe("");
        expect(typeof val).toBe("string");
        if (typeof val !== "string") continue;
        expect(val.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
