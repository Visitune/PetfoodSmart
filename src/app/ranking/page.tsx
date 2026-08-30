import type { Metadata } from "next";
import { getAllAnalyzedBrands } from "@/lib/brands";
import { RankingClient } from "./RankingClient";

export const metadata: Metadata = {
  title: "Pet Food Safety Rankings | PetFoodSmart",
  description:
    "Complete pet food safety rankings — compare cat and dog food brands by ingredient quality.",
  openGraph: {
    title: "Pet Food Safety Rankings | PetFoodSmart",
    description:
      "Compare cat and dog food brands ranked by ingredient safety. Find the safest food for your pet.",
    siteName: "PetFoodSmart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet Food Safety Rankings | PetFoodSmart",
    description:
      "Compare cat and dog food brands ranked by ingredient safety.",
  },
  alternates: {
    languages: {
      'en': '/ranking',
      'zh-CN': '/ranking',
      'fr': '/ranking',
      'es': '/ranking',
      'nl': '/ranking',
    },
  },
};

export default function RankingPage() {
  const brands = getAllAnalyzedBrands();
  return <RankingClient brands={brands} />;
}
