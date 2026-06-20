import * as React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw, Trash2, CheckCircle } from 'lucide-react';

interface ActionPanelProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onComplete: () => void;
  completionPercentage: number;
  isSaving?: boolean;
  onManualSave?: () => void;
  autosaveKey?: string;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onComplete,
  completionPercentage,
  isSaving = false,
  onManualSave,
  autosaveKey,
}) => {
  const handleCheckStorage = () => {
    if (!autosaveKey) {
      console.log('No autosaveKey provided');
      return;
    }
    const saved = localStorage.getItem(autosaveKey);
    if (saved) {
      const data = JSON.parse(saved);
      console.log('✅ Found session in storage:', {
        key: autosaveKey,
        mood: data.mood,
        template: data.template,
        svgLength: data.svgContent?.length || 0,
        colorsUsed: data.colorsUsed,
      });
      alert(`Session found!\nMood: ${data.mood}\nSVG Length: ${data.svgContent?.length || 0}\nColors: ${data.colorsUsed?.length || 0}`);
    } else {
      console.log('❌ No session found for key:', autosaveKey);
      alert(`No session found for key: ${autosaveKey}`);
    }
  };

  const handleClearStorage = () => {
    if (!autosaveKey) return;
    localStorage.removeItem(autosaveKey);
    console.log('🗑️  Cleared session:', autosaveKey);
    alert(`Cleared session: ${autosaveKey}`);
  };
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Actions</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          onClick={onUndo}
          disabled={!canUndo}
          variant="outline"
          className="flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Undo</span>
        </Button>

        <Button
          onClick={onRedo}
          disabled={!canRedo}
          variant="outline"
          className="flex items-center justify-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          <span>Redo</span>
        </Button>

        <Button
          onClick={onClear}
          variant="outline"
          className="flex items-center justify-center gap-2 col-span-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All</span>
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {Math.round(completionPercentage)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <Button
        onClick={onComplete}
        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
        disabled={isSaving}
      >
        <CheckCircle className="w-4 h-4" />
        <span>{isSaving ? 'Saving...' : 'Complete & Save'}</span>
      </Button>

      {/* DEBUG BUTTONS */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">Debug</div>
        <Button
          onClick={onManualSave}
          variant="outline"
          className="w-full text-xs"
        >
          💾 Save Now
        </Button>
        <Button
          onClick={handleCheckStorage}
          variant="outline"
          className="w-full text-xs"
        >
          🔍 Check Storage
        </Button>
        <Button
          onClick={handleClearStorage}
          variant="outline"
          className="w-full text-xs"
        >
          🗑️  Clear Storage
        </Button>
      </div>

      {completionPercentage > 0 && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
          ✓ Mandala is {Math.round(completionPercentage)}% complete
        </div>
      )}
    </div>
  );
};
