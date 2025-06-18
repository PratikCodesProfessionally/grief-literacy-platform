import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Heart } from 'lucide-react';

export function MemoryGardenPage() {
  const [showAddMemory, setShowAddMemory] = React.useState(false);
  const [memoryTitle, setMemoryTitle] = React.useState('');
  const [memoryDescription, setMemoryDescription] = React.useState('');

  const memories = [
    {
      title: 'Mom\'s Sunday Pancakes',
      description: 'Every Sunday morning, the smell of pancakes would fill the house...',
      flower: '🌻',
      date: '2 days ago',
    },
    {
      title: 'Teaching Me to Drive',
      description: 'Dad was so patient when I couldn\'t get parallel parking right...',
      flower: '🌹',
      date: '1 week ago',
    },
    {
      title: 'Christmas Morning Traditions',
      description: 'The way they\'d wake us up at dawn, so excited for our reactions...',
      flower: '🌸',
      date: '2 weeks ago',
    },
    {
      title: 'Bedtime Stories',
      description: 'Even when I got older, they\'d still tell me stories to help me sleep...',
      flower: '🌺',
      date: '3 weeks ago',
    },
  ];

  const flowerOptions = ['🌻', '🌹', '🌸', '🌺', '🌷', '🌼', '🌿', '🍀'];

  const handleAddMemory = () => {
    if (memoryTitle.trim() && memoryDescription.trim()) {
      // Add memory logic here
      setMemoryTitle('');
      setMemoryDescription('');
      setShowAddMemory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/tools">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          🌸 Memory Garden
        </h1>
      </div>

      <div className="text-center space-y-4">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Plant digital flowers to honor and preserve your precious memories
        </p>
        <Button onClick={() => setShowAddMemory(true)} className="space-x-2">
          <Plus className="h-4 w-4" />
          <span>Plant a Memory</span>
        </Button>
      </div>

      {showAddMemory && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle>Plant a New Memory</CardTitle>
            <CardDescription>
              Share a cherished memory and choose a flower to represent it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Memory title (e.g., 'Mom's apple pie recipe')"
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
              <div className="flex space-x-2">
                {flowerOptions.map((flower, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-2xl p-2"
                  >
                    {flower}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddMemory}>Plant Memory</Button>
              <Button variant="outline" onClick={() => setShowAddMemory(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.map((memory, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow group">
            <CardHeader className="text-center">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                {memory.flower}
              </div>
              <CardTitle className="text-lg">{memory.title}</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Planted {memory.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {memory.description}
              </p>
              <div className="mt-3 flex justify-between items-center">
                <Button variant="ghost" size="sm">
                  Read More
                </Button>
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Garden Statistics</CardTitle>
          <CardDescription>
            Your memory garden is growing beautiful
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{memories.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memories Planted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Flowers Blooming</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
