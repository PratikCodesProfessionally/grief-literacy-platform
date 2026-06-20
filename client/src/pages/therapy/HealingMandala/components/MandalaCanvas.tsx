import * as React from 'react';
import { TemplateKey } from '../types';
import { NS } from '../constants';

interface MandalaCanvasProps {
  containerRef: React.RefObject<HTMLDivElement>;
  template: TemplateKey;
  canvasSize: { width: number; height: number };
  lineColor: string;
  stroke: number;
  isDragging: boolean;
  onPaint: (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => void;
  templateSVG?: SVGSVGElement | null;
  zoom: number;
}

export const MandalaCanvas: React.FC<MandalaCanvasProps> = ({
  containerRef,
  template,
  canvasSize,
  lineColor,
  stroke,
  isDragging,
  onPaint,
  templateSVG,
  zoom,
}) => {
  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-300 dark:border-slate-700 overflow-hidden ${
        isDragging ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
      }}
    >
      {/* The SVG will be mounted here by the parent component */}
      {templateSVG && (
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.2s ease',
          }}
        >
          <svg
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseMove={onPaint}
            onMouseDown={onPaint}
            onTouchMove={onPaint}
            onTouchStart={onPaint}
            style={{
              stroke: lineColor,
              strokeWidth: stroke,
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            {/* Template SVG content injected here */}
          </svg>
        </div>
      )}
    </div>
  );
};
