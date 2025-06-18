import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';

export function MeditationPage() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [selectedMeditation, setSelectedMeditation] = React.useState(null);

  const meditations = [
    {
      title: 'Loving Kindness for Grief',
      duration: '12 min',
      description: 'Send love to yourself and your loved one who has passed',
      category: 'Compassion',
    },
    {
      title: 'Breathing Through Pain',
      duration: '8 min',
      description: 'Use breath as an anchor when emotions feel overwhelming',
      category: 'Coping',
    },
    {
      title: 'Body Scan for Grief',
      duration: '15 min',
      description: 'Notice and release tension held in the body from grief',
      category: 'Release',
    },
    {
      title: 'Sleep Meditation for Loss',
      duration: '20 min',
      description: 'Gentle guidance to help you rest when grief disrupts sleep',
      category: 'Sleep',
    },
    {
      title: 'Gratitude in Grief',
      duration: '10 min',
      description: 'Finding moments of gratitude even in the midst of loss',
      category: 'Gratitude',
    },
    {
      title: 'Connecting with Memories',
      duration: '14 min',
      description: 'Safely revisit cherished memories with mindful awareness',
      category: 'Memory',
    },
  ];

  const handlePlay = (meditation) => {
    setSelectedMeditation(meditation);
    setIsPlaying(!isPlaying);
  };

  const progress = selectedMeditation ? (currentTime / (parseInt(selectedMeditation.duration) * 60)) * 100 : 0;

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
          🧘‍♀️ Guided Meditations
        </h1>
      </div>

      {selectedMeditation && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedMeditation.title}</span>
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {selectedMeditation.duration}
              </span>
            </CardTitle>
            <CardDescription>{selectedMeditation.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentTime(0)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full w-16 h-16"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedMeditation(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meditations.map((meditation, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{meditation.title}</CardTitle>
                <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {meditation.category}
                </span>
              </div>
              <CardDescription>{meditation.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {meditation.duration}
                </span>
                <Button
                  size="sm"
                  onClick={() => handlePlay(meditation)}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Play</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Meditation Reminder</CardTitle>
          <CardDescription>
            Set a gentle reminder to practice mindfulness each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Set Daily Reminder</Button>
        </CardContent>
      </Card>
    </div>
  );
}
