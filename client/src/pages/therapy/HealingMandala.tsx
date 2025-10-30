import * as React from 'react';
import { Button } from '@/components/ui/button';
import { artStorageService } from '@/services/ArtStorageService';
import { Save } from 'lucide-react';

interface HealingMandalaProps {
  mood: string;
  onClose: () => void;
  onComplete?: () => void;
}

type PaintableEl = SVGPathElement | SVGPolygonElement | SVGRectElement | SVGCircleElement;

export const HealingMandala: React.FC<HealingMandalaProps> = ({ mood, onClose, onComplete }) => {
  // Core controls
  const [petals, setPetals] = React.useState(16);
  const [rings, setRings] = React.useState(6);
  const [stroke, setStroke] = React.useState(2);
  const [lineColor, setLineColor] = React.useState('#111827');

  // Painting controls
  const [selectedColor, setSelectedColor] = React.useState('#f472b6'); // initial pink
  const [mode, setMode] = React.useState<'paint' | 'erase' | 'eyedropper'>('paint');
  const [isSaving, setIsSaving] = React.useState(false);

  // Keep latest values available to the click handler (avoid stale closure)
  const selectedColorRef = React.useRef(selectedColor);
  const modeRef = React.useRef(mode);
  React.useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  React.useEffect(() => { modeRef.current = mode; }, [mode]);

  const [seed, setSeed] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [undoStack, setUndoStack] = React.useState<string[]>([]);

  const palette = [
    '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#ec4899', '#f43f5e', '#eab308', '#84cc16', '#14b8a6',
    '#0ea5e9', '#4f46e5', '#a855f7', '#f472b6', '#94a3b8'
  ];

  // Simple RNG
  const prng = React.useMemo(() => {
    let x = seed;
    return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }, [seed]);

  // Save SVG (for undo)
  const snapshot = React.useCallback(() => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    setUndoStack((st) => [...st.slice(-14), s]);
  }, []);

  const undo = () => {
    if (!undoStack.length || !svgRef.current) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((st) => st.slice(0, -1));
    const doc = new DOMParser().parseFromString(last, 'image/svg+xml');
    const newSvg = doc.documentElement as SVGSVGElement;
    svgRef.current.replaceWith(newSvg);
    svgRef.current = newSvg;
    attachPaintHandlers();
  };

  // Build procedural mandala
  const buildProcedural = () => {
    const width = 500, height = 500, cx = width / 2, cy = height / 2;
    const NS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-[420px] bg-white');
    svg.setAttribute('xmlns', NS);

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${cx},${cy})`);
    svg.appendChild(g);

    // Concentric ring slices
    for (let ri = 0; ri < rings; ri++) {
      const rInner = 16 + ri * 28;
      const rOuter = rInner + 22;
      for (let pi = 0; pi < petals; pi++) {
        const a0 = (pi * 2 * Math.PI) / petals;
        const a1 = ((pi + 1) * 2 * Math.PI) / petals;

        const x0 = rInner * Math.cos(a0), y0 = rInner * Math.sin(a0);
        const x1 = rInner * Math.cos(a1), y1 = rInner * Math.sin(a1);
        const X0 = rOuter * Math.cos(a0), Y0 = rOuter * Math.sin(a0);
        const X1 = rOuter * Math.cos(a1), Y1 = rOuter * Math.sin(a1);

        const largeArc = a1 - a0 > Math.PI ? 1 : 0;
        const d = [
          `M ${x0} ${y0}`,
          `A ${rInner} ${rInner} 0 ${largeArc} 1 ${x1} ${y1}`,
          `L ${X1} ${Y1}`,
          `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${X0} ${Y0}`,
          'Z'
        ].join(' ');

        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', '#ffffff');
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width', String(stroke));
        path.setAttribute('data-part', `ring-${ri}-petal-${pi}`);
        g.appendChild(path);
      }
    }

    // Decorative leaves
    const leafCount = petals;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * 360) / leafCount;
      const leaf = document.createElementNS(NS, 'path');
      const r1 = 40 + prng() * 8;
      const r2 = 140 + (prng() - 0.5) * 16;
      const r3 = 220 + (prng() - 0.5) * 16;
      const pathD = `
        M 0 ${-r1}
        C 30 ${-r1 - 30}, 60 ${-r2}, 0 ${-r3}
        C -60 ${-r2}, -30 ${-r1 - 30}, 0 ${-r1}
        Z
      `;
      leaf.setAttribute('d', pathD);
      leaf.setAttribute('transform', `rotate(${angle})`);
      leaf.setAttribute('fill', '#ffffff');
      leaf.setAttribute('stroke', lineColor);
      leaf.setAttribute('stroke-width', String(stroke));
      leaf.setAttribute('data-part', `leaf-${i}`);
      g.appendChild(leaf);
    }

    // Center
    const center = document.createElementNS(NS, 'circle');
    center.setAttribute('r', '14');
    center.setAttribute('fill', '#ffffff');
    center.setAttribute('stroke', lineColor);
    center.setAttribute('stroke-width', String(stroke));
    center.setAttribute('data-part', 'center');
    g.appendChild(center);

    return svg;
  };

  // Render mandala
  const renderTemplate = React.useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    c.innerHTML = '';
    const svgEl = buildProcedural();
    c.appendChild(svgEl);
    svgRef.current = svgEl;
    attachPaintHandlers();
    snapshot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petals, rings, stroke, lineColor, seed]);

  // Click-to-paint handler (uses refs for freshest values)
  const handlePaint = (e: MouseEvent) => {
    const target = e.target as Element;
    if (
      !(target instanceof SVGPathElement ||
        target instanceof SVGPolygonElement ||
        target instanceof SVGRectElement ||
        target instanceof SVGCircleElement)
    ) return;

    const modeNow = modeRef.current;
    const colorNow = selectedColorRef.current;

    if (modeNow === 'eyedropper') {
      const current = (target as PaintableEl).getAttribute('fill') || '#ffffff';
      setSelectedColor(current);
      setMode('paint');
      return;
    }

    snapshot(); // before change
    if (modeNow === 'erase') {
      (target as PaintableEl).setAttribute('fill', '#ffffff');
    } else {
      (target as PaintableEl).setAttribute('fill', colorNow);
    }
  };

  const attachPaintHandlers = () => {
    svgRef.current?.addEventListener('click', handlePaint);
  };

  React.useEffect(() => {
    renderTemplate();
    return () => svgRef.current?.removeEventListener('click', handlePaint);
  }, [renderTemplate]);

  // Update strokes live
  React.useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current
      .querySelectorAll<PaintableEl>('path, polygon, rect, circle')
      .forEach(el => {
        el.setAttribute('stroke', lineColor);
        el.setAttribute('stroke-width', String(stroke));
      });
  }, [lineColor, stroke]);

  const randomize = () => setSeed(s => s + 1);

  const handleSaveArtwork = async () => {
    if (!svgRef.current) return;
    
    setIsSaving(true);
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      await artStorageService.saveArtwork({
        title: `Healing Mandala - ${new Date().toLocaleDateString()}`,
        activityType: 'healing-mandala',
        mood,
        svgData,
        config: {
          petals,
          rings,
          stroke,
          lineColor,
        },
      });
      alert('Mandala saved successfully!');
    } catch (error) {
      console.error('Error saving mandala:', error);
      alert('Failed to save mandala');
    } finally {
      setIsSaving(false);
    }
  };

  // Export helpers
  const exportSVG = () => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mandala.svg'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const box = svgRef.current!.viewBox.baseVal;
      const canvas = document.createElement('canvas');
      canvas.width = box.width; canvas.height = box.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url; a.download = 'mandala.png'; a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = svgUrl;
  };

  const clearColors = () => {
    if (!svgRef.current) return;
    snapshot();
    svgRef.current
      .querySelectorAll<PaintableEl>('path, polygon, rect, circle')
      .forEach(el => el.setAttribute('fill', '#ffffff'));
  };

  const canComplete = true;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-5xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Healing Mandala</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Paint segments to create your calming pattern. Current mood: <b>{mood}</b>
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">Petals</label>
          <input type="range" min={8} max={40} value={petals} onChange={(e) => setPetals(Number(e.target.value))} />
          <label className="text-sm">Rings</label>
          <input type="range" min={3} max={10} value={rings} onChange={(e) => setRings(Number(e.target.value))} />
          <label className="text-sm">Stroke</label>
          <input type="range" min={1} max={6} value={stroke} onChange={(e) => setStroke(Number(e.target.value))} />
          <div className="flex items-center gap-2">
            <span className="text-sm">Line</span>
            <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} className="h-8 w-8 rounded" />
          </div>

          <Button size="sm" variant="outline" onClick={randomize}>Randomize</Button>

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={undo} disabled={!undoStack.length}>Undo</Button>
            <Button size="sm" variant="outline" onClick={clearColors}>Clear</Button>
            <Button size="sm" variant="outline" onClick={handleSaveArtwork} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={exportSVG}>Save SVG</Button>
            <Button size="sm" onClick={exportPNG}>Save PNG</Button>
            {onComplete && <Button size="sm" onClick={onComplete} disabled={!canComplete}>Complete</Button>}
          </div>
        </div>

        {/* Paint modes + palette */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button size="sm" variant={mode === 'paint' ? 'default' : 'outline'} onClick={() => setMode('paint')}>Paint</Button>
            <Button size="sm" variant={mode === 'erase' ? 'default' : 'outline'} onClick={() => setMode('erase')}>Erase</Button>
            <Button size="sm" variant={mode === 'eyedropper' ? 'default' : 'outline'} onClick={() => setMode('eyedropper')}>Eyedropper</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Fill</span>
            <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="h-8 w-8 rounded" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {palette.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className="h-7 w-7 rounded border border-gray-300"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white">
          <div ref={containerRef} className="w-full h-[420px]" />
        </div>
      </div>
    </div>
  );
};
