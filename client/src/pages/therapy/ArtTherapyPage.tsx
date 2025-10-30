import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MoodSelector } from '@/components/ui/mood-selector';
import { ArrowLeft, CheckCircle, Clock, Palette, Sparkles, Users, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

// Activity modals (same folder)
import { EmotionColorMapping } from './EmotionColorMapping';
import { MemoryCollage } from './MemoryCollage';
import { SymbolicDrawing } from './SymbolicDrawing';
import { HealingMandala } from './HealingMandala';
import { AdvancedDigitalStudio } from './AdvancedDigitalStudio';

interface ActivityProgress {
  [key: string]: 'not-started' | 'in-progress' | 'completed';
}

export function ArtTherapyPage() {
  const [showMoodSelector, setShowMoodSelector] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState<string | null>(null);
  const [currentMood, setCurrentMood] = React.useState<string>('');

  const [modals, setModals] = React.useState({
    emotion: false,
    collage: false,
    drawing: false,
    mandala: false,
    digitalStudio: false,
  });

  const [activityProgress, setActivityProgress] = React.useState<ActivityProgress>({
    'emotion-color': 'not-started',
    'memory-collage': 'not-started',
    'symbolic-drawing': 'not-started',
    'healing-mandala': 'not-started',
    'digital-studio': 'not-started',
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
      title: 'Emotion Color Mapping',
      description: 'Use colors to express different feelings about your grief',
      icon: '🎨',
      themeColor: 'from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-50 dark:bg-red-900/30',
      detailedDescription: 'Choose colors that represent your emotions and create a visual map of your feelings',
    },
    {
      id: 'memory-collage',
      title: 'Memory Collage',
      description: 'Create a visual representation of cherished memories',
      icon: '📸',
      themeColor: 'from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      detailedDescription: 'Combine photos, text, and drawings to honor special moments you shared',
    },
    {
      id: 'symbolic-drawing',
      title: 'Symbolic Drawing',
      description: 'Draw symbols that represent your journey through grief',
      icon: '🖼️',
      themeColor: 'from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-50 dark:bg-green-900/30',
      detailedDescription: 'Express your grief journey through meaningful symbols and metaphors',
    },
    {
      id: 'healing-mandala',
      title: 'Healing Mandala',
      description: 'Create circular patterns that promote inner peace',
      icon: '🔮',
      themeColor: 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-50 dark:bg-purple-900/30',
      detailedDescription: 'Design intricate circular patterns that help center your mind and emotions',
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

  const openModalForActivity = (activityId: string) => {
    setActivityProgress((prev) => ({
      ...prev,
      [activityId]: prev[activityId] === 'completed' ? 'completed' : 'in-progress',
    }));
    setModals({
      emotion: activityId === 'emotion-color',
      collage: activityId === 'memory-collage',
      drawing: activityId === 'symbolic-drawing',
      mandala: activityId === 'healing-mandala',
      digitalStudio: activityId === 'digital-studio',
    });
  };

  const handleMoodSelect = (mood: string) => {
    if (!selectedActivity) return;
    setCurrentMood(mood);
    setShowMoodSelector(false);
    openModalForActivity(selectedActivity);
  };

  const complete = (activityId: keyof typeof activityProgress) => {
    setActivityProgress((prev) => ({ ...prev, [activityId]: 'completed' }));
    setModals({ emotion: false, collage: false, drawing: false, mandala: false, digitalStudio: false });
  };

  const completedCount = Object.values(activityProgress).filter((s) => s === 'completed').length;
  const overallProgress = (completedCount / artActivities.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 relative overflow-hidden">
      {/* Artistic background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="space-y-6 p-6 relative z-10">
        <div className="flex items-center space-x-4">
          <Link to="/therapy">
            <Button variant="outline" size="sm" className="shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Therapy
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              🎨 Art Therapy Studio
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-200 font-medium">
              Express your emotions through creative visual art ✨
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-800 dark:via-purple-900/30 dark:to-pink-900/30 backdrop-blur-sm shadow-2xl border-2 border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Art Therapy Journey
              </span>
            </CardTitle>
            <CardDescription className="text-base">{completedCount} of {artActivities.length + 1} activities completed</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-4 mb-3" />
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">
              {overallProgress === 100
                ? "🎉 Amazing progress! You've completed all activities."
                : `${Math.round(overallProgress)}% complete - Keep exploring your creativity! 🌟`}
            </p>
          </CardContent>
        </Card>

        {/* Mood Selector Overlay */}
        {showMoodSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <MoodSelector
              title="How are you feeling right now?"
              description="Take a breath and check in before creating"
              moods={moods}
              selectedMood={currentMood}
              onMoodSelect={handleMoodSelect}
              onClose={() => setShowMoodSelector(false)}
            />
          </div>
        )}

        {/* Activity Modals */}
        {modals.emotion && (
          <EmotionColorMapping
            mood={currentMood}
            onClose={() => setModals((m) => ({ ...m, emotion: false }))}
            onComplete={() => complete('emotion-color')}
          />
        )}
        {modals.collage && (
          <MemoryCollage
            mood={currentMood}
            onClose={() => setModals((m) => ({ ...m, collage: false }))}
            onComplete={() => complete('memory-collage')}
          />
        )}
        {modals.drawing && (
          <SymbolicDrawing
            mood={currentMood}
            onClose={() => setModals((m) => ({ ...m, drawing: false }))}
            onComplete={() => complete('symbolic-drawing')}
          />
        )}
        {modals.mandala && (
          <HealingMandala
            mood={currentMood}
            onClose={() => setModals((m) => ({ ...m, mandala: false }))}
            onComplete={() => complete('healing-mandala')}
          />
        )}
        {modals.digitalStudio && (
          <AdvancedDigitalStudio
            mood={currentMood}
            onClose={() => setModals((m) => ({ ...m, digitalStudio: false }))}
            onComplete={() => complete('digital-studio')}
          />
        )}

        {/* Art Activities Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {artActivities.map((activity) => (
            <Card
              key={activity.id}
              className={cn(
                'group hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden',
                'bg-gradient-to-br',
                activity.themeColor,
                activity.borderColor,
                'border-3 relative'
              )}
            >
              {/* Artistic shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn('p-3 rounded-xl text-2xl transition-transform group-hover:scale-110', activity.iconBg)}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{activity.title}</CardTitle>
                      <CardDescription className="text-sm mb-3">{activity.description}</CardDescription>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{activity.detailedDescription}</p>
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
                  {activityProgress[activity.id] === 'completed'
                    ? 'Completed'
                    : activityProgress[activity.id] === 'in-progress'
                    ? 'Continue Activity'
                    : 'Start Activity'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Advanced Digital Art Studio Card */}
        <Card className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-3 border-indigo-300 dark:border-indigo-700 shadow-2xl hover:shadow-3xl hover:scale-[1.01] transition-all duration-300 overflow-hidden group relative">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <Palette className="h-7 w-7 text-indigo-600 group-hover:rotate-12 transition-transform duration-300" />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Advanced Digital Art Studio
                </span>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none">
                  ✨ Now Available
                </Badge>
              </CardTitle>
              {getProgressBadge(activityProgress['digital-studio'])}
            </div>
            <CardDescription className="text-base mt-2">
              Professional-grade digital art tools with brushes, layers, and export options
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-600 rounded-xl p-6 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-3xl">🖌️</div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Multiple Brushes</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">🎨</div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Color Palettes</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">📐</div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Drawing Tools</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">💾</div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Export Art</p>
                </div>
              </div>
            </div>
            <Button
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => handleActivityStart('digital-studio')}
              disabled={activityProgress['digital-studio'] === 'completed'}
            >
              {activityProgress['digital-studio'] === 'completed'
                ? '✓ Completed'
                : activityProgress['digital-studio'] === 'in-progress'
                ? '🎨 Continue Creating'
                : '🚀 Launch Studio'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Community Gallery</span>
              </CardTitle>
              <CardDescription>See inspiring artwork from others on their healing journey (anonymous)</CardDescription>
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
              <CardDescription>Record your thoughts and feelings about your artwork</CardDescription>
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
