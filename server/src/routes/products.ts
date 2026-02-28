import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { upsertProductVector, deleteProductVector, searchProducts } from '../services/pinecone.js';
import { recognizeProduct } from '../services/gemini.js';

export const productRouter = Router();

// GET /api/products?warehouseId=xxx - 列出倉庫中的貨物
productRouter.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { warehouseId, category, page = '1', pageSize = '50' } = req.query;

    if (!warehouseId) {
      res.status(400).json({ success: false, error: 'warehouseId is required' });
      return;
    }

    let query = supabaseAdmin
      .from('products')
      .select('*, zones(name, type, color)', { count: 'exact' })
      .eq('warehouse_id', warehouseId as string);

    if (category) {
      query = query.eq('category', category as string);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    query = query
      .order('name')
      .range(offset, offset + parseInt(pageSize as string) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      total: count,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      totalPages: Math.ceil((count || 0) / parseInt(pageSize as string)),
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ success: false, error: 'Failed to list products' });
  }
});

// GET /api/products/:id - 取得貨物詳情
productRouter.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, zones(name, type, color)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product' });
  }
});

// POST /api/products - 新增貨物 (含空間定位)
productRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      warehouseId, name, sku, description, category,
      quantity, unit, images, zoneId, position,
      shelfLevel, locationLabel, attributes,
    } = req.body;

    if (!warehouseId || !name) {
      res.status(400).json({ success: false, error: 'warehouseId and name are required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        warehouse_id: warehouseId,
        name,
        sku: sku || '',
        description: description || '',
        category: category || '',
        quantity: quantity || 0,
        unit: unit || 'pcs',
        images: images || [],
        zone_id: zoneId || null,
        position: position || { x: 0, y: 0, z: 0 },
        shelf_level: shelfLevel,
        location_label: locationLabel || '',
        attributes: attributes || {},
      })
      .select()
      .single();

    if (error) throw error;

    // 非同步更新 Pinecone 向量索引
    upsertProductVector({
      id: data.id,
      name,
      sku: sku || '',
      description: description || '',
      category: category || '',
      warehouseId,
      locationLabel: locationLabel || '',
    }).catch((err) => console.error('Pinecone upsert error:', err));

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - 更新貨物
productRouter.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const updates: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      name: 'name', sku: 'sku', description: 'description',
      category: 'category', quantity: 'quantity', unit: 'unit',
      images: 'images', zoneId: 'zone_id', position: 'position',
      shelfLevel: 'shelf_level', locationLabel: 'location_label',
      attributes: 'attributes', lastCheckedAt: 'last_checked_at',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (req.body[camel] !== undefined) {
        updates[snake] = req.body[camel];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // 更新 Pinecone
    upsertProductVector({
      id: data.id,
      name: data.name,
      sku: data.sku,
      description: data.description,
      category: data.category,
      warehouseId: data.warehouse_id,
      locationLabel: data.location_label,
    }).catch((err) => console.error('Pinecone upsert error:', err));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - 刪除貨物
productRouter.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // 取得貨物資訊 (用於刪除 Pinecone 向量)
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('warehouse_id')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (product) {
      deleteProductVector(req.params.id, product.warehouse_id)
        .catch((err) => console.error('Pinecone delete error:', err));
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

// POST /api/products/search - 語意搜尋貨物 (Pinecone)
productRouter.post('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { warehouseId, query, limit } = req.body;

    if (!warehouseId || !query) {
      res.status(400).json({ success: false, error: 'warehouseId and query are required' });
      return;
    }

    // 先嘗試 Pinecone 向量搜尋
    const vectorResults = await searchProducts(query, warehouseId, limit || 10);

    if (vectorResults.length > 0) {
      // 用搜尋到的 ID 從 Supabase 取得完整貨物資訊
      const productIds = vectorResults.map((r) => r.id);
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('*, zones(name, type, color)')
        .in('id', productIds);

      const results = vectorResults.map((vr) => ({
        product: products?.find((p) => p.id === vr.id),
        score: vr.score,
      })).filter((r) => r.product);

      res.json({ success: true, data: results });
      return;
    }

    // 降級到 Supabase 全文搜尋
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, zones(name, type, color)')
      .eq('warehouse_id', warehouseId)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(limit || 10);

    if (error) throw error;

    const results = (data || []).map((p) => ({ product: p, score: 0.5 }));
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ success: false, error: 'Failed to search products' });
  }
});

// POST /api/products/recognize - AI 辨識貨物照片
productRouter.post('/recognize', authenticate, async (req: AuthRequest, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      res.status(400).json({ success: false, error: 'imageBase64 is required' });
      return;
    }

    const result = await recognizeProduct(imageBase64);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Recognize product error:', error);
    res.status(500).json({ success: false, error: 'Failed to recognize product' });
  }
});
