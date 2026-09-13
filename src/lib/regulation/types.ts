/**
 * Point 1 (ancrage UE) — types du contrôle de conformité d'étiquetage.
 *
 * Principe : chaque point de contrôle cite le texte. Trois statuts seulement :
 * - "conforme" : vérifiable et vérifié sur la donnée disponible
 * - "a_verifier" : donnée manquante pour trancher (cas le plus fréquent en crowdsourcing)
 * - "non_conforme" : écart constaté sur pièce (réservé aux fiches fabricant_officiel)
 * On ne déclare jamais "non_conforme" sur une donnée non vérifiée (règle anti-diffamation).
 */

export type CheckStatus = "conforme" | "a_verifier" | "non_conforme" | "sans_objet";

export type CheckCategory =
  | "mentions_obligatoires"
  | "allegations"
  | "tolerances_analytiques";

/** Un point de contrôle réglementaire */
export interface LabelCheckItem {
  /** Identifiant stable, ex. "767-2009-art15-liste-matieres" */
  id: string;
  category: CheckCategory;
  /** Libellé court (FR, langue de travail — i18n UI à suivre) */
  label: string;
  /** Référence exacte du texte, ex. "Règl. (CE) n° 767/2009, art. 15 §1 c)" */
  ref: string;
  status: CheckStatus;
  /** Justification : valeur constatée ou donnée manquante */
  detail: string;
}

/** Résultat du contrôle pour un produit */
export interface LabelCheckResult {
  ean: string;
  regulation: "CE-767-2009";
  checked_at: string; // YYYY-MM-DD
  /** Version de la grille appliquée — tout changement de grille = nouvelle version */
  grid_version: string;
  items: LabelCheckItem[];
  summary: {
    conforme: number;
    a_verifier: number;
    non_conforme: number;
    sans_objet: number;
  };
}

/** Tolérance analytique (Annexe IV) : écart admis entre valeur déclarée et analysée */
export interface AnalyticalTolerance {
  /** Constituant, ex. "protéines brutes" */
  constituent: string;
  /** Condition sur la valeur déclarée, ex. ">= 20 %" (vide = toute valeur) */
  declared_range: string;
  /** Écart admis, ex. "± 2 unités" — RENSEIGNÉ PAR L'EXPERT, jamais deviné */
  permitted_deviation: string | null;
  ref: string;
  expert_review: "valide" | "a_valider";
}
