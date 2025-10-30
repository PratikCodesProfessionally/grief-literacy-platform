import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Share, Bookmark, Volume2, Mic, MicOff, Save, Download } from 'lucide-react';
import { ApiClient } from '@/services/ApiClient';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Wifi, WifiOff, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { storageProvider } from '@/services/StorageProvider';

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
  // Neue Zustände für Storage und Sync
  const [storageType, setStorageType] = React.useState<'local' | 'cloud'>('local');
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);
  
  const { toast } = useToast();
  const storageProviderInstance = React.useMemo(() => 
    storageProvider.createProvider(
      storageType,
      'poems',
      import.meta.env.VITE_API_URL
    ),
    [storageType]
  );

  // Online/Offline Status überwachen
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Gedichte beim Mount laden
  React.useEffect(() => {
    const loadPoems = async () => {
      try {
        const poems = await storageProviderInstance.list();
        setSavedPoems(poems);
      } catch (error) {
        console.error('Failed to load poems:', error);
      }
    };
    loadPoems();
  }, [storageProviderInstance]);

    // Sync-Funktion
  const syncPoems = async () => {
    if (!isOnline || storageType === 'local') return;

    try {
      setIsSyncing(true);
      const cloudPoems = await storageProviderInstance.list();
      setSavedPoems(cloudPoems);
      setLastSyncTime(new Date());
      
      toast({
        title: "Sync erfolgreich",
        description: "Ihre Gedichte wurden mit der Cloud synchronisiert",
      });
    } catch (error) {
      toast({
        title: "Sync fehlgeschlagen",
        description: "Fehler beim Synchronisieren der Gedichte.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const savePoem = async () => {
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

      try {
        await storageProviderInstance.save(String(newPoem.id), newPoem);
        setSavedPoems([...savedPoems, newPoem]);
        setUserPoem('');
        setPoemTitle('');
        setSelectedPoem('');
        
        toast({
          title: "Gedicht gespeichert",
          description: `"${newPoem.title}" wurde erfolgreich gespeichert`,
        });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Gedicht konnte nicht gespeichert werden",
          variant: "destructive",
        });
      }
    }
  };

  // UI-Komponenten für Storage-Controls
  const StorageControls = () => (
    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {storageType === 'local' ? (
            <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Cloud className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          )}
          <span className="font-medium text-sm">Storage: {storageType === 'local' ? 'Lokal' : 'Cloud'}</span>
        </div>
        <Switch
          checked={storageType === 'cloud'}
          onCheckedChange={(checked) => setStorageType(checked ? 'cloud' : 'local')}
        />
      </div>
      
      <div className="flex items-center space-x-4">
        {isOnline ? (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Online</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">Offline</span>
          </div>
        )}
        
        {storageType === 'cloud' && (
          <Button
            size="sm"
            variant="outline"
            disabled={!isOnline || isSyncing}
            onClick={syncPoems}
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisiere...' : 'Sync'}
          </Button>
        )}
        
        {lastSyncTime && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Letzter Sync: {lastSyncTime.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
  
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
    },
    {
      id : 7,
      title: "How Soon",
      author: "Unknown",
      content: `How soon the love turns into hate
Sweetness transitions to bitterness 
How the Cuckoo's voice no more rings the semblance of melody 

How soon the air grows toxic,
burning away feelings of warmth.
Tunes once frolic in memory
now lie earthed in the graveyard of love.

In front of that fallen hope
lay confused
the white Gladiolen 
forcing themselves to remember 
Once cherry,
once merry, 
Memories - 
violently pulverized,
steamlessly vaporized 
Into non-existence.

How soon the love turns into hate
Sweetness transitions to bitterness`,
      category: "Transformation",
      readTime: "2 min"
    
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
    <div className="min-h-screen space-y-8">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 rounded-xl p-8 shadow-sm border border-purple-100 dark:border-purple-800">
        <div className="flex items-center space-x-4 mb-4">
          <Link to="/therapy">
            <Button variant="outline" size="sm" className="shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Therapy
            </Button>
          </Link>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            ✍️ Poetry Therapy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find healing through the rhythm and beauty of words
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Storage Controls vor den Healing Poems */}
          <div>
            <StorageControls />
          </div>
          
          <Card className="shadow-lg border-2 border-purple-100 dark:border-purple-800">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-100 dark:border-purple-800">
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-purple-600 dark:text-purple-400">📖</span>
                Healing Poems
              </CardTitle>
              <CardDescription className="text-base">
               Read poems that bring light to the healing journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto p-6">
              {healingPoems.map((poem) => (
                <Card key={poem.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-400 dark:border-l-purple-600 bg-gradient-to-r from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{poem.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">by {poem.author}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(poem.category)}>
                            {poem.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {poem.readTime}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavorite(poem.id)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Heart 
                            className={`h-5 w-5 transition-all ${favoritePoems.has(poem.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400'}`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => readAloud(poem.id)}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Volume2 className={`h-5 w-5 transition-all ${isReading === poem.id ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm whitespace-pre-line italic leading-relaxed text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                      {poem.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-4">
                      <Button size="sm" variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Bookmark className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-indigo-100 dark:border-indigo-800">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-b border-indigo-100 dark:border-indigo-800">
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">💭</span>
                Poetry Prompts
              </CardTitle>
              <CardDescription className="text-base">
                Choose a prompt to inspire your writing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto p-6">
              {poetryPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant={selectedPoem === prompt.text ? "default" : "outline"}
                  className={`w-full text-left justify-start h-auto p-4 transition-all duration-200 hover:shadow-md ${
                    selectedPoem === prompt.text 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg scale-105' 
                      : 'hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                  onClick={() => setSelectedPoem(prompt.text)}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getCategoryColor(prompt.category)}>
                        {prompt.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {prompt.difficulty}
                      </Badge>
                    </div>
                    <div className={`text-sm ${selectedPoem === prompt.text ? 'text-white font-medium' : ''}`}>
                      {prompt.text}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-lg border-2 border-pink-100 dark:border-pink-800">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-b border-pink-100 dark:border-pink-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <span className="text-pink-600 dark:text-pink-400">✨</span>
                    Your Poetry
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {selectedPoem || "Select a prompt or write freely"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {isRecording ? (
                    <Button size="sm" variant="destructive" onClick={stopRecording} className="shadow-md animate-pulse">
                      <MicOff className="h-4 w-4 mr-1" />
                      {formatTime(recordingTime)}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startRecording} className="shadow-sm hover:shadow-md transition-shadow">
                      <Mic className="h-4 w-4 mr-1" />
                      Record
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <Input
                placeholder="Poem title (optional)"
                value={poemTitle}
                onChange={(e) => setPoemTitle(e.target.value)}
                className="text-lg font-semibold border-2 focus:border-pink-400 dark:focus:border-pink-600 transition-colors"
              />
              <Textarea
                placeholder="Let your words flow..."
                className="min-h-80 font-mono leading-relaxed text-base border-2 focus:border-pink-400 dark:focus:border-pink-600 transition-colors bg-gradient-to-br from-white to-pink-50/20 dark:from-gray-900 dark:to-pink-900/10"
                value={userPoem}
                onChange={(e) => setUserPoem(e.target.value)}
              />
              <div className="flex justify-between items-center pt-2">
                <div className="flex space-x-2">
                  <Button 
                    disabled={!userPoem.trim()} 
                    onClick={savePoem}
                    className="shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Poem
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUserPoem('');
                      setPoemTitle('');
                    }}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    Clear
                  </Button>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                  {userPoem.split('\n').length} lines • {userPoem.trim() ? userPoem.trim().split(/\s+/).length : 0} words
                </div>
              </div>

              {voiceRecordings.length > 0 && (
                <div className="border-t-2 border-pink-100 dark:border-pink-800 pt-6 mt-6">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Mic className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    Voice Recordings:
                  </h4>
                  <div className="space-y-2">
                    {voiceRecordings.map((recording, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border border-pink-200 dark:border-pink-700 hover:shadow-md transition-shadow">
                        <span className="font-medium text-sm">{recording}</span>
                        <div className="space-x-1">
                          <Button size="sm" variant="ghost" className="hover:bg-pink-100 dark:hover:bg-pink-900/30">
                            Play
                          </Button>
                          <Button size="sm" variant="ghost" className="hover:bg-pink-100 dark:hover:bg-pink-900/30">
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
            <Card className="shadow-lg border-2 border-teal-100 dark:border-teal-800">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-b border-teal-100 dark:border-teal-800">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-teal-600 dark:text-teal-400">📚</span>
                  Your Poetry Collection
                </CardTitle>
                <CardDescription className="text-base">
                  {savedPoems.length} {savedPoems.length === 1 ? 'poem' : 'poems'} written
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto p-6">
                {savedPoems.map((poem) => (
                  <Card key={poem.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-teal-400 dark:border-l-teal-600 bg-gradient-to-r from-white to-teal-50/30 dark:from-gray-800 dark:to-teal-900/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{poem.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                          {poem.createdAt}
                        </span>
                      </div>
                      {poem.prompt && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-2 bg-teal-50/50 dark:bg-teal-900/20 p-2 rounded border-l-2 border-teal-300 dark:border-teal-700">
                          "{poem.prompt}"
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm line-clamp-3 mb-3 text-gray-700 dark:text-gray-300">
                        {poem.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                          {poem.lineCount} lines • {poem.wordCount} words
                        </span>
                        <Button size="sm" variant="ghost" className="hover:bg-teal-100 dark:hover:bg-teal-900/30 font-medium">
                          Read Full
                        </Button>
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
