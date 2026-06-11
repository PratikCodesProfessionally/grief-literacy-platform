import * as React from 'react';
import { Button } from '@/components/ui/button';
import { addArtwork, collageToPng } from '@/lib/canvassence';

interface MemoryCollageProps {
  mood: string;
  onClose: () => void;
  onComplete?: () => void;
}

type CollageItem =
  | { type: 'image'; src: string }
  | { type: 'note'; text: string; color: string };

export const MemoryCollage: React.FC<MemoryCollageProps> = ({ mood, onClose, onComplete }) => {
  const [items, setItems] = React.useState<CollageItem[]>([]);
  const [noteText, setNoteText] = React.useState('');
  const [noteColor, setNoteColor] = React.useState('#fff7b3');

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setItems((prev) => [...prev, { type: 'note', text: noteText.trim(), color: noteColor }]);
    setNoteText('');
  };

  const handleAddImage: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Read as a data URL (not a blob: object URL) so the image persists into the
    // composed gallery PNG and survives a reload.
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setItems((prev) => [...prev, { type: 'image', src }]);
    };
    reader.readAsDataURL(file);
  };

  const canComplete = items.length > 0;

  const handleComplete = async () => {
    try {
      const image = await collageToPng(items);
      if (image) addArtwork({ activity: 'memory-collage', mood, image });
    } catch {
      /* non-fatal: still mark complete */
    }
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Memory Collage</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Combine images and notes to honor cherished moments. Current mood: <b>{mood}</b>
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            accept="image/*"
            onChange={handleAddImage}
            className="text-sm"
            aria-label="Add image"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={noteColor}
              onChange={(e) => setNoteColor(e.target.value)}
              aria-label="Note color"
              className="h-9 w-9 rounded"
            />
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write a short note…"
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 text-sm w-60"
            />
            <Button size="sm" onClick={handleAddNote}>Add Note</Button>
          </div>

          {onComplete && (
            <Button size="sm" className="ml-auto" onClick={handleComplete} disabled={!canComplete}>
              Mark as Completed
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((it, idx) =>
            it.type === 'image' ? (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src={it.src} alt="collage" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                key={idx}
                className="aspect-square rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-sm"
                style={{ background: it.color }}
              >
                <p className="break-words">{it.text}</p>
              </div>
            )
          )}
          {items.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-6">
              Your collage is empty. Add an image or a note to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
