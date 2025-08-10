import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Mic, MicOff, Download, Plus, AlertTriangle } from 'lucide-react';

export function MusicTherapyPage() {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(50);
  const [isMuted, setIsMuted] = React.useState(false);

  const [progress, setProgress] = React.useState(0);          // 0..100 (%)
  const [duration, setDuration] = React.useState(0);          // seconds
  const [currentTime, setCurrentTime] = React.useState(0);    // seconds

  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [recordings, setRecordings] = React.useState<string[]>([]);
  const [playlistName, setPlaylistName] = React.useState('');
  const [customPlaylist, setCustomPlaylist] = React.useState<string[]>([]);
  const [journalEntry, setJournalEntry] = React.useState('');
  const [selectedActivity, setSelectedActivity] = React.useState<string | null>(null);

  const musicCategories = [
    {
      title: "Calming & Peaceful",
      description: "Gentle melodies for quiet reflection",
      icon: "🕊️",
      tracks: ["Ocean Waves (AI Generated)", "Peaceful Piano (AI Generated)", "Forest Sounds (AI Generated)", "Gentle Rain (AI Generated)", "Mountain Breeze (AI Generated)"],
      color: "from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20"
    },
    {
      title: "Emotional Release",
      description: "Music that allows you to feel deeply",
      icon: "💧",
      tracks: ["Sad Piano (AI Generated)", "Emotional Strings (AI Generated)", "Crying Permission (AI Generated)", "Deep Sorrow (AI Generated)", "Healing Tears (AI Generated)"],
      color: "from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20"
    },
    {
      title: "Uplifting & Hope",
      description: "Songs that remind you of light ahead",
      icon: "🌅",
      tracks: ["Morning Light (AI Generated)", "Hope Rising (AI Generated)", "New Beginnings (AI Generated)", "Strength Within (AI Generated)", "Brighter Days (AI Generated)"],
      color: "from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20"
    },
    {
      title: "Memory Lane",
      description: "Music for remembering and honoring",
      icon: "💝",
      tracks: ["Nostalgic Melodies (AI Generated)", "Memory Box (AI Generated)", "Love Remains (AI Generated)", "Sweet Memories (AI Generated)", "Forever in Heart (AI Generated)"],
      color: "from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20"
    },
  ];

  const activities = [
    { id: 'playlist', title: "Create a playlist for your loved one", description: "Build a musical tribute to their memory" },
    { id: 'journal',  title: "Listen to their favorite song and write about it", description: "Reflect on memories through music" },
    { id: 'sing',     title: "Sing or hum a meaningful melody", description: "Express yourself through voice" },
    { id: 'rhythm',   title: "Use rhythm to express your emotions", description: "Let the beat guide your feelings" },
  ];

  // --- Helpers ---------------------------------------------------------------

  // From "Ocean Waves (AI Generated)" -> "/audio/ocean-waves.mp3"
  const trackToSrc = (track: string) => {
    const base = track.replace(/\(.*?\)/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `/audio/${base}.mp3`;
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Audio wiring ----------------------------------------------------------

  // Set src + play/pause when currentTrack or isPlaying changes
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // ensure correct src for selected track
    const nextSrc = trackToSrc(currentTrack);
    if (audio.getAttribute('data-src') !== nextSrc) {
      audio.src = nextSrc;
      audio.setAttribute('data-src', nextSrc);
      // after setting src, we wait for metadata before we can seek/display duration
    }

    // set volume/mute state on every change
    audio.volume = Math.min(1, Math.max(0, volume / 100));
    audio.muted = isMuted;

    if (isPlaying) {
      // browsers require a user gesture (your button click satisfies it)
      audio.play().catch((err) => {
        console.warn('Playback failed:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, volume, isMuted]);

  // Attach time/duration listeners once
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
    };
    const onTime = () => {
      setCurrentTime(audio.currentTime || 0);
      const d = audio.duration || 0;
      setProgress(d > 0 ? (audio.currentTime / d) * 100 : 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // --- Recording timer (unchanged) ------------------------------------------

  React.useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      id = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    }
    return () => id && clearInterval(id);
  }, [isRecording]);

  // --- UI handlers -----------------------------------------------------------

  const handlePlay = (track: string) => {
    if (currentTrack === track) {
      setIsPlaying((p) => !p); // toggle play/pause
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => setIsMuted((m) => !m);

  const seekToPercent = (percent: number) => {
    const audio = audioRef.current;
    if (!audio || !duration || percent < 0 || percent > 100) return;
    const t = (percent / 100) * duration;
    audio.currentTime = t;
    setProgress(percent);
    setCurrentTime(t);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    const name = `Recording ${recordings.length + 1} (${formatTime(recordingTime)})`;
    setRecordings((r) => [...r, name]);
    setRecordingTime(0);
  };

  const addToPlaylist = (track: string) => {
    setCustomPlaylist((p) => (p.includes(track) ? p : [...p, track]));
  };

  const renderActivity = () => {
    switch (selectedActivity) {
      case 'playlist':
        return (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <CardTitle>Create Memorial Playlist</CardTitle>
              <CardDescription>Build a special playlist in honor of your loved one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Playlist name (e.g., 'Songs for Mom')"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
              />
              <div className="space-y-2">
                <h4 className="font-medium">Current Playlist:</h4>
                {customPlaylist.length === 0 ? (
                  <p className="text-sm text-gray-500">No songs added yet. Click the + button next to any track to add it.</p>
                ) : (
                  <div className="space-y-1">
                    {customPlaylist.map((track, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <span className="text-sm">{track}</span>
                        <Button size="sm" variant="outline" onClick={() => handlePlay(track)}>
                          {currentTrack === track && isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button disabled={customPlaylist.length === 0 || !playlistName}>
                <Download className="h-4 w-4 mr-2" />
                Save Playlist
              </Button>
            </CardContent>
          </Card>
        );
      case 'journal':
        return (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardHeader>
              <CardTitle>Music Journal</CardTitle>
              <CardDescription>Write about the memories this music brings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What memories does this song bring back? How does it make you feel about your loved one?"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                className="min-h-32"
              />
              <Button disabled={!journalEntry.trim()}>Save Journal Entry</Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // --- Render ----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* hidden audio element */}
      <audio ref={audioRef} preload="metadata" playsInline />

      <div className="flex items-center space-x-4">
        <Link to="/therapy">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Therapy
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">🎵 Music Therapy</h1>
      </div>

      {/* AI Generated Content Disclaimer */}
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">AI Generated Music Content</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                All music tracks and audio content are AI-generated for demonstration purposes. This is not actual copyrighted music.
                The therapeutic concepts are based on established music therapy practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Now Playing */}
      {currentTrack && (
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Now Playing: {currentTrack}</span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="flex items-center space-x-2 w-24">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              {/* Seek slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => seekToPercent(Number(e.target.value))}
                  className="w-full"
                  aria-label="Seek"
                />
                <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <Button size="lg" onClick={() => seekToPercent(0)} variant="outline">⏮</Button>
                <Button size="lg" onClick={() => handlePlay(currentTrack)} className="rounded-full w-16 h-16">
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button size="lg" onClick={() => seekToPercent(100)} variant="outline">⏭</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {musicCategories.map((category, index) => (
            <Card key={index} className={`bg-gradient-to-br ${category.color}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{category.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.tracks.map((track, trackIndex) => (
                    <div key={trackIndex} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm font-medium">{track}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addToPlaylist(track)}
                          title="Add to playlist"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePlay(track)}>
                          {currentTrack === track && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Music Activities</CardTitle>
              <CardDescription>Interactive ways to engage with music therapy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity, index) => (
                <Button
                  key={index}
                  variant={selectedActivity === activity.id ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto p-4"
                  onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
                >
                  <div>
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-5 w-5" />
                <span>Voice Recording</span>
              </CardTitle>
              <CardDescription>Record your voice sharing memories or singing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                {isRecording ? (
                  <div className="space-y-3">
                    <div className="text-red-500 text-4xl animate-pulse">🔴</div>
                    <div className="text-lg font-mono">{formatTime(recordingTime)}</div>
                    <Button onClick={stopRecording} variant="destructive">
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-4xl">🎤</div>
                    <Button onClick={startRecording}>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  </div>
                )}
              </div>

              {recordings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Recordings:</h4>
                  {recordings.map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm">{rec}</span>
                      <div className="space-x-1">
                        <Button size="sm" variant="ghost"><Play className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost"><Download className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedActivity && renderActivity()}
        </div>
      </div>
    </div>
  );
}
