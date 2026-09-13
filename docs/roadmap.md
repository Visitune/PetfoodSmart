# PETFOODsmart — Feuille de route stratégique

**Vision :** instrument d'analyse pet-food auditable (qui / quand / sur quelle base),
à interface grand public. L'app est le démonstrateur et le capteur à leads de
l'activité de conseil ; les missions nourrissent la curation qui améliore l'app.

**Principe transversal :** tout fait affiché répond à qui / quand / sur quelle base.
Rien d'OCRisé ou d'importé n'atteint l'utilisateur sans statut `a_valider` minimum.
Le score n'est jamais vendu — ni aux marques, ni aux clients de consulting.

## Piliers produit

### 1. Ancrage réglementaire européen
Statuts UE par additif (autorisé / restreint / non autorisé + teneurs max + ref de texte :
767/2009, 1831/2003, 68/2013, 1069/2009, FEDIAF, EFSA). Migrer `ingredients.json`
de AAFCO-only vers socle UE. Badges UI. Réécrire `/methodology` (inverser
« Regulatory compliance: not evaluated »).

### 2. Rappels et alertes sanitaires
Ingestion RASFF + RappelConso (+ FDA/FSA en complément). `data/recalls.json`
(ean, lot, motif, source, date, statut en cours/clôturé). Bannière au scan,
« alerte active » + **historique** sur `/brand/[slug]`, alertes proactives sur
historique de scans (Vercel Cron). Granularité lot (anti-diffamation).

### 3. Base produits réelle
Pipeline OFF → nettoyage → alignement 68/2013 → `data/products.json` avec
`data_source` (fabricant_officiel / off_import / photo_utilisateur /
contribution_communautaire), `verification`, `confidence`, versioning.
Échantillon pilote : 25 EAN FR (12 chiens / 13 chats, `data/off-shortlist.json`).
Contributions communautaires avec modération (`data/contributions.json` :
pending / approved / rejected, proposer ≠ approuver).

### 4. OCR et capture (marchés FR/ES/NL)
traineddata fra/spa/nld déjà auto-hébergés — finir le câblage : étendre
`detectLanguage`, segmentation multi-blocs (étiquettes BE/CH FR/NL/DE),
écran de correction manuelle post-OCR (état `review` avant scoring),
corrections → file de contributions. Photo conservée comme preuve.

### 5. Transparence méthodologique
Détail du calcul par ingrédient (contributions en points + règle citée, pattern
PetScans en mieux). Sources précises par ingrédient (ref exacte, pas de bloc
générique). Explications double audience (grand public / pro, `/api/explain` +
paramètre audience). Méthodologie surfacée au point de doute (liens vers ancres).
Changelog méthodologique. Anti-hallucination : le prompt pro ne cite que les
refs fournies.

### 6. Fiabilité technique et gouvernance des données
Réparer le harnais (24/46 suites rouges — constat 2026-09-13). Dépinner le test
de version. Validation CI bloquante (zod) sur `data/*.json`. `data/CHANGELOG.md`,
zéro édition silencieuse. `eu_status_history` par ingrédient (statut, texte,
motif, `proposed_by`, `approved_by`, `effective_from` ≠ `decided_at`) +
propagation auto du re-scoring produits. Processus de révision des ratings
(déclencheurs, rôles, dossier de décision, voie d'urgence, publication).
Cache explainer persistant (sortie du Map en mémoire). Seuil de migration DB
défini à l'avance. Fraîcheur exposée sur `/methodology`. Check ODbL en CI.

### 7. Positionnement / modèle économique
Cœur gratuit + open source (diffusion, confiance, leads). Escalier : app →
données/outils B2B (veille, exports, fiches vérifiées, SLA fraîcheur) →
missions de consulting (revue 767/2009, veille portefeuille, appui audit,
formations e-learning). Capteur à leads in-app. Kit de pitch (démos tueuses).
Règle de conflit écrite avant le premier contrat. Ordre : consulting d'abord,
B2B données ensuite, premium B2C en dernier. Scan de base toujours gratuit.

## Couche pro (produit d'audit facturable)

- **Batch / API catalogue** : CSV d'EAN → file avec progression → tableau de bord
  gamme. Facturation au catalogue / à la référence. Rate-limit persistant.
- **Comparaison multi-pays** (FR / UE / UK post-Brexit / CH-OSAV) :
  `statuses: { eu, fr, uk, ch }` sourcés au texte national exact. Vue comparative
  + synthèse d'écarts. Chaque divergence = argument de mission.
- **Rapport PDF exportable** : fiche (identité, détail calcul, statuts par
  juridiction, rappels, sources + versions, empreinte, date, disclaimer).
  Gabarit print-CSS. 1 export gratuit (lead magnet), pro au-delà. Jamais de
  mention « conforme » — analyse fondée sur…, la certification reste la mission.

## Benchmark (à confirmer par teardown)
- US / AAFCO : Dog Food Advisor, CatFoodDB, PawDiet, PetScans, HealthyPaws
  (vrais catalogues US-only).
- Rappels US / marché propre : Petio, Puppii.
- Référence UX : Yuka. Donnée ouverte : Open Pet Food Facts (source + concurrent).
- Amont open source : ToxicPaw.
- Case vide : vrai catalogue + référentiel UE + rappels officiels UE + méthode publiée.

## Séquence d'exécution
1. Réparer le harnais de tests (prérequis à tout gating CI).
2. Ingestion 25 EAN (`scripts/ingest-off.mjs` + `data/products.json`).
3. Détail du calcul par ingrédient (analyseur → UI).
4. Alertes marques (« alerte active » + historique).
5. Câblage OCR (detectLanguage, multi-blocs, écran review).
6. Réécriture `/methodology` + firewall publié + capteur à leads.
7. Couche pro (batch → multi-pays → PDF).
