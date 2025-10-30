import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { artStorageService } from '@/services/ArtStorageService';
import { Download, Save, Trash2, Undo, Redo, Layers, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedCanvasProps {
  mood: string;
  onClose: () => void;
}

type BrushType = 'pencil' | 'brush' | 'marker' | 'eraser' | 'spray';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
}

export const AdvancedCanvas: React.FC<AdvancedCanvasProps> = ({ mood, onClose }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [layers, setLayers] = React.useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = React.useState<string>('');
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Drawing settings
  const [brushType, setBrushType] = React.useState<BrushType>('brush');
  const [color, setColor] = React.useState('#111827');
  const [size, setSize] = React.useState(10);
  const [opacity, setOpacity] = React.useState(1);
  
  // UI state
  const [showLayers, setShowLayers] = React.useState(false);
  const [showPalette, setShowPalette] = React.useState(false);
  
  // Custom color palette
  const [palette, setPalette] = React.useState<string[]>([
    '#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#f97316',
  ]);
  
  const pos = React.useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas with first layer
  React.useEffect(() => {
    if (layers.length === 0) {
      const initialLayer = createLayer('Background');
      setLayers([initialLayer]);
      setActiveLayerId(initialLayer.id);
    }
  }, []);

  const createLayer = (name: string): Layer => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    
    return {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      visible: true,
      opacity: 1,
      canvas,
    };
  };

  const getActiveLayer = (): Layer | undefined => {
    return layers.find(l => l.id === activeLayerId);
  };

  const renderComposite = () => {
    if (!containerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = '';
    
    // Create composite view
    layers.forEach(layer => {
      if (layer.visible) {
        const layerDiv = document.createElement('div');
        layerDiv.style.position = 'absolute';
        layerDiv.style.top = '0';
        layerDiv.style.left = '0';
        layerDiv.style.opacity = layer.opacity.toString();
        layerDiv.appendChild(layer.canvas);
        layer.canvas.style.pointerEvents = layer.id === activeLayerId ? 'auto' : 'none';
        containerRef.current.appendChild(layerDiv);
      }
    });

    // Attach drawing handlers to active layer
    const activeLayer = getActiveLayer();
    if (activeLayer) {
      activeLayer.canvas.onpointerdown = handlePointerDown;
      activeLayer.canvas.onpointermove = handlePointerMove;
      activeLayer.canvas.onpointerup = handlePointerUp;
      activeLayer.canvas.onpointerleave = handlePointerUp;
    }
  };

  React.useEffect(() => {
    renderComposite();
  }, [layers, activeLayerId]);

  const handlePointerDown = (e: PointerEvent) => {
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    pos.current = { x, y };
    
    // Start drawing
    if (brushType === 'spray') {
      drawSpray(x, y);
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDrawing || !pos.current) return;
    
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draw(pos.current.x, pos.current.y, x, y);
    pos.current = { x, y };
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    pos.current = null;
  };

  const draw = (x1: number, y1: number, x2: number, y2: number) => {
    const layer = getActiveLayer();
    if (!layer) return;
    
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalAlpha = opacity;
    
    switch (brushType) {
      case 'pencil':
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 0.5;
        ctx.globalAlpha = opacity * 0.8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
        
      case 'brush':
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
        
      case 'marker':
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 1.5;
        ctx.globalAlpha = opacity * 0.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
        
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = size * 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        break;
        
      case 'spray':
        drawSpray(x2, y2);
        break;
    }
    
    renderComposite();
  };

  const drawSpray = (x: number, y: number) => {
    const layer = getActiveLayer();
    if (!layer) return;
    
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity * 0.1;
    
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    
    renderComposite();
  };

  const addLayer = () => {
    const newLayer = createLayer(`Layer ${layers.length + 1}`);
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const deleteLayer = (id: string) => {
    if (layers.length === 1) return; // Keep at least one layer
    const filtered = layers.filter(l => l.id !== id);
    setLayers(filtered);
    if (id === activeLayerId && filtered.length > 0) {
      setActiveLayerId(filtered[0].id);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(layers.map(l => 
      l.id === id ? { ...l, visible: !l.visible } : l
    ));
  };

  const clearCanvas = () => {
    const layer = getActiveLayer();
    if (!layer) return;
    
    const ctx = layer.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      renderComposite();
    }
  };

  const addColorToPalette = () => {
    if (!palette.includes(color)) {
      setPalette([...palette, color]);
    }
  };

  const handleSaveArtwork = async () => {
    setIsSaving(true);
    try {
      // Create composite canvas
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = 800;
      compositeCanvas.height = 600;
      const ctx = compositeCanvas.getContext('2d');
      if (!ctx) return;

      // Draw all visible layers
      layers.forEach(layer => {
        if (layer.visible) {
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(layer.canvas, 0, 0);
        }
      });

      const canvasDataUrl = compositeCanvas.toDataURL('image/png');
      
      await artStorageService.saveArtwork({
        title: `Digital Art - ${new Date().toLocaleDateString()}`,
        activityType: 'digital-canvas' as any,
        mood,
        canvasDataUrl,
        strokes: [], // Not tracking individual strokes for advanced canvas
      });
      
      alert('Artwork saved successfully!');
    } catch (error) {
      console.error('Error saving artwork:', error);
      alert('Failed to save artwork');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPNG = () => {
    // Create composite
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = 800;
    compositeCanvas.height = 600;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    layers.forEach(layer => {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });

    compositeCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `digital-art-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Advanced Digital Canvas</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-y-auto">
            <div>
              <label className="text-sm font-semibold mb-2 block">Brush Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['pencil', 'brush', 'marker', 'eraser', 'spray'] as BrushType[]).map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant={brushType === type ? 'default' : 'outline'}
                    onClick={() => setBrushType(type)}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Color</label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer"
                />
                <Button size="sm" variant="outline" onClick={addColorToPalette}>
                  Add to Palette
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {palette.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-8 w-8 rounded border-2",
                      color === c ? "border-blue-500" : "border-gray-300"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Size: {size}px</label>
              <input
                type="range"
                min={1}
                max={50}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Opacity: {Math.round(opacity * 100)}%</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => setShowLayers(!showLayers)} className="w-full mb-2">
                <Layers className="h-4 w-4 mr-2" />
                Layers ({layers.length})
              </Button>
              
              {showLayers && (
                <div className="space-y-2">
                  {layers.map((layer, idx) => (
                    <div
                      key={layer.id}
                      className={cn(
                        "p-2 rounded border text-sm",
                        layer.id === activeLayerId ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => setActiveLayerId(layer.id)}
                          className="font-medium flex-1 text-left"
                        >
                          {layer.name}
                        </button>
                        <button
                          onClick={() => toggleLayerVisibility(layer.id)}
                          className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                        >
                          {layer.visible ? '👁️' : '👁️‍🗨️'}
                        </button>
                        {layers.length > 1 && (
                          <button
                            onClick={() => deleteLayer(layer.id)}
                            className="text-red-500 hover:text-red-700 ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button size="sm" onClick={addLayer} className="w-full">
                    + Add Layer
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t space-y-2">
              <Button size="sm" variant="outline" onClick={clearCanvas} className="w-full">
                Clear Layer
              </Button>
              <Button size="sm" variant="outline" onClick={handleSaveArtwork} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportPNG} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export PNG
              </Button>
            </div>

            <div className="pt-2 border-t text-xs text-gray-500">
              <p>Mood: <span className="font-semibold">{mood}</span></p>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
            <div className="relative bg-white rounded-lg shadow-xl" style={{ width: 800, height: 600 }}>
              <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
