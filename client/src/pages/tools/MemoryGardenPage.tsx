import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Heart, Download, Trash2, Printer, Calendar } from 'lucide-react';

// ---- Types ----
export type Memory = {
  id: number;
  title: string;
  description: string;
  flower: string; // emoji
  createdAt: number; // epoch ms
  liked?: boolean;
};

// ---- utils ----
function formatRelative(ms: number) {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? '1 day ago' : `${d} days ago`;
  if (h > 0) return h === 1 ? '1 hour ago' : `${h} hours ago`;
  if (m > 0) return m === 1 ? '1 minute ago' : `${m} minutes ago`;
  return 'just now';
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const STORAGE_KEY = 'gl_memory_garden';

// ✅ Named export (so ToolsPage can `import { MemoryGardenPage } from './MemoryGardenPage'`)
export function MemoryGardenPage() {
  // ---- compose form ----
  const [showAddMemory, setShowAddMemory] = React.useState(false);
  const [memoryTitle, setMemoryTitle] = React.useState('');
  const [memoryDescription, setMemoryDescription] = React.useState('');
  const flowerOptions = ['🌻', '🌹', '🌸', '🌺', '🌷', '🌼', '🌿', '🍀'];
  const [selectedFlower, setSelectedFlower] = React.useState<string>(flowerOptions[0]);

  // ---- data ----
  const [memories, setMemories] = React.useState<Memory[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try { return JSON.parse(cached) as Memory[]; } catch {}
    }
    const now = Date.now();
    return [
      {
        id: now - 1000,
        title: "Mom's Sunday Pancakes",
        description: 'Every Sunday morning, the smell of pancakes would fill the house...\nYou showed me that love can be as simple as a warm breakfast and an unhurried morning.',
        flower: '🌻',
        createdAt: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      },
      {
        id: now - 2000,
        title: 'Teaching Me to Drive',
        description: "Dad was so patient when I couldn't get parallel parking right...\nYou taught me to breathe, try again, and trust the wheel.",
        flower: '🌹',
        createdAt: now - 7 * 24 * 60 * 60 * 1000, // 1 week ago
      },
      {
        id: now - 3000,
        title: 'Christmas Morning Traditions',
        description: "The way they'd wake us up at dawn, so excited for our reactions...\nWe still open one small gift the night before, just like you wanted.",
        flower: '🌸',
        createdAt: now - 14 * 24 * 60 * 60 * 1000,
      },
      {
        id: now - 4000,
        title: 'Bedtime Stories',
        description: "Even when I got older, they'd still tell me stories to help me sleep...\nNow I read those same tales when the nights feel long.",
        flower: '🌺',
        createdAt: now - 21 * 24 * 60 * 60 * 1000,
      },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  }, [memories]);

  // ---- reader dialog ----
  const [isReaderOpen, setIsReaderOpen] = React.useState(false);
  const [activeMemory, setActiveMemory] = React.useState<Memory | null>(null);

  const openReader = (m: Memory) => {
    setActiveMemory(m);
    setIsReaderOpen(true);
  };

  const handleAddMemory = () => {
    if (!memoryTitle.trim() || !memoryDescription.trim()) return;
    const newMem: Memory = {
      id: Date.now(),
      title: memoryTitle.trim(),
      description: memoryDescription,
      flower: selectedFlower,
      createdAt: Date.now(),
    };
    setMemories(prev => [newMem, ...prev]);
    setMemoryTitle('');
    setMemoryDescription('');
    setSelectedFlower(flowerOptions[0]);
    setShowAddMemory(false);
  };

  const toggleLike = (id: number) => {
    setMemories(prev => prev.map(m => (m.id === id ? { ...m, liked: !m.liked } : m)));
  };

  const deleteMemory = (id: number) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    if (activeMemory?.id === id) {
      setIsReaderOpen(false);
      setActiveMemory(null);
    }
  };

  const downloadMemoryTxt = (m: Memory) => {
    const header = `Title: ${m.title}\nFlower: ${m.flower}\nDate: ${new Date(m.createdAt).toLocaleString()}\n\n`;
    const body = m.description.endsWith('\n') ? m.description : m.description + '\n';
    const safe = m.title.replace(/[^\w\-]+/g, '_');
    downloadTextFile(`Memory_${safe}.txt`, header + body);
  };

  const printActive = () => {
    window.print();
  };

  // ---- stats ----
  const total = memories.length;
  const firstCreated = memories.reduce<number | null>((acc, m) => acc === null ? m.createdAt : Math.min(acc, m.createdAt), null);
  const daysActive = firstCreated ? Math.max(1, Math.ceil((Date.now() - firstCreated) / (24 * 60 * 60 * 1000))) : 0;
  const distinctFlowers = new Set(memories.map(m => m.flower)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 print:hidden">
        <Link to="/tools">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">🌸 Memory Garden</h1>
      </div>

      <div className="text-center space-y-4 print:hidden">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Plant digital flowers to honor and preserve your precious memories
        </p>
        <Button onClick={() => setShowAddMemory(true)} className="space-x-2">
          <Plus className="h-4 w-4" />
          <span>Plant a Memory</span>
        </Button>
      </div>

      {/* Add memory form */}
      {showAddMemory && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 print:hidden">
          <CardHeader>
            <CardTitle>Plant a New Memory</CardTitle>
            <CardDescription>
              Share a cherished memory and choose a flower to represent it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Memory title (e.g., 'Mom\'s apple pie recipe')"
              value={memoryTitle}
              onChange={(e) => setMemoryTitle(e.target.value)}
            />
            <Textarea
              placeholder="Describe this special memory..."
              value={memoryDescription}
              onChange={(e) => setMemoryDescription(e.target.value)}
              className="min-h-24"
            />
            <div>
              <p className="text-sm font-medium mb-2">Choose your flower:</p>
              <div className="flex flex-wrap gap-2">
                {['🌻','🌹','🌸','🌺','🌷','🌼','🌿','🍀'].map((flower) => {
                  const active = selectedFlower === flower;
                  return (
                    <Button
                      key={flower}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      className={`text-2xl p-2`}
                      onClick={() => setSelectedFlower(flower)}
                      aria-pressed={active}
                    >
                      {flower}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMemory} disabled={!memoryTitle.trim() || !memoryDescription.trim()}>
                Plant Memory
              </Button>
              <Button variant="outline" onClick={() => setShowAddMemory(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Garden grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.map((memory) => (
          <Card key={memory.id} className="hover:shadow-md transition-shadow group">
            <CardHeader className="text-center">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                {memory.flower}
              </div>
              <CardTitle className="text-lg">{memory.title}</CardTitle>
              <CardDescription className="text-sm text-gray-500 inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Planted {formatRelative(memory.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap">
                {memory.description}
              </p>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openReader(memory)}>
                    Read More
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadMemoryTxt(memory)}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant={memory.liked ? 'default' : 'ghost'} size="sm" onClick={() => toggleLike(memory.id)} aria-pressed={!!memory.liked}>
                    <Heart className={`h-4 w-4 ${memory.liked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMemory(memory.id)} aria-label="Delete Memory">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Garden Statistics</CardTitle>
          <CardDescription>Your memory garden is growing beautifully</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memories Planted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{daysActive}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{distinctFlowers}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Flowers Blooming</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reader Dialog */}
      <Dialog open={isReaderOpen} onOpenChange={setIsReaderOpen}>
        <DialogContent className="sm:max-w-2xl print:block">
          {activeMemory && (
            <>
              <DialogHeader className="print:hidden">
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl">{activeMemory.flower}</span>
                  <span>{activeMemory.title}</span>
                </DialogTitle>
                <DialogDescription>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatRelative(activeMemory.createdAt)}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Printable area */}
              <div id="print-area" className="prose dark:prose-invert max-w-none">
                <div className="mb-4 hidden print:block">
                  <h2 className="text-xl font-semibold">Memory</h2>
                  <p><strong>Title:</strong> {activeMemory.title}</p>
                  <p><strong>Flower:</strong> {activeMemory.flower}</p>
                  <p><strong>Date:</strong> {new Date(activeMemory.createdAt).toLocaleString()}</p>
                </div>

                <article className="whitespace-pre-wrap leading-7">
                  {activeMemory.description}
                </article>
              </div>

              <DialogFooter className="mt-6 flex gap-2 print:hidden">
                <Button variant="outline" onClick={() => downloadMemoryTxt(activeMemory)}>
                  <Download className="h-4 w-4 mr-2" /> Download (.txt)
                </Button>
                <Button variant="outline" onClick={printActive}>
                  <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
                </Button>
                <Button onClick={() => setIsReaderOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
        }
      `}</style>
    </div>
  );
}

// ✅ Default export too (so you can also `import MemoryGardenPage from './MemoryGardenPage'` if desired)
export default MemoryGardenPage;
