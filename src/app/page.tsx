"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Scanner } from "@/components/scanner";
import { AnalysisView, ScanCeremony } from "@/components/analysis";
import { PetProfileForm } from "@/components/profile";
import { HistoryList, ComparisonView } from "@/components/history";
import { LandingPage } from "@/components/landing";
import { useTranslation } from "@/lib/i18n";
import { useAppState } from "./useAppState";
import { AlertTriangle } from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" as const } },
};

export default function Home() {
  const {
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
  } = useAppState();

  const { t: tc } = useTranslation("common");
  const { t: ta } = useTranslation("analysis");
  const { t: th } = useTranslation("history");
  const { t: ts } = useTranslation("scanner");

  function renderContent() {
    // Comparison view
    if (state === "comparing" && comparisonPair) {
      return (
        <motion.main
          key="comparing"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-dvh"
        >
          <ComparisonView
            left={comparisonPair[0]}
            right={comparisonPair[1]}
            onClose={handleOpenHistory}
          />
        </motion.main>
      );
    }

    // History detail (viewing a past scan)
    if (state === "history-detail" && analysisResult) {
      return (
        <motion.main
          key="history-detail"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-dvh"
        >
          <div className="mx-auto max-w-md px-4 pt-10">
            <button
              type="button"
              onClick={handleOpenHistory}
              className="mb-4 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-200"
            >
              {tc("backToHistory")}
            </button>
            {selectedHistoryEntry?.foodName && (
              <h2 className="mb-4 text-xl font-bold text-neutral-100">
                {selectedHistoryEntry.foodName}
              </h2>
            )}
          </div>
          <AnalysisView result={analysisResult} onScanAnother={handleReset} saved />
        </motion.main>
      );
    }

    // Results view
    if (state === "results" && analysisResult) {
      return (
        <motion.main
          key="results"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-dvh"
        >
          <AnalysisView
            result={analysisResult}
            onScanAnother={handleReset}
            onSaveToHistory={handleSaveToHistory}
            onPersonalize={handlePersonalize}
            saved={savedToHistory}
          />
        </motion.main>
      );
    }

    // History view
    if (state === "history") {
      return (
        <motion.main
          key="history"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex min-h-dvh flex-col px-4 pt-12 pb-8"
        >
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={handleReset}
              className="mb-6 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-200"
            >
              {tc("back")}
            </button>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-100">
                {th("title")}
              </h2>
              {historyEntries.length >= 2 && (
                <button
                  type="button"
                  onClick={toggleCompareMode}
                  className={`text-sm font-semibold transition-colors ${
                    compareMode ? "text-red-400" : "text-neutral-500 hover:text-neutral-200"
                  }`}
                  data-testid="compare-toggle"
                >
                  {compareMode ? th("cancel") : th("compare")}
                </button>
              )}
            </div>
            <HistoryList
              entries={historyEntries}
              onSelect={handleHistorySelect}
              onDelete={handleHistoryDelete}
              onClear={handleHistoryClear}
              compareMode={compareMode}
              onCompare={handleCompare}
            />
          </div>
        </motion.main>
      );
    }

    // Profile step
    if (state === "profile") {
      return (
        <motion.main
          key="profile"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex min-h-dvh flex-col px-4 pt-12 pb-8"
        >
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={handleReset}
              className="mb-6 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-200"
            >
              {tc("back")}
            </button>
            <PetProfileForm
              onSave={handleProfileSave}
              onSkip={handleProfileSkip}
              initialProfile={petProfile ?? undefined}
            />
          </div>
        </motion.main>
      );
    }

    // Ceremony animation (after analysis completes)
    if (state === "ceremony" && analysisResult) {
      return (
        <motion.div
          key="ceremony"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ScanCeremony result={analysisResult} onComplete={handleCeremonyComplete} />
        </motion.div>
      );
    }

    // Analyzing spinner (brief, while OCR + analysis runs)
    if (state === "analyzing") {
      return (
        <motion.main
          key="analyzing"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex min-h-dvh flex-col items-center justify-center px-4"
        >
          <div className="text-center">
            <div
              className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-neutral-800 border-t-red-500"
              role="status"
              aria-label={ta("analyzingAriaLabel")}
            />
            <p className="mt-6 text-xl font-bold text-neutral-100">
              {ta("analyzing")}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {ta("analyzingSubtext")}
            </p>
          </div>
        </motion.main>
      );
    }

    // Error state
    if (state === "error") {
      return (
        <motion.main
          key="error"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex min-h-dvh flex-col items-center justify-center px-4"
        >
          <div className="w-full max-w-md text-center">
            <AlertTriangle size={48} className="mx-auto text-amber-400" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-bold text-neutral-100">
              {ta("scanFailed")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={handleStartScan}
              className="mt-8 rounded-full bg-red-500 px-10 py-3.5 font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 active:scale-[0.98]"
            >
              {ta("tryAgain")}
            </button>
          </div>
        </motion.main>
      );
    }

    // Scanning mode
    if (state === "scanning") {
      return (
        <motion.main
          key="scanning"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex min-h-dvh flex-col px-4 pt-12 pb-8"
        >
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={handleReset}
              className="mb-6 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-200"
            >
              {tc("back")}
            </button>
            <h2 className="mb-6 text-xl font-bold text-neutral-100">
              {ts("title")}
            </h2>
            <Scanner onImageConfirmed={handleImageConfirmed} />
          </div>
        </motion.main>
      );
    }

    // Landing / idle state
    return (
      <motion.main
        key="landing"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-dvh"
      >
        <LandingPage onStartScan={handleStartScan} onViewHistory={handleOpenHistory} />
      </motion.main>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {renderContent()}
    </AnimatePresence>
  );
}
