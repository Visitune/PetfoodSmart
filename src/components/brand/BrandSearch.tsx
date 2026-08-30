"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { searchBrands, getAllBrands, getBrandGrade, getPetEmoji } from "@/lib/brands";
import type { Grade } from "@/lib/analyzer/types";
import { GRADE_COLORS } from "@/lib/grade";
import { useTranslation, useLocale } from "@/lib/i18n";

interface BrandSearchProps {
  onScanOwn?: () => void;
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15, ease: "easeIn" as const } },
};

export function BrandSearch({ onScanOwn }: BrandSearchProps) {
  const [query, setQuery] = useState("");
  const { t } = useTranslation("brand");
  const locale = useLocale();

  const allBrands = useMemo(() => getAllBrands(), []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchBrands(query);
  }, [query]);

  const showResults = query.trim().length > 0;

  return (
    <div className="w-full" data-testid="brand-search">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-5 py-4 pl-12 text-base text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
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

      {/* Results */}
      <AnimatePresence mode="wait">
        {showResults && (
          <motion.div
            key="search-results"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-3"
            data-testid="brand-search-results"
          >
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                {t("noResults", { query })}
              </p>
            ) : (
              <ul className="space-y-2">
                {results.map((brand) => {
                  const grade = getBrandGrade(brand);
                  return (
                    <li key={brand.slug}>
                      <Link
                        href={`/brand/${brand.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 transition-colors hover:border-neutral-600 hover:bg-neutral-800/50"
                        data-testid={`brand-result-${brand.slug}`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${GRADE_COLORS[grade]}`}
                        >
                          {grade}
                        </span>
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

      {/* Browse all hint */}
      {!showResults && (
        <p className="mt-3 text-center text-xs text-neutral-600">
          {t("brandsCount", { count: allBrands.length })}{" "}
          {onScanOwn ? (
            <button
              type="button"
              onClick={onScanOwn}
              className="text-red-400 underline-offset-2 hover:underline"
            >
              {t("orScanYourOwn")}
            </button>
          ) : (
            <Link href="/" className="text-red-400 underline-offset-2 hover:underline">
              {t("orScanYourOwn")}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
