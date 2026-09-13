/**
 * Point 1 — Lignes directrices nutritionnelles FEDIAF : cadre de référence.
 *
 * Politique référentielle (décision produit) :
 * - Produits UE (data_source fabricant_officiel / off_import) → FEDIAF en primaire.
 * - AAFCO conservé en repli pour les données US/import (pas de rupture du socle existant).
 *
 * Contenu intégré avec confiance : le SET des nutriments suivis + les stades de vie
 * + la base d'expression (pour 1000 kcal EM — à confirmer par l'expert).
 *
 * Renvoyé à l'expert (valeurs chiffrées, JAMAIS devinées) : minima et niveaux
 * recommandés par nutriment × stade × espèce, édition 2024 des Guidelines.
 * Tant qu'une valeur est null, le contrôle d'adéquation refuse de conclure
 * (même garde-fou que les tolérances 767/2009).
 */

export type LifeStage = "adulte_entretien" | "croissance" | "reproduction";
export type PetSpecies = "dog" | "cat";

/** Base d'expression des tableaux FEDIAF — confirmée par l'expert */
export const FEDIAF_BASIS = "pour 1000 kcal EM (à confirmer — édition 2024)";
export const FEDIAF_EDITION = "2024 (à confirmer)";
export const FEDIAF_GRID_VERSION = "fediaf-v1.0.0";

/** Référence chiffrée par nutriment × stade — valeurs à renseigner par l'expert */
export interface NutrientReference {
  nutrient: string;
  unit: string;
  species: PetSpecies | "both";
  stage: LifeStage;
  /** Minimum FEDIAF — null = non renseigné = contrôle impossible */
  minimum: number | null;
  /** Niveau recommandé FEDIAF — null = non renseigné */
  recommended: number | null;
  expert_review: "valide" | "a_valider";
}

/** Set des nutriments suivis par les Guidelines (liste, pas de valeurs) */
const NUTRIENTS: { nutrient: string; unit: string; species: PetSpecies | "both" }[] = [
  { nutrient: "Protéines brutes", unit: "g", species: "both" },
  { nutrient: "Arginine", unit: "g", species: "both" },
  { nutrient: "Histidine", unit: "g", species: "both" },
  { nutrient: "Isoleucine", unit: "g", species: "both" },
  { nutrient: "Leucine", unit: "g", species: "both" },
  { nutrient: "Lysine", unit: "g", species: "both" },
  { nutrient: "Méthionine", unit: "g", species: "both" },
  { nutrient: "Méthionine + cystine", unit: "g", species: "both" },
  { nutrient: "Phénylalanine", unit: "g", species: "both" },
  { nutrient: "Phénylalanine + tyrosine", unit: "g", species: "both" },
  { nutrient: "Thréonine", unit: "g", species: "both" },
  { nutrient: "Tryptophane", unit: "g", species: "both" },
  { nutrient: "Valine", unit: "g", species: "both" },
  { nutrient: "Taurine", unit: "g", species: "cat" },
  { nutrient: "Matières grasses brutes", unit: "g", species: "both" },
  { nutrient: "Acide linoléique", unit: "g", species: "both" },
  { nutrient: "Acide alpha-linolénique", unit: "g", species: "both" },
  { nutrient: "EPA + DHA", unit: "g", species: "both" },
  { nutrient: "Acide arachidonique", unit: "g", species: "cat" },
  { nutrient: "Calcium", unit: "g", species: "both" },
  { nutrient: "Phosphore", unit: "g", species: "both" },
  { nutrient: "Rapport Ca/P", unit: "ratio", species: "both" },
  { nutrient: "Potassium", unit: "g", species: "both" },
  { nutrient: "Sodium", unit: "g", species: "both" },
  { nutrient: "Chlorure", unit: "g", species: "both" },
  { nutrient: "Magnésium", unit: "g", species: "both" },
  { nutrient: "Fer", unit: "mg", species: "both" },
  { nutrient: "Cuivre", unit: "mg", species: "both" },
  { nutrient: "Zinc", unit: "mg", species: "both" },
  { nutrient: "Manganèse", unit: "mg", species: "both" },
  { nutrient: "Iode", unit: "mg", species: "both" },
  { nutrient: "Sélénium", unit: "mg", species: "both" },
  { nutrient: "Vitamine A", unit: "UI", species: "both" },
  { nutrient: "Vitamine D3", unit: "UI", species: "both" },
  { nutrient: "Vitamine E", unit: "mg", species: "both" },
  { nutrient: "Thiamine (B1)", unit: "mg", species: "both" },
  { nutrient: "Riboflavine (B2)", unit: "mg", species: "both" },
  { nutrient: "Acide pantothénique (B5)", unit: "mg", species: "both" },
  { nutrient: "Niacine (B3)", unit: "mg", species: "both" },
  { nutrient: "Pyridoxine (B6)", unit: "mg", species: "both" },
  { nutrient: "Acide folique (B9)", unit: "mg", species: "both" },
  { nutrient: "Cobalamine (B12)", unit: "µg", species: "both" },
  { nutrient: "Choline", unit: "mg", species: "both" },
  { nutrient: "Biotine", unit: "µg", species: "both" },
  { nutrient: "Vitamine K", unit: "mg", species: "both" },
];

const STAGES: LifeStage[] = ["adulte_entretien", "croissance", "reproduction"];

/** Grille complète : chaque nutriment × stade × espèce, valeurs à renseigner */
export function getFediafReferenceGrid(): NutrientReference[] {
  const grid: NutrientReference[] = [];
  for (const n of NUTRIENTS) {
    const speciesList: PetSpecies[] = n.species === "both" ? ["dog", "cat"] : [n.species];
    for (const species of speciesList) {
      for (const stage of STAGES) {
        grid.push({ ...n, species, stage, minimum: null, recommended: null, expert_review: "a_valider" });
      }
    }
  }
  return grid;
}

/** Référentiel primaire selon la source de la donnée (politique produit) */
export function primaryReferenceFor(dataSource: string): "FEDIAF" | "AAFCO" {
  return dataSource === "fabricant_officiel" || dataSource === "off_import" ? "FEDIAF" : "AAFCO";
}
