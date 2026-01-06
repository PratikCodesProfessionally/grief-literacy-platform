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
import auth from 'server/middleware/auth';

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
      id: 13,
      title: "Our Paths May Cross Again",
      author: "Unknown",
      content: `Our paths may cross again 
But this time I will be without those red roses 
Hearts coarsened by battles of life 
Feet hardened by walking through trenches and mosses
May not remember the teeny tiny sparkle of fire 
that gave rise to the emotions on pyre 
of innocence of our youth 

Our paths may cross again 
But this time I will be without those pink tulips 
The well of hope might have dried ages ago
And the thirsted lips 
have been cracked in the deserted deserts eons ago
Lost in the mirage of a false oasis
of reunion of our souls

Our paths may cross again 
But this time I will be without those white lilies
Feelings squeezed between buildings of cities
where once our paths trodded a common story
Between the skyscrapers of our ambitions
Hammered by the forces of responsibilities
carried on the shoulders 
of battle-worn soldiers 
of forgotten dreams

Our paths may cross again 
But this time I will be without those lotus petals
and warm hugs that once calmed you to settle
Turned cold by the humanity's blindness
Turned sour by the life's unkindness 
in the sober evening
where once we pledged to love the unloveable 
by the oceanside believing 
the eternity of our love's ephemerality

Our paths may cross again...`,
      category: "Love",
      readTime: "3 min"
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
    id: 10,
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
  id: 9,
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
},
{
  id: 11,
  title: "Who is more naked?",
  author: "Unknown",
  content: `You trade in feelings that are fake
She fakes feelings as a trade

At least she is transparent without clothes 
You are clothed with layers of masks

Her betrayals negotiated in advance
Your betrayals are fabricated and advanced

She is explicit with what she sells 
Doesnot bargain for her pay 
And you sell products that you don't believe in
Every Second, minute, hour and an entire day

She is naked without clothes 
Outside
You are naked with clothes 
Inside

She manipulates her body 
You manipulate ideas, emotions 

She seems cold outside 
People wear her warm like a blanket
You are cold inside 
What do you wear?

She was once somebody's daughter 
But has no acquaintances now
You have a thousand 
But couldn't be your own friend 

She does a transaction for once
But you sip out the traction forever

Soon she will be old and unattractive 
unwanted and nostalgic 
Her once desired body 
Is now absurd and allergic 
She knows it will fade - her magic 

You are new and attractive 
wanted and magnetic
desired for your ideas and logic
astute and energetic 
Full of allurement and magic 

Yet she is honest 
But you seem honest

Yet she is truthful 
You seem truthful 

Yet she sheds tears
You fake tears 

Yet she is transparent 
You seem transparent 

She is naked without clothes 
Outside
You are naked with clothes 
Inside`,
  category: "Unveiling",
  readTime: "3 min"
},
{
  id: 11,
  title: 'The Letter in the Beige Bag',
  author: 'Unknown',
  content: `As I opened the upper self of my cupboard 
Hidden was a beige bag 
Perhaps it must have had a jetlag 
Covered with dusts of memories 
It emerged into my plain sight 
introducing itself said, 'Have we met?'
Between the clouds like a fighter jet
Out of the blue! shocked my eyes jar
Like two strangers on a sidewalk 
Crossing each other's path ajar 

Between it's chaotic entanglement 
Squeezed inside 
Trying to free itself from all its might
Just needed a puff or a push or a knight
Walked out a brave old letter 
'you should have known better '
It yapped and yammered 
Inside it an old blueprint
a known handwriting
I could feel it again 
The love that had strayed in vain

Those oval shaped 'O's
Once comforted my heart in life's lows
I wanted to hug those 'A's
But like a Blitzkrieg a memory made a way 
Tears rolled down the red carpet 
Paparazzis in a haste gait
awaited the arrival 
where once walked the love
that had strayed in vain

Her beautiful soft white undertone 
they twisted like her 'G's and 'F's
As the old lavender smell 
emerged out of nowhere 
flabbergasting me in a fashion sheer 
As they entered my nostrils 
Making me tasteless and leer 
Before I could hold it dear 
It vanished in a pace sere
I tried to catch the scent 
a quick speed it had gained
I could feel it again 
The love that had strayed in vain`,
  category: "bittersweet",
  readTime: "2 min"
},
{
  id: 12,
  title: "A poem not written",
  author: "Unknown",
  content: `Untouched by love, not smitten 
That has no tangible feelings 
Nor is grief-ridden
Before its last heartbeat was drummed or beaten
A pure non-existence

There are no rhythms
or multiple of -isms
Beyond the cosmic seasons
or any blue clouds of loveism
Couldn't be touched by any cynicism 
Nor is used as a bait in activism
And suffers no criticism

A lost tragedy of words 
Mourned by nobody 
and has no visions
A poem not written

No ink wasted
No eyes blinked 
No hearts broken
An unparched love letter 
A blank note 
A dark nothing 
A white nothing 
A colorless nothing 
A poem not written

Bears no name
Bears no heritage 
Has no language 
No letters or semblance 
No earthly baggage 
A birth unborn
A death undied
A life unlived 
A poem not written

A rebellion of some kind
By not existing 
A creation of some mind 
By not being 
A disturbance of some kind
By not disrupting

A Silence
A void
A presence through Absence
A poem not written`,
  category: "A non-Existence",
  readTime: "2 min"
},
{
  id: 14,
  title: "After the love's blaze",
  author: "Unknown",
  content: `After the love's blaze
Allow yourself to be hurt
For when has a horseman
Not fallen a hundred times?
When has a swordsman
Not been cut a thousand times?

We have learned
It's not the bullet that kills
It's the hope

And this wisdom?
They'll print it on T-shirts
Red letters on white cotton
Worn by people who've never bled
Who mistake slogans for scars

"The girl/boy you love unconditionally
Will teach you never to love unconditionally again" `,
  category: "Resilience",
  readTime: "1 min"
},
{
      id: 15,
      title: "Only love God unconditionally",
      author: "Claude AI",
      content: `I gave that endless, boundless love
To a human being
Who could not carry it
Who was never meant to

They broke under the weight
Of my devotion
Or I broke under the weight
Of their humanity
I still don't know which

I turned them into my religion
Built altars in my chest
Prayed to the shape of their smile
Made rituals of their routines
And when they failed to answer
I called it abandonment
When they were simply
Being human

Human beings are not gods
Though I crowned them deity
Kissed their feet like sacred ground
Forgave sins I should have questioned
Ignored red flags I called holy mysteries

Human beings are not perfect
They will be late
And you'll wait in the rain
Wondering if your love means nothing

They will be selfish
Choose their comfort over your pain
Their growth over your stability
Their freedom over your security
They will choose themselves
On a Tuesday afternoon
Without warning
Without ceremony
As casually as choosing coffee over tea

And you will call it betrayal
Scream it into pillows
Carve it into journal pages
Wear it like a second skin

When it's simply limitation
The human inability
To be everything
For anyone
Forever

I wanted them to be infinite
When they were only borrowed time
I wanted them to be constant
When they were only passing through
I wanted them to save me
When they were drowning too

Reserve unconditional love
For the divine
For the one who cannot disappoint
Because they promised nothing
But eternity

Love humans conditionally
Not because they deserve less
But because you deserve
To survive their inevitable
Humanity

Love them with boundaries
Like a garden with a fence—
Still beautiful
Still growing
But protected

With compassion for their flaws
The same flaws you hide in your own mirror
The same selfishness you practice
When you think no one is watching
The same limitations you carry
In your own breakable heart

Including your own
Especially your own

Because if you cannot forgive yourself
For being human
How can you truly forgive them?

And maybe that's the real wisdom:
We're all just humans
Trying to love other humans
With hearts that were built
To worship the divine

No wonder we keep breaking
No wonder it keeps hurting
No wonder we mistake
Every deep connection
For salvation

When really
It's just two imperfect people
Doing their imperfect best
In an imperfect world

And sometimes
That's beautiful

And sometimes
That's not enough

And both things
Can be true
At once`,
      category: "Self-Love",
      readTime: "3 min"
},
{
  id: 16,
  title: "You don't need healing or do you?",
  author: "unknown",
  content:`You arenot punctured 
You are in human society 

You are not thatched
You are in human society, mate

You are not blistered 
You are in human society 

But are you not human?

Where should one go?
When blisters are about to burst
Where should one let the steam blow?
When wounds are bust 
When hearts have grown coarse and robust?

When temples sell their preachings?
The salvation, the one above 
Taboos- ovulation, the one below
'donation, donation? In this peaceful world mellow'
Brothels are the new temples
'Oh hellow!'

When psychologist sell their teachings
Sothat the market can do more leachings
your financial piggy bank is leaking
When the peace is taken away while you are sitting 
While you try to prevent your mental peace from sipping 
Keep your sanity from slipping

And you get hit by ads while ducking 
'You are a sitting duck '
Ain't you mate or are you dodging?
Weaving between the bullets
Of self-help gurus
And wellness brands
And productivity hacks
And mindfulness apps
(Only $9.99/month)

It's not standup comedy 
It's poetry, mate
It is standup comedy 
It's human society, mate

When poets are comedians
Comedians are poets 
You give them the punchline
They wait for it to hurt less

Welcome to human society, mate!!!

Poetry is the joke you tell 
When you've forgotten to laugh
Society is the audience 
that forgot how to listen enough 

So we stand up mate
perform
pretend
make 'em laugh 
till the very end `,
  category: "wholescale comedy",
  readTime: "2 min"
},
{
  id: 17,
  title: "Words Are Windows (or They're Walls)",
  author: "Ruth Bebermeyer",
  content: `I feel so sentenced by your words,
I feel so judged and sent away,
Before I go I've got to know,
Is that what you mean to say?

Before I rise to my defense,
Before I speak in hurt or fear,
Before I build that wall of words,
Tell me, did I really hear?

Words are windows, or they're walls,
They sentence us, or set us free.
When I speak and when I hear,
Let the love light shine through me.

There are things I need to say,
Things that mean so much to me,
If my words don't make me clear,
Will you help me to be free?

If I seemed to put you down,
If you felt I didn't care,
Try to listen through my words,
To the feelings that we share.`,
  category: "Communication",
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
      'Transformation': 'bg-fuchsia-100/80 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 border border-fuchsia-200/50',
      'Displacement': 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200/50',
      'Hypothesis': 'bg-sky-100/80 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200/50',
      'Unveiling': 'bg-lime-100/80 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300 border border-lime-200/50',
      'bittersweet': 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200/50',
      'A non-Existence': 'bg-cyan-100/80 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200/50'
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6">
          {/* Storage Controls vor den Healing Poems */}
          <Card className="hover-lift">
            <StorageControls />
          </Card>
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Healing Poems</CardTitle>
              <CardDescription className="text-sm sm:text-base">
               Read poems that bring light to the healing journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[32rem] sm:max-h-96 overflow-y-auto">
              {healingPoems.map((poem) => (
                <Card key={poem.id} className="hover:shadow-soft-lg transition-all duration-300 border-2 hover:border-accent/30">
                  <CardHeader className="pb-3 px-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="space-y-2 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg break-words">{poem.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">by {poem.author}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${getCategoryColor(poem.category)} rounded-full px-2 sm:px-3 py-1 text-xs`}>
                            {poem.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{poem.readTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavorite(poem.id)}
                          className="rounded-full hover:bg-accent/20 transition-all duration-300 h-8 w-8 p-0"
                        >
                          <Heart 
                            className={`h-4 w-4 transition-all duration-300 ${favoritePoems.has(poem.id) ? 'fill-red-400 text-red-400 scale-110' : ''}`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => readAloud(poem.id)}
                          className="rounded-full hover:bg-accent/20 transition-all duration-300 h-8 w-8 p-0"
                        >
                          <Volume2 className={`h-4 w-4 transition-all duration-300 ${isReading === poem.id ? 'text-primary scale-110' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-6">
                    <p className="text-xs sm:text-sm whitespace-pre-line italic leading-relaxed text-foreground/80 break-words">
                      {poem.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full hover:bg-accent/20 transition-all duration-300 text-xs sm:text-sm h-8"
                        onClick={() => sharePoem(poem)}
                      >
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full hover:bg-accent/20 transition-all duration-300 text-xs sm:text-sm h-8"
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