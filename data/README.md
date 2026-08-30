# PetFoodSmart Ingredient Knowledge Base

A curated database of 500+ pet food ingredients with safety ratings, categories, and bilingual (English/Chinese) support.

## Usage

The knowledge base is a single JSON file (`ingredients.json`) that can be used independently of the PetFoodSmart app.

```javascript
import ingredients from './ingredients.json';

// Each ingredient has:
// - name: string (English name)
// - category: string (protein, grain, vegetable, fruit, etc.)
// - safety_rating: "safe" | "caution" | "harmful"
// - explanation: string (why this rating)
// - aliases: string[] (alternate names, Chinese names)
```

## Categories

| Category | Description |
|----------|-------------|
| protein | Meat, fish, eggs, and protein sources |
| grain | Rice, wheat, corn, oats, etc. |
| vegetable | Vegetables and legumes |
| fruit | Fruits and berries |
| fat_oil | Fats, oils, and fatty acids |
| fiber | Fiber sources |
| vitamin | Vitamins and vitamin complexes |
| mineral | Minerals and mineral complexes |
| preservative | Preservatives (natural and artificial) |
| additive | Food additives |
| sweetener | Sweeteners (natural and artificial) |
| coloring | Food colorings and dyes |
| filler | Fillers and bulking agents |
| byproduct | Animal byproducts |
| supplement | Nutritional supplements |
| thickener | Thickeners and gelling agents |
| flavor | Flavoring agents |

## Safety Ratings

- **safe**: Generally recognized as safe and beneficial for pets
- **caution**: May cause issues for some pets or in large quantities
- **harmful**: Known to be harmful, toxic, or of very low nutritional value

## Sources

Safety ratings are based on:
- AAFCO (Association of American Feed Control Officials) guidelines
- Veterinary nutrition literature
- FDA pet food safety guidelines

## License

This knowledge base is released under the MIT License as part of the PetFoodSmart project.
