import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookMarked, Heart, Flower2, Brain, AlertCircle, Wind } from 'lucide-react';
import { JournalingPage } from './JournalingPage';
import { MeditationPage } from './MeditationPage';
import MemoryGardenPage from './MemoryGardenPage';
import { LettersPage } from './LettersPage';

export function ToolsPage() {
  const location = useLocation();
  const isMainPage = location.pathname === '/tools';
  const [activeBubble, setActiveBubble] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const mainTools = [
    {
      id: 'journaling',
      name: 'Grief Journaling',
      description: 'Guided prompts for daily reflection and processing',
      icon: BookMarked,
      path: '/tools/journaling',
      gradient: 'from-purple-100/70 to-pink-100/70',
    },
    {
      id: 'letters',
      name: 'Letters to Loved Ones',
      description: 'Write messages to those you\'ve lost',
      icon: Heart,
      path: '/tools/letters',
      gradient: 'from-rose-100/70 to-orange-100/70',
    },
    {
      id: 'memory',
      name: 'Memory Garden',
      description: 'Create a digital space to honor memories',
      icon: Flower2,
      path: '/tools/memory-garden',
      gradient: 'from-green-100/70 to-teal-100/70',
    },
    {
      id: 'meditation',
      name: 'Guided Meditations',
      description: 'Mindfulness and healing meditation sessions',
      icon: Brain,
      path: '/tools/meditation',
      gradient: 'from-blue-100/70 to-cyan-100/70',
    },
    {
      id: 'emergency',
      name: 'Emergency Toolkit',
      description: 'Quick access to calming resources when overwhelmed',
      icon: AlertCircle,
      path: '/tools/emergency',
      gradient: 'from-amber-100/70 to-yellow-100/70',
    },
    {
      id: 'breathing',
      name: 'Breathing Exercises',
      description: 'Simple techniques for managing difficult moments',
      icon: Wind,
      path: '/tools/breathing',
      gradient: 'from-cyan-100/70 to-blue-100/70',
    },
  ];

  const scrollToBubble = React.useCallback((index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const bubbleHeight = container.scrollHeight / mainTools.length;
      container.scrollTo({
        top: bubbleHeight * index,
        behavior: 'smooth',
      });
      setActiveBubble(index);
    }
  }, [mainTools.length]);

  React.useEffect(() => {
    const startAutoScroll = () => {
      if (!isPaused) {
        autoScrollTimerRef.current = setInterval(() => {
          setActiveBubble((prev) => {
            const next = (prev + 1) % mainTools.length;
            scrollToBubble(next);
            return next;
          });
        }, 8000);
      }
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      startAutoScroll();
    }

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [isPaused, mainTools.length, scrollToBubble]);

  const handleScroll = React.useCallback(() => {
    if (scrollContainerRef.current && !isPaused) {
      const container = scrollContainerRef.current;
      const bubbleHeight = container.scrollHeight / mainTools.length;
      const scrollPosition = container.scrollTop;
      const newIndex = Math.round(scrollPosition / bubbleHeight);
      
      if (newIndex !== activeBubble && newIndex >= 0 && newIndex < mainTools.length) {
        setActiveBubble(newIndex);
      }
    }
  }, [activeBubble, mainTools.length, isPaused]);

  const handleUserInteraction = () => {
    setIsPaused(true);
    
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
    
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && activeBubble < mainTools.length - 1) {
        e.preventDefault();
        scrollToBubble(activeBubble + 1);
        handleUserInteraction();
      } else if (e.key === 'ArrowUp' && activeBubble > 0) {
        e.preventDefault();
        scrollToBubble(activeBubble - 1);
        handleUserInteraction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBubble, mainTools.length, scrollToBubble]);

  if (isMainPage) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-green-50 via-teal-50 to-cyan-100 -mx-4 -my-8 overflow-hidden">
        <header className="relative z-30 text-center pt-12 md:pt-16 pb-6 md:pb-8 px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-gray-800 mb-3 md:mb-4 tracking-wide animate-fade-in">
            Healing Tools
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Practical tools and resources to support you through your grief journey
          </p>
        </header>

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onWheel={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          className="relative h-[60vh] md:h-[65vh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="region"
          aria-label="Healing tools carousel"
          aria-live="polite"
        >
          {mainTools.map((tool, index) => {
            const isActive = activeBubble === index;
            
            return (
              <div
                key={tool.id}
                className="h-[60vh] md:h-[65vh] snap-center flex items-center justify-center px-4"
              >
                <Link
                  to={tool.path}
                  className={`
                    relative w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72
                    rounded-full
                    bg-gradient-to-br ${tool.gradient}
                    backdrop-blur-sm border-2 border-green-200/40
                    flex flex-col items-center justify-center gap-3 md:gap-4 p-8
                    shadow-lg shadow-green-200/50
                    transition-all duration-700 ease-out
                    cursor-pointer
                    ${isActive 
                      ? 'scale-100 opacity-100 z-20' 
                      : 'scale-90 opacity-70'
                    }
                    hover:scale-102 hover:opacity-100 hover:shadow-xl hover:shadow-green-300/50
                  `}
                  onMouseEnter={() => {
                    setIsPaused(true);
                    if (pauseTimerRef.current) {
                      clearTimeout(pauseTimerRef.current);
                    }
                  }}
                  onMouseLeave={handleUserInteraction}
                  aria-label={`${tool.name}: ${tool.description}`}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  <div className={`absolute inset-0 rounded-full bg-white/30 transition-opacity duration-700 ${isActive ? 'opacity-40' : 'opacity-20'}`} />
                  
                  <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4 px-6">
                    <tool.icon className="w-14 h-14 md:w-16 md:h-16 text-gray-700 drop-shadow-sm" />
                    <h3 className="text-xl md:text-2xl font-normal text-gray-800 text-center leading-tight">
                      {tool.name}
                    </h3>
                    {isActive && (
                      <p className="text-xs md:text-sm text-gray-600 text-center animate-fade-in">
                        {tool.description}
                      </p>
                    )}
                  </div>

                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {isActive && (
                    <div className="absolute inset-0 rounded-full animate-gentle-float pointer-events-none" />
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-20 md:bottom-16 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
          {mainTools.map((tool, index) => (
            <button
              key={tool.id}
              onClick={() => {
                scrollToBubble(index);
                handleUserInteraction();
              }}
              className={`
                rounded-full transition-all duration-500
                ${activeBubble === index 
                  ? 'w-2.5 h-2.5 bg-green-400 shadow-sm' 
                  : 'w-2 h-2 bg-green-200 hover:bg-green-300'
                }
              `}
              aria-label={`Go to ${tool.name}`}
              aria-current={activeBubble === index ? 'true' : 'false'}
            />
          ))}
        </div>

        <div className="fixed bottom-8 md:bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <p className="text-gray-500 text-xs md:text-sm text-center animate-fade-in">
            Click a tool to begin • Use arrow keys to navigate
          </p>
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.8s ease-out; }
          @keyframes gentle-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          .animate-gentle-float { animation: gentle-float 4s ease-in-out infinite; }
          .scroll-smooth { scroll-behavior: smooth; }
          .hover\\:scale-102:hover { transform: scale(1.02); }
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/journaling" element={<JournalingPage />} />
      <Route path="/meditation" element={<MeditationPage />} />
      <Route path="/memory-garden" element={<MemoryGardenPage />} />
      <Route path="/letters" element={<LettersPage />} />
    </Routes>
  );
}