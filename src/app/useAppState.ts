"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { extractIngredients } from "@/lib/ocr";
import { analyzeIngredients } from "@/lib/analyzer";
import { saveProfile, loadProfile } from "@/lib/profile";
import {
  loadHistory,
  saveToHistory,
  deleteFromHistory,
  clearHistory,
} from "@/lib/history";
import { useLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/analyzer/types";
import type { PetProfile } from "@/lib/profile/types";
import type { ParsedIngredient } from "@/lib/ocr/types";
import type { ScanHistoryEntry } from "@/lib/history/types";

/**
 * Tesseract.js language pack(s) to load for OCR, per UI locale.
 * Kept to two languages max — loading every supported language at once has
 * caused OCR to fail outright on some mobile devices.
 */
const OCR_LANGUAGES_BY_LOCALE: Record<Locale, string> = {
  en: "eng",
  zh: "eng+chi_sim",
  fr: "eng+fra",
  es: "eng+spa",
  nl: "eng+nld",
};

export type AppState =
  | "idle"
  | "profile"
  | "scanning"
  | "analyzing"
  | "ceremony"
  | "results"
  | "history"
  | "history-detail"
  | "comparing"
  | "error";

export function useAppState() {
  const [state, setState] = useState<AppState>("idle");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ScanHistoryEntry[]>([]);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonPair, setComparisonPair] = useState<
    [ScanHistoryEntry, ScanHistoryEntry] | null
  >(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    useState<ScanHistoryEntry | null>(null);
  const lastParsedIngredients = useRef<ParsedIngredient[] | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const saved = loadProfile();
    if (saved) setPetProfile(saved);
  }, []);

  const refreshHistory = useCallback(() => {
    setHistoryEntries(loadHistory());
  }, []);

  const handleStartScan = useCallback(() => {
    setState("scanning");
    setAnalysisResult(null);
    setErrorMessage("");
    setSavedToHistory(false);
  }, []);

  const handleProfileSave = useCallback((profile: PetProfile) => {
    setPetProfile(profile);
    saveProfile(profile);
    // Re-analyze with profile if we have ingredients from a previous scan
    if (lastParsedIngredients.current) {
      const result = analyzeIngredients(lastParsedIngredients.current, profile);
      setAnalysisResult(result);
      setState("results");
    } else {
      setState("scanning");
    }
  }, []);

  const handleProfileSkip = useCallback(() => {
    // Return to results if we came from there (have parsed ingredients)
    if (lastParsedIngredients.current && analysisResult) {
      setState("results");
    } else {
      setState("scanning");
    }
  }, [analysisResult]);

  const handlePersonalize = useCallback(() => {
    setState("profile");
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setAnalysisResult(null);
    setErrorMessage("");
    setSavedToHistory(false);
    setCompareMode(false);
    setComparisonPair(null);
    setSelectedHistoryEntry(null);
  }, []);

  const handleImageConfirmed = useCallback(async (imageDataUrl: string) => {
    setState("analyzing");

    const extraction = await extractIngredients(imageDataUrl, OCR_LANGUAGES_BY_LOCALE[locale]);

    if (!extraction.success) {
      setErrorMessage(extraction.error ?? "Failed to extract ingredients.");
      setState("error");
      return;
    }

    // Store parsed ingredients for potential re-analysis with profile
    lastParsedIngredients.current = extraction.ingredients;

    const result = analyzeIngredients(
      extraction.ingredients,
      petProfile ?? undefined
    );
    setAnalysisResult(result);
    setState("ceremony");
  }, [petProfile, locale]);

  const handleCeremonyComplete = useCallback(() => {
    setState("results");
  }, []);

  const handleSaveToHistory = useCallback(
    (foodName: string) => {
      if (!analysisResult) return;
      saveToHistory(analysisResult, foodName);
      setSavedToHistory(true);
    },
    [analysisResult]
  );

  const handleOpenHistory = useCallback(() => {
    refreshHistory();
    setState("history");
    setCompareMode(false);
    setComparisonPair(null);
  }, [refreshHistory]);

  const handleHistorySelect = useCallback((entry: ScanHistoryEntry) => {
    setSelectedHistoryEntry(entry);
    setAnalysisResult(entry.result);
    setState("history-detail");
  }, []);

  const handleHistoryDelete = useCallback(
    (id: string) => {
      deleteFromHistory(id);
      refreshHistory();
    },
    [refreshHistory]
  );

  const handleHistoryClear = useCallback(() => {
    clearHistory();
    refreshHistory();
  }, [refreshHistory]);

  const handleCompare = useCallback(
    (pair: [ScanHistoryEntry, ScanHistoryEntry]) => {
      setComparisonPair(pair);
      setState("comparing");
    },
    []
  );

  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => !prev);
  }, []);

  return {
    state,
    analysisResult,
    errorMessage,
    petProfile,
    historyEntries,
    savedToHistory,
    compareMode,
    comparisonPair,
    selectedHistoryEntry,
    handleStartScan,
    handleProfileSave,
    handleProfileSkip,
    handlePersonalize,
    handleReset,
    handleImageConfirmed,
    handleCeremonyComplete,
    handleSaveToHistory,
    handleOpenHistory,
    handleHistorySelect,
    handleHistoryDelete,
    handleHistoryClear,
    handleCompare,
    toggleCompareMode,
  };
}
