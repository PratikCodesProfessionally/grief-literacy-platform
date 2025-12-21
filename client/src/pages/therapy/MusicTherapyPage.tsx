import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Mic, MicOff, Download, Plus, AlertTriangle, Loader2 } from 'lucide-react';

// Audio preload cache - stores preloaded Audio elements
const audioCache = new Map<string, HTMLAudioElement>();

export function MusicTherapyPage() {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(50);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingTrack, setLoadingTrack] = React.useState<string | null>(null);
  const [preloadProgress, setPreloadProgress] = React.useState(0);

  const [progress, setProgress] = React.useState(0);          // 0..100 (%)
  const [duration, setDuration] = React.useState(0);          // seconds
  const [currentTime, setCurrentTime] = React.useState(0);    // seconds

  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [recordings, setRecordings] = React.useState<{name: string; url: string; duration: number}[]>([]);
  const [playingRecordingIndex, setPlayingRecordingIndex] = React.useState<number | null>(null);
  const [recordingError, setRecordingError] = React.useState<string | null>(null);
  
  // Recording refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingChunksRef = React.useRef<Blob[]>([]);
  const recordingAudioRef = React.useRef<HTMLAudioElement | null>(null);
  
  const [playlistName, setPlaylistName] = React.useState('');
  const [customPlaylist, setCustomPlaylist] = React.useState<string[]>([]);
  const [journalEntry, setJournalEntry] = React.useState('');
  const [selectedActivity, setSelectedActivity] = React.useState<string | null>(null);

  const musicCategories = [
    {
      title: "Calming & Peaceful",
      description: "Gentle melodies for quiet reflection",
      icon: "🕊️",
      tracks: ["Ocean Waves (AI Generated)", "Peaceful Piano (AI Generated)", "Forest Sounds (AI Generated)", "Gentle Rain (AI Generated)", "Mountain Temple(AI Generated)"],
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

  // Get all tracks for preloading
  const allTracks = React.useMemo(() => 
    musicCategories.flatMap(cat => cat.tracks), 
    []
  );

  // --- Helpers ---------------------------------------------------------------

  // From "Ocean Waves (AI Generated)" -> "/audio/ocean-waves.mp3"
  const trackToSrc = React.useCallback((track: string) => {
    const base = track.replace(/\(.*?\)/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `/audio/${base}.mp3`;
  }, []);

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Preload audio function ------------------------------------------------
  const preloadAudio = React.useCallback((track: string): Promise<HTMLAudioElement> => {
    const src = trackToSrc(track);
    
    // Return cached audio if available
    if (audioCache.has(src)) {
      return Promise.resolve(audioCache.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'auto';
      
      const handleCanPlay = () => {
        audioCache.set(src, audio);
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.removeEventListener('error', handleError);
        resolve(audio);
      };
      
      const handleError = (e: Event) => {
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.removeEventListener('error', handleError);
        reject(e);
      };
      
      audio.addEventListener('canplaythrough', handleCanPlay);
      audio.addEventListener('error', handleError);
      audio.src = src;
      audio.load();
    });
  }, [trackToSrc]);

  // --- Preload all tracks on mount -------------------------------------------
  React.useEffect(() => {
    let mounted = true;
    let loadedCount = 0;

    const preloadAllTracks = async () => {
      for (const track of allTracks) {
        if (!mounted) break;
        try {
          await preloadAudio(track);
          loadedCount++;
          if (mounted) {
            setPreloadProgress(Math.round((loadedCount / allTracks.length) * 100));
          }
        } catch (err) {
          console.warn(`Failed to preload ${track}:`, err);
          loadedCount++;
          if (mounted) {
            setPreloadProgress(Math.round((loadedCount / allTracks.length) * 100));
          }
        }
      }
    };

    preloadAllTracks();

    return () => {
      mounted = false;
    };
  }, [allTracks, preloadAudio]);

  // --- Audio wiring ----------------------------------------------------------

  // Set src + play/pause when currentTrack or isPlaying changes
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // ensure correct src for selected track
    const nextSrc = trackToSrc(currentTrack);
    if (audio.getAttribute('data-src') !== nextSrc) {
      // Check if we have a preloaded version
      const cachedAudio = audioCache.get(nextSrc);
      if (cachedAudio) {
        // Copy the src from cached audio (already loaded)
        audio.src = nextSrc;
        audio.setAttribute('data-src', nextSrc);
      } else {
        // Fall back to loading directly
        audio.src = nextSrc;
        audio.setAttribute('data-src', nextSrc);
      }
    }

    // set volume/mute state on every change
    audio.volume = Math.min(1, Math.max(0, volume / 100));
    audio.muted = isMuted;

    if (isPlaying) {
      // browsers require a user gesture (your button click satisfies it)
      setIsLoading(true);
      audio.play()
        .then(() => setIsLoading(false))
        .catch((err) => {
          console.warn('Playback failed:', err);
          setIsPlaying(false);
          setIsLoading(false);
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

  const handlePlay = React.useCallback(async (track: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If clicking the same track, just toggle play/pause
    if (currentTrack === track) {
      setIsPlaying((p) => !p);
      return;
    }

    // Switch to new track
    setLoadingTrack(track);
    
    // Stop current playback immediately
    audio.pause();
    audio.currentTime = 0;
    
    // Reset state for new track
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    
    // Set new track and start playing
    setCurrentTrack(track);
    setIsPlaying(true);
    setLoadingTrack(null);
  }, [currentTrack]);

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

  // Get current track index in the flat list of all tracks
  const getCurrentTrackIndex = React.useCallback(() => {
    if (!currentTrack) return -1;
    return allTracks.indexOf(currentTrack);
  }, [currentTrack, allTracks]);

  // Play previous track
  const playPreviousTrack = React.useCallback(() => {
    const currentIndex = getCurrentTrackIndex();
    if (currentIndex <= 0) {
      // If first track or no track, go to last track
      handlePlay(allTracks[allTracks.length - 1]);
    } else {
      handlePlay(allTracks[currentIndex - 1]);
    }
  }, [getCurrentTrackIndex, allTracks, handlePlay]);

  // Play next track
  const playNextTrack = React.useCallback(() => {
    const currentIndex = getCurrentTrackIndex();
    if (currentIndex >= allTracks.length - 1 || currentIndex === -1) {
      // If last track or no track, go to first track
      handlePlay(allTracks[0]);
    } else {
      handlePlay(allTracks[currentIndex + 1]);
    }
  }, [getCurrentTrackIndex, allTracks, handlePlay]);

  const startRecording = async () => {
    setRecordingError(null);
    try {
      // Request microphone with high quality audio settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      // Try to use the best available audio codec
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose default
          }
        }
      }
      
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 128000
      };
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(recordingChunksRef.current, { type: actualMimeType });
        const url = URL.createObjectURL(blob);
        const name = `Recording ${recordings.length + 1}`;
        setRecordings((r) => [...r, { name, url, duration: recordingTime }]);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Request data every 250ms for smoother recording
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setRecordingError('Could not access microphone. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const playRecording = (index: number) => {
    const recording = recordings[index];
    if (!recording) return;

    // Stop any currently playing recording
    if (recordingAudioRef.current) {
      recordingAudioRef.current.pause();
      recordingAudioRef.current = null;
    }

    // If clicking the same recording that's playing, just stop it
    if (playingRecordingIndex === index) {
      setPlayingRecordingIndex(null);
      return;
    }

    const audio = new Audio(recording.url);
    recordingAudioRef.current = audio;
    
    audio.onended = () => {
      setPlayingRecordingIndex(null);
      recordingAudioRef.current = null;
    };
    
    audio.play();
    setPlayingRecordingIndex(index);
  };

  const downloadRecording = (index: number) => {
    const recording = recordings[index];
    if (!recording) return;

    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `${recording.name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteRecording = (index: number) => {
    // Stop if currently playing
    if (playingRecordingIndex === index) {
      if (recordingAudioRef.current) {
        recordingAudioRef.current.pause();
        recordingAudioRef.current = null;
      }
      setPlayingRecordingIndex(null);
    }
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(recordings[index].url);
    
    setRecordings((r) => r.filter((_, i) => i !== index));
  };

  const addToPlaylist = (track: string) => {
    setCustomPlaylist((p) => (p.includes(track) ? p : [...p, track]));
  };

  const renderActivity = () => {
    switch (selectedActivity) {
      case 'playlist':
        return (
          <Card className="bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-rose-50/50 dark:from-purple-900/10 dark:to-pink-900/10 hover-lift border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Create Memorial Playlist</CardTitle>
              <CardDescription className="text-base">Build a special playlist in honor of your loved one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Playlist name (e.g., 'Songs for Mom')"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className="rounded-2xl border-2 focus:border-primary/40 transition-all duration-300"
              />
              <div className="space-y-2">
                <h4 className="font-medium text-lg">Current Playlist:</h4>
                {customPlaylist.length === 0 ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">No songs added yet. Click the + button next to any track to add it.</p>
                ) : (
                  <div className="space-y-2">
                    {customPlaylist.map((track, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300">
                        <span className="text-sm">{track}</span>
                        <Button size="sm" variant="outline" onClick={() => handlePlay(track)} className="rounded-full">
                          {currentTrack === track && isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button disabled={customPlaylist.length === 0 || !playlistName} className="rounded-full transition-all duration-300 hover:scale-105">
                <Download className="h-4 w-4 mr-2" />
                Save Playlist
              </Button>
            </CardContent>
          </Card>
        );
      case 'journal':
        return (
          <Card className="bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 hover-lift border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Music Journal</CardTitle>
              <CardDescription className="text-base">Write about the memories this music brings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What memories does this song bring back? How does it make you feel about your loved one?"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                className="min-h-32 rounded-2xl border-2 focus:border-primary/40 transition-all duration-300 resize-none leading-loose"
              />
              <Button disabled={!journalEntry.trim()} className="rounded-full transition-all duration-300 hover:scale-105">Save Journal Entry</Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // --- Render ----------------------------------------------------------------

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      {/* hidden audio element with auto preload */}
      <audio ref={audioRef} preload="auto" playsInline />

      <div className="flex items-center space-x-4">
        <Link to="/therapy">
          <Button variant="outline" size="sm" className="rounded-full shadow-soft hover:shadow-soft-lg transition-all duration-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Therapy
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-semibold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎵 Music Therapy
          </h1>
          <p className="text-lg text-muted-foreground">
            Find healing through the power of sound and melody
          </p>
        </div>
      </div>

      {/* Preload Progress Indicator */}
      {preloadProgress < 100 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading music library... {preloadProgress}%</span>
          <Progress value={preloadProgress} className="h-2 w-32" />
        </div>
      )}

      {/* AI Generated Content Disclaimer */}
      <Card className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-700 hover-lift">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-100">AI Generated Music Content</h4>
              <p className="text-sm text-amber-700 dark:text-amber-200 mt-1 leading-relaxed">
                All music tracks and audio content are AI-generated for demonstration purposes. This is not actual copyrighted music.
                The therapeutic concepts are based on established music therapy practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Now Playing */}
      {currentTrack && (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-2 border-primary/20 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl">
              <span>Now Playing: {currentTrack}</span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={toggleMute} className="rounded-full hover:bg-accent/20 transition-all duration-300">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="flex items-center space-x-2 w-24">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="h-3 rounded-full" />
              {/* Seek slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground min-w-[3rem]">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => seekToPercent(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Seek"
                />
                <span className="text-xs tabular-nums text-muted-foreground min-w-[3rem]">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <Button 
                  size="lg" 
                  onClick={playPreviousTrack} 
                  variant="outline" 
                  className="rounded-full hover:bg-accent/20 transition-all duration-300"
                  title="Previous track"
                >
                  ⏮
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => handlePlay(currentTrack)} 
                  disabled={isLoading}
                  className="rounded-full w-16 h-16 shadow-soft-lg hover:scale-105 transition-all duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <Button 
                  size="lg" 
                  onClick={playNextTrack} 
                  variant="outline" 
                  className="rounded-full hover:bg-accent/20 transition-all duration-300"
                  title="Next track"
                >
                  ⏭
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6">
          {musicCategories.map((category, index) => (
            <Card key={index} className={`bg-gradient-to-br ${category.color} hover-lift border-2`}>
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl sm:text-3xl flex-shrink-0">{category.icon}</div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">{category.title}</CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-2 sm:space-y-3">
                  {category.tracks.map((track, trackIndex) => (
                    <div key={trackIndex} className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm border border-gray-200 dark:border-gray-600 shadow-sm">
                      <span className="text-xs sm:text-sm font-medium truncate min-w-0 text-gray-900 dark:text-gray-100">{track}</span>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addToPlaylist(track)}
                          title="Add to playlist"
                          className="rounded-full hover:bg-accent/30 transition-all duration-300 h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handlePlay(track)} 
                          disabled={loadingTrack === track}
                          className="rounded-full hover:bg-accent/30 transition-all duration-300 h-8 w-8 p-0"
                        >
                          {loadingTrack === track ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : currentTrack === track && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
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
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Music Activities</CardTitle>
              <CardDescription className="text-sm sm:text-base">Interactive ways to engage with music therapy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity, index) => (
                <Button
                  key={index}
                  variant={selectedActivity === activity.id ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto p-4 rounded-2xl transition-all duration-300 hover:shadow-soft hover:scale-[1.02]"
                  onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
                >
                  <div>
                    <div className="font-medium text-base leading-relaxed">{activity.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{activity.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <Mic className="h-6 w-6 text-primary" />
                <span>Voice Recording</span>
              </CardTitle>
              <CardDescription className="text-base">Record your voice sharing memories or singing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                {recordingError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300">
                    {recordingError}
                  </div>
                )}
                {isRecording ? (
                  <div className="space-y-4 p-6 bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-900/10 dark:to-pink-900/10 rounded-2xl">
                    <div className="text-red-500 text-5xl animate-pulse">🔴</div>
                    <div className="text-2xl font-mono font-semibold">{formatTime(recordingTime)}</div>
                    <Button onClick={stopRecording} variant="destructive" className="rounded-full shadow-soft-lg transition-all duration-300 hover:scale-105">
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 p-6">
                    <div className="text-5xl">🎤</div>
                    <Button onClick={startRecording} className="rounded-full shadow-soft-lg transition-all duration-300 hover:scale-105">
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  </div>
                )}
              </div>

              {recordings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-lg">Your Recordings:</h4>
                  {recordings.map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-all duration-300">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{rec.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(rec.duration)}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant={playingRecordingIndex === idx ? "default" : "ghost"} 
                          className="rounded-full"
                          onClick={() => playRecording(idx)}
                        >
                          {playingRecordingIndex === idx ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-full"
                          onClick={() => downloadRecording(idx)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => deleteRecording(idx)}
                        >
                          ✕
                        </Button>
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
