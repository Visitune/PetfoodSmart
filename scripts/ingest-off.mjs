/**
 * Ingère l'échantillon pilote OFF : fiches complètes -> data/raw/ + data/products.json
 * Nettoyage léger, brut toujours conservé (traçabilité auditeur).
 * Statut systématique : off_import / a_valider (jamais de brut au scoring).
 *
 * Usage : node scripts/ingest-off.mjs
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";

const FIELDS = "code,product_name,brands,ingredients_text_fr,image_url,quantity,lang,nutriments";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);

/** Fragments non-ingrédients typiques des étiquettes FR (mentions légales, conseils) */
const NOISE_RE = /conserver|endroit frais|animal doit|acc[eè]s en permanence|r[eé]cipient propre|utiliser de pr[eé]f[eé]rence|voir (le |la |l'|au |sur )?(paquet|emballage|sachet|bo[iî]te)|www\.|http|fabriqu[eé] pour|[ée]labor[eé] pour|distribu[eé] par|import[eé] par|n° vert|service consommateur|mode d'emploi|ration quotidienne|poids de l'animal|ajouter de l'eau|eau (fra[iî]che|propre) à disposition|conservez|refermer apr[eè]s|à utiliser|date de durabilit[eé]|lot\s*:|poids net/i;

function cleanIngredients(raw) {
  const parts = raw.split(/[,;，、；]+/);
  const kept = [];
  let dropped = 0;
  for (let p of parts) {
    p = p.replace(/\s+/g, " ").trim();
    if (p.length < 3 || /^\d+$/.test(p)) { dropped++; continue; }
    if (NOISE_RE.test(p)) { dropped++; continue; }
    kept.push(p);
  }
  return { kept, dropped };
}

async function fetchProduct(code) {
  const url = `https://world.openpetfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": "PetFoodSmart/0.1.0 (sample-ingest)" } });
  if (!res.ok) throw new Error(`OFF ${res.status} pour ${code}`);
  const json = await res.json();
  if (json.status !== 1 || !json.product) throw new Error(`Produit ${code} introuvable (status ${json.status})`);
  return json.product;
}

const shortlist = JSON.parse(readFileSync("data/off-shortlist.json", "utf8")).shortlist;
mkdirSync("data/raw", { recursive: true });

const products = [];
for (const { code, petType } of shortlist) {
  try {
    const p = await fetchProduct(code);
    writeFileSync(`data/raw/off-${code}.json`, JSON.stringify({ fetched_at: TODAY, product: p }, null, 2));
    const raw = (p.ingredients_text_fr || "").trim();
    const { kept, dropped } = cleanIngredients(raw);
    const brand = (p.brands || "").split(",")[0].trim();
    // Constituants analytiques /100g (base du futur contrôle d'adéquation FEDIAF)
    const NUT_KEYS = ["proteins_100g", "fat_100g", "fiber_100g", "ash_100g", "moisture_100g", "energy-kcal_100g", "calcium_100g", "phosphorus_100g", "sodium_100g"];
    const nutriments_100g = {};
    for (const k of NUT_KEYS) {
      const v = p.nutriments ? p.nutriments[k] : undefined;
      nutriments_100g[k] = typeof v === "number" ? v : null;
    }
    products.push({
      ean: code,
      brand,
      product: (p.product_name || "").trim(),
      petType,
      ingredients_fr: kept,
      ingredients_raw: raw,
      dropped_fragments: dropped,
      nutriments_100g,
      data_source: "off_import",
      verification: "a_valider",
      confidence: "a_valider",
      quantity: (p.quantity || "").trim() || null,
      image_url: p.image_url || null,
      off_url: `https://world.openpetfoodfacts.org/product/${code}`,
      lastUpdated: TODAY,
      version: 1,
    });
    console.log(`OK  ${code} | ${brand} — kept:${kept.length} dropped:${dropped}`);
  } catch (e) {
    console.error(`FAIL ${code}: ${e.message}`);
  }
  await sleep(1000);
}

writeFileSync("data/products.json", JSON.stringify({
  version: "1.1.0",
  last_updated: TODAY,
  scope: "Échantillon pilote FR — références réelles OFF (ODbL), statut a_valider, relecture manuelle requise",
  count: products.length,
  products,
}, null, 2) + "\n");

if (!existsSync("data/contributions.json")) {
  writeFileSync("data/contributions.json", JSON.stringify({ version: "1.0.0", contributions: [] }, null, 2) + "\n");
}

console.log(`\n${products.length}/${shortlist.length} produits -> data/products.json`);
