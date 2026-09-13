"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { CameraCapture } from "./CameraCapture";
import { ImageUpload } from "./ImageUpload";
import { ImagePreview } from "./ImagePreview";
import { BarcodePanel } from "@/components/barcode/BarcodePanel";
import type { BarcodeProduct } from "@/lib/barcode";

type ScannerState = "capture" | "preview";
type ScannerMode = "label" | "barcode";

interface ScannerProps {
  onImageConfirmed: (imageDataUrl: string) => void;
  onProductResolved: (product: BarcodeProduct) => void;
}

export function Scanner({ onImageConfirmed, onProductResolved }: ScannerProps) {
  const [state, setState] = useState<ScannerState>("capture");
  const [mode, setMode] = useState<ScannerMode>("label");
  const [imageData, setImageData] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { t } = useTranslation("common");
  const { t: ts } = useTranslation("scanner");

  const hasCamera = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  const handleImage = useCallback((dataUrl: string) => {
    setImageData(dataUrl);
    setState("preview");
  }, []);

  const handleCameraError = useCallback((message: string) => {
    setCameraError(message);
  }, []);

  const handleRetake = useCallback(() => {
    setImageData(null);
    setState("capture");
    setCameraError(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (imageData) {
      onImageConfirmed(imageData);
    }
  }, [imageData, onImageConfirmed]);

  if (state === "preview" && imageData) {
    return (
      <ImagePreview
        src={imageData}
        onRetake={handleRetake}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={ts("modeLabel")} className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-800 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "label"}
          onClick={() => setMode("label")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "label" ? "bg-neutral-700 text-white" : "text-neutral-400"}`}
        >
          {ts("tabLabel")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "barcode"}
          onClick={() => setMode("barcode")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "barcode" ? "bg-neutral-700 text-white" : "text-neutral-400"}`}
        >
          {ts("tabBarcode")}
        </button>
      </div>
      {mode === "barcode" ? (
        <BarcodePanel onProductResolved={onProductResolved} />
      ) : (
      <>
      {hasCamera && !cameraError && (
        <CameraCapture onCapture={handleImage} onError={handleCameraError} />
      )}
      {cameraError && (
        <p className="text-center text-sm text-amber-400">{cameraError}</p>
      )}
      <div className="relative">
        {hasCamera && !cameraError && (
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-700" />
            <span className="text-sm text-neutral-500">{t("or")}</span>
            <div className="h-px flex-1 bg-neutral-700" />
          </div>
        )}
        <ImageUpload onImageSelected={handleImage} />
      </div>
      </>
      )}
    </div>
  );
}
