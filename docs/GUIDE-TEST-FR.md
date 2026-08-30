# Guide de test rapide — PetFoodSmart (version localisée FR/ES/NL)

## 1. Lancer l'application

```bash
npm run dev
```

Puis ouvrez http://localhost:2999/

## 2. Changer de langue

En haut à droite de l'écran, un menu déroulant permet de choisir la langue :
**EN / 中文 / FR / ES / NL**. Le choix est mémorisé (localStorage) et
détecté automatiquement selon la langue du navigateur au premier chargement.

➡️ Ce qui est traduit à ce stade : toute l'interface (boutons, textes,
méthodologie, mentions légales, etc.).

➡️ Ce qui n'est **encore traduit que partiellement** : le contenu de la base
de données. Une dizaine de déclarations génériques de type UE (viandes et
sous-produits animaux, céréales, substances minérales...) ont des alias et
explications en français, mais la grande majorité des 512 ingrédients (noms
spécifiques comme "chicken", "salmon") restent en anglais uniquement. La
base de marques a été remplacée par 12 marques fictives de démonstration
(voir `data/brands.json`).
C'est la limite actuelle du travail réalisé jusqu'ici (traduction de
l'interface uniquement, pas encore du contenu métier).

## 3. Tester le scan d'une étiquette

Deux façons d'utiliser le scanner (bouton "Scanner votre étiquette") :

- **Caméra** : prend une photo en direct.
- **Import de photo** : glissez-déposez ou sélectionnez une image
  d'étiquette d'ingrédients (recommandé pour un test reproductible :
  prenez une photo bien cadrée, nette, avec un bon éclairage, du bloc
  "Composition" / "Ingrédients" de l'emballage).

L'app fait ensuite, dans l'ordre :
1. OCR (lecture du texte de l'image)
2. Découpage de la liste en ingrédients individuels
3. Recherche de chaque ingrédient dans la base de connaissances (512
   entrées) par correspondance exacte, alias, ou floue
4. Attribution d'un score /100 et d'une note A à F
5. (optionnel) Génération d'une explication en langage naturel par Claude —
   nécessite une clé API dans `.env.local` (voir `.env.example`)

## 4. Ce qu'il faut surveiller pendant le test

- Les ingrédients français ("volaille", "graisse de volaille", "levures",
  "extrait de yucca schidigera"...) ne matcheront **probablement pas**
  la base actuelle (elle ne contient que des alias anglais/chinois) →
  ils apparaîtront comme "Inconnu". C'est attendu, pas un bug : c'est le
  chantier de localisation du contenu qui reste à faire.
- Les cartes de marques (accueil, recherche, classement) ne doivent
  **plus** afficher de texte chinois quel que soit la langue choisie
  (bug corrigé — avant, le nom chinois de la marque s'affichait
  systématiquement, même en anglais/français).
- Le sélecteur de langue doit proposer les 5 langues et changer tout le
  texte de l'interface instantanément.

## 5. Pour un test end-to-end vraiment représentatif du marché EU

Le plus utile est de tester avec le **texte exact** de la liste
d'ingrédients d'un vrai produit vendu en France/Belgique/Espagne
(section "Composition" ou "Ingrédients" au dos de l'emballage, en petit
texte — pas le texte marketing du recto). Cela permet de voir
concrètement combien d'ingrédients sont reconnus vs "Inconnu", et donc
l'ampleur réelle du travail de localisation du contenu.
