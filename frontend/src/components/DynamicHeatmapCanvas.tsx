import React, { useEffect, useRef, useState } from 'react';
import {
  renderDynamicRetinalHeatmap,
  HeatmapAnomalyItem,
  DynamicHeatmapOptions,
} from '../utils/dynamicHeatmapEngine';

export interface DynamicHeatmapCanvasProps {
  imageSrc: string;
  riskScore?: number;
  anomalies?: HeatmapAnomalyItem[];
  selectedEye?: string;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
  isDarkRoom?: boolean;
  onRenderComplete?: (dataUrl: string) => void;
}

export const DynamicHeatmapCanvas: React.FC<DynamicHeatmapCanvasProps> = ({
  imageSrc,
  riskScore = 35,
  anomalies = [],
  selectedEye = 'OD',
  opacity = 0.85,
  className = '',
  style = {},
  isDarkRoom = false,
  onRenderComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!imageSrc || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (isCancelled || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const w = img.naturalWidth || img.width || 512;
      const h = img.naturalHeight || img.height || 512;

      canvas.width = w;
      canvas.height = h;

      const options: DynamicHeatmapOptions = {
        riskScore,
        anomalies,
        selectedEye,
        opacity: 1.0, // Canvas lưu trữ alpha nội tại ở mức tối đa, opacity giao diện được điều khiển qua style/CSS
        isDarkRoom,
        width: w,
        height: h,
      };

      const success = renderDynamicRetinalHeatmap(img, canvas, options);
      if (success && !isCancelled) {
        setIsRendered(true);
        if (onRenderComplete) {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            onRenderComplete(dataUrl);
          } catch {
            // Safe fallback
          }
        }
      }
    };

    img.onerror = () => {
      if (isCancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = 512;
      canvas.height = 512;

      renderDynamicRetinalHeatmap(canvas, canvas, {
        riskScore,
        anomalies,
        selectedEye,
        opacity: 1.0,
        isDarkRoom,
        width: 512,
        height: 512,
      });
      setIsRendered(true);
    };

    img.src = imageSrc;

    return () => {
      isCancelled = true;
    };
  }, [imageSrc, riskScore, anomalies, selectedEye, isDarkRoom, onRenderComplete]);

  return (
    <canvas
      ref={canvasRef}
      className={`select-none pointer-events-none transition-opacity duration-150 ${className}`}
      style={{
        opacity: opacity,
        mixBlendMode: 'screen',
        ...style,
      }}
      aria-label="Dynamic Retinal XAI Grad-CAM Heatmap"
    />
  );
};
