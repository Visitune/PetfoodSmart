import {
  FEDIAF_BASIS,
  FEDIAF_GRID_VERSION,
  getFediafReferenceGrid,
  primaryReferenceFor,
} from "../fediaf";

describe("FEDIAF Nutritional Guidelines — cadre de référence", () => {
  it("expose une grille versionnée, base d'expression déclarée", () => {
    expect(FEDIAF_GRID_VERSION).toMatch(/^fediaf-v\d+\.\d+\.\d+$/);
    expect(FEDIAF_BASIS).toContain("1000 kcal");
  });

  it("couvre les nutriments clés (protéines, taurine chat, Ca/P, vitamines)", () => {
    const grid = getFediafReferenceGrid();
    const names = grid.map((r) => r.nutrient);
    for (const expected of ["Protéines brutes", "Taurine", "Calcium", "Phosphore", "Rapport Ca/P", "Vitamine A", "Vitamine D3"]) {
      expect(names).toContain(expected);
    }
    // Taurine : chats uniquement (pas de référence chien)
    expect(grid.filter((r) => r.nutrient === "Taurine").every((r) => r.species === "cat")).toBe(true);
  });

  it("ne devine AUCUNE valeur : tous les minima en attente experte", () => {
    for (const ref of getFediafReferenceGrid()) {
      expect(ref.minimum).toBeNull();
      expect(ref.recommended).toBeNull();
      expect(ref.expert_review).toBe("a_valider");
    }
  });

  it("FEDIAF en primaire pour les données UE, AAFCO en repli", () => {
    expect(primaryReferenceFor("fabricant_officiel")).toBe("FEDIAF");
    expect(primaryReferenceFor("off_import")).toBe("FEDIAF");
    expect(primaryReferenceFor("contribution_communautaire")).toBe("AAFCO");
    expect(primaryReferenceFor("photo_utilisateur")).toBe("AAFCO");
  });
});
