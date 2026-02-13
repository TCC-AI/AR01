import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { findPath, calculatePathDistance, estimateWalkingTime } from '../services/navigation.js';

export const navigationRouter = Router();

// POST /api/navigation/path - 計算導航路徑
navigationRouter.post('/path', authenticate, async (req: AuthRequest, res) => {
  try {
    const { warehouseId, startPosition, targetProductId } = req.body;

    if (!warehouseId || !startPosition || !targetProductId) {
      res.status(400).json({
        success: false,
        error: 'warehouseId, startPosition, and targetProductId are required',
      });
      return;
    }

    // 取得目標貨物
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*, zones(name, type, color)')
      .eq('id', targetProductId)
      .single();

    if (productError || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // 取得倉庫的導航網格和障礙物
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select('navigation_mesh, spatial_data')
      .eq('id', warehouseId)
      .single();

    const navigationMesh = warehouse?.navigation_mesh || [];
    const obstacles = warehouse?.spatial_data?.obstacles || [];

    // 計算路徑
    const waypoints = findPath(
      startPosition,
      product.position,
      navigationMesh,
      obstacles,
    );

    const distance = calculatePathDistance(waypoints);
    const estimatedTime = estimateWalkingTime(distance);

    // 記錄導航日誌
    supabaseAdmin
      .from('navigation_logs')
      .insert({
        warehouse_id: warehouseId,
        user_id: req.userId!,
        product_id: targetProductId,
        start_position: startPosition,
        end_position: product.position,
        distance,
        duration_seconds: estimatedTime,
      })
      .then(() => {})
      .catch((err) => console.error('Navigation log error:', err));

    res.json({
      success: true,
      data: {
        waypoints,
        distance: Math.round(distance * 100) / 100,
        estimatedTime: Math.round(estimatedTime),
        targetProduct: product,
      },
    });
  } catch (error) {
    console.error('Navigation error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate navigation path' });
  }
});

// POST /api/navigation/multi - 計算多目標導航路徑 (找多個貨物的最佳路線)
navigationRouter.post('/multi', authenticate, async (req: AuthRequest, res) => {
  try {
    const { warehouseId, startPosition, targetProductIds } = req.body;

    if (!warehouseId || !startPosition || !targetProductIds?.length) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // 取得所有目標貨物
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('*, zones(name, type, color)')
      .in('id', targetProductIds);

    if (!products?.length) {
      res.status(404).json({ success: false, error: 'Products not found' });
      return;
    }

    // 取得倉庫資料
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select('navigation_mesh, spatial_data')
      .eq('id', warehouseId)
      .single();

    const navigationMesh = warehouse?.navigation_mesh || [];
    const obstacles = warehouse?.spatial_data?.obstacles || [];

    // 使用貪心法排序目標點 (最近的先)
    const sortedProducts = [];
    let currentPos = startPosition;
    const remaining = [...products];

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dist = Math.sqrt(
          (remaining[i].position.x - currentPos.x) ** 2 +
          (remaining[i].position.z - currentPos.z) ** 2,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      sortedProducts.push(remaining[nearestIdx]);
      currentPos = remaining[nearestIdx].position;
      remaining.splice(nearestIdx, 1);
    }

    // 計算串聯路徑
    const allWaypoints = [];
    let totalDistance = 0;
    let prevPos = startPosition;

    for (const product of sortedProducts) {
      const segment = findPath(prevPos, product.position, navigationMesh, obstacles);
      allWaypoints.push(...segment);
      totalDistance += calculatePathDistance(segment);
      prevPos = product.position;
    }

    res.json({
      success: true,
      data: {
        waypoints: allWaypoints,
        distance: Math.round(totalDistance * 100) / 100,
        estimatedTime: Math.round(estimateWalkingTime(totalDistance)),
        products: sortedProducts,
        optimizedOrder: sortedProducts.map((p) => p.id),
      },
    });
  } catch (error) {
    console.error('Multi-navigation error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate navigation' });
  }
});
