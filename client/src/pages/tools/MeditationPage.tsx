import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';

/**
 * MeditationPage
 * ---------------
 * Key ideas (architecture 101):
 * - We keep UI state in React (which meditation is selected, play/pause, time).
 * - A <video> element is our "player". We control it with a React ref.
 * - We listen to the video’s events (loadedmetadata, timeupdate, ended) to keep React state in sync.
 * - Progress bar uses currentTime / duration from the video (source of truth).
 */
export function MeditationPage() {
  /** UI states we render from */
  const [isPlaying, setIsPlaying] = React.useState(false);     // Is the player currently playing?
  const [currentTime, setCurrentTime] = React.useState(0);     // Current playback position (seconds)
  const [duration, setDuration] = React.useState(0);           // Total media length (seconds)
  const [selectedMeditation, setSelectedMeditation] = React.useState<null | {
    title: string;
    duration: string;
    description: string;
    category: string;
    src?: string; // optional media URL if available
  }>(null);

  /** The <video> DOM node we will command (play/pause/seek) */
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  /**
   * Data model:
   * - Add `src` only for items that actually have media today.
   * - Others can be added later without breaking the UI.
   */
  const meditations = [
    {
      title: 'Loving Kindness for Grief',
      duration: '3 min', // real length for this video
      description: 'Send love to yourself and your loved one who has passed',
      category: 'Compassion',
      // Because the file is in /public/videos, we can just use the absolute path:
      src: '/videos/LovingKindnessforGrief.mp4',
    },
    {
      title: 'Breathing Through Pain',
      duration: '8 min',
      description: 'Use breath as an anchor when emotions feel overwhelming',
      category: 'Coping',
      // src: '/videos/BreathingThroughPain.mp4' // (add when you have it)
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

  /**
   * When user clicks "Play" on a card:
   * - Set that meditation as selected
   * - If another was playing, we load the new source and start from 0
   */
  const handlePlay = (meditation: typeof meditations[number]) => {
    setSelectedMeditation(meditation);
    setIsPlaying(true); // auto-start when a card is chosen
  };

  /**
   * Sync React state whenever the <video> element changes over time.
   * We attach event listeners once the <video> exists, and clean them up on unmount.
   */
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // When metadata is loaded (e.g., duration becomes known)
    const onLoaded = () => {
      setDuration(video.duration || 0);
      setCurrentTime(video.currentTime || 0);
    };

    // Every small time step during playback
    const onTime = () => setCurrentTime(video.currentTime || 0);

    // When playback ends (e.g., let’s stop and leave the progress at 100%)
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
    };
  }, [selectedMeditation]); // re-attach when a new meditation (source) is selected

  /**
   * Actually start/stop the video element when isPlaying changes.
   * (React state is the intention; the <video> is the performer.)
   */
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      // If no source is present yet (e.g., user pressed play without selecting), do nothing
      video.play().catch(() => {
        // Some browsers require a user gesture; UI already provides one (button click),
        // but if play() fails silently, we keep state consistent:
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  /** Reset button: jump to start and pause */
  const handleReset = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  /** Close button: hide player and stop everything */
  const handleClose = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSelectedMeditation(null);
  };

  /** Progress bar: safe against 0 duration */
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  /** Utility: seconds -> mm:ss for friendly readout */
  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header bar + back link */}
      <div className="flex items-center space-x-4">
        <Link to="/tools">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">🧘‍♀️ Guided Meditations</h1>
      </div>

      {/* Player card: only shows when a meditation is chosen */}
      {selectedMeditation && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedMeditation.title}</span>
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {/* If we discovered real duration from the video, show it; else show label */}
                {duration > 0 ? `${Math.round(duration / 60)} min` : selectedMeditation.duration}
              </span>
            </CardTitle>
            <CardDescription>{selectedMeditation.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* The hidden (chrome-free) video element we control via our own buttons */}
              <video
                ref={videoRef}
                // Only set src if this meditation actually has media available
                src={selectedMeditation.src}
                // We hide native controls to keep your custom UI. Add controls if you prefer.
                controls={false}
                preload="metadata"
                // For accessibility: allow keyboard users to focus the player
                tabIndex={0}
                className="w-full rounded-lg shadow-sm bg-black/5"
                // Auto-load the new source when selection changes
                // (no autoPlay here; we manage via isPlaying effect)
              />

              <Progress value={progress} className="h-2" />

              {/* Time readout: current / total */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || 0)}</span>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <Button variant="outline" size="icon" onClick={handleReset} aria-label="Reset to start">
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  onClick={() => {
                    // If there is no real media for this meditation, do nothing
                    if (!selectedMeditation.src) return;
                    setIsPlaying((p) => !p);
                  }}
                  className="rounded-full w-16 h-16"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  disabled={!selectedMeditation.src} // disable if no media yet
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>

                <Button variant="outline" size="icon" onClick={handleClose} aria-label="Close player">
                  ✕
                </Button>
              </div>

              {/* Friendly message if a meditation has no video yet */}
              {!selectedMeditation.src && (
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  This meditation’s video is coming soon.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid of meditation cards */}
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

      {/* (Static) Reminder card — unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Meditation Reminder</CardTitle>
          <CardDescription>Set a gentle reminder to practice mindfulness each day</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Set Daily Reminder</Button>
        </CardContent>
      </Card>
    </div>
  );
}
