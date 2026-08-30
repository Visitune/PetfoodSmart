"use client";

import { useTranslation } from "@/lib/i18n";

interface ImagePreviewProps {
  src: string;
  onRetake: () => void;
  onConfirm: () => void;
}

export function ImagePreview({ src, onRetake, onConfirm }: ImagePreviewProps) {
  const { t } = useTranslation("scanner");

  return (
    <div className="flex flex-col items-center">
      <div className="flex h-[50vh] max-h-[420px] min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from camera/upload, not optimizable by next/image */}
        <img
          src={src}
          alt={t("capturedLabel")}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="mt-4 flex w-full gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="flex-1 rounded-full border-2 border-neutral-600 px-6 py-3 font-medium text-neutral-300 transition-colors hover:border-neutral-400 active:scale-95"
        >
          {t("retake")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-full bg-red-500 px-6 py-3 font-semibold text-white shadow-lg transition-transform active:scale-95"
        >
          {t("analyze")}
        </button>
      </div>
    </div>
  );
}
