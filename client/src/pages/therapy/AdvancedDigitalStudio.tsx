import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, 
  Eraser, 
  Undo, 
  Redo, 
  Download, 
  Layers, 
  PaintBucket,
  Brush,
  Circle,
  Square,
  Minus,
  Sparkles
} from 'lucide-react';

interface AdvancedDigitalStudioProps {
  mood?: string;
  onClose: () => void;
  onComplete?: () => void;
}

interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  visible: boolean;
  opacity: number;
}

type Tool = 'brush' | 'eraser' | 'bucket' | 'line' | 'circle' | 'rectangle';
type BrushType = 'round' | 'spray' | 'calligraphy' | 'watercolor';

export const AdvancedDigitalStudio: React.FC<AdvancedDigitalStudioProps> = ({ 
  mood = 'creative', 
  onClose, 
  onComplete 
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const compositeCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  
  // Tool state
  const [tool, setTool] = React.useState<Tool>('brush');
  const [brushType, setBrushType] = React.useState<BrushType>('round');
  const [color, setColor] = React.useState('#2563eb');
  const [brushSize, setBrushSize] = React.useState([8]);
  const [opacity, setOpacity] = React.useState([100]);
  
  // Layer state
  const [layers, setLayers] = React.useState<Layer[]>([]);
  const [activeLayerIndex, setActiveLayerIndex] = React.useState(0);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [lastPos, setLastPos] = React.useState<{ x: number; y: number } | null>(null);
  const [startPos, setStartPos] = React.useState<{ x: number; y: number } | null>(null);
  
  // History
  const [history, setHistory] = React.useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [hasDrawn, setHasDrawn] = React.useState(false);

  // Color palette
  const colorPalette = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#000000',
    '#ffffff', '#9ca3af'
  ];

  // Initialize canvas and layers
  React.useEffect(() => {
    if (!compositeCanvasRef.current) return;
    
    const canvas = compositeCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Create initial layer
    const layer = createLayer('Background');
    setLayers([layer]);
    saveToHistory();
  }, []);

  const createLayer = (name: string): Layer => {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const rect = compositeCanvasRef.current?.getBoundingClientRect();
    
    if (rect && rect.width && rect.height) {
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
    }
    
    return {
      id: `layer-${Date.now()}-${Math.random()}`,
      name,
      canvas,
      visible: true,
      opacity: 1
    };
  };

  const compositeAllLayers = () => {
    if (!compositeCanvasRef.current || layers.length === 0) return;
    
    const canvas = compositeCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    
    // Clear composite canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Draw all visible layers
    layers.forEach((layer) => {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0, rect.width, rect.height);
      }
    });
    ctx.globalAlpha = 1;
  };

  const getActiveLayer = () => layers[activeLayerIndex];

  const saveToHistory = () => {
    if (!compositeCanvasRef.current) return;
    const ctx = compositeCanvasRef.current.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, compositeCanvasRef.current.width, compositeCanvasRef.current.height);
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), imageData]);
    setHistoryIndex(prev => prev + 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      const ctx = compositeCanvasRef.current?.getContext('2d');
      if (ctx && history[historyIndex - 1]) {
        ctx.putImageData(history[historyIndex - 1], 0, 0);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      const ctx = compositeCanvasRef.current?.getContext('2d');
      if (ctx && history[historyIndex + 1]) {
        ctx.putImageData(history[historyIndex + 1], 0, 0);
      }
    }
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const drawBrush = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize[0];
    ctx.globalAlpha = opacity[0] / 100;
    
    if (brushType === 'round') {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else if (brushType === 'spray') {
      const density = 20;
      const radius = brushSize[0] / 2;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const offsetX = Math.cos(angle) * r;
        const offsetY = Math.sin(angle) * r;
        ctx.fillStyle = color;
        ctx.fillRect(to.x + offsetX, to.y + offsetY, 1, 1);
      }
    } else if (brushType === 'calligraphy') {
      ctx.save();
      ctx.lineWidth = brushSize[0];
      ctx.lineCap = 'square';
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      ctx.translate(from.x, from.y);
      ctx.rotate(angle + Math.PI / 4);
      ctx.translate(-from.x, -from.y);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    } else if (brushType === 'watercolor') {
      ctx.globalAlpha = (opacity[0] / 100) * 0.3;
      ctx.filter = 'blur(2px)';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.lineWidth = brushSize[0] * 1.5;
      ctx.stroke();
      ctx.filter = 'none';
    }
    
    ctx.globalAlpha = 1;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setLastPos(pos);
    setStartPos(pos);
    setHasDrawn(true);

    const layer = getActiveLayer();
    if (!layer) return;
    
    const ctx = layer.canvas.getContext('2d')!;

    if (tool === 'brush') {
      drawBrush(ctx, pos, pos);
      compositeAllLayers();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize[0];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize[0] / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      compositeAllLayers();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos) return;

    const pos = getCanvasCoords(e);
    const layer = getActiveLayer();
    if (!layer) return;
    
    const ctx = layer.canvas.getContext('2d')!;

    if (tool === 'brush') {
      drawBrush(ctx, lastPos, pos);
      compositeAllLayers();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize[0];
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      compositeAllLayers();
    }

    setLastPos(pos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getCanvasCoords(e);
    const layer = getActiveLayer();
    if (!layer) return;
    
    const ctx = layer.canvas.getContext('2d')!;

    if (tool === 'line' && startPos) {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize[0];
      ctx.globalAlpha = opacity[0] / 100;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      compositeAllLayers();
    } else if (tool === 'circle' && startPos) {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize[0];
      ctx.globalAlpha = opacity[0] / 100;
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      compositeAllLayers();
    } else if (tool === 'rectangle' && startPos) {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize[0];
      ctx.globalAlpha = opacity[0] / 100;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      ctx.globalAlpha = 1;
      compositeAllLayers();
    } else if (tool === 'bucket' && startPos) {
      floodFill(ctx, Math.floor(startPos.x), Math.floor(startPos.y), color);
      compositeAllLayers();
    }

    setIsDrawing(false);
    setLastPos(null);
    setStartPos(null);
    saveToHistory();
  };

  const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) => {
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const targetColor = getPixelColor(data, x, y, canvas.width);
    const fillRgb = hexToRgb(fillColor);
    
    if (!fillRgb || colorsMatch(targetColor, fillRgb)) return;
    
    const stack: [number, number][] = [[x, y]];
    const maxIterations = 50000; // Prevent infinite loops
    let iterations = 0;
    
    while (stack.length > 0 && iterations < maxIterations) {
      iterations++;
      const [px, py] = stack.pop()!;
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;
      
      const currentColor = getPixelColor(data, px, py, canvas.width);
      if (!colorsMatch(currentColor, targetColor)) continue;
      
      setPixelColor(data, px, py, canvas.width, fillRgb);
      
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2], data[index + 3]];
  };

  const setPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number, color: number[]) => {
    const index = (y * width + x) * 4;
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = 255;
  };

  const hexToRgb = (hex: string): number[] | null => {
    if (!hex || typeof hex !== 'string') return null;
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  };

  const colorsMatch = (c1: number[], c2: number[]) => {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2];
  };

  const clearCanvas = () => {
    const layer = getActiveLayer();
    if (!layer) return;
    
    const ctx = layer.canvas.getContext('2d')!;
    const rect = compositeCanvasRef.current?.getBoundingClientRect();
    if (rect) {
      ctx.clearRect(0, 0, rect.width, rect.height);
      compositeAllLayers();
      saveToHistory();
    }
  };

  const addNewLayer = () => {
    const newLayer = createLayer(`Layer ${layers.length + 1}`);
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerIndex(layers.length);
  };

  const exportPNG = () => {
    if (!compositeCanvasRef.current) return;
    compositeCanvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `art-therapy-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border-4 border-purple-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Advanced Digital Art Studio</h2>
              <p className="text-sm text-purple-100">Express your grief through digital art • Mood: {mood}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white hover:bg-white/20">
            Close
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Tools Sidebar */}
          <div className="w-20 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col items-center py-4 space-y-2">
            <Button
              size="sm"
              variant={tool === 'brush' ? 'default' : 'ghost'}
              onClick={() => setTool('brush')}
              className="w-14 h-14"
              title="Brush"
            >
              <Brush className="h-6 w-6" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'eraser' ? 'default' : 'ghost'}
              onClick={() => setTool('eraser')}
              className="w-14 h-14"
              title="Eraser"
            >
              <Eraser className="h-6 w-6" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'bucket' ? 'default' : 'ghost'}
              onClick={() => setTool('bucket')}
              className="w-14 h-14"
              title="Fill Bucket"
            >
              <PaintBucket className="h-6 w-6" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'line' ? 'default' : 'ghost'}
              onClick={() => setTool('line')}
              className="w-14 h-14"
              title="Line"
            >
              <Minus className="h-6 w-6" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'circle' ? 'default' : 'ghost'}
              onClick={() => setTool('circle')}
              className="w-14 h-14"
              title="Circle"
            >
              <Circle className="h-6 w-6" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'rectangle' ? 'default' : 'ghost'}
              onClick={() => setTool('rectangle')}
              className="w-14 h-14"
              title="Rectangle"
            >
              <Square className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Top Toolbar */}
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-3 flex items-center space-x-4 flex-wrap">
              {/* Brush Type */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Brush:</span>
                <div className="flex space-x-1">
                  {(['round', 'spray', 'calligraphy', 'watercolor'] as BrushType[]).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={brushType === type ? 'default' : 'outline'}
                      onClick={() => setBrushType(type)}
                      className="text-xs capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Size:</span>
                <Slider
                  value={brushSize}
                  onValueChange={setBrushSize}
                  min={1}
                  max={50}
                  step={1}
                  className="w-24"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{brushSize[0]}</span>
              </div>

              {/* Opacity */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Opacity:</span>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  min={1}
                  max={100}
                  step={1}
                  className="w-24"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 w-10">{opacity[0]}%</span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-auto">
                <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={clearCanvas}>
                  Clear
                </Button>
                <Button size="sm" onClick={exportPNG}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {onComplete && (
                  <Button size="sm" onClick={onComplete} disabled={!hasDrawn} variant="default" className="bg-green-600 hover:bg-green-700">
                    Complete
                  </Button>
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-gray-200 dark:bg-gray-900 p-4 overflow-auto flex items-center justify-center">
              <div 
                ref={containerRef}
                className="bg-white rounded-lg shadow-2xl border-4 border-purple-200"
                style={{ width: '800px', height: '600px' }}
              >
                <canvas
                  ref={compositeCanvasRef}
                  className="w-full h-full cursor-crosshair touch-none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-3">
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 rounded border-2 border-gray-300 cursor-pointer"
                    title="Custom Color"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded border-2 hover:scale-110 transition-transform ${
                          color === c ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Layers Panel */}
          <div className="w-56 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span className="text-sm font-medium">Layers</span>
              </div>
              <Button size="sm" variant="outline" onClick={addNewLayer} className="h-7 text-xs">
                + Add
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {layers.map((layer, idx) => (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayerIndex(idx)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    idx === activeLayerIndex
                      ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-400'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{layer.name}</div>
                  <div className="text-xs text-gray-500">
                    {layer.visible ? 'Visible' : 'Hidden'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
