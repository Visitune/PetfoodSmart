/**
 * Point 1 — Règlement (CE) n° 767/2009 : grille de contrôle d'étiquetage pet-food.
 *
 * Contenu intégré avec confiance (structure du règlement) :
 * - Mentions obligatoires d'étiquetage (art. 15-17) : ce qui DOIT figurer.
 * - Allégations (art. 13) : principes — objectifs, vérifiables, étayées, non trompeuses.
 *
 * Renvoyé à l'expert (valeurs exactes à compléter, JAMAIS devinées) :
 * - Barème chiffré des tolérances analytiques (Annexe IV) : ANALYTICAL_TOLERANCES
 *   porte la structure + les constituants, avec permitted_deviation: null + a_valider.
 * - Libellés d'allégations autorisés mot à mot et conditions d'emploi.
 *
 * Grille versionnée (GRID_VERSION) : toute modification = nouvelle version,
 * tracée comme le reste (cf. data/CHANGELOG.md pour la donnée).
 */

import type { AnalyticalTolerance, LabelCheckItem } from "./types";

export const GRID_VERSION = "767-2009-v1.0.0";
const REG = "Règl. (CE) n° 767/2009";

/** Mentions obligatoires — aliment complet/complémentaire pour animaux familiers */
export const MANDATORY_PARTICULARS: Omit<LabelCheckItem, "status" | "detail">[] = [
  { id: "767-type-aliment", category: "mentions_obligatoires", label: "Type d'aliment déclaré (complet / complémentaire)", ref: `${REG}, art. 15 §1 a)` },
  { id: "767-espece-cible", category: "mentions_obligatoires", label: "Espèce animale de destination", ref: `${REG}, art. 15 §1 a)` },
  { id: "767-operateur", category: "mentions_obligatoires", label: "Nom et adresse de l'exploitant du secteur de l'alimentation animale", ref: `${REG}, art. 15 §1 b)` },
  { id: "767-agrement", category: "mentions_obligatoires", label: "Numéro d'agrément / d'enregistrement de l'établissement", ref: `${REG}, art. 15 §1 c)` },
  { id: "767-lot", category: "mentions_obligatoires", label: "Référence du lot", ref: `${REG}, art. 15 §1 d)` },
  { id: "767-quantite", category: "mentions_obligatoires", label: "Quantité nette", ref: `${REG}, art. 15 §1 e)` },
  { id: "767-liste-matieres", category: "mentions_obligatoires", label: "Liste des matières premières, par ordre pondéral décroissant", ref: `${REG}, art. 15 §1 f) + art. 17` },
  { id: "767-additifs", category: "mentions_obligatoires", label: "Additifs : nom / teneur selon catégorie (étiquetage spécifique)", ref: `${REG}, art. 15 §1 g) + Annexe VI` },
  { id: "767-constituants", category: "mentions_obligatoires", label: "Constituants analytiques (protéines, matières grasses, cellulose, cendres, humidité si ≥ seuils)", ref: `${REG}, art. 15 §1 + Annexe V` },
  { id: "767-mode-emploi", category: "mentions_obligatoires", label: "Mode d'emploi / ration journalière indicative", ref: `${REG}, art. 15 §1 + Annexe VII (pet-food)` },
  { id: "767-durabilite", category: "mentions_obligatoires", label: "Date de durabilité minimale", ref: `${REG}, art. 15 §1` },
  { id: "767-langue", category: "mentions_obligatoires", label: "Mentions dans la langue du marché de mise en vente", ref: `${REG}, art. 14` },
];

/** Allégations — principes de l'art. 13 (le mot à mot autorisé relève de l'expert) */
export const CLAIM_RULES: Omit<LabelCheckItem, "status" | "detail">[] = [
  { id: "767-alleg-objective", category: "allegations", label: "Allégation objective et vérifiable", ref: `${REG}, art. 13 §1 a)` },
  { id: "767-alleg-substantiated", category: "allegations", label: "Allégation étayée scientifiquement, dossier disponible", ref: `${REG}, art. 13 §1 b)` },
  { id: "767-alleg-non-misleading", category: "allegations", label: "Allégation non trompeuse (ni sur la composition, ni sur les effets)", ref: `${REG}, art. 13 §1 c)` },
  { id: "767-alleg-medicinal", category: "allegations", label: "Aucune allégation thérapeutique / de prévention des maladies", ref: `${REG}, art. 13 §3` },
];

/**
 * Tolérances analytiques (Annexe IV) — STRUCTURE SEULE.
 * Les écarts chiffrés admis sont renseignés par l'expert (permitted_deviation: null
 * + a_valider en attendant). Aucune valeur devinée : une fausse tolérance ferait
 * valider à tort une étiquette non conforme.
 */
export const ANALYTICAL_TOLERANCES: AnalyticalTolerance[] = [
  { constituent: "Protéines brutes", declared_range: "toute valeur déclarée", permitted_deviation: null, ref: `${REG}, Annexe IV`, expert_review: "a_valider" },
  { constituent: "Matières grasses brutes", declared_range: "toute valeur déclarée", permitted_deviation: null, ref: `${REG}, Annexe IV`, expert_review: "a_valider" },
  { constituent: "Cellulose brute", declared_range: "toute valeur déclarée", permitted_deviation: null, ref: `${REG}, Annexe IV`, expert_review: "a_valider" },
  { constituent: "Cendres brutes", declared_range: "toute valeur déclarée", permitted_deviation: null, ref: `${REG}, Annexe IV`, expert_review: "a_valider" },
  { constituent: "Humidité", declared_range: "toute valeur déclarée", permitted_deviation: null, ref: `${REG}, Annexe IV`, expert_review: "a_valider" },
  { constituent: "Calcium / Phosphore / Sodium / Magnésium", declared_range: "toute valeur déclarée", permitted_deviation: null, ref: `${REG}, Annexe IV`, expert_review: "a_valider" },
];

/** Grille complète (mentions + allégations), prête pour le moteur de contrôle */
export function getLabelCheckGrid(): Omit<LabelCheckItem, "status" | "detail">[] {
  return [...MANDATORY_PARTICULARS, ...CLAIM_RULES];
}
