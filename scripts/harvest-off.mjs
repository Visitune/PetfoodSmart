/**
 * Moissonne des références pet-food réelles depuis Open Pet Food Facts (API search).
 * Filtre qualité strict : EAN valide, marque + nom présents, ingrédients FR non vides.
 * Sortie : data/off-candidates.json
 *
 * Usage : node scripts/harvest-off.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const QUERIES = [
  { terms: "croquettes chien", petType: "dog" },
  { terms: "croquettes chat", petType: "cat" },
  { terms: "croquettes chat sterilise", petType: "cat" },
  { terms: "patee chien", petType: "dog" },
  { terms: "patee chat", petType: "cat" },
  { terms: "friandises chien", petType: "dog" },
];

const FIELDS = "code,product_name,brands,ingredients_text_fr,image_url,quantity";
const MIN_INGREDIENTS_LEN = 80;
const MAX_PER_BRAND = 4;
const TARGET_TOTAL = 40; // on récolte 40, on retiendra 20-30 après tri

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query) {
  const url =
    "https://world.openpetfoodfacts.org/cgi/search.pl?action=process" +
    `&search_terms=${encodeURIComponent(query)}&json=1&page_size=50&fields=${FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": "PetFoodSmart/0.1.0 (sample-harvest)" } });
  if (!res.ok) throw new Error(`OFF search ${res.status} pour "${query}"`);
  const json = await res.json();
  return json.products ?? [];
}

function brandKey(brands) {
  return (brands || "").split(",")[0].trim().toLowerCase();
}

const byCode = new Map();
const perBrand = new Map();

for (const { terms, petType } of QUERIES) {
  console.log(`Recherche : "${terms}" ...`);
  let products = [];
  try {
    products = await search(terms);
  } catch (e) {
    console.error(`  ! ${e.message}`);
    continue;
  }
  console.log(`  ${products.length} résultats bruts`);
  for (const p of products) {
    const code = (p.code || "").trim();
    const brand = (p.brands || "").split(",")[0].trim();
    const name = (p.product_name || "").trim();
    const ing = (p.ingredients_text_fr || "").trim();
    if (!/^\d{8}$|^\d{13}$/.test(code)) continue;
    if (!brand || !name) continue;
    if (ing.length < MIN_INGREDIENTS_LEN) continue;
    if (byCode.has(code)) {
      // enrichit le petType si découvert via 2 requêtes
      const prev = byCode.get(code);
      if (prev.petType !== petType) prev.petType = null;
      continue;
    }
    const bk = brandKey(p.brands);
    const n = perBrand.get(bk) ?? 0;
    if (n >= MAX_PER_BRAND) continue;
    perBrand.set(bk, n + 1);
    byCode.set(code, {
      code,
      brand,
      product_name: name,
      petType,
      ingredients_len: ing.length,
      quantity: (p.quantity || "").trim() || null,
      image_url: p.image_url || null,
      off_url: `https://world.openpetfoodfacts.org/product/${code}`,
    });
    if (byCode.size >= TARGET_TOTAL) break;
  }
  await sleep(1200); // politesse API
  if (byCode.size >= TARGET_TOTAL) break;
}

const candidates = [...byCode.values()];
mkdirSync("data", { recursive: true });
writeFileSync("data/off-candidates.json", JSON.stringify({
  harvested_at: new Date().toISOString().slice(0, 10),
  source: "Open Pet Food Facts (search API, ODbL)",
  min_ingredients_len: MIN_INGREDIENTS_LEN,
  count: candidates.length,
  candidates,
}, null, 2) + "\n");

console.log(`\n${candidates.length} candidats retenus -> data/off-candidates.json`);
for (const c of candidates) {
  console.log(`- ${c.code} | ${c.brand} — ${c.product_name} [${c.petType ?? "?"}] (${c.ingredients_len} car.)`);
}
