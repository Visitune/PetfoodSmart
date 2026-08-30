import { recognizeText, isConfident, MIN_CONFIDENCE } from '../ocr-engine';
import type { OcrResult } from '../types';

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  __esModule: true,
  default: {
    recognize: jest.fn(),
  },
}));

import Tesseract from 'tesseract.js';
const mockRecognize = Tesseract.recognize as jest.MockedFunction<typeof Tesseract.recognize>;

describe('recognizeText', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns OCR result with text and confidence', async () => {
    mockRecognize.mockResolvedValue({
      data: {
        text: 'Ingredients: chicken, rice, corn\n',
        confidence: 85,
      },
    } as Tesseract.RecognizeResult);

    const result = await recognizeText('data:image/jpeg;base64,abc123');

    expect(result.rawText).toBe('Ingredients: chicken, rice, corn');
    expect(result.confidence).toBe(85);
    expect(result.language).toBe('eng');
    expect(mockRecognize).toHaveBeenCalledWith(
      'data:image/jpeg;base64,abc123',
      'eng',
      expect.any(Object)
    );
  });

  it('uses the provided language string instead of the default', async () => {
    mockRecognize.mockResolvedValue({
      data: { text: 'Ingredients: poulet, riz', confidence: 80 },
    } as Tesseract.RecognizeResult);

    await recognizeText('data:image/jpeg;base64,abc123', 'eng+fra');

    expect(mockRecognize).toHaveBeenCalledWith(
      'data:image/jpeg;base64,abc123',
      'eng+fra',
      expect.any(Object)
    );
  });

  it('wraps a Tesseract failure in a descriptive Error, including the rejection reason', async () => {
    mockRecognize.mockRejectedValue('worker crashed');

    await expect(
      recognizeText('data:image/jpeg;base64,abc123', 'eng+fra')
    ).rejects.toThrow(/Tesseract recognition failed \(languages: eng\+fra,.*worker crashed/);
  });

  it('surfaces the last known progress stage on failure', async () => {
    mockRecognize.mockImplementation(async (_image, _langs, options) => {
      options?.logger?.({ status: 'loading language traineddata', progress: 0.5, jobId: '1', userJobId: '1', workerId: '1' });
      throw new Error('network timeout');
    });

    await expect(
      recognizeText('data:image/jpeg;base64,abc123', 'eng+fra')
    ).rejects.toThrow(/last stage: loading language traineddata \(50%\)/);
  });

  it('detects Chinese language', async () => {
    mockRecognize.mockResolvedValue({
      data: {
        text: '成分：鸡肉、大米',
        confidence: 78,
      },
    } as Tesseract.RecognizeResult);

    const result = await recognizeText('data:image/jpeg;base64,xyz');
    expect(result.language).toBe('chi');
  });

  it('rounds confidence to integer', async () => {
    mockRecognize.mockResolvedValue({
      data: {
        text: 'chicken, rice',
        confidence: 82.7,
      },
    } as Tesseract.RecognizeResult);

    const result = await recognizeText('data:image/jpeg;base64,xyz');
    expect(result.confidence).toBe(83);
  });
});

describe('isConfident', () => {
  it('returns true when confidence meets threshold', () => {
    const result: OcrResult = { rawText: 'text', confidence: MIN_CONFIDENCE, language: 'eng' };
    expect(isConfident(result)).toBe(true);
  });

  it('returns false when confidence below threshold', () => {
    const result: OcrResult = { rawText: 'text', confidence: MIN_CONFIDENCE - 1, language: 'eng' };
    expect(isConfident(result)).toBe(false);
  });

  it('returns false when text is empty', () => {
    const result: OcrResult = { rawText: '', confidence: 90, language: 'unknown' };
    expect(isConfident(result)).toBe(false);
  });
});
