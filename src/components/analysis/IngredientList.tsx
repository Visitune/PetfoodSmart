/**
 * F006 - Ingredient List Component (polished F013, i18n F019, stagger F036)
 *
 * Scrollable list of analyzed ingredients with color-coded flags.
 * Red = harmful, Yellow = caution, Green = safe, Gray = unknown.
 * Shows Chinese ingredient names when locale is zh.
 * F036: Stagger animation on ingredient items.
 */

"use client";

import { motion, type Variants } from "framer-motion";
import type { AnalyzedIngredient, IngredientFlag } from "@/lib/analyzer/types";
import { useTranslation } from "@/lib/i18n";
import { lookupIngredient } from "@/lib/knowledge";

const FLAG_DOT_STYLES: Record<IngredientFlag, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  unknown: "bg-neutral-500",
};

const FLAG_BADGE_STYLES: Record<IngredientFlag, string> = {
  red: "bg-red-500/10 text-red-400",
  yellow: "bg-amber-500/10 text-amber-400",
  green: "bg-emerald-500/10 text-emerald-400",
  unknown: "bg-neutral-500/10 text-neutral-400",
};

const FLAG_LABEL_KEYS: Record<IngredientFlag, string> = {
  red: "harmful",
  yellow: "caution",
  green: "safe",
  unknown: "unknown",
};

const listVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

function getChineseName(name: string): string | undefined {
  const result = lookupIngredient(name);
  if (!result) return undefined;
  const chineseAlias = result.ingredient.common_aliases.find((a) =>
    /[\u4e00-\u9fff]/.test(a),
  );
  return chineseAlias;
}

interface IngredientItemProps {
  ingredient: AnalyzedIngredient;
  locale: string;
  flagLabel: string;
}

function IngredientItem({ ingredient, locale, flagLabel }: IngredientItemProps) {
  const dotStyle = FLAG_DOT_STYLES[ingredient.flag];
  const badgeStyle = FLAG_BADGE_STYLES[ingredient.flag];

  let displayName = ingredient.original;
  if (locale === "zh") {
    const cnName = getChineseName(ingredient.original);
    if (cnName) {
      displayName = `${cnName} (${ingredient.original})`;
    }
  }

  return (
    <motion.li variants={itemVariants} className="flex items-start gap-3 py-3">
      <span
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotStyle}`}
        aria-label={flagLabel}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-100">
            {displayName}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeStyle}`}>
            {flagLabel}
          </span>
          <span className="ml-auto text-xs tabular-nums text-neutral-600">
            #{ingredient.position + 1}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-neutral-400">
          {locale === "zh" && ingredient.knownIngredient?.explanation_zh
            ? ingredient.knownIngredient.explanation_zh
            : locale === "fr" && ingredient.knownIngredient?.explanation_fr
              ? ingredient.knownIngredient.explanation_fr
              : ingredient.explanation}
        </p>
      </div>
    </motion.li>
  );
}

interface IngredientListProps {
  ingredients: AnalyzedIngredient[];
}

export function IngredientList({ ingredients }: IngredientListProps) {
  const { t, locale } = useTranslation("analysis");

  if (ingredients.length === 0) {
    return (
      <p className="text-center text-neutral-400" data-testid="empty-list">
        {t("noIngredients")}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {t("ingredientsCount", { count: ingredients.length })}
      </h3>
      <motion.ul
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="divide-y divide-neutral-800/50"
        data-testid="ingredient-list"
      >
        {ingredients.map((item, idx) => (
          <IngredientItem
            key={`${item.normalized}-${idx}`}
            ingredient={item}
            locale={locale}
            flagLabel={t(FLAG_LABEL_KEYS[item.flag])}
          />
        ))}
      </motion.ul>
    </div>
  );
}
