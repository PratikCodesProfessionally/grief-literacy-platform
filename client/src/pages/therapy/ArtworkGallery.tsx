import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { artStorageService, AnyArtwork, ArtActivityType } from '@/services/ArtStorageService';
import { X, Download, Trash2, Calendar, Heart, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtworkGalleryProps {
  onClose: () => void;
}

const activityLabels: Record<ArtActivityType, string> = {
  'emotion-color': 'Emotion Colors',
  'memory-collage': 'Memory Collage',
  'symbolic-drawing': 'Symbolic Drawing',
  'healing-mandala': 'Healing Mandala',
  'digital-canvas': 'Digital Canvas',
};

const activityColors: Record<ArtActivityType, string> = {
  'emotion-color': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'memory-collage': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'symbolic-drawing': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'healing-mandala': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'digital-canvas': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export const ArtworkGallery: React.FC<ArtworkGalleryProps> = ({ onClose }) => {
  const [artworks, setArtworks] = React.useState<AnyArtwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = React.useState<AnyArtwork | null>(null);
  const [filterType, setFilterType] = React.useState<ArtActivityType | 'all'>('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    setLoading(true);
    try {
      const allArtworks = await artStorageService.getAllArtworks();
      // Sort by most recent first
      allArtworks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setArtworks(allArtworks);
    } catch (error) {
      console.error('Error loading artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;
    
    try {
      await artStorageService.deleteArtwork(id);
      setArtworks(artworks.filter(a => a.id !== id));
      if (selectedArtwork?.id === id) {
        setSelectedArtwork(null);
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Failed to delete artwork');
    }
  };

  const handleExport = (artwork: AnyArtwork) => {
    artStorageService.exportAsJSON(artwork);
  };

  const renderArtworkPreview = (artwork: AnyArtwork) => {
    switch (artwork.activityType) {
      case 'emotion-color':
        return (
          <div className="grid grid-cols-5 gap-0.5 h-full">
            {artwork.cells.map((color, idx) => (
              <div key={idx} className="w-full h-full" style={{ background: color }} />
            ))}
          </div>
        );
        
      case 'symbolic-drawing':
        return (
          <img
            src={artwork.canvasDataUrl}
            alt={artwork.title}
            className="w-full h-full object-contain"
          />
        );
        
      case 'healing-mandala':
        return (
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: artwork.svgData }}
          />
        );
        
      case 'memory-collage':
        return (
          <div className="grid grid-cols-3 gap-1 p-2 h-full overflow-hidden">
            {artwork.items.slice(0, 9).map((item, idx) => {
              if (item.type === 'image') {
                return (
                  <img
                    key={idx}
                    src={item.dataUrl || item.src}
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                );
              } else {
                return (
                  <div
                    key={idx}
                    className="w-full h-full rounded p-1 text-xs overflow-hidden"
                    style={{ background: item.color }}
                  >
                    {item.text}
                  </div>
                );
              }
            })}
          </div>
        );
        
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Palette className="h-12 w-12" />
          </div>
        );
    }
  };

  const filteredArtworks = filterType === 'all' 
    ? artworks 
    : artworks.filter(a => a.activityType === filterType);

  if (selectedArtwork) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedArtwork.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={activityColors[selectedArtwork.activityType]}>
                  {activityLabels[selectedArtwork.activityType]}
                </Badge>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {selectedArtwork.mood}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedArtwork.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport(selectedArtwork)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedArtwork(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[400px]">
              {renderArtworkPreview(selectedArtwork)}
            </div>
            
            {selectedArtwork.notes && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedArtwork.notes}</p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => handleDelete(selectedArtwork.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Artwork
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-3xl font-bold">Your Artwork Gallery</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredArtworks.length} {filteredArtworks.length === 1 ? 'artwork' : 'artworks'}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
            >
              All ({artworks.length})
            </Button>
            {(Object.keys(activityLabels) as ArtActivityType[]).map(type => {
              const count = artworks.filter(a => a.activityType === type).length;
              if (count === 0) return null;
              return (
                <Button
                  key={type}
                  size="sm"
                  variant={filterType === type ? 'default' : 'outline'}
                  onClick={() => setFilterType(type)}
                >
                  {activityLabels[type]} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading your artwork...</p>
              </div>
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Artwork Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create your first artwork to see it here!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredArtworks.map(artwork => (
                <Card
                  key={artwork.id}
                  className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  onClick={() => setSelectedArtwork(artwork)}
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                    {renderArtworkPreview(artwork)}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm truncate mb-1">{artwork.title}</h3>
                    <div className="flex items-center justify-between">
                      <Badge className={cn('text-xs', activityColors[artwork.activityType])}>
                        {activityLabels[artwork.activityType]}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(artwork.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <Heart className="h-3 w-3" />
                      <span>{artwork.mood}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
