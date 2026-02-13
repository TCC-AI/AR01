import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

export const warehouseRouter = Router();

// GET /api/warehouses - 列出使用者的倉庫
warehouseRouter.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .select('*')
      .eq('user_id', req.userId!)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('List warehouses error:', error);
    res.status(500).json({ success: false, error: 'Failed to list warehouses' });
  }
});

// GET /api/warehouses/:id - 取得倉庫詳情
warehouseRouter.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .select(`
        *,
        zones (*),
        scan_photos (*)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Warehouse not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ success: false, error: 'Failed to get warehouse' });
  }
});

// POST /api/warehouses - 建立新倉庫
warehouseRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description, width, depth, height, boundaryPolygon } = req.body;

    // 檢查訂閱限制
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription')
      .eq('id', req.userId!)
      .single();

    const { count } = await supabaseAdmin
      .from('warehouses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId!);

    const limits: Record<string, number> = { free: 1, pro: 10, enterprise: 999 };
    const maxWarehouses = limits[profile?.subscription || 'free'] ?? 1;

    if ((count || 0) >= maxWarehouses) {
      res.status(403).json({
        success: false,
        error: `Warehouse limit reached (${maxWarehouses}). Upgrade your plan.`,
      });
      return;
    }

    // 預設多邊形 (矩形)
    const defaultPolygon = [
      { x: 0, y: 0 },
      { x: width || 20, y: 0 },
      { x: width || 20, y: depth || 30 },
      { x: 0, y: depth || 30 },
    ];

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .insert({
        user_id: req.userId!,
        name: name || 'New Warehouse',
        description: description || '',
        width: width || 20,
        depth: depth || 30,
        height: height || 6,
        boundary_polygon: boundaryPolygon || defaultPolygon,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ success: false, error: 'Failed to create warehouse' });
  }
});

// PUT /api/warehouses/:id - 更新倉庫
warehouseRouter.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const updates: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'description', 'width', 'depth', 'height',
      'boundary_polygon', 'mapping_status', 'spatial_data', 'navigation_mesh',
    ];

    for (const field of allowedFields) {
      // 將 camelCase 轉為 snake_case 的欄位名稱
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camelField] !== undefined) {
        updates[field] = req.body[camelField];
      } else if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ success: false, error: 'Failed to update warehouse' });
  }
});

// DELETE /api/warehouses/:id - 刪除倉庫
warehouseRouter.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('warehouses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) throw error;

    res.json({ success: true, message: 'Warehouse deleted' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete warehouse' });
  }
});

// POST /api/warehouses/:id/zones - 新增區域/貨架
warehouseRouter.post('/:id/zones', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, type, polygon, position, size, shelfLevels, color } = req.body;

    const { data, error } = await supabaseAdmin
      .from('zones')
      .insert({
        warehouse_id: req.params.id,
        name: name || 'New Zone',
        type: type || 'rack',
        polygon: polygon || [],
        position: position || { x: 0, y: 0, z: 0 },
        size: size || { x: 2, y: 2, z: 2 },
        shelf_levels: shelfLevels || 1,
        color: color || '#6366f1',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create zone error:', error);
    res.status(500).json({ success: false, error: 'Failed to create zone' });
  }
});
