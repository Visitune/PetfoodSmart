/**
 * F025 - Share Button with server-side image generation
 *
 * Generates share images via /api/share-image (server-side, high quality).
 * Supports two formats: landscape (1200×630 for Twitter/FB) and square (1080×1080 for 小红书/Instagram).
 * Falls back to html2canvas client-side rendering if the API fails.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import type Html2Canvas from "html2canvas";
import type { AnalysisResult } from "@/lib/analyzer/types";
import type { ShareFormat } from "@/lib/og/constants";
import { useTranslation } from "@/lib/i18n";
import { ShareCard } from "./ShareCard";

interface ShareButtonProps {
  result: AnalysisResult;
  foodName?: string;
  /** Brand slug for server-side image generation (GET). Omit for scan results (POST). */
  brandSlug?: string;
}

/** Fetch a share image from the server API */
async function fetchShareImage(
  result: AnalysisResult,
  format: ShareFormat,
  brandSlug?: string,
  foodName?: string
): Promise<Blob> {
  const formatParam = `format=${format}`;

  if (brandSlug) {
    const response = await fetch(
      `/api/share-image?slug=${encodeURIComponent(brandSlug)}&${formatParam}`
    );
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.blob();
  }

  const body = {
    grade: result.grade,
    score: result.score,
    summary: {
      totalIngredients: result.summary.totalIngredients,
      harmfulCount: result.summary.harmfulCount,
      cautionCount: result.summary.cautionCount,
      safeCount: result.summary.safeCount,
      unknownCount: result.summary.unknownCount,
      topIngredientIsProtein: result.summary.topIngredientIsProtein,
      concernPercentage: result.summary.concernPercentage,
    },
    verdict: result.verdict,
    foodName,
    harmfulNames: result.ingredients
      .filter((i) => i.flag === "red")
      .slice(0, 5)
      .map((i) => i.original),
    safeNames: result.ingredients
      .filter((i) => i.flag === "green")
      .slice(0, 5)
      .map((i) => i.original),
  };

  const response = await fetch(`/api/share-image?${formatParam}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.blob();
}

/** Fallback: capture the ShareCard DOM element via html2canvas */
async function captureCardAsBlob(element: HTMLElement): Promise<Blob> {
  const html2canvas: typeof Html2Canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    backgroundColor: "#171717",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate image"));
      },
      "image/png",
      1.0
    );
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ShareButton({ result, foodName, brandSlug }: ShareButtonProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [format, setFormat] = useState<ShareFormat>("square");
  const { t } = useTranslation("sharing");

  const generateImage = useCallback(async (): Promise<Blob> => {
    try {
      return await fetchShareImage(result, format, brandSlug, foodName);
    } catch {
      // Fallback to html2canvas
      if (cardRef.current) {
        return captureCardAsBlob(cardRef.current);
      }
      throw new Error("No fallback available");
    }
  }, [result, format, brandSlug, foodName]);

  const handleShare = useCallback(async () => {
    if (sharing) return;

    setSharing(true);
    try {
      const blob = await generateImage();
      const filename = `petfoodsmart-${format === "square" ? "square" : "og"}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      const shareText = foodName
        ? t("shareTextWithName", {
            foodName,
            grade: result.grade,
            score: result.score,
            verdict: result.verdict,
          })
        : t("shareText", {
            grade: result.grade,
            score: result.score,
            verdict: result.verdict,
          });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title: t("shareTitle"),
          text: shareText,
          files: [file],
        });
      } else {
        downloadBlob(blob, filename);
      }

      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        try {
          const blob = await generateImage();
          downloadBlob(
            blob,
            `petfoodsmart-${format === "square" ? "square" : "og"}.png`
          );
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        } catch {
          // Give up silently
        }
      }
    } finally {
      setSharing(false);
    }
  }, [sharing, result, foodName, format, generateImage, t]);

  return (
    <>
      {/* Hidden card for fallback capture */}
      <div
        style={{ position: "absolute", left: "-9999px", top: 0 }}
        aria-hidden="true"
      >
        <ShareCard ref={cardRef} result={result} foodName={foodName} />
      </div>

      {/* Format toggle */}
      <div className="flex items-center justify-center gap-2" data-testid="format-toggle">
        <button
          type="button"
          onClick={() => setFormat("square")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            format === "square"
              ? "bg-red-500/20 text-red-400"
              : "bg-neutral-800 text-neutral-500 hover:text-neutral-300"
          }`}
          aria-pressed={format === "square"}
          data-testid="format-square"
        >
          {t("formatSquare")}
        </button>
        <button
          type="button"
          onClick={() => setFormat("og")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            format === "og"
              ? "bg-red-500/20 text-red-400"
              : "bg-neutral-800 text-neutral-500 hover:text-neutral-300"
          }`}
          aria-pressed={format === "og"}
          data-testid="format-og"
        >
          {t("formatLandscape")}
        </button>
      </div>

      {/* Share button */}
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="w-full rounded-full bg-red-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-400 active:scale-95 disabled:opacity-50"
        data-testid="share-button"
      >
        {sharing ? t("generating") : shared ? t("shared") : t("shareResult")}
      </button>
    </>
  );
}
