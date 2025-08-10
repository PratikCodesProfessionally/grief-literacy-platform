import * as React from 'react';
import { Button } from '@/components/ui/button';

interface HealingMandalaProps {
  mood: string;
  onClose: () => void;
  onComplete?: () => void;
}

export const HealingMandala: React.FC<HealingMandalaProps> = ({ mood, onClose, onComplete }) => {
  const [petals, setPetals] = React.useState(12);
  const [stroke, setStroke] = React.useState(2);
  const [color, setColor] = React.useState('#6d28d9'); // purple-700
  const [seed, setSeed] = React.useState(1);

  const randomize = () => setSeed((s) => s + 1);

  // simple deterministic pseudo-random generator for symmetry
  const prng = React.useMemo(() => {
    let x = seed;
    return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }, [seed]);

  const rings = 5;
  const radii = React.useMemo(() => {
    const r: number[] = [];
    for (let i = 0; i < rings; i++) r.push(18 + i * 16 + Math.floor(prng() * 8));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prng]);

  const canComplete = true;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Healing Mandala</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Create soothing symmetric patterns. Current mood: <b>{mood}</b>
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm">Petals</label>
          <input type="range" min={6} max={32} value={petals} onChange={(e) => setPetals(Number(e.target.value))} />
          <label className="text-sm">Stroke</label>
          <input type="range" min={1} max={6} value={stroke} onChange={(e) => setStroke(Number(e.target.value))} />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-9 rounded" />
          <Button size="sm" variant="outline" onClick={randomize}>Randomize</Button>
          {onComplete && (
            <Button size="sm" onClick={onComplete} disabled={!canComplete}>Mark as Completed</Button>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white flex items-center justify-center">
          <svg viewBox="0 0 400 400" className="w-full h-[360px]">
            <g transform="translate(200,200)" fill="none" stroke={color} strokeWidth={stroke}>
              {/* rings */}
              {radii.map((r, i) => (
                <circle key={`c-${i}`} r={r} opacity={0.35 + i * 0.1} />
              ))}
              {/* petals */}
              {Array.from({ length: petals }).map((_, i) => {
                const angle = (i * 360) / petals;
                return (
                  <g key={i} transform={`rotate(${angle})`}>
                    <path d={`M0 0 C 30 -30, 60 -30, 90 0 C 60 30, 30 30, 0 0`} opacity={0.9} />
                  </g>
                );
              })}
              {/* center */}
              <circle r={10} fill={color} />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
