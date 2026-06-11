import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  getArtworks,
  removeArtwork,
  clearGallery,
  ACTIVITY_LABELS,
  type GalleryArtwork,
  type ActivityKey,
} from '@/lib/canvassence';
import { Download, Trash2, X, ImageOff } from 'lucide-react';

interface CanvassenceProps {
  open: boolean;
  onClose: () => void;
}

type FilterKey = 'all' | ActivityKey;

export const Canvassence: React.FC<CanvassenceProps> = ({ open, onClose }) => {
  const [artworks, setArtworks] = React.useState<GalleryArtwork[]>([]);
  const [filter, setFilter] = React.useState<FilterKey>('all');

  // Reload from storage whenever the gallery is opened.
  React.useEffect(() => {
    if (open) {
      setArtworks(getArtworks());
      setFilter('all');
    }
  }, [open]);

  if (!open) return null;

  const handleDelete = (id: string) => {
    removeArtwork(id);
    setArtworks(getArtworks());
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all creations from your Canvassence gallery? This cannot be undone.')) {
      clearGallery();
      setArtworks([]);
    }
  };

  const counts = artworks.reduce<Record<string, number>>((acc, a) => {
    acc[a.activity] = (acc[a.activity] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter === 'all' ? artworks : artworks.filter((a) => a.activity === filter);

  const filterChips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `All (${artworks.length})` },
    ...(Object.keys(ACTIVITY_LABELS) as ActivityKey[])
      .filter((k) => counts[k])
      .map((k) => ({ key: k as FilterKey, label: `${ACTIVITY_LABELS[k]} (${counts[k]})` })),
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎨 Canvassence
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your personal gallery of completed creations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {artworks.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear all
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close gallery">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filter chips */}
        {artworks.length > 0 && (
          <div className="flex gap-2 flex-wrap px-6 py-3 border-b border-gray-100 dark:border-gray-800">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filter === chip.key
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
              <ImageOff className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">No creations yet</p>
              <p className="text-sm mt-1">
                Complete an art activity and it will be saved here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((art) => (
                <div
                  key={art.id}
                  className="group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex flex-col"
                >
                  <div className="relative aspect-square bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    <img
                      src={art.image}
                      alt={`${art.activityLabel} creation`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={art.image}
                        download={`${art.activity}-${art.id}.png`}
                        className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white shadow"
                        title="Download"
                        aria-label="Download creation"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-red-600 hover:bg-white shadow"
                        title="Delete"
                        aria-label="Delete creation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {art.activityLabel}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {art.mood ? `${art.mood} · ` : ''}
                      {new Date(art.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvassence;
