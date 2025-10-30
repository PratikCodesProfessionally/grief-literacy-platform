import * as React from 'react';
import { Button } from '@/components/ui/button';
import { artStorageService } from '@/services/ArtStorageService';
import { Download, Save } from 'lucide-react';

interface EmotionColorMappingProps {
  mood: string;
  onClose: () => void;
  onComplete?: () => void; // ⬅️ NEW
}

export const EmotionColorMapping: React.FC<EmotionColorMappingProps> = ({ mood, onClose, onComplete }) => {
  const [selectedColor, setSelectedColor] = React.useState<string>('#ffb3b3');
  const [cells, setCells] = React.useState<string[]>(Array(25).fill('#fff'));
  const [isSaving, setIsSaving] = React.useState(false);

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

  const handleSaveArtwork = async () => {
    if (!canComplete) return;
    
    setIsSaving(true);
    try {
      await artStorageService.saveArtwork({
        title: `Emotion Colors - ${new Date().toLocaleDateString()}`,
        activityType: 'emotion-color',
        mood,
        cells,
        selectedColor,
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
    if (!canComplete) return;
    
    // Create a canvas and draw the color grid
    const canvas = document.createElement('canvas');
    const cellSize = 60;
    canvas.width = cellSize * 5;
    canvas.height = cellSize * 5;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    cells.forEach((color, idx) => {
      const row = Math.floor(idx / 5);
      const col = idx % 5;
      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      ctx.strokeStyle = '#cccccc';
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emotion-colors-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Emotion Color Mapping</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Schließen</Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Wähle eine Farbe, die deine aktuelle Stimmung widerspiegelt, und klicke auf die Felder, um deine Gefühle sichtbar zu machen.
        </p>

        <div className="flex space-x-2">
          {palette.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-gray-300'}`}
              style={{ background: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Farbe ${color}`}
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
              aria-label={`Feld ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Your mood: <span className="font-semibold">{mood}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveArtwork}
              disabled={!canComplete || isSaving}
              title="Save to gallery"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPNG}
              disabled={!canComplete}
              title="Download as PNG"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            {onComplete && (
              <Button
                size="sm"
                onClick={onComplete}
                disabled={!canComplete}
                title={canComplete ? 'Mark as completed' : 'Please color at least one cell'}
              >
                Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
