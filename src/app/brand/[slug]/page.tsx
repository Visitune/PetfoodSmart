import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllBrandSlugs,
  getAnalyzedBrandBySlug,
} from "@/lib/brands";
import { BrandResultClient } from "./BrandResultClient";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return getAllBrandSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getAnalyzedBrandBySlug(slug);

  if (!brand) {
    return { title: "Brand Not Found | PetFoodSmart" };
  }

  const title = `${brand.brand} ${brand.product} — Grade ${brand.analysis.grade} | PetFoodSmart`;
  const description = `${brand.brand} ${brand.product} (${brand.brandCn} ${brand.productCn}) scored ${brand.analysis.score}/100 (Grade ${brand.analysis.grade}). ${brand.analysis.verdict}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "PetFoodSmart",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      languages: {
        'en': `/brand/${slug}`,
        'zh-CN': `/brand/${slug}`,
        'fr': `/brand/${slug}`,
        'es': `/brand/${slug}`,
        'nl': `/brand/${slug}`,
      },
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getAnalyzedBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${brand.brand} ${brand.product}`,
    "review": {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": brand.analysis.score,
        "bestRating": 100,
      },
      "author": { "@type": "Organization", "name": "PetFoodSmart" },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BrandResultClient brand={brand} />
    </>
  );
}
