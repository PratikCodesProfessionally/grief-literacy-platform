import * as React from 'react';
import { Button } from '@/components/ui/button';

interface EmotionColorMappingProps {
  mood: string;
  onClose: () => void;
  onComplete?: () => void; // ⬅️ NEW
}

export const EmotionColorMapping: React.FC<EmotionColorMappingProps> = ({ mood, onClose, onComplete }) => {
  const [selectedColor, setSelectedColor] = React.useState<string>('#ffb3b3');
  const [cells, setCells] = React.useState<string[]>(Array(25).fill('#fff'));

  const palette = [
    '#ffb3b3', // rot
    '#ffd9b3', // orange
    '#fff7b3', // gelb
    '#b3ffd9', // grün
    '#b3e0ff', // blau
    '#d1b3ff', // lila
    '#e0e0e0', // grau
  ];

  const handleCellClick = (idx: number) => {
    setCells((prev) => prev.map((c, i) => (i === idx ? selectedColor : c)));
  };

  // Optional: require at least one non-white cell before allowing completion
  const canComplete = React.useMemo(() => cells.some((c) => c !== '#fff'), [cells]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Emotion Color Mapping</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Choose a color that reflects your current mood, and click on the fields to make your feelings visible.
        </p>

        <div className="flex space-x-2">
          {palette.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-gray-300'}`}
              style={{ background: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {cells.map((color, idx) => (
            <button
              key={idx}
              className="w-8 h-8 rounded border border-gray-300"
              style={{ background: color }}
              onClick={() => handleCellClick(idx)}
              aria-label={`Cell ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Your selected mood: <span className="font-semibold">{mood}</span>
          </div>
          {onComplete && (
            <Button
              size="sm"
              onClick={onComplete}
              disabled={!canComplete}
              title={canComplete ? 'Mark as completed' : 'Bitte mindestens ein Cell färben'}
            >
              Mark as Completed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
