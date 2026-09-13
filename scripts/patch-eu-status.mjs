/**
 * Migration one-shot (v2, chirurgicale) : insère les champs UE après "sources"
 * de chacune des 7 entrées, sans re-sérialiser le fichier (format + CRLF préservés).
 * Tous les statuts sont posés en "a_valider" : relecture experte requise.
 * Exécuté le 2026-09-13 (ingredients.json v1.1.0). Conservé pour traçabilité.
 */
import { readFileSync, writeFileSync } from "node:fs";

const TODAY = "2026-09-13";
const NL = "\r\n";

const EU_PATCH = {
  "BHA": ["restreint", "Règl. (CE) n° 1831/2003 — Registre UE des additifs (antioxydant E320, teneurs maximales)", "Antioxydant autorisé en alimentation animale UE avec teneurs maximales."],
  "BHT": ["restreint", "Règl. (CE) n° 1831/2003 — Registre UE des additifs (antioxydant E321, teneurs maximales)", "Antioxydant autorisé en alimentation animale UE avec teneurs maximales."],
  "Ethoxyquin": ["non_autorise_ue", "UE — autorisation suspendue en 2017 (éthoxyquine E324)", "Autorisation non renouvelée/suspendue dans l'UE depuis 2017 — référence exacte du règlement à confirmer par l'expert."],
  "TBHQ": ["a_evaluer", "Règl. (CE) n° 1831/2003 — Registre UE des additifs (à vérifier)", "Additif alimentaire humain (E319) — statut en alimentation animale UE à confirmer au Registre."],
  "Red 40": ["a_evaluer", "Règl. (CE) n° 1831/2003 — Registre UE des additifs (à vérifier)", "Colorant (E129) — autorisation UE en alimentation animale à confirmer au Registre."],
  "Yellow 5": ["a_evaluer", "Règl. (CE) n° 1831/2003 — Registre UE des additifs (à vérifier)", "Colorant (E102) — autorisation UE en alimentation animale à confirmer au Registre."],
  "Caramel Color": ["a_evaluer", "Règl. (CE) n° 1831/2003 — Registre UE des additifs (à vérifier)", "Colorant caramel (E150) — conditions d'emploi UE en alimentation animale à confirmer."],
};

const p = "data/ingredients.json";
let text = readFileSync(p, "utf8");

for (const [name, [status, ref, note]] of Object.entries(EU_PATCH)) {
  const nameIdx = text.indexOf(`"name": "${name}"`);
  if (nameIdx === -1) throw new Error(`Entrée introuvable: ${name}`);
  const srcRe = /"sources": (\[[^\]]*\])/;
  const m = srcRe.exec(text.slice(nameIdx, nameIdx + 4000));
  if (!m) throw new Error(`sources introuvable pour: ${name}`);
  const insert =
    `"sources": ${m[1]},` + NL +
    `      "eu_status": ${JSON.stringify(status)},` + NL +
    `      "eu_ref": ${JSON.stringify(ref)},` + NL +
    `      "eu_note": ${JSON.stringify(note)},` + NL +
    `      "eu_review": "a_valider"`;
  text = text.slice(0, nameIdx + m.index) + insert + text.slice(nameIdx + m.index + m[0].length);
}

text = text.replace(`"version": "1.0.0"`, `"version": "1.1.0"`);
text = text.replace(`"last_updated": "2026-03-19"`, `"last_updated": "${TODAY}"`);
writeFileSync(p, text);
console.log("ingredients.json patché (format préservé)");
