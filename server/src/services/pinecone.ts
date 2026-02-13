/**
 * Pinecone 向量搜尋服務
 * - 將貨物資訊轉為向量，存入 Pinecone
 * - 支援語意搜尋：用自然語言找貨物
 */

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'ar01-products';
const PINECONE_HOST = process.env.PINECONE_HOST || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * 使用 Gemini 將文字轉為 embedding 向量
 */
async function getEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = (await response.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}

/**
 * 將貨物資訊 upsert 到 Pinecone
 */
export async function upsertProductVector(product: {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  warehouseId: string;
  locationLabel: string;
}): Promise<void> {
  if (!PINECONE_API_KEY || !PINECONE_HOST) {
    console.warn('Pinecone not configured, skipping vector upsert');
    return;
  }

  const text = `${product.name} ${product.sku} ${product.description} ${product.category} ${product.locationLabel}`;
  const embedding = await getEmbedding(text);

  const response = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_API_KEY,
    },
    body: JSON.stringify({
      vectors: [
        {
          id: product.id,
          values: embedding,
          metadata: {
            name: product.name,
            sku: product.sku,
            category: product.category,
            warehouseId: product.warehouseId,
            locationLabel: product.locationLabel,
          },
        },
      ],
      namespace: product.warehouseId,
    }),
  });

  if (!response.ok) {
    console.error('Pinecone upsert failed:', response.status);
  }
}

/**
 * 語意搜尋貨物
 */
export async function searchProducts(
  query: string,
  warehouseId: string,
  topK: number = 10,
): Promise<Array<{ id: string; score: number; metadata: Record<string, string> }>> {
  if (!PINECONE_API_KEY || !PINECONE_HOST) {
    console.warn('Pinecone not configured, returning empty results');
    return [];
  }

  const embedding = await getEmbedding(query);

  const response = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_API_KEY,
    },
    body: JSON.stringify({
      vector: embedding,
      topK,
      namespace: warehouseId,
      includeMetadata: true,
    }),
  });

  if (!response.ok) {
    console.error('Pinecone query failed:', response.status);
    return [];
  }

  const data = (await response.json()) as {
    matches: Array<{
      id: string;
      score: number;
      metadata: Record<string, string>;
    }>;
  };

  return data.matches || [];
}

/**
 * 刪除貨物向量
 */
export async function deleteProductVector(
  productId: string,
  warehouseId: string,
): Promise<void> {
  if (!PINECONE_API_KEY || !PINECONE_HOST) return;

  await fetch(`${PINECONE_HOST}/vectors/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_API_KEY,
    },
    body: JSON.stringify({
      ids: [productId],
      namespace: warehouseId,
    }),
  });
}
