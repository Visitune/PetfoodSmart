"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { validateBarcode } from "@/lib/barcode";
import type { BarcodeProduct } from "@/lib/barcode";

type PanelStatus = "idle" | "looking" | "preview" | "error";

interface BarcodePanelProps {
  onProductResolved: (product: BarcodeProduct) => void;
}

/**
 * Barcode lookup panel: manual entry (always works), live camera scan
 * (ZXing, loaded on demand so the main bundle stays lean), or detection
 * from an uploaded photo. Found products are previewed before analysis.
 */
export function BarcodePanel({ onProductResolved }: BarcodePanelProps) {
  const { t } = useTranslation("scanner");
  const { t: tc } = useTranslation("common");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const hasCamera =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const stopCamera = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore cleanup errors
    }
    controlsRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const lookup = useCallback(
    async (ean: string) => {
      setStatus("looking");
      setError(null);
      try {
        const res = await fetch(`/api/barcode/${encodeURIComponent(ean)}`);
        const body = await res.json();
        if (!res.ok) {
          const reason = body?.reason as string | undefined;
          setError(
            reason === "not-found"
              ? t("barcodeNotFound")
              : reason === "no-ingredients"
                ? t("barcodeNoIngredients")
                : t("barcodeNetworkError")
          );
          setStatus("error");
          return;
        }
        setProduct(body.product as BarcodeProduct);
        setStatus("preview");
      } catch {
        setError(t("barcodeNetworkError"));
        setStatus("error");
      }
    },
    [t]
  );

  const submitCode = useCallback(
    (raw: string) => {
      const validation = validateBarcode(raw);
      if (!validation.ok) {
        const key =
          validation.error === "bad-checksum"
            ? "barcodeBadChecksum"
            : validation.error === "bad-length"
              ? "barcodeBadLength"
              : "barcodeNotNumeric";
        setError(t(key));
        setStatus("error");
        return;
      }
      stopCamera();
      void lookup(validation.ean);
    },
    [lookup, stopCamera, t]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setError(null);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      setCameraOn(true);
      // Wait a tick so the <video> element exists
      await new Promise((r) => setTimeout(r, 50));
      if (!videoRef.current) {
        setCameraOn(false);
        return;
      }
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            const text = result.getText();
            stopCamera();
            submitCode(text);
          }
        }
      );
      controlsRef.current = controls;
    } catch {
      setCameraOn(false);
      setCameraError(t("barcodeCameraError"));
    }
  }, [stopCamera, submitCode, t]);

  const handlePhoto = useCallback(
    async (file: File) => {
      setError(null);
      const url = URL.createObjectURL(file);
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        const result = await reader.decodeFromImageUrl(url);
        submitCode(result.getText());
      } catch {
        setError(t("barcodeCameraError"));
        setStatus("error");
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [submitCode, t]
  );

  if (status === "preview" && product) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.productName ?? product.code}
            className="h-32 w-32 rounded-xl object-contain bg-white p-2"
          />
        )}
        <div>
          <p className="text-sm text-neutral-400">{t("barcodeFound")}</p>
          <p className="text-lg font-bold text-neutral-100">
            {[product.brand, product.productName].filter(Boolean).join(" — ") ||
              product.code}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {product.ingredients.length} · {t("barcodeSource")}
          </p>
        </div>
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={() => {
              setProduct(null);
              setStatus("idle");
            }}
            className="flex-1 rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-300"
          >
            {t("barcodeCancel")}
          </button>
          <button
            type="button"
            onClick={() => onProductResolved(product)}
            className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white"
          >
            {t("barcodeAnalyze")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-neutral-400">{t("barcodeTitle")}</p>

      <div className="flex gap-2">
        <input
          data-testid="barcode-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitCode(input);
          }}
          placeholder={t("barcodePlaceholder")}
          inputMode="numeric"
          aria-label={t("barcodePlaceholder")}
          className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-center text-lg tracking-widest text-neutral-100 placeholder:text-sm placeholder:tracking-normal placeholder:text-neutral-600"
        />
        <button
          type="button"
          data-testid="barcode-lookup"
          disabled={status === "looking" || input.trim().length === 0}
          onClick={() => submitCode(input)}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          {status === "looking" ? t("barcodeLookingUp") : t("barcodeLookup")}
        </button>
      </div>

      {status === "error" && error && (
        <p role="alert" className="text-center text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-700" />
        <span className="text-sm text-neutral-500">{tc("or")}</span>
        <div className="h-px flex-1 bg-neutral-700" />
      </div>

      {hasCamera && !cameraOn && (
        <button
          type="button"
          onClick={startCamera}
          className="rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-200"
        >
          {t("barcodeCamera")}
        </button>
      )}
      {cameraOn && (
        <div className="flex flex-col gap-2">
          <video
            ref={videoRef}
            data-testid="barcode-video"
            className="aspect-[4/3] w-full rounded-xl bg-black object-cover"
            playsInline
            muted
          />
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300"
          >
            {t("barcodeCameraStop")}
          </button>
        </div>
      )}
      {cameraError && (
        <p role="alert" className="text-center text-sm text-amber-400">
          {cameraError}
        </p>
      )}

      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        className="rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-200"
      >
        {t("barcodePhoto")}
      </button>
      <input
        ref={photoInputRef}
        data-testid="barcode-photo-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handlePhoto(file);
        }}
      />
    </div>
  );
}
