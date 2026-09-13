import {
  ANALYTICAL_TOLERANCES,
  CLAIM_RULES,
  GRID_VERSION,
  MANDATORY_PARTICULARS,
  getLabelCheckGrid,
} from "../ce767-2009";

describe("Règlement (CE) n° 767/2009 — grille de contrôle", () => {
  it("expose une grille versionnée (mentions + allégations, toutes référencées)", () => {
    expect(GRID_VERSION).toMatch(/^767-2009-v\d+\.\d+\.\d+$/);
    const grid = getLabelCheckGrid();
    expect(grid.length).toBe(MANDATORY_PARTICULARS.length + CLAIM_RULES.length);
    expect(MANDATORY_PARTICULARS.length).toBeGreaterThanOrEqual(10);
    for (const item of grid) {
      expect(item.id).toMatch(/^767-/);
      expect(item.ref).toContain("767/2009");
    }
  });

  it("couvre les mentions critiques pet-food (type, lot, liste pondérale, additifs)", () => {
    const ids = MANDATORY_PARTICULARS.map((i) => i.id);
    for (const expected of ["767-type-aliment", "767-lot", "767-liste-matieres", "767-additifs", "767-constituants", "767-mode-emploi"]) {
      expect(ids).toContain(expected);
    }
  });

  it("interdit les allégations thérapeutiques (art. 13 §3)", () => {
    expect(CLAIM_RULES.map((i) => i.id)).toContain("767-alleg-medicinal");
  });

  it("ne devine AUCUNE tolérance chiffrée : toutes en attente experte", () => {
    expect(ANALYTICAL_TOLERANCES.length).toBeGreaterThan(0);
    for (const t of ANALYTICAL_TOLERANCES) {
      expect(t.permitted_deviation).toBeNull();
      expect(t.expert_review).toBe("a_valider");
    }
  });
});
