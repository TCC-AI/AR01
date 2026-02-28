import { useRef, useState, useCallback, useEffect } from 'react';
import type { Point2D } from '@shared/types';

interface PolygonEditorProps {
  /** 多邊形頂點 */
  vertices: Point2D[];
  /** 倉庫尺寸 (公尺) */
  dimensions: { width: number; depth: number };
  /** 頂點變更回調 */
  onChange: (vertices: Point2D[]) => void;
}

/**
 * 倉庫邊界多邊形編輯器
 * - 使用者可拖拉頂點調整倉庫形狀
 * - 可新增/刪除頂點
 * - 網格背景代表 1 公尺
 */
export default function PolygonEditor({ vertices, dimensions, onChange }: PolygonEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 400, h: 400 });

  // 計算縮放比例 (倉庫公尺 → 畫布像素)
  const padding = 40;
  const scaleX = (canvasSize.w - padding * 2) / dimensions.width;
  const scaleY = (canvasSize.h - padding * 2) / dimensions.depth;
  const scale = Math.min(scaleX, scaleY);

  const toCanvas = useCallback(
    (p: Point2D) => ({
      x: padding + p.x * scale,
      y: padding + p.y * scale,
    }),
    [scale],
  );

  const toWorld = useCallback(
    (cx: number, cy: number): Point2D => ({
      x: Math.round(((cx - padding) / scale) * 10) / 10,
      y: Math.round(((cy - padding) / scale) * 10) / 10,
    }),
    [scale],
  );

  // 調整 canvas 大小
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: width, h: height });
      }
    });

    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // 繪製
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;

    // 背景
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    // 網格 (1 公尺間隔)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= dimensions.width; x++) {
      const cx = padding + x * scale;
      ctx.beginPath();
      ctx.moveTo(cx, padding);
      ctx.lineTo(cx, padding + dimensions.depth * scale);
      ctx.stroke();
    }
    for (let y = 0; y <= dimensions.depth; y++) {
      const cy = padding + y * scale;
      ctx.beginPath();
      ctx.moveTo(padding, cy);
      ctx.lineTo(padding + dimensions.width * scale, cy);
      ctx.stroke();
    }

    // 刻度標籤
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let x = 0; x <= dimensions.width; x += 5) {
      const cx = padding + x * scale;
      ctx.fillText(`${x}m`, cx, padding - 8);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y <= dimensions.depth; y += 5) {
      const cy = padding + y * scale;
      ctx.fillText(`${y}m`, padding - 8, cy + 4);
    }

    // 多邊形填充
    if (vertices.length >= 3) {
      ctx.beginPath();
      const first = toCanvas(vertices[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < vertices.length; i++) {
        const p = toCanvas(vertices[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.fill();
    }

    // 多邊形邊線
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    if (vertices.length >= 2) {
      ctx.beginPath();
      const first = toCanvas(vertices[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < vertices.length; i++) {
        const p = toCanvas(vertices[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 頂點
    vertices.forEach((v, i) => {
      const cp = toCanvas(v);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, draggingIdx === i ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = draggingIdx === i ? '#818cf8' : '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 頂點座標
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`(${v.x}, ${v.y})`, cp.x, cp.y - 12);
    });

    // 面積計算
    if (vertices.length >= 3) {
      let area = 0;
      for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
      }
      area = Math.abs(area) / 2;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Area: ${area.toFixed(1)} m\u00B2`, padding, canvasSize.h - 10);
    }
  }, [vertices, dimensions, canvasSize, scale, toCanvas, draggingIdx]);

  // 拖拉處理
  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getEventPos(e);
    // 找到最近的頂點
    for (let i = 0; i < vertices.length; i++) {
      const cp = toCanvas(vertices[i]);
      const dist = Math.sqrt((pos.x - cp.x) ** 2 + (pos.y - cp.y) ** 2);
      if (dist < 20) {
        setDraggingIdx(i);
        return;
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIdx === null) return;
    e.preventDefault();
    const pos = getEventPos(e);
    const worldPos = toWorld(pos.x, pos.y);

    // 限制在倉庫範圍內
    worldPos.x = Math.max(0, Math.min(dimensions.width, worldPos.x));
    worldPos.y = Math.max(0, Math.min(dimensions.depth, worldPos.y));

    const newVertices = [...vertices];
    newVertices[draggingIdx] = worldPos;
    onChange(newVertices);
  };

  const handlePointerUp = () => {
    setDraggingIdx(null);
  };

  // 雙擊新增頂點
  const handleDoubleClick = (e: React.MouseEvent) => {
    const pos = getEventPos(e);
    const worldPos = toWorld(pos.x, pos.y);
    worldPos.x = Math.max(0, Math.min(dimensions.width, worldPos.x));
    worldPos.y = Math.max(0, Math.min(dimensions.depth, worldPos.y));
    onChange([...vertices, worldPos]);
  };

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />
      <div className="absolute top-2 right-2 text-xs text-slate-400 bg-slate-800/80 rounded px-2 py-1">
        Drag vertices | Double-click to add
      </div>
    </div>
  );
}
