import * as React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarCheck, Droplets, Leaf, Sun } from 'lucide-react';

type PlantDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

type PlantEntry = {
  id: string;
  name: string;
  subtitle: string;
  difficulty: PlantDifficulty;
  heroImage: string;
  galleryImages?: string[];
  alt: string;
  healingInfo: string;
  care: {
    light: string;
    water: string;
    rhythm: string;
  };
  note: string;
};

const plantEntries: PlantEntry[] = [
  {
    id: 'snake-plant',
    name: 'Snake Plant',
    subtitle: 'Steady Breath Plant',
    difficulty: 'Beginner',
    heroImage: '/Images/SnakePlant.jpg',
    alt: 'Snake Plant in a pot',
    healingInfo:
      'Resilient and calming. Great for low-energy days because it tolerates missed watering and still feels grounded.',
    care: {
      light: 'Low to bright indirect light',
      water: 'Every 2-3 weeks after soil dries fully',
      rhythm: 'Rotate every 2 weeks and wipe leaves monthly',
    },
    note: 'Use this plant as your reset cue: 3 deep breaths whenever you water.',
  },
  {
    id: 'monstera',
    name: 'Monstera',
    subtitle: 'Growth & Progress Plant',
    difficulty: 'Intermediate',
    heroImage: '/Images/Monstera1.jpg',
    galleryImages: ['/Images/Monstera1.jpg', '/Images/Monstera2.jpg', '/Images/Monstera3.jpg'],
    alt: 'Monstera leaves',
    healingInfo:
      'Large leaves and visible new growth make it ideal for tracking emotional progress over time.',
    care: {
      light: 'Medium to bright indirect light',
      water: 'Water when top 1-2 inches of soil are dry',
      rhythm: 'Rotate weekly, wipe leaves, support stems as they mature',
    },
    note: 'Once a week, check one new leaf and write one sentence about your own growth.',
  },
  {
    id: 'pothos',
    name: 'Pothos',
    subtitle: 'Hope Vine',
    difficulty: 'Beginner',
    heroImage: '/Images/PothosPlant.jpg',
    alt: 'Pothos trailing plant',
    healingInfo:
      'A fast grower that symbolizes moving forward while still honoring memories.',
    care: {
      light: 'Medium to bright indirect light',
      water: 'When top inch of soil is dry',
      rhythm: 'Trim long vines monthly for fuller growth',
    },
    note: 'During pruning, name one thing you are ready to release.',
  },
  {
    id: 'aloe-vera',
    name: 'Aloe Vera',
    subtitle: 'Healing Companion',
    difficulty: 'Beginner',
    heroImage: '/Images/AloeVeraPlant.jpg',
    alt: 'Aloe vera plant',
    healingInfo:
      'Represents restoration and self-care, especially useful during emotionally heavy weeks.',
    care: {
      light: 'Bright indirect light',
      water: 'Infrequent watering, let soil dry fully',
      rhythm: 'Check roots every few months and repot if crowded',
    },
    note: 'Pair aloe care with a short body check-in: where am I holding tension?',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    subtitle: 'Rest & Reset',
    difficulty: 'Intermediate',
    heroImage: '/Images/LavenderPlant.png',
    alt: 'Lavender plant',
    healingInfo:
      'Supports calming evening rituals and helps soften anxiety through scent and routine.',
    care: {
      light: 'Strong light, ideally 6+ hours',
      water: 'Every 7-10 days, avoid overwatering',
      rhythm: 'Harvest and dry stems for bedtime grounding',
    },
    note: 'Hold a dried sprig at night and name one feeling without judging it.',
  },
  {
    id: 'rosemary',
    name: 'Rosemary',
    subtitle: 'Memory Herb',
    difficulty: 'Intermediate',
    heroImage: '/Images/RosemaryPlant.jpg',
    alt: 'Rosemary plant',
    healingInfo:
      'Traditionally linked with remembrance and useful for gentle memory rituals.',
    care: {
      light: 'Bright light with some direct sun',
      water: 'When top layer feels dry',
      rhythm: 'Pinch tips regularly to keep shape and health',
    },
    note: 'Use rosemary before meals as a small remembrance habit.',
  },
  {
    id: 'peace-lily',
    name: 'Peace Lily',
    subtitle: 'Quiet Heart',
    difficulty: 'Intermediate',
    heroImage: '/Images/peace-lily-plant-white-pot.jpg',
    alt: 'Peace lily in a white pot',
    healingInfo:
      'A soothing visual anchor that supports quiet decompression and reflection.',
    care: {
      light: 'Low to medium indirect light',
      water: 'Keep soil slightly moist, never soggy',
      rhythm: 'Mist leaves 1-2 times per week',
    },
    note: 'When blooms appear, record one comforting memory.',
  },
];

const difficultyFilters: Array<PlantDifficulty | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const RITUAL_STORAGE_KEY = 'plants-healing-weekly-ritual-checklist';

const weeklyHealingPlan = [
  'Monday: Check moisture and refresh air for 2 minutes.',
  'Wednesday: Rotate pots and write one emotional weather note.',
  'Friday: Wipe leaves and do 2 minutes of slow breathing.',
  'Sunday: Reflect on one growth in your plant and in yourself.',
];

export function PlantsHealingPage() {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<PlantDifficulty | 'All'>('All');
  const [checkedRituals, setCheckedRituals] = React.useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(RITUAL_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem(RITUAL_STORAGE_KEY, JSON.stringify(checkedRituals));
  }, [checkedRituals]);

  const filteredEntries = React.useMemo(
    () =>
      selectedDifficulty === 'All'
        ? plantEntries
        : plantEntries.filter((entry) => entry.difficulty === selectedDifficulty),
    [selectedDifficulty],
  );

  const toggleRitualCheck = (ritual: string) => {
    setCheckedRituals((prev) => ({
      ...prev,
      [ritual]: !prev[ritual],
    }));
  };

  return (
    <div className="plants-page-cursor relative -mx-4 -my-8 px-4 md:px-8 py-8 md:py-12 overflow-hidden bg-gradient-to-b from-[#f3efe6] via-[#f7f4ee] to-[#eef3ea] dark:from-[#101816] dark:via-[#0f1d1a] dark:to-[#0d1816]">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative max-w-6xl mx-auto space-y-10 md:space-y-12">
        <div className="flex items-center justify-between gap-4">
          <Link to="/tools">
            <Button variant="outline" size="sm" className="bg-white/85 dark:bg-slate-900/80 border-emerald-300 dark:border-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Button>
          </Link>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700">
            Plant Care Journal
          </Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-5 items-stretch">
          <div className="lg:col-span-3 rounded-3xl border border-emerald-200/80 dark:border-emerald-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm p-6 md:p-8 shadow-xl shadow-emerald-100/50 dark:shadow-black/30">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300 font-semibold mb-3">
              Plants for Healing
            </p>
            <h1 className="text-4xl md:text-5xl leading-tight font-semibold text-[#1f2a22] dark:text-emerald-50 max-w-2xl">
              Gentle structure for heavy days.
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-[#3f4b43] dark:text-emerald-100 max-w-2xl">
              Build a calm rhythm through simple plant care. Choose one plant, do one tiny action, and let consistency carry you.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {difficultyFilters.map((filter) => {
                const isActive = selectedDifficulty === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedDifficulty(filter)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors border ${
                      isActive
                        ? 'bg-emerald-700 text-white border-emerald-700 dark:bg-emerald-500 dark:border-emerald-500'
                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-emerald-200 dark:border-emerald-800 shadow-xl shadow-emerald-100/60 dark:shadow-black/30 relative min-h-[320px]">
            <img
              src="/Images/SnakePlant.jpg"
              alt="Snake Plant close-up"
              className="absolute inset-0 w-full h-full object-contain object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">Featured</p>
              <p className="text-2xl font-semibold mt-1">Snake Plant</p>
              <p className="text-sm text-emerald-100 mt-1">Low maintenance, high steadiness.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <Leaf className="h-5 w-5" />
            <h2 className="text-2xl md:text-3xl font-semibold">Plant Wall</h2>
          </div>

          <div className="relative overflow-visible rounded-3xl border border-emerald-200/80 dark:border-emerald-800 bg-[#f5f1e8]/90 dark:bg-slate-900/70 p-4 md:p-7">
            <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-200/60 dark:bg-amber-700/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-emerald-300/40 dark:bg-emerald-700/30 blur-2xl" />
            <div className="pointer-events-none absolute left-8 right-8 top-1/2 h-px border-t border-dashed border-emerald-400/50 dark:border-emerald-600/50" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 items-start">
              {filteredEntries.map((entry, index) => {
                const collageLayout = [
                  'rotate-[-1.2deg] md:mt-1',
                  'rotate-[1.4deg] md:mt-6',
                  'rotate-[-0.8deg] md:mt-3',
                  'rotate-[1.1deg] md:-mt-1',
                  'rotate-[-1.5deg] md:mt-5',
                  'rotate-[0.9deg] md:mt-2',
                ];

                const heroTilt = ['rotate-[-2.2deg]', 'rotate-[1.8deg]', 'rotate-[-1.4deg]', 'rotate-[2.4deg]'];
                const galleryTilt = ['rotate-[-3deg]', 'rotate-[2.5deg]', 'rotate-[-2deg]'];

                return (
                  <article
                    key={entry.id}
                    className={`relative ${collageLayout[index % collageLayout.length]} rounded-2xl border border-[#d8d0be] dark:border-emerald-800 bg-[#fffef9] dark:bg-slate-900/90 shadow-[0_8px_20px_rgba(40,40,40,0.08)] dark:shadow-black/40`}
                  >
                    <div className={`pointer-events-none absolute -top-3 left-6 h-6 w-20 rounded-sm border border-amber-300 bg-amber-100/90 dark:bg-amber-200/70 shadow-sm ${index % 2 === 0 ? 'rotate-[-8deg]' : 'rotate-[6deg]'}`} />
                    <div className={`pointer-events-none absolute -top-3 right-7 h-5 w-14 rounded-sm border border-emerald-300 bg-emerald-100/80 dark:bg-emerald-200/60 shadow-sm ${index % 2 === 0 ? 'rotate-[6deg]' : 'rotate-[-8deg]'}`} />

                    <div className="h-full p-4 md:p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-emerald-50">{entry.name}</h3>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-emerald-200">{entry.subtitle}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                          {entry.difficulty}
                        </Badge>
                      </div>

                      <div className="relative flex justify-center py-1">
                        <img
                          src={entry.heroImage}
                          alt={entry.alt}
                          className={`w-auto max-w-full max-h-52 md:max-h-56 object-contain drop-shadow-md ${heroTilt[index % heroTilt.length]}`}
                          loading="lazy"
                        />
                        <span className={`pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full border border-amber-700/40 bg-amber-300 shadow ${index % 2 === 0 ? 'translate-y-[2px]' : ''}`} />
                      </div>

                      {entry.galleryImages && entry.galleryImages.length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                          {entry.galleryImages.map((img, i) => (
                            <div key={`${entry.id}-${i}`} className="relative h-24 flex items-center justify-center">
                              <img
                                src={img}
                                alt={`${entry.name} detail ${i + 1}`}
                                className={`h-full w-auto max-w-full object-contain drop-shadow-sm ${galleryTilt[i % galleryTilt.length]}`}
                                loading="lazy"
                              />
                              <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full border border-amber-700/40 bg-amber-300 shadow" />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs md:text-sm leading-relaxed text-gray-700 dark:text-gray-100">
                        {entry.healingInfo}
                      </p>

                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-900/30 p-2.5 space-y-1.5 text-xs md:text-sm text-gray-800 dark:text-gray-100">
                        <p className="flex items-start gap-2">
                          <Sun className="h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 text-amber-500" />
                          <span><span className="font-semibold">Light:</span> {entry.care.light}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <Droplets className="h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 text-blue-500" />
                          <span><span className="font-semibold">Water:</span> {entry.care.water}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CalendarCheck className="h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 text-emerald-600" />
                          <span><span className="font-semibold">Rhythm:</span> {entry.care.rhythm}</span>
                        </p>
                      </div>

                      <p className="text-xs md:text-sm leading-relaxed text-gray-700 dark:text-gray-100 italic">{entry.note}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-teal-200 dark:border-teal-700 bg-white/85 dark:bg-slate-900/80 p-6 md:p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-emerald-50">Weekly Plant-Care Ritual</h2>
          <p className="mt-2 text-gray-700 dark:text-gray-100">
            Keep this checklist simple and compassionate.
          </p>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {weeklyHealingPlan.map((step, idx) => (
              <li key={step} className="rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50/70 dark:bg-teal-900/30 p-4 text-sm text-gray-800 dark:text-gray-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(checkedRituals[step])}
                    onChange={() => toggleRitualCheck(step)}
                    className="mt-1 h-4 w-4 rounded border-teal-500 text-teal-700 focus:ring-teal-500"
                  />
                  <span>
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-teal-600 text-white text-xs mr-2 align-middle">
                      {idx + 1}
                    </span>
                    <span className={`align-middle ${checkedRituals[step] ? 'line-through opacity-70' : ''}`}>{step}</span>
                  </span>
                </label>
              </li>
            ))}
          </ol>
        </section>

        <style>{`
          .plants-page-cursor {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cg fill='none' stroke='%23f4b400' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='14' cy='14' r='5.5' fill='%23ffd54f' stroke='%23f4b400'/%3E%3Cpath d='M14 1.8v3.1M14 23.1v3.1M1.8 14h3.1M23.1 14h3.1M4.7 4.7l2.2 2.2M21.1 21.1l2.2 2.2M23.3 4.7l-2.2 2.2M6.9 21.1l-2.2 2.2'/%3E%3C/g%3E%3C/svg%3E") 14 14, auto;
          }

          .dark .plants-page-cursor {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cg fill='none' stroke='%23cdd6f4' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M18.8 3.8a10 10 0 1 0 5.4 17.6A9.2 9.2 0 0 1 18.8 3.8Z' fill='%23cdd6f4' stroke='%2395a2d8'/%3E%3Ccircle cx='8.5' cy='7.2' r='1.1' fill='%23e5ecff' stroke='none'/%3E%3Ccircle cx='11.2' cy='5.1' r='0.9' fill='%23e5ecff' stroke='none'/%3E%3C/g%3E%3C/svg%3E") 14 14, auto;
          }

          .plants-page-cursor * {
            cursor: inherit !important;
          }
        `}</style>
      </div>
    </div>
  );
}
