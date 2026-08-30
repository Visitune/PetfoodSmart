/**
 * F009 - Scan History localStorage Persistence
 */

import type { ScanHistoryEntry } from "./types";
import type { AnalysisResult } from "../analyzer/types";

export const HISTORY_STORAGE_KEY = "petfoodsmart_scan_history";
export const MAX_HISTORY_ENTRIES = 50;

/** Generate a simple unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Load all scan history entries from localStorage */
export function loadHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScanHistoryEntry[];
  } catch {
    return [];
  }
}

/** Save a new scan result to history. Returns the created entry. */
export function saveToHistory(
  result: AnalysisResult,
  foodName?: string
): ScanHistoryEntry {
  const entry: ScanHistoryEntry = {
    id: generateId(),
    scannedAt: new Date().toISOString(),
    foodName: foodName ?? "",
    result,
  };

  const history = loadHistory();
  // Prepend new entry (most recent first)
  history.unshift(entry);

  // Prune to max entries
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES;
  }

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage full or unavailable — silently fail
  }

  return entry;
}

/** Delete a single history entry by ID */
export function deleteFromHistory(id: string): void {
  const history = loadHistory();
  const filtered = history.filter((e) => e.id !== id);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Silently fail
  }
}

/** Clear all scan history */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/** Get a single history entry by ID */
export function getHistoryEntry(id: string): ScanHistoryEntry | null {
  const history = loadHistory();
  return history.find((e) => e.id === id) ?? null;
}
