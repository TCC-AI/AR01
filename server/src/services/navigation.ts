/**
 * A* 導航路徑計算服務
 * - 在倉庫空間中計算從 A 點到 B 點的最短路徑
 * - 避開障礙物 (貨架、牆壁)
 */

import type { Point3D } from '../../../shared/types/index.js';

interface NavNode {
  x: number;
  y: number;
  z: number;
  g: number; // 從起點到此節點的距離
  h: number; // 啟發式估計到終點的距離
  f: number; // g + h
  parent: NavNode | null;
}

/**
 * 計算兩點之間的歐幾里得距離
 */
function distance(a: Point3D, b: Point3D): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2,
  );
}

/**
 * 在導航網格上使用 A* 演算法找到最短路徑
 */
export function findPath(
  start: Point3D,
  end: Point3D,
  navigationMesh: Point3D[][],
  obstacles: Array<{ position: Point3D; size: Point3D }>,
): Point3D[] {
  // 如果沒有導航網格，回傳直線路徑
  if (!navigationMesh || navigationMesh.length === 0) {
    return generateSimplePath(start, end);
  }

  // 將導航網格扁平化為節點陣列
  const flatNodes = navigationMesh.flat();

  // 找到最接近起點和終點的導航節點
  const startNode = findClosestNode(start, flatNodes);
  const endNode = findClosestNode(end, flatNodes);

  if (!startNode || !endNode) {
    return generateSimplePath(start, end);
  }

  // A* 演算法
  const openSet: NavNode[] = [
    { ...startNode, g: 0, h: distance(startNode, endNode), f: distance(startNode, endNode), parent: null },
  ];
  const closedSet = new Set<string>();
  const nodeKey = (n: Point3D) => `${n.x.toFixed(1)},${n.y.toFixed(1)},${n.z.toFixed(1)}`;

  while (openSet.length > 0) {
    // 取 f 值最小的節點
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = nodeKey(current);

    // 到達終點
    if (distance(current, endNode) < 1.5) {
      return reconstructPath(current, start, end);
    }

    closedSet.add(currentKey);

    // 展開鄰居節點
    const neighbors = findNeighbors(current, flatNodes, 2.0);

    for (const neighbor of neighbors) {
      const nKey = nodeKey(neighbor);
      if (closedSet.has(nKey)) continue;

      // 檢查是否穿過障礙物
      if (isBlockedByObstacle(current, neighbor, obstacles)) continue;

      const tentativeG = current.g + distance(current, neighbor);
      const existingNode = openSet.find((n) => nodeKey(n) === nKey);

      if (!existingNode) {
        openSet.push({
          ...neighbor,
          g: tentativeG,
          h: distance(neighbor, endNode),
          f: tentativeG + distance(neighbor, endNode),
          parent: current,
        });
      } else if (tentativeG < existingNode.g) {
        existingNode.g = tentativeG;
        existingNode.f = tentativeG + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  // 找不到路徑，回傳簡單路徑
  return generateSimplePath(start, end);
}

/**
 * 從 A* 結果重建路徑
 */
function reconstructPath(endNode: NavNode, realStart: Point3D, realEnd: Point3D): Point3D[] {
  const path: Point3D[] = [];
  let current: NavNode | null = endNode;

  while (current) {
    path.unshift({ x: current.x, y: current.y, z: current.z });
    current = current.parent;
  }

  // 確保起點和終點在路徑中
  if (path.length > 0) {
    path[0] = realStart;
    path.push(realEnd);
  }

  return smoothPath(path);
}

/**
 * 平滑路徑 (減少鋸齒狀折線)
 */
function smoothPath(path: Point3D[]): Point3D[] {
  if (path.length <= 2) return path;

  const smoothed: Point3D[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    // 簡單的拉普拉斯平滑
    smoothed.push({
      x: (prev.x + curr.x * 2 + next.x) / 4,
      y: curr.y, // 保持 Y 軸不變 (保持在地面)
      z: (prev.z + curr.z * 2 + next.z) / 4,
    });
  }

  smoothed.push(path[path.length - 1]);
  return smoothed;
}

/**
 * 產生簡單的直線路徑 (帶 L 型轉彎避免穿過貨架)
 */
function generateSimplePath(start: Point3D, end: Point3D): Point3D[] {
  // 建立 L 型路徑
  const midPoint: Point3D = {
    x: end.x,
    y: Math.min(start.y, end.y),
    z: start.z,
  };

  return [start, midPoint, end];
}

/**
 * 找到最接近目標點的導航節點
 */
function findClosestNode(target: Point3D, nodes: Point3D[]): Point3D | null {
  if (nodes.length === 0) return null;

  let closest = nodes[0];
  let minDist = distance(target, closest);

  for (const node of nodes) {
    const dist = distance(target, node);
    if (dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }

  return closest;
}

/**
 * 找到指定範圍內的鄰居節點
 */
function findNeighbors(node: Point3D, allNodes: Point3D[], maxDist: number): Point3D[] {
  return allNodes.filter(
    (n) =>
      n !== node &&
      Math.abs(n.x - node.x) <= maxDist &&
      Math.abs(n.z - node.z) <= maxDist &&
      distance(n, node) <= maxDist,
  );
}

/**
 * 檢查兩點之間的路徑是否被障礙物阻擋
 */
function isBlockedByObstacle(
  from: Point3D,
  to: Point3D,
  obstacles: Array<{ position: Point3D; size: Point3D }>,
): boolean {
  for (const obs of obstacles) {
    const minX = obs.position.x - obs.size.x / 2;
    const maxX = obs.position.x + obs.size.x / 2;
    const minZ = obs.position.z - obs.size.z / 2;
    const maxZ = obs.position.z + obs.size.z / 2;

    // 簡化的線段-矩形碰撞檢測
    const midX = (from.x + to.x) / 2;
    const midZ = (from.z + to.z) / 2;

    if (midX >= minX && midX <= maxX && midZ >= minZ && midZ <= maxZ) {
      return true;
    }
  }

  return false;
}

/**
 * 計算路徑的總距離
 */
export function calculatePathDistance(path: Point3D[]): number {
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistance += distance(path[i - 1], path[i]);
  }
  return totalDistance;
}

/**
 * 估算步行時間 (以平均步行速度 1.2 m/s 計算)
 */
export function estimateWalkingTime(distanceMeters: number): number {
  return distanceMeters / 1.2;
}
