import { useState, useRef, useCallback } from 'react';

interface SpatialMapperProps {
  warehouseId: string;
  onPhotoTaken: (imageBase64: string) => Promise<void>;
  photoCount: number;
  requiredPhotos: number;
  onComplete: () => void;
}

/**
 * 多角度拍照空間構圖模組
 * - 啟動手機相機拍攝倉庫各個角度
 * - 顯示拍攝進度和覆蓋率
 * - 提供拍攝角度提示
 */
export default function SpatialMapper({
  warehouseId: _warehouseId,
  onPhotoTaken,
  photoCount,
  requiredPhotos,
  onComplete,
}: SpatialMapperProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const coveragePercent = Math.min(100, (photoCount / requiredPhotos) * 100);

  const captureAngles = [
    { label: 'Front entrance', icon: '\u2B06\uFE0F' },
    { label: 'Left wall', icon: '\u2B05\uFE0F' },
    { label: 'Right wall', icon: '\u27A1\uFE0F' },
    { label: 'Back wall', icon: '\u2B07\uFE0F' },
    { label: 'Center overview', icon: '\u{1F50D}' },
    { label: 'Left corner detail', icon: '\u2196\uFE0F' },
    { label: 'Right corner detail', icon: '\u2197\uFE0F' },
    { label: 'Ceiling/height ref', icon: '\u2B06\uFE0F' },
  ];

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    setIsProcessing(true);
    try {
      await onPhotoTaken(imageBase64);
    } finally {
      setIsProcessing(false);
    }
  }, [onPhotoTaken]);

  return (
    <div className="space-y-4">
      {/* 進度條 */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Spatial Mapping Progress</h3>
          <span className="text-sm text-primary-400">
            {photoCount}/{requiredPhotos} photos
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Coverage: {coveragePercent.toFixed(0)}%
          {coveragePercent >= 100 && ' - Ready to generate map!'}
        </p>
      </div>

      {/* 拍攝角度提示 */}
      <div className="card">
        <h4 className="text-sm font-medium mb-3">Suggested capture angles:</h4>
        <div className="grid grid-cols-4 gap-2">
          {captureAngles.map((angle, i) => (
            <div
              key={i}
              className={`text-center p-2 rounded-lg text-xs ${
                i < photoCount
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              <div className="text-lg">{angle.icon}</div>
              <div className="mt-1 leading-tight">{angle.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 相機區域 */}
      {isCameraActive ? (
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* 拍攝十字線 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border-2 border-white/50 rounded-lg" />
            <div className="absolute w-0.5 h-8 bg-white/30" />
            <div className="absolute w-8 h-0.5 bg-white/30" />
          </div>

          {/* 控制按鈕 */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button
              onClick={stopCamera}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={capturePhoto}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center
                ${isProcessing ? 'opacity-50' : 'active:scale-95'}`}
            >
              <div className={`w-12 h-12 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-white'}`} />
            </button>
            <div className="w-12" />
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Analyzing with AI...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button onClick={startCamera} className="btn-primary w-full">
          Open Camera to Scan
        </button>
      )}

      {/* 生成地圖按鈕 */}
      {photoCount >= requiredPhotos && (
        <button onClick={onComplete} className="btn-primary w-full bg-green-600 hover:bg-green-700">
          Generate Spatial Map
        </button>
      )}
    </div>
  );
}
