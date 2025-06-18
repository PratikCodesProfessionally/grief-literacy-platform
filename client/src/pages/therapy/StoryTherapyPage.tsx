import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, FileText, Clock, CheckCircle, Mic, MicOff } from 'lucide-react';

export function StoryTherapyPage() {
  const [selectedPrompt, setSelectedPrompt] = React.useState('');
  const [story, setStory] = React.useState('');
  const [savedStories, setSavedStories] = React.useState<any[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [voiceRecordings, setVoiceRecordings] = React.useState<string[]>([]);
  const [writingTimer, setWritingTimer] = React.useState(0);
  const [isWriting, setIsWriting] = React.useState(false);

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
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Comfort': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Connection': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Dreams': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Growth': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Honor': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Wisdom': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'Joy': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Tradition': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSaveStory = () => {
    if (story.trim() && selectedPrompt) {
      const newStory = {
        id: Date.now(),
        prompt: selectedPrompt,
        content: story,
        wordCount: story.trim().split(/\s+/).length,
        timeSpent: writingTimer,
        savedAt: new Date().toLocaleDateString(),
        category: storyPrompts.find(p => p.text === selectedPrompt)?.category || 'Unknown'
      };
      setSavedStories([...savedStories, newStory]);
      setCompletedPrompts(new Set([...completedPrompts, selectedPrompt]));
      setStory('');
      setSelectedPrompt('');
      setIsWriting(false);
      setWritingTimer(0);
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
            📖 Story Therapy
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Heal through the power of storytelling and narrative
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Your Story Journey</span>
          </CardTitle>
          <CardDescription>
            {completedPrompts.size} of {storyPrompts.length} prompts completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{Math.round(completionPercentage)}% Complete</span>
            <span>{savedStories.length} stories saved</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Story Prompts</CardTitle>
            <CardDescription>
              Choose a prompt to begin your therapeutic storytelling session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {storyPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant={selectedPrompt === prompt.text ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-4"
                onClick={() => setSelectedPrompt(prompt.text)}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCategoryColor(prompt.category)}>
                      {prompt.category}
                    </Badge>
                    {completedPrompts.has(prompt.text) && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-sm font-medium mb-1">{prompt.text}</div>
                  <div className="flex items-center space-x-2 text-xs">
                    <Badge variant="outline" className={getDifficultyColor(prompt.difficulty)}>
                      {prompt.difficulty}
                    </Badge>
                    <span className="text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {prompt.estimated}
                    </span>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Story</CardTitle>
                <CardDescription>
                  {selectedPrompt || "Select a prompt to begin writing"}
                </CardDescription>
              </div>
              {isWriting && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(writingTimer)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Start writing your story here..."
              className="min-h-80"
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
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                  {isRecording ? (
                    <Button variant="destructive" onClick={stopVoiceRecording}>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop ({formatTime(recordingTime)})
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={startVoiceRecording}>
                      <Mic className="h-4 w-4 mr-2" />
                      Voice Record
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {story.length} characters • {story.trim() ? story.trim().split(/\s+/).length : 0} words
              </div>
            </div>

            {voiceRecordings.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Voice Recordings:</h4>
                <div className="space-y-1">
                  {voiceRecordings.map((recording, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      <span>{recording}</span>
                      <Button size="sm" variant="ghost">Play</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Stories */}
      {savedStories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Story Collection</CardTitle>
            <CardDescription>
              Your completed stories and reflections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedStories.map((story) => (
                <Card key={story.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(story.category)}>
                        {story.category}
                      </Badge>
                      <span className="text-xs text-gray-500">{story.savedAt}</span>
                    </div>
                    <CardTitle className="text-sm line-clamp-2">
                      {story.prompt}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>{story.wordCount} words</div>
                      <div>Writing time: {formatTime(story.timeSpent)}</div>
                      <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                         {story.content}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      Read Full Story
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
