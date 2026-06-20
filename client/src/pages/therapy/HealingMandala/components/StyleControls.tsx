import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Slider } from '../../components/ui/slider';

interface StyleControlsProps {
  stroke: number;
  lineColor: string;
  onStrokeChange: (stroke: number) => void;
  onLineColorChange: (color: string) => void;
}

const LINE_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#808080' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
];

export const StyleControls: React.FC<StyleControlsProps> = ({
  stroke,
  lineColor,
  onStrokeChange,
  onLineColorChange,
}) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
        Style Controls
      </h3>

      <div className="space-y-4">
        {/* Stroke Width */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Stroke Width
            </label>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stroke}px</span>
          </div>
          <Slider
            min={1}
            max={8}
            step={1}
            value={[stroke]}
            onValueChange={(val) => onStrokeChange(val[0])}
            className="w-full"
          />
        </div>

        {/* Line Color */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Line Color
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {LINE_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => onLineColorChange(color.value)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  lineColor === color.value
                    ? 'border-slate-900 dark:border-white scale-110'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{lineColor}</div>
        </div>

        {/* Custom Color Input */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Custom Line Color
          </label>
          <input
            type="color"
            value={lineColor}
            onChange={(e) => onLineColorChange(e.target.value)}
            className="w-12 h-8 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
