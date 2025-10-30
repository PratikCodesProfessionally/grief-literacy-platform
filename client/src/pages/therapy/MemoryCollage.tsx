import * as React from 'react';
import { Button } from '@/components/ui/button';
import { artStorageService } from '@/services/ArtStorageService';
import { Download, Save } from 'lucide-react';

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
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setItems((prev) => [...prev, { type: 'note', text: noteText.trim(), color: noteColor }]);
    setNoteText('');
  };

  const handleAddImage: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create both object URL for display and data URL for storage
    const objectUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setItems((prev) => [...prev, { type: 'image', src: objectUrl, dataUrl }]);
    };
    reader.readAsDataURL(file);
  };

  const canComplete = items.length > 0;

  const handleSaveArtwork = async () => {
    if (!canComplete) return;
    
    setIsSaving(true);
    try {
      await artStorageService.saveArtwork({
        title: `Memory Collage - ${new Date().toLocaleDateString()}`,
        activityType: 'memory-collage',
        mood,
        items,
      });
      alert('Collage saved successfully!');
    } catch (error) {
      console.error('Error saving collage:', error);
      alert('Failed to save collage');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportHTML = () => {
    if (!canComplete) return;
    
    // Create an HTML representation of the collage
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Memory Collage - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .collage { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
    .item { border: 2px solid #ddd; border-radius: 8px; overflow: hidden; }
    .item img { width: 100%; height: 200px; object-fit: cover; }
    .note { padding: 15px; min-height: 200px; display: flex; align-items: center; justify-content: center; text-align: center; }
  </style>
</head>
<body>
  <h1>Memory Collage</h1>
  <p>Created: ${new Date().toLocaleString()} | Mood: ${mood}</p>
  <div class="collage">
    ${items.map((item, idx) => {
      if (item.type === 'image') {
        return `<div class="item"><img src="${item.dataUrl || item.src}" alt="Memory ${idx + 1}" /></div>`;
      } else {
        return `<div class="item note" style="background: ${item.color}"><p>${item.text}</p></div>`;
      }
    }).join('\n    ')}
  </div>
</body>
</html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-collage-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    return () => {
      // revoke any created object URLs
      items.forEach((it) => {
        if (it.type === 'image') URL.revokeObjectURL(it.src);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSaveArtwork} disabled={!canComplete || isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportHTML} disabled={!canComplete}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            {onComplete && (
              <Button size="sm" onClick={onComplete} disabled={!canComplete}>
                Complete
              </Button>
            )}
          </div>
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
