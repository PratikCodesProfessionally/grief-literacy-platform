import * as React from 'react';
import { Button } from '@/components/ui/button';
import { artStorageService } from '@/services/ArtStorageService';
import { Download, Save } from 'lucide-react';

interface SymbolicDrawingProps {
  mood: string;
  onClose: () => void;
  onComplete?: () => void;
}

export const SymbolicDrawing: React.FC<SymbolicDrawingProps> = ({ mood, onClose, onComplete }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = React.useState('#111827'); // gray-900
  const [size, setSize] = React.useState(4);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasStroke, setHasStroke] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [strokes, setStrokes] = React.useState<Array<{
    color: string;
    size: number;
    points: Array<{ x: number; y: number }>;
  }>>([]);
  const currentStroke = React.useRef<Array<{ x: number; y: number }>>([]);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = React.useRef<{ x: number; y: number } | null>(null);

  const start = (x: number, y: number) => {
    setIsDrawing(true);
    pos.current = { x, y };
    currentStroke.current = [{ x, y }];
  };

  const move = (x: number, y: number) => {
    if (!isDrawing || !pos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(pos.current.x, pos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    pos.current = { x, y };
    currentStroke.current.push({ x, y });
    setHasStroke(true);
  };

  const stop = () => {
    if (isDrawing && currentStroke.current.length > 0) {
      setStrokes(prev => [...prev, {
        color,
        size,
        points: [...currentStroke.current]
      }]);
    }
    setIsDrawing(false);
    pos.current = null;
    currentStroke.current = [];
  };

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    start(e.clientX - rect.left, e.clientY - rect.top);
  };
  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    move(e.clientX - rect.left, e.clientY - rect.top);
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    setStrokes([]);
  };

  const handleSaveArtwork = async () => {
    if (!hasStroke || !canvasRef.current) return;
    
    setIsSaving(true);
    try {
      const canvasDataUrl = canvasRef.current.toDataURL('image/png');
      await artStorageService.saveArtwork({
        title: `Symbolic Drawing - ${new Date().toLocaleDateString()}`,
        activityType: 'symbolic-drawing',
        mood,
        canvasDataUrl,
        strokes,
      });
      alert('Drawing saved successfully!');
    } catch (error) {
      console.error('Error saving drawing:', error);
      alert('Failed to save drawing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPNG = () => {
    if (!hasStroke || !canvasRef.current) return;
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `symbolic-drawing-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Symbolic Drawing</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Draw symbols and metaphors that reflect your journey. Current mood: <b>{mood}</b>
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-9 rounded" />
          <label className="text-sm">Size</label>
          <input
            type="range"
            min={1}
            max={16}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSaveArtwork} disabled={!hasStroke || isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPNG} disabled={!hasStroke}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            {onComplete && (
              <Button size="sm" onClick={onComplete} disabled={!hasStroke}>Complete</Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-[360px] touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stop}
            onPointerLeave={stop}
          />
        </div>
      </div>
    </div>
  );
};
