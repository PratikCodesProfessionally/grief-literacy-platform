import * as React from 'react';
import { PaintMode } from '../types';
import { Button } from '../../components/ui/button';
import { Brush, Eraser, Eye, Pipette, Code } from 'lucide-react';

interface PaintToolsProps {
  mode: PaintMode;
  onModeChange: (mode: PaintMode) => void;
  onShowJsEditor?: () => void;
  hasJsEditor?: boolean;
}

const TOOLS: { mode: PaintMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'paint', label: 'Paint', icon: <Brush className="w-4 h-4" /> },
  { mode: 'erase', label: 'Erase', icon: <Eraser className="w-4 h-4" /> },
  { mode: 'eyedropper', label: 'Eyedropper', icon: <Pipette className="w-4 h-4" /> },
  { mode: 'fill', label: 'Fill', icon: <Eye className="w-4 h-4" /> },
];

export const PaintTools: React.FC<PaintToolsProps> = ({
  mode,
  onModeChange,
  onShowJsEditor,
  hasJsEditor = true,
}) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Tools</h3>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map((tool) => (
            <Button
              key={tool.mode}
              onClick={() => onModeChange(tool.mode)}
              variant={mode === tool.mode ? 'default' : 'outline'}
              className="w-full flex items-center justify-center gap-2"
            >
              {tool.icon}
              <span>{tool.label}</span>
            </Button>
          ))}
        </div>

        {hasJsEditor && (
          <Button
            onClick={onShowJsEditor}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400"
          >
            <Code className="w-4 h-4" />
            <span>Learn & Code</span>
          </Button>
        )}
      </div>

      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm text-slate-600 dark:text-slate-400">
        <div className="font-medium mb-1">Current Mode:</div>
        <div className="capitalize">{mode}</div>
      </div>
    </div>
  );
};
