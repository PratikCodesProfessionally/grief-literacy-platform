import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, FileText, Clock, CheckCircle, Mic, MicOff, Cloud, HardDrive, X } from 'lucide-react';
import { StorageProviderFactory } from '@/services/StorageService';
import type { IStorageProvider, Story } from '@/services/StorageService';

export function StoryTherapyPage() {
  const [selectedPrompt, setSelectedPrompt] = React.useState('');
  const [story, setStory] = React.useState('');
  const [savedStories, setSavedStories] = React.useState<Story[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [voiceRecordings, setVoiceRecordings] = React.useState<string[]>([]);
  const [writingTimer, setWritingTimer] = React.useState(0);
  const [isWriting, setIsWriting] = React.useState(false);
  const [storageType, setStorageType] = React.useState<'local' | 'cloud'>('local');
  const [storageProvider, setStorageProvider] = React.useState<IStorageProvider | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedStoryForReading, setSelectedStoryForReading] = React.useState<Story | null>(null);
  const [activeTab, setActiveTab] = React.useState<'stories' | 'divine-comedy'>('stories');

  // Divine Comedy Chapters - Chapter-by-chapter philosophical interpretation inspired by Predictive History
  const divineComedyChapters = [
    {
      number: 1,
      cantica: "Inferno",
      title: "The Dark Forest: Recognizing the Abyss Within",
      theme: "Self-Awareness & Crisis",
      interpretation: `Dante's journey begins in a dark forest, lost and confused. In the context of grief and spiritual crisis, this represents the moment when we can no longer ignore our pain. The forest symbolizes how grief disorients us. We lose our way, surrounded by familiar yet frightening terrain.\n\nThe philosophical meaning: Before transformation can occur, we must acknowledge that we are lost. The "dark forest" is not a punishment but an awakening. Dante's fear and confusion are the catalysts for change. Similarly, in grief, the initial darkness is often the moment when we stop pretending and face reality.\n\nPredictive History's insight: History shows that civilizations and individuals only advance when they confront their deepest crises. The forest represents the crisis point. Denial ends and the journey toward healing begins.`,
      reflection: "When did you realize you were 'lost' in your grief? What did that moment of clarity feel like?",
      keywords: ["Crisis", "Awakening", "Dark night of the soul", "Self-recognition"]
    }
  ];

  const storyPrompts = [
    {
      text: "Write about a memory that brings you comfort",
      category: "Comfort",
      difficulty: "Easy",
      estimated: "10-15 min"
    },
    {
      text: "Tell the story of how you met your loved one",
      category: "Connection",
      difficulty: "Medium", 
      estimated: "15-20 min"
    },
    {
      text: "Describe a perfect day you would spend together",
      category: "Dreams",
      difficulty: "Medium",
      estimated: "20-25 min"
    },
    {
      text: "Write a letter to your future self about this journey",
      category: "Growth",
      difficulty: "Hard",
      estimated: "25-30 min"
    },
    {
      text: "Create a story where your loved one is the hero",
      category: "Honor",
      difficulty: "Hard", 
      estimated: "30+ min"
    },
    {
      text: "Write about a lesson they taught you",
      category: "Wisdom",
      difficulty: "Medium",
      estimated: "15-20 min"
    },
    {
      text: "Describe their laugh and what made them happy",
      category: "Joy",
      difficulty: "Easy",
      estimated: "10-15 min"
    },
    {
      text: "Tell the story of a tradition you shared",
      category: "Tradition",
      difficulty: "Medium",
      estimated: "20-25 min"
    }
  ];

  const [completedPrompts, setCompletedPrompts] = React.useState<Set<string>>(new Set());

  // Initialize storage provider
  React.useEffect(() => {
    const initStorage = async () => {
      try {
        const provider = StorageProviderFactory.createProvider(
          storageType, 
          'story-therapy-stories',
          storageType === 'cloud' ? 'https://api.example.com' : undefined
        );
        setStorageProvider(provider);
        
        // Load saved stories
        const stories = await provider.list<Story>();
        setSavedStories(stories);
        
        // Update completed prompts
        const completed = new Set(stories.map(s => s.prompt));
        setCompletedPrompts(completed);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        // Fallback to local storage if initialization fails
        try {
          const fallbackProvider = StorageProviderFactory.createProvider('local', 'story-therapy-stories', undefined);
          setStorageProvider(fallbackProvider);
          const stories = await fallbackProvider.list<Story>();
          setSavedStories(stories);
          const completed = new Set(stories.map(s => s.prompt));
          setCompletedPrompts(completed);
        } catch (fallbackError) {
          console.error('Fallback storage initialization also failed:', fallbackError);
        }
        setIsLoading(false);
      }
    };

    initStorage();
  }, [storageType]);

  // Writing timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWriting) {
      interval = setInterval(() => {
        setWritingTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWriting]);

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

  // Track writing activity
  React.useEffect(() => {
    if (story.length > 0 && !isWriting) {
      setIsWriting(true);
    } else if (story.length === 0 && isWriting) {
      setIsWriting(false);
      setWritingTimer(0);
    }
  }, [story, isWriting]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200/50';
      case 'Medium': return 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200/50';
      case 'Hard': return 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200/50';
      default: return 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200/50';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Comfort': 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50',
      'Connection': 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/50',
      'Dreams': 'bg-pink-100/80 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200/50',
      'Growth': 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/50',
      'Honor': 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50',
      'Wisdom': 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50',
      'Joy': 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200/50',
      'Tradition': 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200/50'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100/80 text-gray-700 border border-gray-200/50';
  };

  const handleSaveStory = async () => {
    if (!story.trim()) {
      alert('Please write a story before saving.');
      return;
    }
    if (!selectedPrompt) {
      alert('Please select a prompt before saving.');
      return;
    }
    if (!storageProvider) {
      alert('Storage not available. Please try again.');
      return;
    }
    
    try {
      const newStory: Omit<Story, 'id' | 'createdAt' | 'updatedAt'> = {
        prompt: selectedPrompt,
        content: story,
        wordCount: story.trim().split(/\s+/).length,
        timeSpent: writingTimer,
        savedAt: new Date().toLocaleDateString(),
        category: storyPrompts.find(p => p.text === selectedPrompt)?.category || 'Unknown'
      };
      
      const savedStory = await storageProvider.save(newStory as Story);
      setSavedStories([...savedStories, savedStory]);
      setCompletedPrompts(new Set([...completedPrompts, selectedPrompt]));
      setStory('');
      setSelectedPrompt('');
      setIsWriting(false);
      setWritingTimer(0);
      alert('Story saved successfully!');
    } catch (error) {
      console.error('Failed to save story:', error);
      alert(`Failed to save story: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleStorageTypeChange = (newType: 'local' | 'cloud') => {
    if (storageType !== newType) {
      setStorageType(newType);
      setIsLoading(true);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    const recordingName = `Voice Story ${voiceRecordings.length + 1} (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})`;
    setVoiceRecordings([...voiceRecordings, recordingName]);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completionPercentage = (completedPrompts.size / storyPrompts.length) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your stories...</p>
        </div>
      </div>
    );
  }

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
            📖 Story Therapy
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Heal through the power of storytelling and narrative
          </p>
          {/* Tab Buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'stories' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('stories')}
              className="rounded-full"
            >
              Story Prompts
            </Button>
            <Button
              variant={activeTab === 'divine-comedy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('divine-comedy')}
              className="rounded-full"
            >
              Divine Comedy
            </Button>
          </div>
        </div>
        
        {/* Storage Type Toggle */}
        <div className="flex items-center space-x-2 bg-muted/30 rounded-full p-1">
          <Button
            variant={storageType === 'local' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleStorageTypeChange('local')}
            className="rounded-full"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Local
          </Button>
          <Button
            variant={storageType === 'cloud' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleStorageTypeChange('cloud')}
            className="rounded-full"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Cloud
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 hover-lift border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            <span>Your Story Journey</span>
          </CardTitle>
          <CardDescription className="text-base">
            {completedPrompts.size} of {storyPrompts.length} prompts completed • {storageType === 'local' ? 'Stored locally' : 'Synced to cloud'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3 mb-3 rounded-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{Math.round(completionPercentage)}% Complete</span>
            <span>{savedStories.length} stories saved</span>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <Card className="lg:col-span-1 hover-lift">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Story Prompts</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Choose a prompt to begin your therapeutic storytelling session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[28rem] sm:max-h-96 overflow-y-auto">
            {storyPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant={selectedPrompt === prompt.text ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-soft hover:scale-[1.02]"
                onClick={() => setSelectedPrompt(prompt.text)}
              >
                <div className="w-full min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <Badge className={`${getCategoryColor(prompt.category)} rounded-full px-2 sm:px-3 py-1 text-xs`}>
                      {prompt.category}
                    </Badge>
                    {completedPrompts.has(prompt.text) && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium mb-2 leading-relaxed break-words">{prompt.text}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className={`${getDifficultyColor(prompt.difficulty)} rounded-full`}>
                      {prompt.difficulty}
                    </Badge>
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {prompt.estimated}
                    </span>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Your Story</CardTitle>
                <CardDescription className="text-base">
                  {selectedPrompt || "Select a prompt to begin writing"}
                </CardDescription>
              </div>
              {isWriting && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(writingTimer)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Start writing your story here..."
              className="min-h-80 rounded-2xl border-2 focus:border-primary/40 transition-all duration-300 resize-none leading-loose"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              disabled={!selectedPrompt}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="space-x-2">
                  <Button 
                    disabled={!story.trim() || !selectedPrompt}
                    onClick={handleSaveStory}
                    className="rounded-full transition-all duration-300 hover:scale-105"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Story
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStory('');
                      setIsWriting(false);
                      setWritingTimer(0);
                    }}
                    className="rounded-full hover:bg-accent/20 transition-all duration-300"
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="border-l border-border pl-4">
                  {isRecording ? (
                    <Button variant="destructive" onClick={stopVoiceRecording} className="rounded-full">
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop ({formatTime(recordingTime)})
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={startVoiceRecording} className="rounded-full hover:bg-accent/20 transition-all duration-300">
                      <Mic className="h-4 w-4 mr-2" />
                      Voice Record
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {story.length} characters • {story.trim() ? story.trim().split(/\s+/).length : 0} words
              </div>
            </div>

            {voiceRecordings.length > 0 && (
              <div className="border-t pt-4 border-border">
                <h4 className="font-medium mb-3 text-lg">Voice Recordings:</h4>
                <div className="space-y-2">
                  {voiceRecordings.map((recording, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl text-sm hover:bg-muted/50 transition-all duration-300">
                      <span>{recording}</span>
                      <Button size="sm" variant="ghost" className="rounded-full">Play</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Divine Comedy Section */}
      {activeTab === 'divine-comedy' && (
      <div className="space-y-6">
        {divineComedyChapters.map((chapter) => (
          <Card key={chapter.number} className="hover-lift">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-primary/20 text-primary rounded-full px-3 py-1">
                  {chapter.cantica}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Chapter {chapter.number}
                </Badge>
              </div>
              <CardTitle className="text-2xl mb-2">{chapter.title}</CardTitle>
              <CardDescription className="text-base">
                <span className="font-semibold text-foreground">Theme:</span> {chapter.theme}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h4 className="font-semibold text-lg mb-3">Philosophical Interpretation</h4>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {chapter.interpretation}
                </p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="font-semibold mb-2">Reflection Prompt</h4>
                <p className="text-foreground/70 italic">{chapter.reflection}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Concepts</h4>
                <div className="flex flex-wrap gap-2">
                  {chapter.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="rounded-full bg-accent/10">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Saved Stories */}
      {activeTab === 'stories' && savedStories.length > 0 && (
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-2xl">Your Story Collection</CardTitle>
            <CardDescription className="text-base">
              Your completed stories and reflections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedStories.map((story) => (
                <Card key={story.id} className="hover:shadow-soft-lg transition-all duration-300 border-2 hover:border-accent/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getCategoryColor(story.category)} rounded-full px-3 py-1`}>
                        {story.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{story.savedAt}</span>
                    </div>
                    <CardTitle className="text-base line-clamp-2 leading-relaxed">
                      {story.prompt}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground space-y-2">
                      <div>{story.wordCount} words</div>
                      <div>Writing time: {formatTime(story.timeSpent)}</div>
                      <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                         {story.content}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-4 rounded-full hover:bg-accent/20 transition-all duration-300" onClick={() => setSelectedStoryForReading(story)}>
                      Read Full Story
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Reading Modal */}
      <Dialog open={selectedStoryForReading !== null} onOpenChange={(open) => !open && setSelectedStoryForReading(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedStoryForReading?.prompt}</DialogTitle>
            <DialogDescription>View your saved story</DialogDescription>
            <div className="flex gap-4 items-center pt-2">
              <Badge className={`${getCategoryColor(selectedStoryForReading?.category || '')} rounded-full`}>
                {selectedStoryForReading?.category}
              </Badge>
              <span className="text-sm text-muted-foreground">{selectedStoryForReading?.savedAt}</span>
            </div>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div className="flex gap-6 text-sm text-muted-foreground pb-4 border-b">
              <div>
                <span className="font-semibold text-foreground">{selectedStoryForReading?.wordCount}</span> words
              </div>
              <div>
                <span className="font-semibold text-foreground">{selectedStoryForReading && formatTime(selectedStoryForReading.timeSpent)}</span> writing time
              </div>
            </div>
            <p className="text-base whitespace-pre-wrap leading-relaxed text-foreground">
              {selectedStoryForReading?.content}
            </p>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSelectedStoryForReading(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
