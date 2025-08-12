import * as React from 'react';
import { Button } from '@/components/ui/button';

/**
 * TIP: Put 1–2 complex SVG mandalas in /src/assets/mandalas/
 * Make sure each paintable shape has either an id or becomes a <path>/<polygon>/<rect>/<circle>.
 * With Vite you can import raw SVG strings using '?raw' like this:
 *
 * import floralSvg from '@/assets/mandalas/floral.svg?raw';
 * import gemSvg from '@/assets/mandalas/gem.svg?raw';
 *
 * If you don't have assets yet, comment these two lines and keep using the Procedural template.
 */
//import floralSvg from '@/assets/mandalas/floral.svg?raw';
//import gemSvg from '@/assets/mandalas/gem.svg?raw';

interface HealingMandalaProps {
  mood: string;
  onClose: () => void;
  onComplete?: () => void;
}

type TemplateKey = 'procedural' | 'floral' | 'gem';
type PaintableEl = SVGPathElement | SVGPolygonElement | SVGRectElement | SVGCircleElement;

export const HealingMandala: React.FC<HealingMandalaProps> = ({ mood, onClose, onComplete }) => {
  // ── UI state ───────────────────────────────────────────────────────────────────
  const [template, setTemplate] = React.useState<TemplateKey>('procedural');
  const [petals, setPetals] = React.useState(16);
  const [rings, setRings] = React.useState(6);
  const [stroke, setStroke] = React.useState(2);

  const [lineColor, setLineColor] = React.useState('#111827'); // stroke color
  const [selectedColor, setSelectedColor] = React.useState('#f472b6'); // paint color
  const [mode, setMode] = React.useState<'paint' | 'erase' | 'eyedropper'>('paint');

  const [seed, setSeed] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const [undoStack, setUndoStack] = React.useState<string[]>([]); // serialized SVG strings

  // ── Color palette ──────────────────────────────────────────────────────────────
  const palette = [
    '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#ec4899', '#f43f5e', '#eab308', '#84cc16', '#14b8a6',
    '#0ea5e9', '#4f46e5', '#a855f7', '#f472b6', '#94a3b8'
  ];

  // ── Simple deterministic RNG for procedural variety ───────────────────────────
  const prng = React.useMemo(() => {
    let x = seed;
    return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }, [seed]);

  // ── Save current SVG for undo ─────────────────────────────────────────────────
  const snapshot = React.useCallback(() => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    setUndoStack((st) => [...st.slice(-14), s]); // keep last 15
  }, []);

  const undo = () => {
    if (!undoStack.length || !svgRef.current) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((st) => st.slice(0, -1));
    // Replace current SVG with last snapshot
    const parser = new DOMParser();
    const doc = parser.parseFromString(last, 'image/svg+xml');
    const newSvg = doc.documentElement as SVGSVGElement;
    svgRef.current.replaceWith(newSvg);
    svgRef.current = newSvg;
    // Rebind events after swap
    attachPaintHandlers();
  };

  // ── Build procedural mandala (paintable segments) ─────────────────────────────
  const buildProcedural = () => {
    const width = 500;
    const height = 500;
    const cx = width / 2;
    const cy = height / 2;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-[420px] bg-white');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Root group
    const g = document.createElementNS(svg.namespaceURI, 'g');
    g.setAttribute('transform', `translate(${cx},${cy})`);
    svg.appendChild(g);

    // Concentric rings as paintable donuts
    const ringCount = rings;
    for (let ri = 0; ri < ringCount; ri++) {
      const rInner = 16 + ri * 28;
      const rOuter = rInner + 22;
      for (let pi = 0; pi < petals; pi++) {
        const a0 = (pi * 2 * Math.PI) / petals;
        const a1 = ((pi + 1) * 2 * Math.PI) / petals;
        const path = document.createElementNS(svg.namespaceURI, 'path');

        // donut slice (two arcs)
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

        path.setAttribute('d', d);
        path.setAttribute('fill', '#ffffff'); // paintable
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width', String(stroke));
        path.setAttribute('data-part', `ring-${ri}-petal-${pi}`);
        g.appendChild(path);
      }
    }

    // Decorative leaf petals
    const leafCount = petals;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * 360) / leafCount;
      const leaf = document.createElementNS(svg.namespaceURI, 'path');
      const r1 = 40 + prng() * 8;
      const r2 = 140 + riRand();
      const r3 = 220 + riRand();
      function riRand() { return (prng() - 0.5) * 16; }
      const path = `
        M 0 ${-r1}
        C ${30} ${-r1 - 30}, ${60} ${-r2}, 0 ${-r3}
        C ${-60} ${-r2}, ${-30} ${-r1 - 30}, 0 ${-r1}
        Z
      `;
      leaf.setAttribute('d', path);
      leaf.setAttribute('transform', `rotate(${angle})`);
      leaf.setAttribute('fill', '#ffffff'); // paintable
      leaf.setAttribute('stroke', lineColor);
      leaf.setAttribute('stroke-width', String(stroke));
      leaf.setAttribute('data-part', `leaf-${i}`);
      g.appendChild(leaf);
    }

    // Center
    const center = document.createElementNS(svg.namespaceURI, 'circle');
    center.setAttribute('r', '14');
    center.setAttribute('fill', '#ffffff'); // paintable
    center.setAttribute('stroke', lineColor);
    center.setAttribute('stroke-width', String(stroke));
    center.setAttribute('data-part', 'center');
    g.appendChild(center);

    return svg;
  };

  // ── Render selected template into container ───────────────────────────────────
  const renderTemplate = React.useCallback(() => {
    const c = containerRef.current;
    if (!c) return;

    // clear previous
    c.innerHTML = '';

    let svgEl: SVGSVGElement | null = null;

    if (template === 'procedural') {
      svgEl = buildProcedural();
    } else {
      // From raw SVG string -> DOM
      const raw = template === 'floral' ? floralSvg : gemSvg;
      const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
      svgEl = doc.documentElement as SVGSVGElement;

      // normalize sizing + styles
      svgEl.setAttribute('class', 'w-full h-[420px] bg-white');
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      // Ensure shapes are paintable: give default fill if missing and unify stroke
      const paintables = svgEl.querySelectorAll<PaintableEl>('path, polygon, rect, circle');
      paintables.forEach(el => {
        if (!el.getAttribute('fill') || el.getAttribute('fill') === 'none') {
          el.setAttribute('fill', '#ffffff'); // default white so user can paint
        }
        el.setAttribute('stroke', lineColor);
        el.setAttribute('stroke-width', String(stroke));
      });
    }

    c.appendChild(svgEl!);
    svgRef.current = svgEl!;
    attachPaintHandlers();
    snapshot(); // initial state for undo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, petals, rings, stroke, lineColor, seed]);

  // ── Attach click handlers to paint segments (event delegation) ────────────────
  const handlePaint = (e: MouseEvent) => {
    const target = e.target as Element;
    if (!svgRef.current) return;
    if (!(target instanceof SVGPathElement || target instanceof SVGPolygonElement || target instanceof SVGRectElement || target instanceof SVGCircleElement)) {
      return;
    }
    // Ignore container/background clicks
    if (target.tagName.toLowerCase() === 'svg' || target.tagName.toLowerCase() === 'g') return;

    if (mode === 'eyedropper') {
      const current = target.getAttribute('fill') || '#ffffff';
      setSelectedColor(current);
      setMode('paint');
      return;
    }

    snapshot(); // record before change

    if (mode === 'erase') {
      target.setAttribute('fill', '#ffffff');
    } else {
      target.setAttribute('fill', selectedColor);
    }
  };

  const attachPaintHandlers = () => {
    svgRef.current?.addEventListener('click', handlePaint);
  };

  React.useEffect(() => {
    renderTemplate();
    return () => {
      svgRef.current?.removeEventListener('click', handlePaint);
    };
  }, [renderTemplate]);

  // If stroke color/width change, update current SVG strokes
  React.useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.querySelectorAll<PaintableEl>('path, polygon, rect, circle').forEach(el => {
      el.setAttribute('stroke', lineColor);
      el.setAttribute('stroke-width', String(stroke));
    });
  }, [lineColor, stroke]);

  const randomize = () => setSeed(s => s + 1);

  // ── Export utilities ──────────────────────────────────────────────────────────
  const exportSVG = () => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandala-${template}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = async () => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const box = svgRef.current!.viewBox.baseVal;
      canvas.width = box.width;
      canvas.height = box.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mandala-${template}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = svgUrl;
  };

  const clearColors = () => {
    if (!svgRef.current) return;
    snapshot();
    svgRef.current.querySelectorAll<PaintableEl>('path, polygon, rect, circle').forEach(el => {
      el.setAttribute('fill', '#ffffff');
    });
  };

  const canComplete = true;

  // ── UI ────────────────────────────────────────────────────────────────────────
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
          <label className="text-sm">Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateKey)}
            className="border rounded px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value="procedural">Procedural (simple)</option>
            <option value="floral">Floral (complex SVG)</option>
            <option value="gem">Gem (complex SVG)</option>
          </select>

          {template === 'procedural' && (
            <>
              <label className="text-sm">Petals</label>
              <input type="range" min={8} max={40} value={petals} onChange={(e) => setPetals(Number(e.target.value))} />
              <label className="text-sm">Rings</label>
              <input type="range" min={3} max={10} value={rings} onChange={(e) => setRings(Number(e.target.value))} />
              <Button size="sm" variant="outline" onClick={randomize}>Randomize</Button>
            </>
          )}

          <label className="text-sm">Stroke</label>
          <input type="range" min={1} max={6} value={stroke} onChange={(e) => setStroke(Number(e.target.value))} />
          <div className="flex items-center gap-2">
            <span className="text-sm">Line</span>
            <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} className="h-8 w-8 rounded" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={undo} disabled={!undoStack.length}>Undo</Button>
            <Button size="sm" variant="outline" onClick={clearColors}>Clear</Button>
            <Button size="sm" variant="outline" onClick={exportSVG}>Save SVG</Button>
            <Button size="sm" onClick={exportPNG}>Save PNG</Button>
            {onComplete && <Button size="sm" onClick={onComplete} disabled={!canComplete}>Mark as Completed</Button>}
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
