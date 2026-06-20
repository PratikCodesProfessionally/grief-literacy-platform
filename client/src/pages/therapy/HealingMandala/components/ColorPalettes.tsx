import * as React from 'react';
import { COLOR_PALETTES } from '../constants';
import { PaletteKey } from '../types';
import { Button } from '../../components/ui/button';

interface ColorPalettesProps {
  activePalette: PaletteKey;
  selectedColor: string;
  onPaletteChange: (palette: PaletteKey) => void;
  onColorChange: (color: string) => void;
}

export const ColorPalettes: React.FC<ColorPalettesProps> = ({
  activePalette,
  selectedColor,
  onPaletteChange,
  onColorChange,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    warmEarth: true,
    coolBlues: false,
    natureGreen: false,
    sunset: false,
    zen: false,
  });

  const toggleSection = (palette: PaletteKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [palette]: !prev[palette],
    }));
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
        Color Palettes
      </h3>

      <div className="space-y-3">
        {(Object.entries(COLOR_PALETTES) as [PaletteKey, any][]).map(
          ([paletteKey, palette]) => (
            <div key={paletteKey}>
              <button
                onClick={() => {
                  toggleSection(paletteKey);
                  onPaletteChange(paletteKey);
                }}
                className={`w-full px-3 py-2 rounded-md flex items-center justify-between font-medium transition-colors ${
                  activePalette === paletteKey
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="capitalize">{palette.name}</span>
                <span className="text-sm">{expandedSections[paletteKey] ? '−' : '+'}</span>
              </button>

              {expandedSections[paletteKey] && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-5 gap-2">
                    {palette.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => onColorChange(color)}
                        className={`w-10 h-10 rounded border-2 transition-all ${
                          selectedColor === color
                            ? 'border-slate-900 dark:border-white scale-110'
                            : 'border-slate-300 dark:border-slate-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Current color:{' '}
          <span
            className="inline-block w-6 h-6 rounded border border-slate-300 ml-2 align-middle"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="ml-2">{selectedColor}</span>
        </p>
      </div>
    </div>
  );
};
