import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { analyzeWarehousePhoto, generateSpatialMap } from '../services/gemini.js';

export const spatialRouter = Router();

// POST /api/spatial/analyze-photo - 分析單張倉庫照片
spatialRouter.post('/analyze-photo', authenticate, async (req: AuthRequest, res) => {
  try {
    const { warehouseId, imageBase64 } = req.body;

    if (!warehouseId || !imageBase64) {
      res.status(400).json({ success: false, error: 'warehouseId and imageBase64 are required' });
      return;
    }

    // 分析照片
    const analysis = await analyzeWarehousePhoto(imageBase64);

    // 儲存照片記錄
    const { data: photo, error } = await supabaseAdmin
      .from('scan_photos')
      .insert({
        warehouse_id: warehouseId,
        photo_url: '', // 會由前端上傳到 Supabase Storage
        analysis_result: analysis,
      })
      .select()
      .single();

    if (error) throw error;

    // 更新倉庫構圖狀態
    await supabaseAdmin
      .from('warehouses')
      .update({ mapping_status: 'in_progress' })
      .eq('id', warehouseId);

    res.json({ success: true, data: { photo, analysis } });
  } catch (error) {
    console.error('Analyze photo error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze photo' });
  }
});

// POST /api/spatial/generate-map - 從所有照片生成空間地圖
spatialRouter.post('/generate-map', authenticate, async (req: AuthRequest, res) => {
  try {
    const { warehouseId } = req.body;

    if (!warehouseId) {
      res.status(400).json({ success: false, error: 'warehouseId is required' });
      return;
    }

    // 取得倉庫資訊
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select('width, depth, height')
      .eq('id', warehouseId)
      .single();

    if (!warehouse) {
      res.status(404).json({ success: false, error: 'Warehouse not found' });
      return;
    }

    // 取得所有照片分析結果
    const { data: photos } = await supabaseAdmin
      .from('scan_photos')
      .select('analysis_result')
      .eq('warehouse_id', warehouseId)
      .not('analysis_result', 'is', null);

    if (!photos?.length) {
      res.status(400).json({ success: false, error: 'No analyzed photos found. Upload and analyze photos first.' });
      return;
    }

    const analyses = photos.map((p) => p.analysis_result).filter(Boolean);

    // 合併分析結果生成空間地圖
    const spatialData = await generateSpatialMap(analyses, {
      width: warehouse.width,
      depth: warehouse.depth,
      height: warehouse.height,
    });

    // 儲存到倉庫
    const { error } = await supabaseAdmin
      .from('warehouses')
      .update({
        spatial_data: spatialData,
        navigation_mesh: spatialData.navigationMesh,
        mapping_status: 'completed',
      })
      .eq('id', warehouseId);

    if (error) throw error;

    res.json({ success: true, data: spatialData });
  } catch (error) {
    console.error('Generate map error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate spatial map' });
  }
});

// GET /api/spatial/:warehouseId/status - 取得構圖狀態
spatialRouter.get('/:warehouseId/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select('mapping_status, spatial_data')
      .eq('id', req.params.warehouseId)
      .single();

    const { count } = await supabaseAdmin
      .from('scan_photos')
      .select('*', { count: 'exact', head: true })
      .eq('warehouse_id', req.params.warehouseId);

    res.json({
      success: true,
      data: {
        status: warehouse?.mapping_status || 'not_started',
        photoCount: count || 0,
        hasSpatialData: !!warehouse?.spatial_data,
        requiredPhotos: 8,
        coveragePercent: Math.min(100, ((count || 0) / 8) * 100),
      },
    });
  } catch (error) {
    console.error('Get mapping status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get mapping status' });
  }
});
