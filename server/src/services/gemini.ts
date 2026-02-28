/**
 * Gemini API 整合服務
 * - 空間構圖：分析多張倉庫照片，推斷空間結構
 * - 圖像辨識：辨識貨物照片，自動填寫品項資訊
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

async function callGemini(prompt: string, imageBase64?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const response = await fetch(
    `${GEMINI_API_URL}/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

/**
 * 分析倉庫照片，推斷空間結構
 */
export async function analyzeWarehousePhoto(imageBase64: string): Promise<{
  walls: Array<{ start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; height: number }>;
  obstacles: Array<{ position: { x: number; y: number; z: number }; size: { x: number; y: number; z: number }; type: string }>;
  estimatedDimensions: { width: number; depth: number; height: number };
}> {
  const prompt = `Analyze this warehouse/storage facility photo. Return a JSON object with:
1. "walls": array of wall segments with start/end 3D coordinates and height
2. "obstacles": array of detected obstacles (shelves, racks, pillars) with position, size, and type
3. "estimatedDimensions": estimated room dimensions in meters {width, depth, height}

Estimate real-world measurements in meters. Return ONLY valid JSON, no explanation.`;

  const result = await callGemini(prompt, imageBase64);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { walls: [], obstacles: [], estimatedDimensions: { width: 20, depth: 30, height: 6 } };
  } catch {
    return { walls: [], obstacles: [], estimatedDimensions: { width: 20, depth: 30, height: 6 } };
  }
}

/**
 * 辨識貨物照片，回傳品項建議
 */
export async function recognizeProduct(imageBase64: string): Promise<{
  name: string;
  category: string;
  description: string;
  suggestedAttributes: Record<string, string>;
}> {
  const prompt = `Analyze this product/item photo for a warehouse inventory system.
Return a JSON object with:
1. "name": product name or description
2. "category": product category (e.g. "Electronics", "Food", "Construction Materials")
3. "description": brief description of the item
4. "suggestedAttributes": key-value pairs of notable attributes (e.g. weight, color, brand, material)

Return ONLY valid JSON, no explanation.`;

  const result = await callGemini(prompt, imageBase64);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { name: 'Unknown Product', category: 'Uncategorized', description: '', suggestedAttributes: {} };
  } catch {
    return { name: 'Unknown Product', category: 'Uncategorized', description: '', suggestedAttributes: {} };
  }
}

/**
 * 合併多張照片的空間分析結果，生成完整空間資料
 */
export async function generateSpatialMap(
  photoAnalyses: Array<{
    walls: Array<{ start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; height: number }>;
    obstacles: Array<{ position: { x: number; y: number; z: number }; size: { x: number; y: number; z: number }; type: string }>;
    estimatedDimensions: { width: number; depth: number; height: number };
  }>,
  warehouseDimensions: { width: number; depth: number; height: number },
): Promise<{
  floorPlane: Array<{ x: number; y: number; z: number }>;
  walls: Array<{ start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; height: number }>;
  obstacles: Array<{ position: { x: number; y: number; z: number }; size: { x: number; y: number; z: number }; type: string }>;
  navigationMesh: Array<Array<{ x: number; y: number; z: number }>>;
}> {
  const prompt = `Given multiple photo analyses of a warehouse with dimensions ${warehouseDimensions.width}m x ${warehouseDimensions.depth}m x ${warehouseDimensions.height}m,
merge them into a unified spatial map. Input analyses: ${JSON.stringify(photoAnalyses)}

Return a JSON object with:
1. "floorPlane": array of 3D points defining the walkable floor
2. "walls": merged wall segments
3. "obstacles": merged and deduplicated obstacles
4. "navigationMesh": 2D grid of walkable path nodes (array of arrays of 3D points, spacing ~1m)

Return ONLY valid JSON, no explanation.`;

  const result = await callGemini(prompt);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          floorPlane: [
            { x: 0, y: 0, z: 0 },
            { x: warehouseDimensions.width, y: 0, z: 0 },
            { x: warehouseDimensions.width, y: 0, z: warehouseDimensions.depth },
            { x: 0, y: 0, z: warehouseDimensions.depth },
          ],
          walls: [],
          obstacles: [],
          navigationMesh: [],
        };
  } catch {
    return {
      floorPlane: [
        { x: 0, y: 0, z: 0 },
        { x: warehouseDimensions.width, y: 0, z: 0 },
        { x: warehouseDimensions.width, y: 0, z: warehouseDimensions.depth },
        { x: 0, y: 0, z: warehouseDimensions.depth },
      ],
      walls: [],
      obstacles: [],
      navigationMesh: [],
    };
  }
}
