import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { DailyReminderCard } from '@/components/meditation/DailyReminderCard';
import {
  MEDITATION_COUNTS_AFTER_SECONDS,
  loadMeditationDays,
  recordMeditationToday,
} from '@/lib/meditationReminder';

/**
 * MeditationPage
 * ---------------
 * Key ideas (architecture 101):
 * - We keep UI state in React (which meditation is selected, time). Play/pause mirrors the video's own events.
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

  /** True when the selected video can't be loaded (e.g. the host served a placeholder, not the file). */
  const [loadFailed, setLoadFailed] = React.useState(false);

  /** Days (local "YYYY-MM-DD") with a meditation, for the streak in the reminder card. */
  const [meditationDays, setMeditationDays] = React.useState<string[]>(() => loadMeditationDays());

  /** Count today once: after a minute of listening, or when a meditation finishes. */
  const markMeditatedToday = React.useCallback(() => {
    setMeditationDays((prev) => {
      const updated = recordMeditationToday();
      return updated.length === prev.length ? prev : updated;
    });
  }, []);

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
       src: '/videos/BreathingThroughPain.mp4' // (add when you have it)
    },
    {
      title: 'Body Scan for Grief',
      duration: '25 min',
      description: 'Notice and release tension held in the body from grief',
      category: 'Release',
      src : '/videos/BodyScanForGrief.mp4' // (add when you have it)
    },
    {
      title: 'Sleep Meditation for Loss',
      duration: '20 min',
      description: 'Gentle guidance to help you rest when grief disrupts sleep',
      category: 'Sleep',
      src: '/videos/SleepMeditationForLoss.mp4' // (add when you have it)
    },
    {
      title: 'Gratitude in Grief',
      duration: '15 min',
      description: 'Finding moments of gratitude even in the midst of loss',
      category: 'Gratitude',
      src: '/videos/GratitudeInGrief.mp4' // (add when you have it)
    },
    {
      title: 'Connecting with Memories',
      duration: '14 min',
      description: 'Safely revisit cherished memories with mindful awareness',
      category: 'Memory',
    },
  ];

  /** The player card, so we can scroll it into view when a meditation is chosen (it sits above the grid). */
  const playerRef = React.useRef<HTMLDivElement | null>(null);

  /** Set when a card's "Play" is clicked; the effect below starts the new source once it's in the DOM. */
  const autoplayRef = React.useRef(false);

  /**
   * Start playback. Called straight from click handlers (or the effect right after one), so the
   * browser still counts it as a user gesture. AbortError just means a newer load replaced this one.
   */
  const startVideo = (video: HTMLVideoElement) => {
    video.play().catch((err: DOMException) => {
      if (err?.name !== 'AbortError') console.warn('Meditation video could not start:', err);
    });
  };

  /**
   * When user clicks "Play" on a card:
   * - Same meditation already loaded: just play it.
   * - Otherwise select it; the effect below loads the new source and starts it.
   */
  const handlePlay = (meditation: typeof meditations[number]) => {
    const video = videoRef.current;
    if (video && selectedMeditation?.src && selectedMeditation.src === meditation.src) {
      startVideo(video);
    } else {
      autoplayRef.current = Boolean(meditation.src);
      setCurrentTime(0);
      setDuration(0);
      setSelectedMeditation(meditation);
    }
    // On phones the player opens at the top of the page, out of sight; bring it into view.
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  /**
   * The <video> element is the source of truth for play/pause. We mirror its events into React
   * state instead of keeping a separate "isPlaying" intention: that older approach got out of sync
   * when switching meditations (new video paused, button still showing "Pause"), so it took two clicks.
   */
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setDuration(video.duration || 0);
      setCurrentTime(video.currentTime || 0);
    };
    const onTime = () => {
      setCurrentTime(video.currentTime || 0);
      if (video.currentTime >= MEDITATION_COUNTS_AFTER_SECONDS) markMeditatedToday();
    };
    const onEnded = () => markMeditatedToday();
    video.addEventListener('ended', onEnded);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false); // also fires on 'ended'
    const onError = () => setLoadFailed(true);
    setLoadFailed(false);
    video.addEventListener('error', onError);

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onPause);
    setIsPlaying(!video.paused);

    if (autoplayRef.current) {
      autoplayRef.current = false;
      startVideo(video);
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onPause);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
    };
  }, [selectedMeditation?.src]); // re-attach (and autoplay) when a new source is selected

  /** Big round button: act on the video directly, inside the click. */
  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video || !selectedMeditation?.src) return;
    if (video.paused) startVideo(video);
    else video.pause();
  };

  /** Reset button: jump to start and pause */
  const handleReset = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setCurrentTime(0);
  };

  /** Close button: hide player and stop everything */
  const handleClose = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    autoplayRef.current = false;
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
        <Card ref={playerRef} className="border-purple-200 bg-purple-50 dark:bg-purple-900/20 scroll-mt-24">
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
{/* --- Responsive, non-overflowing video wrapper --- */}
{selectedMeditation.src ? (
  <div
    className="
      mx-auto                       /* center horizontally */
      w-full max-w-[92vw] md:max-w-3xl  /* comfortable width limits */
    "
  >
    {/* soft backdrop + rounded edges */}
    <div className="rounded-xl overflow-hidden bg-black/70">
      <video
        ref={videoRef}
        src={selectedMeditation.src}
        controls={false}            /* keep custom controls; set true if you want native ones */
        preload="metadata"
        tabIndex={0}
        playsInline                 // ← keeps video inline on iOS Safari
        className="
          w-full h-auto             /* maintain natural aspect ratio */
          max-h-[70vh]              /* never exceed 70% of viewport height */
          object-contain            /* letterbox instead of crop */
          block
        "
      />
    </div>
  </div>
) : (
  /* if there is no media yet, we don’t render an empty player */
  <p className="text-sm text-center text-gray-600 dark:text-gray-400">
    This meditation’s video is coming soon.
  </p>
)}


              {loadFailed && (
                <p className="text-sm text-center text-red-700 dark:text-red-300" role="alert">
                  Sorry, this meditation couldn't be loaded right now. Please try again later.
                </p>
              )}

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
                  onClick={handleTogglePlay}
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

      {/* Daily reminder (in the user's own calendar) + on-device streak */}
      <DailyReminderCard meditationDays={meditationDays} />
    </div>
  );
}
