/**
 * F017 - Demo-first Homepage (i18n F019, visual overhaul F034, micro-interactions F036)
 *
 * Demo-first homepage with brand data, search, and scan CTA.
 * F034 adds: animated gradient title, search bar glow pulse,
 * brand card hover lift+glow, stats CountUp on scroll, accent glows.
 * F036 adds: search dropdown animation, scroll-reveal sections,
 * button whileTap scale, brand list stagger.
 */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getAllAnalyzedBrands, searchBrands, getBrandGrade, getPetEmoji } from "@/lib/brands";
import type { AnalyzedBrand } from "@/lib/brands/types";
import type { Grade } from "@/lib/analyzer/types";
import { GRADE_COLORS, GRADE_TEXT_COLORS } from "@/lib/grade";
import { useTranslation, useLocale } from "@/lib/i18n";
import { CountUp, ScrollReveal } from "@/components/motion";
import { Disclaimer } from "@/components/shared/Disclaimer";

interface LandingPageProps {
  onStartScan: () => void;
  onViewHistory: () => void;
}

/** Returns [ref, inView]. In environments without IntersectionObserver (JSDOM), inView is true immediately. */
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

function MiniGradeBadge({ grade }: { grade: Grade }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLORS[grade]}`}
      data-testid="mini-grade-badge"
    >
      {grade}
    </span>
  );
}

function BrandListItem({ brand }: { brand: AnalyzedBrand }) {
  const locale = useLocale();
  return (
    <Link
      href={`/brand/${brand.slug}`}
      className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-neutral-600 hover:bg-neutral-800/50 hover:shadow-lg hover:shadow-red-500/5"
    >
      <MiniGradeBadge grade={brand.analysis.grade} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-100">
          {brand.brand} — {brand.product}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {locale === "zh" ? `${brand.brandCn} ${brand.productCn} · ` : ""}
          {getPetEmoji(brand.petType)}
        </p>
      </div>
      <span className={`text-sm font-bold ${GRADE_TEXT_COLORS[brand.analysis.grade]}`}>
        {brand.analysis.score}
      </span>
    </Link>
  );
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15, ease: "easeIn" as const } },
};

export function LandingPage({ onStartScan, onViewHistory }: LandingPageProps) {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { t } = useTranslation("landing");
  const { t: tc } = useTranslation("common");
  const { t: tl } = useTranslation("legal");
  const { t: tm } = useTranslation("methodology");
  const locale = useLocale();
  const [trustRef, trustInView] = useInView(0.3);
  const [supportsIO, setSupportsIO] = useState(false);
  useEffect(() => {
    setSupportsIO(typeof IntersectionObserver !== "undefined");
  }, []);

  const allAnalyzed = useMemo(() => getAllAnalyzedBrands(), []);

  const bestBrands = useMemo(() => {
    return [...allAnalyzed]
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, 5);
  }, [allAnalyzed]);

  const worstBrands = useMemo(() => {
    return [...allAnalyzed]
      .sort((a, b) => a.analysis.score - b.analysis.score)
      .slice(0, 5);
  }, [allAnalyzed]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchBrands(query);
  }, [query]);

  const showSearch = query.trim().length > 0;

  const trustItems = [
    { stat: t("trustIngredients"), label: t("trustIngredientsLabel"), countTo: 500, suffix: "+" },
    { stat: t("trustGrades"), label: t("trustGradesLabel") },
    { stat: t("trustLanguages"), label: t("trustLanguagesLabel"), countTo: 2 },
    { stat: t("trustFree"), label: t("trustFreeLabel") },
  ];

  return (
    <div className="relative mx-auto max-w-md px-4">
      {/* F034: Background accent glows */}
      <div
        className="pointer-events-none absolute top-4 left-8 h-40 w-40 rounded-full bg-red-500/10 blur-[100px]"
        aria-hidden="true"
        data-testid="accent-glow"
      />
      <div
        className="pointer-events-none absolute top-[480px] right-8 h-32 w-32 rounded-full bg-orange-500/10 blur-[80px]"
        aria-hidden="true"
        data-testid="accent-glow"
      />

      {/* Compact Hero */}
      <section className="pt-12 pb-6 text-center">
        <h1 className="text-4xl font-black tracking-tight">
          PetFood<span className="hero-gradient-text">Smart</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          {t("tagline")}
        </p>
      </section>

      {/* Search Bar */}
      <section className="pb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className={`w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-5 py-4 pl-12 text-base text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 ${
              !searchFocused && !showSearch ? "search-glow" : ""
            }`}
            data-testid="brand-search-input"
          />
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search Results — animated dropdown */}
        <AnimatePresence mode="wait">
          {showSearch && (
            <motion.div
              key="landing-search-results"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-3"
              data-testid="brand-search-results"
            >
              {searchResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">
                  {t("noResults", { query })}
                </p>
              ) : (
                <ul className="space-y-2">
                  {searchResults.map((brand) => {
                    const grade = getBrandGrade(brand);
                    return (
                      <li key={brand.slug}>
                        <Link
                          href={`/brand/${brand.slug}`}
                          className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-neutral-600 hover:bg-neutral-800/50 hover:shadow-lg hover:shadow-red-500/5"
                        >
                          <MiniGradeBadge grade={grade} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-100">
                              {brand.brand} — {brand.product}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
                              {locale === "zh" ? `${brand.brandCn} ${brand.productCn} · ` : ""}
                              {getPetEmoji(brand.petType)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Scan CTA (above the brand lists) */}
      <section className="pb-8 text-center">
        <motion.button
          onClick={onStartScan}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-red-500 px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 hover:shadow-red-500/35"
          type="button"
          data-testid="hero-scan-button"
        >
          {t("scanButton")}
        </motion.button>
        <button
          onClick={onViewHistory}
          className="mt-3 block w-full text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-300"
          type="button"
          data-testid="history-button"
        >
          {t("viewHistory")}
        </button>
      </section>

      {/* Worst-Rated Brands (fear hook — shown first) */}
      <ScrollReveal>
        <section className="pb-8" data-testid="worst-brands">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-100">
              {t("worstRated")}
            </h2>
            <Link
              href="/ranking"
              className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              data-testid="view-full-ranking"
            >
              {t("viewFullRanking")}
            </Link>
          </div>
          <div className="space-y-2">
            {worstBrands.map((brand) => (
              <BrandListItem key={brand.slug} brand={brand} />
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Best-Rated Brands */}
      <ScrollReveal delay={0.1}>
        <section className="pb-8" data-testid="best-brands">
          <h2 className="mb-3 text-lg font-bold text-neutral-100">
            {t("topRated")}
          </h2>
          <div className="space-y-2">
            {bestBrands.map((brand) => (
              <BrandListItem key={brand.slug} brand={brand} />
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Trust Signals */}
      <ScrollReveal delay={0.1}>
        <section className="py-10" ref={trustRef} data-testid="trust-signals">
          <div className="grid grid-cols-2 gap-3">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-center"
              >
                {item.countTo !== undefined && supportsIO ? (
                  trustInView ? (
                    <CountUp
                      to={item.countTo}
                      duration={1.2}
                      formatter={
                        item.suffix
                          ? (v: number) => `${v}${item.suffix}`
                          : undefined
                      }
                      className="text-2xl font-bold text-red-400"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-red-400">
                      0{item.suffix || ""}
                    </p>
                  )
                ) : (
                  <p className="text-2xl font-bold text-red-400">{item.stat}</p>
                )}
                <p className="mt-1.5 text-xs font-medium text-neutral-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Bottom CTA */}
      <ScrollReveal>
        <section className="py-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">{t("readyToScan")}</h2>
          <p className="mt-3 text-sm text-neutral-500">
            {t("readyToScanDesc")}
          </p>
          <motion.button
            onClick={onStartScan}
            whileTap={{ scale: 0.95 }}
            className="mt-8 rounded-full bg-red-500 px-12 py-4 text-lg font-bold text-white shadow-xl shadow-red-500/25 transition-all hover:bg-red-400"
            type="button"
            data-testid="bottom-scan-button"
          >
            {t("scanLabelNow")}
          </motion.button>
        </section>
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50 py-10 text-center text-xs text-neutral-600">
        <p className="font-medium">
          {t("footer")}
        </p>
        <Disclaimer />
        <div className="mt-3 flex items-center justify-center gap-3">
          <Link
            href="/legal"
            className="text-xs text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-400"
          >
            {tl("footerLink")}
          </Link>
          <span className="text-neutral-700">&middot;</span>
          <Link
            href="/methodology"
            className="text-xs text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-400"
          >
            {tm("footerLink")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
