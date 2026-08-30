/**
 * F009 - Scan History List Component (i18n F019)
 *
 * Displays a scrollable list of past scans with grade badges and timestamps.
 * Supports selection for comparison mode and deletion of entries.
 */

"use client";

import { useState } from "react";
import type { ScanHistoryEntry } from "@/lib/history/types";
import { GRADE_COLORS } from "@/lib/grade";
import { useTranslation } from "@/lib/i18n";
import { ClipboardList, X } from "lucide-react";

interface HistoryListProps {
  entries: ScanHistoryEntry[];
  onSelect: (entry: ScanHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  /** When in compare mode, track selected entries */
  compareMode?: boolean;
  onCompare?: (entries: [ScanHistoryEntry, ScanHistoryEntry]) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

export function HistoryList({
  entries,
  onSelect,
  onDelete,
  onClear,
  compareMode = false,
  onCompare,
}: HistoryListProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const { t } = useTranslation("history");

  function handleToggleSelect(entry: ScanHistoryEntry): void {
    if (!compareMode) {
      onSelect(entry);
      return;
    }

    setSelected((prev) => {
      const isSelected = prev.includes(entry.id);
      if (isSelected) {
        return prev.filter((id) => id !== entry.id);
      }
      const next = [...prev, entry.id];
      if (next.length === 2 && onCompare) {
        const found = next
          .map((id) => entries.find((e) => e.id === id))
          .filter((e): e is ScanHistoryEntry => e !== undefined);
        if (found.length === 2) {
          onCompare([found[0], found[1]]);
        }
        return [];
      }
      return next;
    });
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12" data-testid="history-empty">
        <ClipboardList size={36} className="mx-auto text-neutral-500" aria-hidden="true" />
        <p className="mt-3 text-neutral-400">{t("empty")}</p>
        <p className="mt-1 text-sm text-neutral-500">
          {t("emptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="history-list">
      {compareMode && (
        <p className="text-sm text-neutral-400 text-center">
          {t("selectToCompare", { count: selected.length })}
        </p>
      )}

      {entries.map((entry) => {
        const isSelected = selected.includes(entry.id);
        return (
          <div
            key={entry.id}
            className={`flex items-center gap-3 rounded-xl bg-neutral-800/60 px-4 py-3 transition-colors ${
              isSelected ? "ring-2 ring-red-500" : ""
            }`}
            data-testid="history-entry"
          >
            <button
              type="button"
              onClick={() => handleToggleSelect(entry)}
              className="flex flex-1 items-center gap-3 text-left"
              data-testid="history-entry-button"
            >
              {/* Mini grade badge */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${GRADE_COLORS[entry.result.grade]} text-white font-bold text-lg`}
              >
                {entry.result.grade}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-neutral-200">
                  {entry.foodName || t("unnamedFood")}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDate(entry.scannedAt)} · {t("scoreDisplay", { score: entry.result.score })}
                </p>
              </div>
            </button>

            {!compareMode && (
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                className="shrink-0 p-2 text-neutral-500 hover:text-red-400"
                aria-label={`Delete ${entry.foodName || "scan"}`}
                data-testid="history-delete"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}

      {entries.length > 0 && !compareMode && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 text-sm text-neutral-500 hover:text-red-400"
          data-testid="history-clear"
        >
          {t("clearAll")}
        </button>
      )}
    </div>
  );
}
