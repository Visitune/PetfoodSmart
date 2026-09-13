/**
 * F030 - Types base produits réelles + contributions communautaires
 *
 * Traçabilité (réflexe auditeur) : chaque fiche porte sa source,
 * son niveau de vérification, son historique de versions.
 */

/** Canal d'acquisition de la donnée — jamais null, jamais ambigu */
export type DataSource =
  | "fabricant_officiel" // scrape/fiche fournie par la marque (vérité terrain)
  | "off_import" // import Open Pet Food Facts (ODbL, attribution requise)
  | "photo_utilisateur" // photo d'étiquette + OCR (Tesseract), à valider
  | "contribution_communautaire"; // saisie manuelle contributrice, modération requise

/** Niveau de vérification d'une fiche produit */
export type VerificationStatus =
  | "verifie_manuel" // relu par un humain (interne ou modérateur)
  | "a_valider" // ingéré automatiquement, en attente de relecture
  | "rejete"; // écarté (doublon, données incohérentes)

/** Fiche produit réelle */
export interface ProductRecord {
  /** GTIN-13 (ou GTIN-8), chiffres uniquement */
  ean: string;
  /** Marque (1ère déclarée) */
  brand: string;
  /** Nom produit */
  product: string;
  /** Espèce cible — null si ambigu (à lever manuellement) */
  petType: "dog" | "cat" | null;
  /** Ingrédients nettoyés (liste) */
  ingredients_fr: string[];
  /** Texte brut source (référence d'audit — jamais modifié) */
  ingredients_raw: string;
  /** Nombre de fragments écartés au nettoyage (indicateur qualité) */
  dropped_fragments: number;
  /** Traçabilité — le champ auditeur */
  data_source: DataSource;
  verification: VerificationStatus;
  /** Confiance affichable : officiel / vérifié / à valider */
  confidence: "officiel" | "verifie" | "a_valider";
  quantity: string | null;
  image_url: string | null;
  /** URL fiche OFF source (attribution ODbL) */
  off_url: string;
  lastUpdated: string; // YYYY-MM-DD
  version: number;
}

/** Fichier data/products.json */
export interface ProductDatabase {
  version: string;
  last_updated: string;
  scope: string;
  count: number;
  products: ProductRecord[];
}

/** Statut de modération d'une contribution */
export type ContributionStatus =
  | "pending"
  | "approved"
  | "rejected";

/** Contribution communautaire (file de modération) */
export interface Contribution {
  id: string; // ex. "contrib-2026-0001"
  /** EAN concerné (nouveau produit ou correction d'existant) */
  ean: string;
  kind: "nouveau_produit" | "correction" | "photo_etiquette";
  /** Données proposées (ingrédients ressaisis ou texte OCR) */
  proposed_ingredients_raw: string;
  photo_refs: string[];
  submitted_by: string; // hash/pseudo — jamais d'email en clair
  submitted_at: string; // ISO date
  status: ContributionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  /** Fiche produit résultante (si approuvée) */
  resulting_version: number | null;
}

/** Fichier data/contributions.json */
export interface ContributionQueue {
  version: string;
  contributions: Contribution[];
}
