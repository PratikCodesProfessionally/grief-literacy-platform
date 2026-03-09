import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StoryTherapyPage } from './StoryTherapyPage';
import { ArtTherapyPage } from './ArtTherapyPage';
import { PoetryTherapyPage } from './PoetryTherapyPage';
import { MusicTherapyPage } from './MusicTherapyPage';

interface TherapyOption {
  id: string;
  title: string;
  description: string;
  iconSrc: string;
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
      iconSrc: '/Images/StoralisIcon.jpg',
      path: '/therapy/story',
      colorClass: 'bg-gradient-to-br from-sky-400 to-blue-500',
    },
    {
      id: 'art',
      title: 'Canvessence',
      description: 'Use visual expression and creative art to explore and heal emotional wounds',
      iconSrc: '/Images/CanvassenceIcon.jpg',
      path: '/therapy/art',
      colorClass: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    },
    {
      id: 'poetry',
      title: 'Therapoetic',
      description: 'Find healing and peace through reading, writing and sharing poetry',
      iconSrc: '/Images/TherapoeeticIcon.svg',
      path: '/therapy/poetry',
      colorClass: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    },
    {
      id: 'music',
      title: 'Euphora',
      description: 'Process emotions and memories through music, sound and therapeutic rhythm',
      iconSrc: '/Images/EuphoriaIcon.png',
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

        {/* Healing Journey Timeline */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto relative">

            {/* Central Timeline Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-sky-200 via-blue-300 to-cyan-200 -translate-x-1/2" />

            {therapyOptions.map((option, index) => {
              const isLeft = index % 2 === 0;
              const isLast = index === therapyOptions.length - 1;

              return (
                <div key={option.id} className={`relative flex flex-col md:flex-row items-center ${!isLast ? 'mb-16 md:mb-24' : ''}`}
                     style={{ animationDelay: `${index * 150}ms` }}>

                  {/* Timeline Node — center circle with image */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10
                                  w-20 h-20 rounded-full overflow-hidden
                                  ring-4 ring-white shadow-lg
                                  group cursor-pointer">
                    <div className={`absolute inset-0 ${option.colorClass}`} />
                    <img src={option.iconSrc} alt={option.title}
                         className="relative w-full h-full object-cover" />
                  </div>

                  {/* Left side content (even items) */}
                  {isLeft ? (
                    <>
                      <div className="w-full md:w-[calc(50%-60px)] md:pr-8">
                        <Link to={option.path} className="group block">
                          <div className="animate-fadeInUp bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden
                                        shadow-md hover:shadow-xl border border-sky-100/50 hover:border-sky-200/60
                                        transform hover:scale-[1.02] hover:-translate-y-1
                                        transition-all duration-500 ease-out cursor-pointer
                                        will-change-transform">
                            {/* Image Banner */}
                            <div className={`relative h-48 md:h-56 ${option.colorClass}`}>
                              <img src={option.iconSrc} alt={option.title}
                                   className="absolute inset-0 w-full h-full object-cover
                                              opacity-90 group-hover:opacity-100 group-hover:scale-105
                                              transition-all duration-700 ease-out" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                              <h3 className="absolute bottom-4 left-6 text-2xl md:text-3xl font-bold text-white
                                           drop-shadow-lg">
                                {option.title}
                              </h3>
                            </div>
                            {/* Text */}
                            <div className="p-6 md:p-8">
                              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-4
                                          group-hover:text-gray-700 transition-colors duration-300">
                                {option.description}
                              </p>
                              <div className="flex items-center text-sky-600 font-medium
                                            group-hover:text-sky-700 transition-colors duration-300">
                                <span className="group-hover:underline">Start Session</span>
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1
                                                     transition-transform duration-300" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                      {/* Right spacer */}
                      <div className="hidden md:block w-[calc(50%-60px)]" />
                    </>
                  ) : (
                    <>
                      {/* Left spacer */}
                      <div className="hidden md:block w-[calc(50%-60px)]" />
                      <div className="w-full md:w-[calc(50%-60px)] md:pl-8">
                        <Link to={option.path} className="group block">
                          <div className="animate-fadeInUp bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden
                                        shadow-md hover:shadow-xl border border-sky-100/50 hover:border-sky-200/60
                                        transform hover:scale-[1.02] hover:-translate-y-1
                                        transition-all duration-500 ease-out cursor-pointer
                                        will-change-transform">
                            {/* Image Banner */}
                            <div className={`relative h-48 md:h-56 ${option.colorClass}`}>
                              <img src={option.iconSrc} alt={option.title}
                                   className="absolute inset-0 w-full h-full object-cover
                                              opacity-90 group-hover:opacity-100 group-hover:scale-105
                                              transition-all duration-700 ease-out" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                              <h3 className="absolute bottom-4 right-6 text-2xl md:text-3xl font-bold text-white
                                           drop-shadow-lg text-right">
                                {option.title}
                              </h3>
                            </div>
                            {/* Text */}
                            <div className="p-6 md:p-8 text-right">
                              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-4
                                          group-hover:text-gray-700 transition-colors duration-300">
                                {option.description}
                              </p>
                              <div className="flex items-center justify-end text-sky-600 font-medium
                                            group-hover:text-sky-700 transition-colors duration-300">
                                <ArrowRight className="w-5 h-5 mr-2 rotate-180 group-hover:-translate-x-1
                                                     transition-transform duration-300" />
                                <span className="group-hover:underline">Start Session</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
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
