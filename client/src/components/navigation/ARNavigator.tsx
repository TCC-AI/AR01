import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Point3D, Product } from '@shared/types';

interface ARNavigatorProps {
  /** 導航路徑點 */
  waypoints: Point3D[];
  /** 目標貨物 */
  targetProduct: Product;
  /** 距離 (公尺) */
  distance: number;
  /** 預估時間 (秒) */
  estimatedTime: number;
  /** 關閉導航 */
  onClose: () => void;
  /** 是否啟用 AR 模式 */
  isARMode: boolean;
}

/**
 * AR 導航元件
 * - 在 3D 空間中顯示導航路線 (發光箭頭)
 * - 在目標位置顯示貨物資訊卡片 (AR 浮現)
 * - 顯示距離和預估步行時間
 */
export default function ARNavigator({
  waypoints,
  targetProduct,
  distance,
  estimatedTime,
  onClose,
  isARMode,
}: ARNavigatorProps) {
  return (
    <div className="fixed inset-0 bg-black">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 75 }}
        style={{ background: isARMode ? 'transparent' : '#0f172a' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />
        <Environment preset="warehouse" />

        {/* 導航路線 */}
        <NavigationPath waypoints={waypoints} />

        {/* 目標貨物標記 */}
        <ProductMarker product={targetProduct} />

        {/* 地面格線 */}
        <gridHelper args={[50, 50, '#1e293b', '#0f172a']} />
      </Canvas>

      {/* 頂部資訊欄 */}
      <div className="absolute top-0 left-0 right-0 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="glass rounded-full w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="glass rounded-full px-4 py-2">
            <div className="text-sm font-medium text-center">
              Navigating to: {targetProduct.name}
            </div>
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* 底部資訊 */}
      <div className="absolute bottom-0 left-0 right-0 safe-area-bottom p-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-4">
            {/* 貨物縮圖 */}
            <div className="w-16 h-16 rounded-xl bg-slate-700 shrink-0 overflow-hidden">
              {targetProduct.images.length > 0 ? (
                <img
                  src={targetProduct.images[0]}
                  alt={targetProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>

            {/* 資訊 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{targetProduct.name}</h3>
              <p className="text-xs text-slate-400">
                {targetProduct.location.label} | {targetProduct.quantity} {targetProduct.unit}
              </p>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-primary-400">
                  {distance < 1 ? `${(distance * 100).toFixed(0)}cm` : `${distance.toFixed(1)}m`}
                </span>
                <span className="text-slate-400">
                  ~{estimatedTime < 60 ? `${estimatedTime}s` : `${Math.round(estimatedTime / 60)}min`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3D 導航路徑 (發光線條 + 動畫箭頭)
 */
function NavigationPath({ waypoints }: { waypoints: Point3D[] }) {
  const arrowRef = useRef<THREE.Mesh>(null);

  const points = useMemo(
    () => waypoints.map((w) => new THREE.Vector3(w.x, 0.1, w.z)),
    [waypoints],
  );

  // 箭頭沿路徑移動動畫
  useFrame(({ clock }) => {
    if (!arrowRef.current || points.length < 2) return;

    const t = (clock.getElapsedTime() * 0.3) % 1;
    const totalLen = points.reduce((sum, p, i) => {
      if (i === 0) return 0;
      return sum + p.distanceTo(points[i - 1]);
    }, 0);

    let walked = t * totalLen;
    for (let i = 1; i < points.length; i++) {
      const segLen = points[i].distanceTo(points[i - 1]);
      if (walked <= segLen) {
        const ratio = walked / segLen;
        const pos = points[i - 1].clone().lerp(points[i], ratio);
        arrowRef.current.position.copy(pos);

        // 朝向下一個點
        const dir = points[i].clone().sub(points[i - 1]).normalize();
        arrowRef.current.lookAt(pos.clone().add(dir));
        break;
      }
      walked -= segLen;
    }
  });

  if (points.length < 2) return null;

  return (
    <group>
      {/* 路徑線條 */}
      <Line
        points={points}
        color="#6366f1"
        lineWidth={4}
        dashed
        dashScale={2}
        dashSize={0.5}
        gapSize={0.3}
      />

      {/* 路徑下方光暈 */}
      <Line
        points={points.map((p) => new THREE.Vector3(p.x, 0.05, p.z))}
        color="#818cf8"
        lineWidth={8}
        transparent
        opacity={0.3}
      />

      {/* 移動箭頭 */}
      <mesh ref={arrowRef} position={[0, 0.3, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial
          color="#a5b4fc"
          emissive="#6366f1"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

/**
 * 目標貨物 3D 標記 (浮動圖標 + 資訊卡)
 */
function ProductMarker({ product }: { product: Product }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // 上下浮動
      groupRef.current.position.y =
        product.location.position.y + 1.5 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[product.location.position.x, 1.5, product.location.position.z]}>
      {/* 光柱 */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.02, 0.1, 1.5, 8]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.8}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* 標記球體 */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#818cf8"
          emissive="#4f46e5"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* HTML 標籤 */}
      <Html distanceFactor={8} position={[0, 0.5, 0]} center>
        <div className="glass rounded-lg px-3 py-2 text-center whitespace-nowrap pointer-events-none">
          <div className="text-sm font-bold">{product.name}</div>
          <div className="text-xs text-slate-300">{product.location.label}</div>
        </div>
      </Html>

      {/* 地面圓圈 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -product.location.position.y - 1.4, 0]}
      >
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.4}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
