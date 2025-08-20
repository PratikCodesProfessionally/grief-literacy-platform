import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Share, Bookmark, Volume2, Mic, MicOff, Save, Download } from 'lucide-react';
import { read } from 'fs';

export function PoetryTherapyPage() {
  const [selectedPoem, setSelectedPoem] = React.useState('');
  const [userPoem, setUserPoem] = React.useState('');
  const [poemTitle, setPoemTitle] = React.useState('');
  const [savedPoems, setSavedPoems] = React.useState<any[]>([]);
  const [favoritePoems, setFavoritePoems] = React.useState<Set<number>>(new Set());
  const [isReading, setIsReading] = React.useState<number | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [voiceRecordings, setVoiceRecordings] = React.useState<string[]>([]);

  const healingPoems = [
    {
      id: 1,
      title: "Grief Speaks",
      author: "Unknown",
      content: "I am grief.\nI am not your enemy,\nthough I bring pain.\nI am the price you pay for love.\nI am the weight of missing someone.\nLet me be here.\nLet me be felt.\nFor in acknowledging me,\nyou honor the love that remains.",
      category: "Understanding",
      readTime: "1 min"
    },
    {
      id: 2,
      title: "The Guest House",
      author: "Rumi",
      content: "This being human is a guest house.\nEvery morning a new arrival.\nA joy, a depression, a meanness,\nsome momentary awareness comes\nas an unexpected visitor.\nWelcome and entertain them all!\nEven if they're a crowd of sorrows,\nwho violently sweep your house\nempty of its furniture,\nstill, treat each guest honorably.",
      category: "Acceptance",
      readTime: "2 min"
    },
    {
      id: 3,
      title: "What We Know",
      author: "Jane Hirshfield",
      content: "We know the story.\nThe story of the seasons,\nof time passing,\nof love given and received,\nof loss that comes to everyone,\nand the tenderness\nthat grows between the lines\nof what cannot be spoken.",
      category: "Wisdom",
      readTime: "1 min"
    },
    {
      id: 4,
      title: "Memorial",
      author: "Mark Doty",
      content: "What I remember\nis how we loved\nthe world, and I think\nthat must be\nwhat the world\nwas for.",
      category: "Love",
      readTime: "30 sec"
    },
    {
      id: 5,
      title: "Hey, I'm Sorry",
      author: "Unknown",
      content: "I know words sometimes cut like knives,\nand knives, sometimes, cut like words\nLike the arrow that has left the archer,\nlike the bullet freed from its muzzle,\nthey sway through the ether,\nkilling identity as they pass—\ndistorting the emptiness\nthat lies between feelings, bodies,\nand quill-feathers.\n\nA life emptied,\nwith a barrel of words.",
      category: "Guilt",
      readTime: "30 sec",
    },
    {
      id: 6,
      title: "Marmelade morning",
      author: "Unknown",
      content: "Peaceful house with no pesky mouse\nthat I yearn - moi aussi\nno smart home but an autark home\n where egos don't burn the entire Rome\n\nA greenish garden, multiple plants\n with minimal conflicts, petty rants\nwhere the marmelade is made\n fresh with love's own aid\nto soothe the burning ail\npeachy tinged in its own shade\n\nA morning sun on hill's turn\nOver the barn by the tavern\n the morning bird shall hymn the urn\nof how peace was won in the long run\nPeaceful house with no pecky mouse\nthat I yearn - moi aussi\n",
      category: "Simplicity",
      readTime: "1 min",
    }
  ];

  const poetryPrompts = [
    {
      text: "Write about what you would say if you could speak to them one more time",
      category: "Connection",
      difficulty: "Medium"
    },
    {
      text: "Describe your grief as if it were a color, shape, or weather",
      category: "Expression",
      difficulty: "Easy"
    },
    {
      text: "Create a poem using only words that remind you of them",
      category: "Memory",
      difficulty: "Hard"
    },
    {
      text: "Write about a moment when you felt their presence",
      category: "Spiritual",
      difficulty: "Medium"
    },
    {
      text: "Compose a poem about the sound of their voice or laughter",
      category: "Senses",
      difficulty: "Medium"
    },
    {
      text: "Write about something they left behind that brings comfort",
      category: "Objects",
      difficulty: "Easy"
    },
    {
      text: "Create a poem about the lessons they taught you",
      category: "Wisdom",
      difficulty: "Hard"
    },
    {
      text: "Write about your first day without them",
      category: "Journey",
      difficulty: "Hard"
    }
  ];

  // Recording timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleFavorite = (poemId: number) => {
    const newFavorites = new Set(favoritePoems);
    if (newFavorites.has(poemId)) {
      newFavorites.delete(poemId);
    } else {
      newFavorites.add(poemId);
    }
    setFavoritePoems(newFavorites);
  };

  const readAloud = (poemId: number) => {
    if (isReading === poemId) {
      setIsReading(null);
      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsReading(poemId);
      // Start speech synthesis
      if ('speechSynthesis' in window) {
        const poem = healingPoems.find(p => p.id === poemId);
        if (poem) {
          const utterance = new SpeechSynthesisUtterance(poem.content);
          utterance.rate = 0.8;
          utterance.pitch = 1;
          utterance.onend = () => setIsReading(null);
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  };

  const savePoem = () => {
    if (userPoem.trim()) {
      const newPoem = {
        id: Date.now(),
        title: poemTitle || 'Untitled Poem',
        content: userPoem,
        prompt: selectedPoem,
        wordCount: userPoem.trim().split(/\s+/).length,
        lineCount: userPoem.split('\n').length,
        createdAt: new Date().toLocaleDateString()
      };
      setSavedPoems([...savedPoems, newPoem]);
      setUserPoem('');
      setPoemTitle('');
      setSelectedPoem('');
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    const recordingName = `Poetry Reading ${voiceRecordings.length + 1} (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})`;
    setVoiceRecordings([...voiceRecordings, recordingName]);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Understanding': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Acceptance': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Wisdom': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Love': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Connection': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Expression': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Memory': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Spiritual': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      'Senses': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Objects': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      'Journey': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/therapy">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Therapy
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            ✍️ Poetry Therapy
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find healing through the rhythm and beauty of words
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Healing Poems</CardTitle>
              <CardDescription>
                Read poems that speak to the grief experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {healingPoems.map((poem) => (
                <Card key={poem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{poem.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">by {poem.author}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(poem.category)}>
                            {poem.category}
                          </Badge>
                          <span className="text-xs text-gray-500">{poem.readTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavorite(poem.id)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${favoritePoems.has(poem.id) ? 'fill-red-500 text-red-500' : ''}`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => readAloud(poem.id)}
                        >
                          <Volume2 className={`h-4 w-4 ${isReading === poem.id ? 'text-blue-600' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm whitespace-pre-line italic leading-relaxed">
                      {poem.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline">
                        <Bookmark className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Poetry Prompts</CardTitle>
              <CardDescription>
                Choose a prompt to inspire your writing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {poetryPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant={selectedPoem === prompt.text ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto p-3"
                  onClick={() => setSelectedPoem(prompt.text)}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={getCategoryColor(prompt.category)}>
                        {prompt.category}
                      </Badge>
                      <Badge variant="outline">
                        {prompt.difficulty}
                      </Badge>
                    </div>
                    <div className="text-sm">{prompt.text}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Poetry</CardTitle>
                  <CardDescription>
                    {selectedPoem || "Select a prompt or write freely"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {isRecording ? (
                    <Button size="sm" variant="destructive" onClick={stopRecording}>
                      <MicOff className="h-4 w-4 mr-1" />
                      {formatTime(recordingTime)}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startRecording}>
                      <Mic className="h-4 w-4 mr-1" />
                      Record
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Poem title (optional)"
                value={poemTitle}
                onChange={(e) => setPoemTitle(e.target.value)}
              />
              <Textarea
                placeholder="Let your words flow..."
                className="min-h-80 font-mono leading-relaxed"
                value={userPoem}
                onChange={(e) => setUserPoem(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button disabled={!userPoem.trim()} onClick={savePoem}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Poem
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setUserPoem('');
                    setPoemTitle('');
                  }}>
                    Clear
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  {userPoem.split('\n').length} lines • {userPoem.trim() ? userPoem.trim().split(/\s+/).length : 0} words
                </div>
              </div>

              {voiceRecordings.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Voice Recordings:</h4>
                  <div className="space-y-1">
                    {voiceRecordings.map((recording, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <span>{recording}</span>
                        <div className="space-x-1">
                          <Button size="sm" variant="ghost">Play</Button>
                          <Button size="sm" variant="ghost">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {savedPoems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Poetry Collection</CardTitle>
                <CardDescription>
                  {savedPoems.length} poems written
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {savedPoems.map((poem) => (
                  <Card key={poem.id} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{poem.title}</h4>
                        <span className="text-xs text-gray-500">{poem.createdAt}</span>
                      </div>
                      {poem.prompt && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                          "{poem.prompt}"
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm line-clamp-3 mb-2">
                        {poem.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{poem.lineCount} lines • {poem.wordCount} words</span>
                        <Button size="sm" variant="ghost">Read Full</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
