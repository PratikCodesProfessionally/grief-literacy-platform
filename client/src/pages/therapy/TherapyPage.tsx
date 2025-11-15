import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, Palette, PenTool, Music, ArrowRight } from 'lucide-react';
import { StoryTherapyPage } from './StoryTherapyPage';
import { ArtTherapyPage } from './ArtTherapyPage';
import { PoetryTherapyPage } from './PoetryTherapyPage';
import { MusicTherapyPage } from './MusicTherapyPage';

interface TherapyOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  colorClass: string;
}

export function TherapyPage() {
  const location = useLocation();
  const isMainPage = location.pathname === '/therapy';

  const therapyOptions: TherapyOption[] = [
    {
      id: 'story',
      title: 'Storalis',
      description: 'Express and process grief through storytelling and narrative therapy in a safe, supportive space',
      icon: BookOpen,
      path: '/therapy/story',
      colorClass: 'bg-gradient-to-br from-sky-400 to-blue-500',
    },
    {
      id: 'art',
      title: 'Canvessence',
      description: 'Use visual expression and creative art to explore and heal emotional wounds',
      icon: Palette,
      path: '/therapy/art',
      colorClass: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    },
    {
      id: 'poetry',
      title: 'Therapoetic',
      description: 'Find healing and peace through reading, writing and sharing poetry',
      icon: PenTool,
      path: '/therapy/poetry',
      colorClass: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    },
    {
      id: 'music',
      title: 'Euphora',
      description: 'Process emotions and memories through music, sound and therapeutic rhythm',
      icon: Music,
      path: '/therapy/music',
      colorClass: 'bg-gradient-to-br from-teal-400 to-cyan-500',
    },
  ];

  if (isMainPage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50/30 to-cyan-50/20 -mx-4 -my-8">
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100/40 via-blue-50/30 to-cyan-50/40" />
          
          <div className="relative max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Therapeutic
              <span className="block bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                Approaches
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Choose from evidence-based creative therapies to help process and express your grief
            </p>
          </div>
        </section>

        {/* Therapy Options Cards */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {therapyOptions.map((option, index) => (
                <Link
                  key={option.id}
                  to={option.path}
                  className="group block"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 
                                shadow-md hover:shadow-xl 
                                transform hover:scale-[1.02] hover:-translate-y-1
                                transition-all duration-500 ease-out
                                border border-sky-100/50
                                hover:border-sky-200/60
                                cursor-pointer
                                focus:outline-none focus:ring-4 focus:ring-sky-300/50 focus:ring-offset-2
                                active:scale-[1.01] active:-translate-y-0.5
                                animate-fadeInUp
                                will-change-transform">
                    
                    {/* Icon Circle */}
                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full ${option.colorClass} 
                                  flex items-center justify-center mb-6
                                  shadow-md group-hover:shadow-lg
                                  group-hover:scale-105
                                  transition-all duration-400 ease-out`}>
                      <option.icon className="w-10 h-10 md:w-12 md:h-12 text-white 
                                             group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3
                                 group-hover:text-sky-700 transition-colors duration-300">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6
                                group-hover:text-gray-700 transition-colors duration-300">
                      {option.description}
                    </p>

                    {/* Arrow Link */}
                    <div className="flex items-center text-sky-600 font-medium 
                                  group-hover:text-sky-700 transition-colors duration-300">
                      <span className="group-hover:underline">Start Session</span>
                      <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 
                                           transition-transform duration-300 ease-out" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Custom Animations */}
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </div>
    );
  }



  return (
    <Routes>
      <Route path="/story" element={<StoryTherapyPage />} />
      <Route path="/art" element={<ArtTherapyPage />} />
      <Route path="/poetry" element={<PoetryTherapyPage />} />
      <Route path="/music" element={<MusicTherapyPage />} />
    </Routes>
  );
}
