import { renderHook, act } from "@testing-library/react";
import { useAppState } from "../useAppState";

// Mock dependencies
jest.mock("@/lib/ocr", () => ({
  extractIngredients: jest.fn(),
}));

jest.mock("@/lib/analyzer", () => ({
  analyzeIngredients: jest.fn(),
}));

jest.mock("@/lib/profile", () => ({
  saveProfile: jest.fn(),
  loadProfile: jest.fn().mockReturnValue(null),
}));

jest.mock("@/lib/history", () => ({
  loadHistory: jest.fn().mockReturnValue([]),
  saveToHistory: jest.fn(),
  deleteFromHistory: jest.fn(),
  clearHistory: jest.fn(),
}));

import { extractIngredients } from "@/lib/ocr";
import { analyzeIngredients } from "@/lib/analyzer";
import { loadProfile } from "@/lib/profile";
import type { ExtractionResult, ParsedIngredient } from "@/lib/ocr/types";
import type { AnalysisResult } from "@/lib/analyzer/types";

const mockExtract = extractIngredients as jest.MockedFunction<typeof extractIngredients>;
const mockAnalyze = analyzeIngredients as jest.MockedFunction<typeof analyzeIngredients>;
const mockLoadProfile = loadProfile as jest.MockedFunction<typeof loadProfile>;

function makeParsedIngredients(): ParsedIngredient[] {
  return [
    { original: "Chicken", normalized: "chicken", position: 0 },
    { original: "Rice", normalized: "rice", position: 1 },
  ];
}

function makeAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    grade: "B",
    score: 82,
    ingredients: [],
    summary: {
      totalIngredients: 2,
      harmfulCount: 0,
      cautionCount: 0,
      safeCount: 2,
      unknownCount: 0,
      topIngredientIsProtein: true,
      concernPercentage: 0,
    },
    verdict: "Good food",
    insufficientData: false,
    ...overrides,
  };
}

describe("useAppState - Zero Friction Flow (F020)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadProfile.mockReturnValue(null);
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current.state).toBe("idle");
  });

  it("handleStartScan goes directly to scanning (not profile)", () => {
    const { result } = renderHook(() => useAppState());
    act(() => result.current.handleStartScan());
    expect(result.current.state).toBe("scanning");
  });

  it("handleImageConfirmed analyzes and goes to ceremony, then results", async () => {
    const parsed = makeParsedIngredients();
    const analysis = makeAnalysisResult();

    mockExtract.mockResolvedValue({
      success: true,
      ingredients: parsed,
      rawText: "Chicken, Rice",
      confidence: 90,
    } as ExtractionResult);
    mockAnalyze.mockReturnValue(analysis);

    const { result } = renderHook(() => useAppState());

    act(() => result.current.handleStartScan());
    expect(result.current.state).toBe("scanning");

    await act(async () => {
      await result.current.handleImageConfirmed("data:image/png;base64,abc");
    });

    // F033: analysis now goes to ceremony first
    expect(result.current.state).toBe("ceremony");
    expect(result.current.analysisResult).toBe(analysis);

    // Ceremony complete → results
    act(() => result.current.handleCeremonyComplete());
    expect(result.current.state).toBe("results");
  });

  it("handlePersonalize goes to profile from results", async () => {
    const parsed = makeParsedIngredients();
    const analysis = makeAnalysisResult();

    mockExtract.mockResolvedValue({
      success: true,
      ingredients: parsed,
      rawText: "Chicken, Rice",
      confidence: 90,
    } as ExtractionResult);
    mockAnalyze.mockReturnValue(analysis);

    const { result } = renderHook(() => useAppState());

    // Scan first
    act(() => result.current.handleStartScan());
    await act(async () => {
      await result.current.handleImageConfirmed("data:image/png;base64,abc");
    });
    // Complete ceremony → results
    act(() => result.current.handleCeremonyComplete());
    expect(result.current.state).toBe("results");

    // Personalize
    act(() => result.current.handlePersonalize());
    expect(result.current.state).toBe("profile");
  });

  it("handleProfileSave re-analyzes and returns to results when ingredients exist", async () => {
    const parsed = makeParsedIngredients();
    const analysis = makeAnalysisResult();
    const personalizedAnalysis = makeAnalysisResult({
      score: 75,
      profileWarnings: ["Warning: grain sensitivity"],
    });

    mockExtract.mockResolvedValue({
      success: true,
      ingredients: parsed,
      rawText: "Chicken, Rice",
      confidence: 90,
    } as ExtractionResult);
    mockAnalyze
      .mockReturnValueOnce(analysis) // first analysis (no profile)
      .mockReturnValueOnce(personalizedAnalysis); // re-analysis with profile

    const { result } = renderHook(() => useAppState());

    // Complete scan flow
    act(() => result.current.handleStartScan());
    await act(async () => {
      await result.current.handleImageConfirmed("data:image/png;base64,abc");
    });
    act(() => result.current.handleCeremonyComplete());

    // Go to profile
    act(() => result.current.handlePersonalize());
    expect(result.current.state).toBe("profile");

    // Save profile → should re-analyze and return to results
    act(() => {
      result.current.handleProfileSave({
        petType: "dog",
        breed: "Labrador",
        ageRange: "adult",
      });
    });

    expect(result.current.state).toBe("results");
    expect(mockAnalyze).toHaveBeenCalledTimes(2);
    expect(result.current.analysisResult).toBe(personalizedAnalysis);
  });

  it("handleProfileSkip returns to results when ingredients exist", async () => {
    const parsed = makeParsedIngredients();
    const analysis = makeAnalysisResult();

    mockExtract.mockResolvedValue({
      success: true,
      ingredients: parsed,
      rawText: "Chicken, Rice",
      confidence: 90,
    } as ExtractionResult);
    mockAnalyze.mockReturnValue(analysis);

    const { result } = renderHook(() => useAppState());

    // Complete scan flow
    act(() => result.current.handleStartScan());
    await act(async () => {
      await result.current.handleImageConfirmed("data:image/png;base64,abc");
    });
    act(() => result.current.handleCeremonyComplete());

    // Go to profile, then skip
    act(() => result.current.handlePersonalize());
    act(() => result.current.handleProfileSkip());

    expect(result.current.state).toBe("results");
  });

  it("full zero-friction flow: scan → result → personalize → profile → re-analyze → result", async () => {
    const parsed = makeParsedIngredients();
    const analysis = makeAnalysisResult({ score: 82 });
    const personalizedAnalysis = makeAnalysisResult({
      score: 70,
      profileWarnings: ["Grain sensitivity detected"],
    });

    mockExtract.mockResolvedValue({
      success: true,
      ingredients: parsed,
      rawText: "Chicken, Rice",
      confidence: 90,
    } as ExtractionResult);
    mockAnalyze
      .mockReturnValueOnce(analysis)
      .mockReturnValueOnce(personalizedAnalysis);

    const { result } = renderHook(() => useAppState());

    // 1. Start scan (goes directly to scanning)
    act(() => result.current.handleStartScan());
    expect(result.current.state).toBe("scanning");

    // 2. Confirm image → analyzing → ceremony → results
    await act(async () => {
      await result.current.handleImageConfirmed("data:image/png;base64,abc");
    });
    expect(result.current.state).toBe("ceremony");
    act(() => result.current.handleCeremonyComplete());
    expect(result.current.state).toBe("results");
    expect(result.current.analysisResult?.score).toBe(82);

    // 3. Personalize → profile
    act(() => result.current.handlePersonalize());
    expect(result.current.state).toBe("profile");

    // 4. Save profile → re-analyze → results with warnings
    act(() => {
      result.current.handleProfileSave({
        petType: "dog",
        breed: "German Shepherd",
        ageRange: "senior",
      });
    });
    expect(result.current.state).toBe("results");
    expect(result.current.analysisResult?.score).toBe(70);
    expect(result.current.analysisResult?.profileWarnings).toEqual([
      "Grain sensitivity detected",
    ]);
  });
});
