import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Game } from './engine/Game';
import { StationConfig } from '../phaser/config/constants';
import { getSectionMenu } from '../journey/sections';

// Gentle apologies when the car bumps a tree (the first is the user's line).
const TREE_APOLOGIES = [
  '🌳💚 I love you tree, that was not intentional!',
  '🌳 Oh, sorry tree! I didn’t mean to.',
  '🌳💚 Forgive me, dear tree — I still love you.',
];

// One-time intro tutorial for the 3D driving world.
const DRIVE_TUTORIAL_KEY = 'journey3d_tutorial_complete';
const DRIVE_TUTORIAL_STEPS = [
  { title: 'Welcome to your drive 🚗', body: 'Take a gentle drive through your healing world. There’s no rush — wander at your own pace.' },
  { title: 'Steering the road', body: 'Use W A S D or the arrow keys — or the on-screen buttons — to drive. Press S to brake and slow down.' },
  { title: 'Words along the way 🌳', body: 'Drive past the roadside trees to receive a few words of hope and encouragement.' },
  { title: 'Pull into a garage 🏠', body: 'When you’re ready, steer off the road into a house’s garage to choose where to go next.' },
];

// 3D driving version of the healing "journey": cruise the world, read positive
// quotes when passing trees, and drive into a house's garage to enter a section.
export function DrivingJourney() {
  const navigate = useNavigate();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const gameRef = React.useRef<Game | null>(null);
  const navigatedRef = React.useRef(false);

  const [quote, setQuote] = React.useState<string | null>(null);
  const [nearGarage, setNearGarage] = React.useState<StationConfig | null>(null);
  const [muted, setMuted] = React.useState(false);
  const [bump, setBump] = React.useState<string | null>(null);
  const bumpTimer = React.useRef<number | null>(null);

  // One-time intro tutorial (shown on first visit to the 3D world).
  const [tutorialStep, setTutorialStep] = React.useState<number | null>(() => {
    try {
      return localStorage.getItem(DRIVE_TUTORIAL_KEY) === 'true' ? null : 0;
    } catch {
      return 0;
    }
  });
  const finishTutorial = () => {
    try { localStorage.setItem(DRIVE_TUTORIAL_KEY, 'true'); } catch { /* ignore */ }
    setTutorialStep(null);
  };

  const goToRoute = React.useCallback((route: string) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    const overlay = document.getElementById('journey-fade');
    if (overlay) overlay.style.opacity = '1';
    window.setTimeout(() => navigate(route), 450);
  }, [navigate]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const game = new Game(containerRef.current, {
      onQuote: (q) => setQuote(q),
      onNearGarage: (s) => setNearGarage(s),
      onEnterGarage: (station) => {
        // Enter this section's 2D walking world; sections with no sub-pages
        // (e.g. the meditation garage) navigate straight to the page.
        const m = getSectionMenu(station.route);
        if (m) goToRoute('/journey/walk/' + m.id);
        else goToRoute(station.route);
      },
      onImpact: () => {
        const msg = TREE_APOLOGIES[Math.floor(Math.random() * TREE_APOLOGIES.length)];
        setBump(msg);
        if (bumpTimer.current) window.clearTimeout(bumpTimer.current);
        bumpTimer.current = window.setTimeout(() => setBump(null), 2800);
      },
    });

    game.init().then(() => {
      if (cancelled) game.dispose();
    });
    gameRef.current = game;

    return () => {
      cancelled = true;
      if (bumpTimer.current) window.clearTimeout(bumpTimer.current);
      game.dispose();
      gameRef.current = null;
    };
  }, [navigate]);

  // Mobile control helpers
  const setSteer = (v: number) => gameRef.current?.setTouchSteer(v);
  const setThrottle = (v: number) => gameRef.current?.setTouchThrottle(v);

  const cleanName = (name: string) => name.replace(/\n/g, ' ');

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-sky-200"
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Three.js canvas mounts here */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Fade overlay for section transitions */}
      <div
        id="journey-fade"
        className="pointer-events-none absolute inset-0 bg-sky-100 transition-opacity duration-[450ms]"
        style={{ opacity: 0 }}
      />

      {/* Back to home */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2
                   bg-white/80 backdrop-blur-sm text-stone-600 font-medium text-sm
                   rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(gameRef.current?.toggleMute() ?? false)}
        aria-label={muted ? 'Unmute engine sound' : 'Mute engine sound'}
        className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center
                   bg-white/80 backdrop-blur-sm text-stone-600
                   rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Positive quote card (shown when passing a tree) */}
      {quote && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-40 w-[90%] max-w-lg -translate-x-1/2">
          <div className="rounded-2xl border-2 border-green-400 bg-green-50/95 px-6 py-4 text-center shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <p className="text-green-900 italic leading-relaxed">🍃 {quote}</p>
          </div>
        </div>
      )}

      {/* Tree bump apology (shown when the car hits a tree) — centered above the quote card */}
      {bump && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[55] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/95 px-6 py-4 text-center shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            <p className="text-rose-800 font-medium leading-relaxed">{bump}</p>
          </div>
        </div>
      )}

      {/* Garage entry prompt */}
      {nearGarage && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 z-40 -translate-x-1/2">
          <div className="rounded-full bg-amber-400 px-6 py-3 text-amber-900 font-semibold shadow-lg animate-pulse">
            🏠 Drive into the garage to enter {cleanName(nearGarage.name)} {nearGarage.icon}
          </div>
        </div>
      )}

      {/* On-screen driving controls (touch) */}
      <div className="absolute bottom-6 left-0 right-0 z-50 flex items-end justify-between px-6 select-none">
        {/* Steering (left) */}
        <div className="flex gap-3">
          <ControlButton label="◀" onPress={() => setSteer(-1)} onRelease={() => setSteer(0)} />
          <ControlButton label="▶" onPress={() => setSteer(1)} onRelease={() => setSteer(0)} />
        </div>
        {/* Throttle (right) */}
        <div className="flex gap-3">
          <ControlButton label="▼" onPress={() => setThrottle(-1)} onRelease={() => setThrottle(0)} />
          <ControlButton label="▲" accent onPress={() => setThrottle(1)} onRelease={() => setThrottle(0)} />
        </div>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 text-center text-xs text-stone-600/80">
        WASD / Arrows to drive
      </div>

      {/* One-time intro tutorial */}
      {tutorialStep !== null && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-stone-50 p-8 shadow-xl border border-stone-200/60">
            <div className="flex justify-center gap-2 mb-6">
              {DRIVE_TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === tutorialStep ? 'w-4 bg-sky-600' : i < tutorialStep ? 'w-2 bg-sky-400' : 'w-2 bg-stone-300'
                  }`}
                />
              ))}
            </div>
            <h2 className="text-2xl font-medium text-stone-800 mb-3 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              {DRIVE_TUTORIAL_STEPS[tutorialStep].title}
            </h2>
            <p className="text-stone-600 mb-8 text-center leading-relaxed">
              {DRIVE_TUTORIAL_STEPS[tutorialStep].body}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={finishTutorial}
                className="px-5 py-3 text-stone-500 hover:text-stone-700 font-medium rounded-xl transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() =>
                  tutorialStep >= DRIVE_TUTORIAL_STEPS.length - 1
                    ? finishTutorial()
                    : setTutorialStep(tutorialStep + 1)
                }
                className="px-6 py-3 text-white font-medium rounded-xl shadow-sm active:scale-[0.98] transition-all"
                style={{ backgroundColor: '#0284c7' }}
              >
                {tutorialStep >= DRIVE_TUTORIAL_STEPS.length - 1 ? 'Begin' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ControlButtonProps {
  label: string;
  accent?: boolean;
  onPress: () => void;
  onRelease: () => void;
}

function ControlButton({ label, accent, onPress, onRelease }: ControlButtonProps) {
  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onPress();
  };
  return (
    <button
      onPointerDown={handleDown}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
      className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold shadow-lg
                  active:scale-95 transition-transform touch-none
                  ${accent ? 'bg-sage-600 text-white' : 'bg-white/85 text-stone-700'}`}
      style={{ touchAction: 'none', backgroundColor: accent ? '#7c9a7c' : undefined }}
    >
      {label}
    </button>
  );
}

export default DrivingJourney;
