import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MoodSelector } from '@/components/ui/mood-selector';
import { ArrowLeft, CheckCircle, Clock, Palette, Sparkles, Users, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityProgress {
  [key: string]: 'not-started' | 'in-progress' | 'completed';
}

export function ArtTherapyPage() {
  const [showMoodSelector, setShowMoodSelector] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState<string | null>(null);
  const [currentMood, setCurrentMood] = React.useState<string>('');
  const [activityProgress, setActivityProgress] = React.useState<ActivityProgress>({
    'emotion-color': 'not-started',
    'memory-collage': 'in-progress',
    'symbolic-drawing': 'completed',
    'healing-mandala': 'not-started',
  });

  const moods = [
    { emoji: '😢', label: 'Sad', value: 'sad', color: 'border-blue-400' },
    { emoji: '😟', label: 'Anxious', value: 'anxious', color: 'border-yellow-400' },
    { emoji: '😐', label: 'Neutral', value: 'neutral', color: 'border-gray-400' },
    { emoji: '🙂', label: 'Calm', value: 'calm', color: 'border-green-400' },
    { emoji: '💙', label: 'Peaceful', value: 'peaceful', color: 'border-indigo-400' },
    { emoji: '✨', label: 'Hopeful', value: 'hopeful', color: 'border-purple-400' },
  ];

  const artActivities = [
    {
      id: 'emotion-color',
      title: "Emotion Color Mapping",
      description: "Use colors to express different feelings about your grief",
      icon: "🎨",
      themeColor: "from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      iconBg: "bg-red-50 dark:bg-red-900/30",
      detailedDescription: "Choose colors that represent your emotions and create a visual map of your feelings"
    },
    {
      id: 'memory-collage',
      title: "Memory Collage",
      description: "Create a visual representation of cherished memories",
      icon: "📸",
      themeColor: "from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      detailedDescription: "Combine photos, text, and drawings to honor special moments you shared"
    },
    {
      id: 'symbolic-drawing',
      title: "Symbolic Drawing",
      description: "Draw symbols that represent your journey through grief",
      icon: "🖼️",
      themeColor: "from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      iconBg: "bg-green-50 dark:bg-green-900/30",
      detailedDescription: "Express your grief journey through meaningful symbols and metaphors"
    },
    {
      id: 'healing-mandala',
      title: "Healing Mandala",
      description: "Create circular patterns that promote inner peace",
      icon: "🔮",
      themeColor: "from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-50 dark:bg-purple-900/30",
      detailedDescription: "Design intricate circular patterns that help center your mind and emotions"
    },
  ];

  const getProgressIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getProgressBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed ✅</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress ⏳</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const handleActivityStart = (activityId: string) => {
    setSelectedActivity(activityId);
    setShowMoodSelector(true);
  };

  const handleMoodSelect = (mood: string) => {
    setCurrentMood(mood);
    setShowMoodSelector(false);
    // Update progress to in-progress
    setActivityProgress(prev => ({
      ...prev,
      [selectedActivity!]: 'in-progress'
    }));
    // Here you would navigate to the actual activity
    console.log(`Starting ${selectedActivity} with mood: ${mood}`);
  };

  const completedCount = Object.values(activityProgress).filter(status => status === 'completed').length;
  const overallProgress = (completedCount / artActivities.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <Link to="/therapy">
            <Button variant="outline" size="sm" className="shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Therapy
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              🎨 Art Therapy Studio
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Express your emotions through creative visual art
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>Your Art Therapy Journey</span>
            </CardTitle>
            <CardDescription>
              {completedCount} of {artActivities.length} activities completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {overallProgress === 100 ? "Amazing progress! You've completed all activities." : 
               `${Math.round(overallProgress)}% complete - Keep exploring your creativity!`}
            </p>
          </CardContent>
        </Card>

        {/* Mood Selector Overlay */}
        {showMoodSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <MoodSelector
              title="How are you feeling right now?"
              description="Taking a moment to check in with yourself before creating"
              moods={moods}
              selectedMood={currentMood}
              onMoodSelect={handleMoodSelect}
              onClose={() => setShowMoodSelector(false)}
            />
          </div>
        )}

        {/* Art Activities Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {artActivities.map((activity) => (
            <Card 
              key={activity.id} 
              className={cn(
                "group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden",
                "bg-gradient-to-br",
                activity.themeColor,
                activity.borderColor,
                "border-2"
              )}
            >
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-3 rounded-xl text-2xl transition-transform group-hover:scale-110",
                      activity.iconBg
                    )}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{activity.title}</CardTitle>
                      <CardDescription className="text-sm mb-3">
                        {activity.description}
                      </CardDescription>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.detailedDescription}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getProgressIcon(activityProgress[activity.id])}
                    {getProgressBadge(activityProgress[activity.id])}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full group-hover:shadow-md transition-shadow"
                  onClick={() => handleActivityStart(activity.id)}
                  disabled={activityProgress[activity.id] === 'completed'}
                >
                  {activityProgress[activity.id] === 'completed' ? 'Completed' :
                   activityProgress[activity.id] === 'in-progress' ? 'Continue Activity' :
                   'Start Activity'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Digital Art Canvas */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-6 w-6 text-indigo-600" />
              <span>Digital Art Canvas</span>
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                Coming Soon
              </Badge>
            </CardTitle>
            <CardDescription>
              Professional-grade digital art tools for grief expression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white/50 dark:bg-gray-800/50 border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-xl p-8">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="text-6xl opacity-20 animate-pulse">🖌️</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Advanced Art Studio in Development
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span>Multiple brush types</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span>Layered editing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span>Color palettes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span>Export options</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 justify-center pt-4">
                    <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                      <Users className="h-4 w-4 mr-2" />
                      Join Beta List
                    </Button>
                    <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                      Try Simple Canvas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Community Gallery</span>
              </CardTitle>
              <CardDescription>
                See inspiring artwork from others on their healing journey (anonymous)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-3xl mb-3">🖼️</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  A safe space to share and be inspired by others' creative expressions
                </p>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  Explore Gallery
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-5 w-5 text-amber-600" />
                <span>Voice Reflection</span>
              </CardTitle>
              <CardDescription>
                Record your thoughts and feelings about your artwork
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-3xl mb-3">🎙️</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Speak about your creative process and emotional discoveries
                </p>
                <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  Start Recording
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
