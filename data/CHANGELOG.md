# Changelog des données

Toute modification d'un fichier `data/*.json` est entrée ici : jamais d'édition silencieuse.
`effective_from` (date d'application juridique) ≠ date d'ingestion (date de cette entrée).

## 2026-09-13 — products.json v1.1.0
- Ajout `nutriments_100g` (protéines, matières grasses, cellulose, cendres, humidité,
  énergie, Ca/P/Na) depuis OFF — entrée du futur contrôle d'adéquation FEDIAF.
- Couverture réelle : 7/25 fiches avec protéines. Le contrôle conclura `a_verifier`
  quand la donnée manque (crowdsourcing OFF lacunaire) — jamais de conclusion sans donnée.

## 2026-09-13 — module FEDIAF (code, pas de donnée)

## 2026-09-13 — ingredients.json v1.1.0
- Ajout des champs UE (`eu_status`, `eu_ref`, `eu_note`, `eu_review`) sur 7 additifs à enjeu :
  BHA → `restreint`, BHT → `restreint`, Éthoxyquine → `non_autorise_ue`,
  TBHQ / Red 40 / Yellow 5 / Caramel → `a_evaluer`.
- Tous posés en `eu_review: a_valider` — relecture experte requise avant tout affichage « vérifié ».
- Référence socle : Règl. (CE) n° 1831/2003 (Registre UE des additifs).
- Migration : `scripts/patch-eu-status.mjs` (chirurgicale, format préservé).

## 2026-09-13 — products.json v1.0.0 (création)
- Échantillon pilote : 25 références FR réelles (Open Pet Food Facts, ODbL),
  12 chiens / 13 chats. Brut conservé dans `data/raw/`, statut `a_valider`.
- Ingestion : `scripts/harvest-off.mjs` + `scripts/ingest-off.mjs`.

## 2026-09-13 — contributions.json v1.0.0 (création)
- File de modération vide (schéma `src/lib/products/types.ts`).
