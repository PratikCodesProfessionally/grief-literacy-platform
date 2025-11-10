import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Heart, Share, Bookmark, Volume2, Mic, MicOff, Save, Download, Play, Pause, Trash2, Check, Copy } from 'lucide-react';
import { ApiClient } from '@/services/ApiClient';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Wifi, WifiOff, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { storageProvider } from '@/services/StorageProvider';

interface VoiceRecording {
  id: number;
  name: string;
  blob: Blob;
  url: string;
  duration: number;
}

export function PoetryTherapyPage() {
  const [selectedPoem, setSelectedPoem] = React.useState('');
  const [userPoem, setUserPoem] = React.useState('');
  const [poemTitle, setPoemTitle] = React.useState('');
  const [savedPoems, setSavedPoems] = React.useState<any[]>([]);
  const [favoritePoems, setFavoritePoems] = React.useState<Set<number>>(new Set());
  const [savedHealingPoems, setSavedHealingPoems] = React.useState<Set<number>>(new Set());
  const [isReading, setIsReading] = React.useState<number | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [voiceRecordings, setVoiceRecordings] = React.useState<VoiceRecording[]>([]);
  const [selectedFullPoem, setSelectedFullPoem] = React.useState<any | null>(null);
  const [playingRecording, setPlayingRecording] = React.useState<number | null>(null);
  
  // Neue Zustände für Storage und Sync
  const [storageType, setStorageType] = React.useState<'local' | 'cloud'>('local');
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);
  
  // MediaRecorder refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);
  
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

  // Cleanup audio URLs on unmount
  React.useEffect(() => {
    return () => {
      voiceRecordings.forEach(recording => {
        URL.revokeObjectURL(recording.url);
      });
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
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

    // Load saved healing poems from localStorage
    const saved = localStorage.getItem('savedHealingPoems');
    if (saved) {
      setSavedHealingPoems(new Set(JSON.parse(saved)));
    }
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

  const saveHealingPoem = (poemId: number, poemTitle: string) => {
    const newSaved = new Set(savedHealingPoems);
    if (newSaved.has(poemId)) {
      newSaved.delete(poemId);
      toast({
        title: "Aus Sammlung entfernt",
        description: `"${poemTitle}" wurde aus Ihrer Sammlung entfernt`,
      });
    } else {
      newSaved.add(poemId);
      toast({
        title: "Zur Sammlung hinzugefügt",
        description: `"${poemTitle}" wurde zu Ihrer Sammlung hinzugefügt`,
      });
    }
    setSavedHealingPoems(newSaved);
    localStorage.setItem('savedHealingPoems', JSON.stringify(Array.from(newSaved)));
  };

  const sharePoem = async (poem: any) => {
    const shareText = `${poem.title}\nby ${poem.author}\n\n${poem.content}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: poem.title,
          text: shareText,
        });
        toast({
          title: "Erfolgreich geteilt",
          description: `"${poem.title}" wurde geteilt`,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(shareText, poem.title);
        }
      }
    } else {
      copyToClipboard(shareText, poem.title);
    }
  };

  const copyToClipboard = async (text: string, title: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "In Zwischenablage kopiert",
        description: `"${title}" wurde in die Zwischenablage kopiert`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte nicht in die Zwischenablage kopieren",
        variant: "destructive",
      });
    }
  };

  const exportPoemAsText = (poem: any) => {
    const content = `${poem.title}\n${poem.createdAt ? `Created: ${poem.createdAt}` : ''}\n${poem.prompt ? `Prompt: "${poem.prompt}"` : ''}\n\n${poem.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${poem.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export erfolgreich",
      description: `"${poem.title}" wurde als Textdatei exportiert`,
    });
  };

  // UI-Komponenten für Storage-Controls
  const StorageControls = () => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {storageType === 'local' ? (
            <HardDrive className="h-4 w-4" />
          ) : (
            <Cloud className="h-4 w-4" />
          )}
          <span>Storage: {storageType === 'local' ? 'Lokal' : 'Cloud'}</span>
        </div>
        <Switch
          checked={storageType === 'cloud'}
          onCheckedChange={(checked) => setStorageType(checked ? 'cloud' : 'local')}
        />
      </div>
      
      <div className="flex items-center space-x-4">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        
        {storageType === 'cloud' && (
          <Button
            size="sm"
            variant="outline"
            disabled={!isOnline || isSyncing}
            onClick={syncPoems}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisiere...' : 'Sync'}
          </Button>
        )}
        
        {lastSyncTime && (
          <span className="text-xs text-gray-500">
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
    
    },
     {
      id : 8,
      title: "'Are you sure you even packed it?",
      author: "Unknown",
      content: `You seem confused dear Sir? 
Are you sure you belong here?

A barrage of questions hits him 
Your name looks odd Ibrahim 

The eyes are watery and scared
He wants to return to his home,
But home is ash and bone 

punctured and teared
marred and severed

The guy on immigration runs over his passport
crushes it like a cigarette butt
His attire props him up with satire
But you look different, sire

Do you think you belong here in our empire?

The nervous laughter, a half smile, 
the situation is dire
His attire screams the truth, but the officer's eyes judge him guilty,
a born liar, a living pyre

"The story we want to tell you is of love
Not of hate" a big billboard at the landing gate
But something feels not right about your landing gear?

He wants to tear his clothes old
peel off the skin that marks him odd

H & M, C & A, the brands that promise to make you look smart and smooth
Prep you up for an integration school
duty free products 

A silent slave to the economy's bloom
Operator of multiple saloons
gets labeled as a goon, a plague, a wound
H & M, C & A cannot bleach you into one of us
'You loon'

You have left your soul at home 
You have landed 
but your dignity 
' has been delayed '

I guess it must be checked out
with your 23 kg luggage

But wait you claim your bags
and something is missing
Something they never returned.

'Are you sure you even packed it?'
`,
      category: "Displacement",
      readTime: "2 min"
    
    },
     {
    id: 9,
    title: "After the love's funeral",
    author: "Unknown",
    content: `Allow yourself to feel it 
the unfeelable
hand of divine creation 

Allow yourself to see it 
the unseeable
disguise of eternal cosmos

Don't build walls and dams like beaver 
Pour the beaker 
of love 
For you are a seeker 
of love 

Let the sandstorm sway away 
the ancient wounds 
the cascades arrayal

Let the thunderstorm carry away
the ancient sounds 
Of masquerades, betrayal 

Let the heavy rain 
wash away the burdens, the dues 
needing attention, defrayal

Allow yourself to hear it 
the heresay of hope
between the whispers of salient trees

Allow yourself to taste it 
the taste of autumn leaves

Let go my friend 
the grudges of past 

See those ridges and cliffs 
beyond the ever sailing mast

Feel the dance of eternal play 
between the stardust's lay 
the unfathomable, aghast 

The home you seek
the ultimate the last`,
    category: "Journey",
    readTime: "2 min"
  },
  {
  id: 10,
  title: "After the love's demise",
  author: "Unknown",
  content: `After the love's demise
Don't collect the last breath 
From the raging fire of heart's hearth
Let it be gassed and released 
Chimneyed into open earth 
Let it recollect its memories 
Let it have a new birth 

After the love's demise 
Let the warm tears freely flow 
Into the cold cheek's glow 
Let it be crystallized 
Let it be prickly and needlized 
Piercing through the rib cages hollow 

After the love's demise 
Let the pink tulips wilt 
Let the white cotton quilt
be disarrayed
like the red emotions and orange guilt 
lie martyred and deranged

After the love's demise
Let the letters be burned 
Let the Shakespeares mourn 
Let the literature be shunned 
Let the feelings be gunned
Mortared, rifled and bombed

After the love's demise
Let the soul be thirsty 
of bright white light
that lie hidden out of human sight 
in the deep ocean's vile 
Between the holdfast of clam's guile 
Between the timid stars 
far in oblivion but agile

After the love's demise
let apple fall behind Newton's head 
Let the charity be born
Gravity can wait instead
Let the Schrodinger's cat be dead 
Let the relativity be poisoned with lead 

After the love's demise
Let the microcontrollers be frozen
Nullified and zeroed bitwise
Let the world be taken by a bot
Let the singularity remain a dot
Let the black holes be wise 
Swallow everything of universe's size`,
  category: "Hypothesis",
  readTime: "3 min"
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const recordingName = `Poetry Reading ${voiceRecordings.length + 1} (${formatTime(recordingTime)})`;
        
        const newRecording: VoiceRecording = {
          id: Date.now(),
          name: recordingName,
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime
        };

        setVoiceRecordings(prev => [...prev, newRecording]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Aufnahme gespeichert",
          description: recordingName,
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      toast({
        title: "Aufnahme gestartet",
        description: "Lesen Sie Ihr Gedicht vor",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Fehler",
        description: "Mikrofon-Zugriff wurde verweigert",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = (recording: VoiceRecording) => {
    if (playingRecording === recording.id) {
      // Stop current playback
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      setPlayingRecording(null);
    } else {
      // Stop previous playback if any
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      // Create new audio player
      const audio = new Audio(recording.url);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setPlayingRecording(null);
      };

      audio.onerror = () => {
        toast({
          title: "Fehler",
          description: "Aufnahme konnte nicht abgespielt werden",
          variant: "destructive",
        });
        setPlayingRecording(null);
      };

      audio.play();
      setPlayingRecording(recording.id);
    }
  };

  const downloadRecording = (recording: VoiceRecording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `${recording.name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download gestartet",
      description: `${recording.name}.webm`,
    });
  };

  const deleteRecording = (recordingId: number) => {
    const recording = voiceRecordings.find(r => r.id === recordingId);
    if (recording) {
      // Stop playback if this recording is playing
      if (playingRecording === recordingId && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingRecording(null);
      }
      
      // Revoke object URL
      URL.revokeObjectURL(recording.url);
      
      // Remove from state
      setVoiceRecordings(prev => prev.filter(r => r.id !== recordingId));
      
      toast({
        title: "Aufnahme gelöscht",
        description: recording.name,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Understanding': 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50',
      'Acceptance': 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200/50',
      'Wisdom': 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/50',
      'Love': 'bg-pink-100/80 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200/50',
      'Connection': 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/50',
      'Expression': 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200/50',
      'Memory': 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50',
      'Spiritual': 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200/50',
      'Senses': 'bg-teal-100/80 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200/50',
      'Objects': 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200/50',
      'Journey': 'bg-slate-100/80 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border border-slate-200/50',
      'Guilt': 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200/50',
      'Simplicity': 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50',
      'Transformation': 'bg-fuchsia-100/80 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 border border-fuchsia-200/50'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100/80 text-gray-700 border border-gray-200/50';
  };

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link to="/therapy">
          <Button variant="outline" size="sm" className="rounded-full shadow-soft hover:shadow-soft-lg transition-all duration-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Therapy
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-semibold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ✍️ Poetry Therapy
          </h1>
          <p className="text-lg text-muted-foreground">
            Find healing through the rhythm and beauty of words
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Storage Controls vor den Healing Poems */}
          <Card className="hover-lift">
            <StorageControls />
          </Card>
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="text-2xl">Healing Poems</CardTitle>
              <CardDescription className="text-base">
               Read poems that bring light to the healing journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {healingPoems.map((poem) => (
                <Card key={poem.id} className="hover:shadow-soft-lg transition-all duration-300 border-2 hover:border-accent/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{poem.title}</h3>
                        <p className="text-sm text-muted-foreground">by {poem.author}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getCategoryColor(poem.category)} rounded-full px-3 py-1`}>
                            {poem.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{poem.readTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavorite(poem.id)}
                          className="rounded-full hover:bg-accent/20 transition-all duration-300"
                        >
                          <Heart 
                            className={`h-4 w-4 transition-all duration-300 ${favoritePoems.has(poem.id) ? 'fill-red-400 text-red-400 scale-110' : ''}`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => readAloud(poem.id)}
                          className="rounded-full hover:bg-accent/20 transition-all duration-300"
                        >
                          <Volume2 className={`h-4 w-4 transition-all duration-300 ${isReading === poem.id ? 'text-primary scale-110' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm whitespace-pre-line italic leading-relaxed text-foreground/80">
                      {poem.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full hover:bg-accent/20 transition-all duration-300"
                        onClick={() => sharePoem(poem)}
                      >
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full hover:bg-accent/20 transition-all duration-300"
                        onClick={() => saveHealingPoem(poem.id, poem.title)}
                      >
                        {savedHealingPoems.has(poem.id) ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Bookmark className="h-3 w-3 mr-1" />
                        )}
                        {savedHealingPoems.has(poem.id) ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="text-2xl">Poetry Prompts</CardTitle>
              <CardDescription className="text-base">
                Choose a prompt to inspire your writing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {poetryPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant={selectedPoem === prompt.text ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto p-4 rounded-2xl transition-all duration-300 hover:shadow-soft hover:scale-[1.02]"
                  onClick={() => setSelectedPoem(prompt.text)}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getCategoryColor(prompt.category)} rounded-full px-3 py-1`}>
                        {prompt.category}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {prompt.difficulty}
                      </Badge>
                    </div>
                    <div className="text-sm leading-relaxed">{prompt.text}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Your Poetry</CardTitle>
                  <CardDescription className="text-base">
                    {selectedPoem || "Select a prompt or write freely"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {isRecording ? (
                    <Button size="sm" variant="destructive" onClick={stopRecording} className="rounded-full">
                      <MicOff className="h-4 w-4 mr-1" />
                      {formatTime(recordingTime)}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startRecording} className="rounded-full hover:bg-accent/20 transition-all duration-300">
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
                className="rounded-2xl border-2 focus:border-primary/40 transition-all duration-300"
              />
              <Textarea
                placeholder="Let your words flow..."
                className="min-h-80 font-mono leading-loose rounded-2xl border-2 focus:border-primary/40 transition-all duration-300 resize-none"
                value={userPoem}
                onChange={(e) => setUserPoem(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button disabled={!userPoem.trim()} onClick={savePoem} className="rounded-full transition-all duration-300 hover:scale-105">
                    <Save className="h-4 w-4 mr-2" />
                    Save Poem
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setUserPoem('');
                    setPoemTitle('');
                  }} className="rounded-full hover:bg-accent/20 transition-all duration-300">
                    Clear
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {userPoem.split('\n').length} lines • {userPoem.trim() ? userPoem.trim().split(/\s+/).length : 0} words
                </div>
              </div>

              {voiceRecordings.length > 0 && (
                <div className="border-t pt-4 border-border">
                  <h4 className="font-medium mb-3 text-lg">Voice Recordings:</h4>
                  <div className="space-y-2">
                    {voiceRecordings.map((recording) => (
                      <div key={recording.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl text-sm hover:bg-muted/50 transition-all duration-300">
                        <span className="flex-1">{recording.name}</span>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-full"
                            onClick={() => playRecording(recording)}
                          >
                            {playingRecording === recording.id ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-full"
                            onClick={() => downloadRecording(recording)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-full text-destructive hover:text-destructive"
                            onClick={() => deleteRecording(recording.id)}
                          >
                            <Trash2 className="h-3 w-3" />
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
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl">Your Poetry Collection</CardTitle>
                <CardDescription className="text-base">
                  {savedPoems.length} poems written
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {savedPoems.map((poem) => (
                  <Card key={poem.id} className="hover:shadow-soft-lg transition-all duration-300 border-2 hover:border-accent/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-lg">{poem.title}</h4>
                        <span className="text-xs text-muted-foreground">{poem.createdAt}</span>
                      </div>
                      {poem.prompt && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          "{poem.prompt}"
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm line-clamp-3 mb-3 leading-relaxed">
                        {poem.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{poem.lineCount} lines • {poem.wordCount} words</span>
                        <Button size="sm" variant="ghost" className="rounded-full hover:bg-accent/20 transition-all duration-300" onClick={() => setSelectedFullPoem(poem)}>Read Full</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Full Poem Dialog */}
      <Dialog open={!!selectedFullPoem} onOpenChange={(open) => !open && setSelectedFullPoem(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedFullPoem?.title}</DialogTitle>
            <DialogDescription>
              {selectedFullPoem?.createdAt}
              {selectedFullPoem?.prompt && (
                <span className="block mt-2 italic text-sm">
                  Prompt: "{selectedFullPoem.prompt}"
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-line leading-relaxed font-mono text-base">
                {selectedFullPoem?.content}
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
              <span>{selectedFullPoem?.lineCount} lines • {selectedFullPoem?.wordCount} words</span>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => sharePoem({
                    title: selectedFullPoem?.title,
                    author: 'You',
                    content: selectedFullPoem?.content
                  })}
                >
                  <Share className="h-3 w-3 mr-1" />
                  Share
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => exportPoemAsText(selectedFullPoem)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}