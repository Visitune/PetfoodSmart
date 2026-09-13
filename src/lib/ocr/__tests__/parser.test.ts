import {
  parseIngredients,
  detectLanguage,
  normalizeIngredient,
  stripHeader,
  containsChinese,
  cleanParenthetical,
} from '../parser';

describe('containsChinese', () => {
  it('detects Chinese characters', () => {
    expect(containsChinese('鸡肉')).toBe(true);
    expect(containsChinese('chicken')).toBe(false);
    expect(containsChinese('chicken 鸡肉')).toBe(true);
  });
});

describe('stripHeader', () => {
  it('strips "Ingredients:" header', () => {
    expect(stripHeader('Ingredients: chicken, rice')).toBe('chicken, rice');
  });

  it('strips "ingredients:" lowercase', () => {
    expect(stripHeader('ingredients: chicken, rice')).toBe('chicken, rice');
  });

  it('strips Chinese header 成分：', () => {
    expect(stripHeader('成分：鸡肉、大米')).toBe('鸡肉、大米');
  });

  it('strips Chinese header 配料：', () => {
    expect(stripHeader('配料：鸡肉、大米')).toBe('鸡肉、大米');
  });

  it('strips Chinese header 原料：', () => {
    expect(stripHeader('原料：鸡肉、大米')).toBe('鸡肉、大米');
  });

  it('returns text as-is when no header found', () => {
    expect(stripHeader('chicken, rice, corn')).toBe('chicken, rice, corn');
  });

  it('handles full-width colon', () => {
    expect(stripHeader('Ingredients：chicken, rice')).toBe('chicken, rice');
  });

  it('strips French header "Ingrédients :"', () => {
    expect(stripHeader('Ingrédients : poulet, riz, maïs')).toBe('poulet, riz, maïs');
  });

  it('strips French header "Composition :"', () => {
    expect(stripHeader('Composition : poulet, riz')).toBe('poulet, riz');
  });

  it('strips French header "Additifs :"', () => {
    expect(stripHeader('Additifs : vitamine A, taurine')).toBe('vitamine A, taurine');
  });
});

describe('cleanParenthetical (FR/EU)', () => {
  it('strips French "(dont ...)" sub-ingredient notes', () => {
    expect(cleanParenthetical('viandes (dont poulet 4%)')).toBe('viandes');
  });

  it('strips French "(source de ...)" notes', () => {
    expect(cleanParenthetical('farine de poulet (source de glucosamine)')).toBe('farine de poulet');
  });

  it('keeps non-noise parentheticals as-is', () => {
    expect(cleanParenthetical('poulet (saveur)')).toBe('poulet (saveur)');
  });
});

describe('normalizeIngredient', () => {
  it('trims whitespace', () => {
    expect(normalizeIngredient('  chicken  ')).toBe('chicken');
  });

  it('lowercases English text', () => {
    expect(normalizeIngredient('Chicken Meal')).toBe('chicken meal');
  });

  it('preserves Chinese characters', () => {
    expect(normalizeIngredient('鸡肉粉')).toBe('鸡肉粉');
  });

  it('removes percentage values', () => {
    expect(normalizeIngredient('chicken (30%)')).toBe('chicken');
    expect(normalizeIngredient('chicken 30%')).toBe('chicken');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeIngredient('chicken   meal')).toBe('chicken meal');
  });

  it('strips leading/trailing punctuation', () => {
    expect(normalizeIngredient(', chicken,')).toBe('chicken');
  });
});

describe('detectLanguage', () => {
  it('detects English', () => {
    expect(detectLanguage('chicken, rice, corn')).toBe('eng');
  });

  it('detects Chinese', () => {
    expect(detectLanguage('鸡肉、大米、玉米')).toBe('chi');
  });

  it('detects mixed', () => {
    expect(detectLanguage('chicken 鸡肉, rice 大米')).toBe('mixed');
  });

  it('returns unknown for empty text', () => {
    expect(detectLanguage('')).toBe('unknown');
  });

  it('returns unknown for numbers only', () => {
    expect(detectLanguage('123 456')).toBe('unknown');
  });
});

describe('parseIngredients', () => {
  it('parses comma-separated English ingredients', () => {
    const result = parseIngredients('Ingredients: chicken, brown rice, chicken fat, dried egg');
    expect(result).toHaveLength(4);
    expect(result[0].normalized).toBe('chicken');
    expect(result[0].position).toBe(0);
    expect(result[1].normalized).toBe('brown rice');
    expect(result[2].normalized).toBe('chicken fat');
    expect(result[3].normalized).toBe('dried egg');
    expect(result[3].position).toBe(3);
  });

  it('parses Chinese comma (、) separated ingredients', () => {
    const result = parseIngredients('成分：鸡肉、大米、鸡脂肪、鸡蛋');
    expect(result).toHaveLength(4);
    expect(result[0].normalized).toBe('鸡肉');
    expect(result[1].normalized).toBe('大米');
  });

  it('parses Chinese comma (，) separated ingredients', () => {
    const result = parseIngredients('配料：鸡肉，大米，玉米');
    expect(result).toHaveLength(3);
  });

  it('handles multi-line text', () => {
    const result = parseIngredients('Ingredients: chicken,\nrice,\ncorn');
    expect(result).toHaveLength(3);
  });

  it('handles semicolons as separators', () => {
    const result = parseIngredients('chicken; rice; corn');
    expect(result).toHaveLength(3);
  });

  it('skips short OCR noise (< 2 chars)', () => {
    const result = parseIngredients('chicken, , a, rice');
    expect(result).toHaveLength(2);
    expect(result[0].normalized).toBe('chicken');
    expect(result[1].normalized).toBe('rice');
  });

  it('skips pure number entries', () => {
    const result = parseIngredients('chicken, 123, rice');
    expect(result).toHaveLength(2);
  });

  it('strips preservative parentheticals', () => {
    const result = parseIngredients('chicken fat (preserved with mixed tocopherols), rice');
    expect(result).toHaveLength(2);
    expect(result[0].normalized).toBe('chicken fat');
  });

  it('returns empty array for empty text', () => {
    expect(parseIngredients('')).toEqual([]);
    expect(parseIngredients('   ')).toEqual([]);
  });

  it('handles text without header', () => {
    const result = parseIngredients('chicken, rice, corn');
    expect(result).toHaveLength(3);
  });

  it('removes trailing period', () => {
    const result = parseIngredients('Ingredients: chicken, rice.');
    expect(result).toHaveLength(2);
    expect(result[1].normalized).toBe('rice');
  });

  it('assigns sequential positions skipping filtered entries', () => {
    const result = parseIngredients('chicken, , rice, , corn');
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
    expect(result[2].position).toBe(2);
  });

  it('preserves original text in original field', () => {
    const result = parseIngredients('Ingredients: Chicken Meal, Brown Rice');
    expect(result[0].original).toBe('Chicken Meal');
    expect(result[0].normalized).toBe('chicken meal');
  });
});
