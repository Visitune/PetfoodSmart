/*
 * F001 PRE-IMPLEMENTATION THINKING:
 * 1. What: Root layout with mobile-first viewport, camera-ready meta tags, PWA support.
 * 2. Decisions: Dark theme by default (fear-driven UX works better on dark bg),
 *    viewport-fit=cover for notched phones, standalone PWA display mode.
 * 3. Risks: iOS Safari quirks with viewport-fit, PWA install prompt timing.
 * 4. Simplest: Standard Next.js layout with proper meta tags and manifest link.
 * 5. Tests: Build succeeds, meta tags render correctly.
 */

import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/i18n";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: "PetFoodSmart - Pet Food Ingredient Scanner",
  description:
    "Scan pet food labels instantly. AI-powered ingredient analysis gives your pet's food a safety grade from A to F.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PetFoodSmart",
  },
  keywords: ["pet food safety", "ingredient scanner", "pet food grade", "dog food", "cat food", "宠物粮安全", "配料分析", "猫粮", "狗粮"],
  creator: "PetFoodSmart",
  authors: [{ name: "PetFoodSmart" }],
  openGraph: {
    title: "PetFoodSmart - Pet Food Ingredient Scanner",
    description:
      "Scan pet food labels instantly. AI-powered ingredient analysis gives your pet's food a safety grade from A to F.",
    siteName: "PetFoodSmart",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PetFoodSmart - Pet Food Ingredient Scanner",
    description:
      "Scan pet food labels instantly. AI-powered ingredient analysis gives your pet's food a safety grade from A to F.",
  },
  alternates: {
    languages: {
      'en': '/',
      'zh-CN': '/',
      'fr': '/',
      'es': '/',
      'nl': '/',
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "PetFoodSmart",
              "description": "AI-powered pet food ingredient scanner. Scan a label, get an instant safety grade.",
              "url": "https://petfoodsmart.com",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
              "inLanguage": ["en", "zh-CN", "fr", "es", "nl"],
            }),
          }}
        />
        <I18nProvider>
          <LanguageSwitcher />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
