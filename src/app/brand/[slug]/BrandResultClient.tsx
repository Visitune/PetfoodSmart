"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { AnalyzedBrand } from "@/lib/brands/types";
import { AnimatedGradeBadge } from "@/components/grade";
import { IngredientList } from "@/components/analysis/IngredientList";
import { SummaryBar } from "@/components/analysis/SummaryBar";
import { ShareButton } from "@/components/sharing";
import { useTranslation, useLocale } from "@/lib/i18n";
import { Disclaimer } from "@/components/shared/Disclaimer";
import { PetTypeIcon } from "@/components/shared/PetTypeIcon";

interface BrandResultClientProps {
  brand: AnalyzedBrand;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: "easeOut" as const },
  }),
};

export function BrandResultClient({ brand }: BrandResultClientProps) {
  const { analysis } = brand;
  const displayName = `${brand.brand} ${brand.product}`;
  const displayNameCn = `${brand.brandCn} ${brand.productCn}`;
  const locale = useLocale();
  const { t: tc } = useTranslation("common");
  const { t: tb } = useTranslation("brand");
  const { t: tg } = useTranslation("grade");

  const verdictKey = analysis.summary.totalIngredients === 0
    ? "verdictNone"
    : `verdict${analysis.grade}`;
  const localizedVerdict = tg(verdictKey, {
    harmfulCount: String(analysis.summary.harmfulCount),
  });

  // Only animate after client hydration — SSR renders content visible
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-dvh">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
        {/* Back link */}
        <Link
          href="/"
          className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-200"
          data-testid="back-link"
        >
          {tc("backToHome")}
        </Link>

        {/* Brand Header */}
        <motion.div
          variants={sectionVariants}
          initial={mounted ? "hidden" : false}
          animate="visible"
          custom={0}
          className="text-center"
          data-testid="brand-header"
        >
          <h1 className="text-xl font-bold text-neutral-100">{displayName}</h1>
          {locale === "zh" && brand.brandCn && (
            <p className="mt-1 text-sm text-neutral-400">{displayNameCn}</p>
          )}
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-neutral-600">
            <PetTypeIcon petType={brand.petType} size={13} />
            {brand.petType === "cat" ? tb("catFood") : tb("dogFood")}
          </p>
        </motion.div>

        {/* Grade Badge */}
        <AnimatedGradeBadge grade={analysis.grade} score={analysis.score} />

        {/* Verdict */}
        <motion.p
          variants={sectionVariants}
          initial={mounted ? "hidden" : false}
          animate="visible"
          custom={0.3}
          className="text-center text-base leading-relaxed text-neutral-300"
          data-testid="verdict"
        >
          {localizedVerdict}
        </motion.p>

        {/* Legal Disclaimer */}
        <div className="text-center">
          <Disclaimer />
        </div>

        {/* Summary Stats */}
        <motion.div
          variants={sectionVariants}
          initial={mounted ? "hidden" : false}
          animate="visible"
          custom={0.4}
        >
          <SummaryBar summary={analysis.summary} />
        </motion.div>

        {/* Ingredient List */}
        <motion.div
          variants={sectionVariants}
          initial={mounted ? "hidden" : false}
          animate="visible"
          custom={0.5}
        >
          <IngredientList ingredients={analysis.ingredients} />
        </motion.div>

        {/* Share */}
        <motion.div
          variants={sectionVariants}
          initial={mounted ? "hidden" : false}
          animate="visible"
          custom={0.6}
        >
          <ShareButton result={analysis} foodName={displayName} brandSlug={brand.slug} />
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={sectionVariants}
          initial={mounted ? "hidden" : false}
          animate="visible"
          custom={0.7}
          className="flex flex-col gap-3"
        >
          <Link
            href="/"
            className="block w-full rounded-full bg-red-500 px-8 py-3.5 text-center font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 hover:shadow-red-500/30 active:scale-[0.98]"
            data-testid="scan-own-cta"
          >
            {tc("scanYourFood")}
          </Link>
          <Link
            href="/ranking"
            className="block w-full rounded-full border border-neutral-700 bg-neutral-800 px-8 py-3.5 text-center font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 active:scale-[0.98]"
            data-testid="ranking-link"
          >
            {tc("viewRankings")}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
