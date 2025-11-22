import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Brain, 
  Users, 
  Flower2, 
  BookOpen,
  Gamepad2,
  ArrowRight
} from 'lucide-react';
import { GrandmaSue } from '@/components/GrandmaSue';

interface Feature {
  id: number;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  colorClass: string;
}

export function HomePage() {
  const shouldReduceMotion = useReducedMotion();
  
  // Animation variants for different elements
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: shouldReduceMotion ? 0 : 0.8, 
        ease: 'easeOut' 
      }
    }
  };

  const staggerContainerVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: shouldReduceMotion ? 0 : 0.2
      }
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: shouldReduceMotion ? 0 : 0.6, 
        ease: 'easeOut' 
      }
    }
  };

  const features: Feature[] = [
    {
      id: 1,
      title: 'Therapeutic Approaches',
      description: 'Express yourself through story, art, poetry and music therapy in a safe, healing space',
      path: '/therapy',
      icon: Brain,
      gradient: 'from-sky-400 to-blue-500',
      colorClass: 'bg-gradient-to-br from-sky-400 to-blue-500',
    },
    {
      id: 2,
      title: 'Support Community',
      description: 'Connect with others who understand. Join circles, find peer support, and honor memories together',
      path: '/community',
      icon: Users,
      gradient: 'from-cyan-400 to-teal-500',
      colorClass: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    },
    {
      id: 3,
      title: 'Healing Tools',
      description: 'Access journaling, guided meditation, breathing exercises and emergency support resources',
      path: '/tools',
      icon: Flower2,
      gradient: 'from-blue-400 to-indigo-500',
      colorClass: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    },
    {
      id: 4,
      title: 'Learning Resources',
      description: 'Explore curated books, courses, and professional resources for your healing journey',
      path: '/resources',
      icon: BookOpen,
      gradient: 'from-teal-400 to-cyan-500',
      colorClass: 'bg-gradient-to-br from-teal-400 to-cyan-500',
    },
  ];

  return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50/30 to-cyan-50/20 -mx-4 -my-8">
      
      {/* Hero Section - Modern Messenger Style */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        {/* Animated subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/40 via-blue-50/30 to-cyan-50/40 animate-gradient" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Animated Hero Heading - Slide Up + Fade In */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: shouldReduceMotion ? 0 : 1, 
              ease: 'easeOut' 
            }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight"
          >
            Welcome to Your
            <span className="block bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
              Healing Journey
            </span>
          </motion.h1>
          
          {/* Animated Subtitle - Delayed Entry */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: shouldReduceMotion ? 0 : 1, 
              delay: shouldReduceMotion ? 0 : 0.3,
              ease: 'easeOut' 
            }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light"
          >
            A compassionate space for processing grief, finding support, and discovering tools for emotional wellness
          </motion.p>
        </div>
      </section>

      {/* Interactive Journey CTA - Featured Card */}
      <motion.section
        className="py-8 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
      >
        <div className="max-w-7xl mx-auto">
          <Link to="/journey" className="group block">
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 
                          rounded-3xl p-8 md:p-12
                          shadow-2xl hover:shadow-3xl
                          transform hover:scale-[1.02] hover:-translate-y-2
                          transition-all duration-500 ease-out
                          border-2 border-white/20
                          cursor-pointer
                          focus:outline-none focus:ring-4 focus:ring-violet-300/50 focus:ring-offset-2
                          active:scale-[1.01] active:-translate-y-1">
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] animate-pulse" />
              </div>

              <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Icon */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur-sm
                              flex items-center justify-center
                              shadow-lg group-hover:shadow-xl
                              group-hover:scale-110 group-hover:rotate-6
                              transition-all duration-500 ease-out">
                  <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-white
                                     group-hover:scale-110
                                     transition-transform duration-300" />
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-3
                               group-hover:scale-105 transition-transform duration-300 origin-left">
                    Start Interactive Journey
                  </h3>
                  <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-4">
                    Explore a peaceful 2D world and discover healing stations at your own pace. 
                    Walk through therapy, community, tools, and meditation areas.
                  </p>
                  <div className="inline-flex items-center text-white font-semibold text-lg
                                group-hover:translate-x-2 transition-transform duration-300">
                    <span>Begin Your Journey</span>
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </motion.section>

      {/* Feature Cards - Messenger-Inspired Design with Scroll Animations */}
      <motion.section 
        className="py-16 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainerVariant}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                variants={cardVariant}
              >
                <Link
                  to={feature.path}
                  className="group block"
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
                              will-change-transform">
                  
                    {/* Icon Circle */}
                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full ${feature.colorClass} 
                                flex items-center justify-center mb-6
                                shadow-md group-hover:shadow-lg
                                group-hover:scale-105
                                transition-all duration-400 ease-out`}>
                      <feature.icon className="w-10 h-10 md:w-12 md:h-12 text-white 
                                           group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3
                               group-hover:text-sky-700 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6
                              group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>

                    {/* Arrow Link */}
                    <div className="flex items-center text-sky-600 font-medium 
                                group-hover:text-sky-700 transition-colors duration-300">
                      <span className="group-hover:underline">Explore</span>
                      <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 
                                         transition-transform duration-300 ease-out" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Quick Stats Section - Modern Cards with Scroll Animation */}
      <motion.section 
        className="py-16 px-4 bg-white/40 backdrop-blur-sm"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12"
            variants={fadeUpVariant}
          >
            You're Not Alone
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainerVariant}
          >
            {[
              { number: '4', label: 'Therapeutic Modalities', color: 'sky' },
              { number: '6', label: 'Healing Tools', color: 'cyan' },
              { number: '24/7', label: 'Support Access', color: 'blue' },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                variants={cardVariant}
                className="group bg-white rounded-2xl p-8 text-center 
                         shadow-md hover:shadow-lg
                         hover:-translate-y-1 
                         hover:bg-gradient-to-br hover:from-sky-50/50 hover:to-cyan-50/50
                         transition-all duration-400 ease-out cursor-pointer
                         border border-transparent hover:border-sky-200/50
                         focus:outline-none focus:ring-4 focus:ring-sky-300/50 focus:ring-offset-2
                         active:scale-[0.99] active:-translate-y-0.5"
                tabIndex={0}
              >
                <div className={`text-5xl md:text-6xl font-bold mb-3
                              bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-500 
                              bg-clip-text text-transparent
                              group-hover:scale-110
                              transition-all duration-400 ease-out`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 text-lg font-medium
                              group-hover:text-gray-800 group-hover:font-semibold
                              transition-all duration-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section with Scroll Animation */}
      <motion.section 
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-3xl p-12 md:p-16 
                        shadow-xl hover:shadow-2xl 
                        hover:scale-[1.01]
                        transition-all duration-500 ease-out"
            whileHover={{ scale: shouldReduceMotion ? 1 : 1.01 }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              variants={fadeUpVariant}
            >
              Begin Your Healing Journey Today
            </motion.h2>
            <motion.p 
              className="text-xl text-white/90 mb-8 leading-relaxed"
              variants={fadeUpVariant}
            >
              Take the first step towards emotional wellness and join a supportive community
            </motion.p>
            <motion.div variants={fadeUpVariant}>
              <Link
                to="/therapy"
                className="group inline-flex items-center gap-2 px-8 py-4 
                         bg-white text-sky-600 
                         font-semibold rounded-full 
                         shadow-lg hover:shadow-xl 
                         hover:scale-105 active:scale-[1.02]
                         transition-all duration-300 ease-out
                         focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-sky-500">
                Get Started
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 
                                     transition-transform duration-300 ease-out" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Floating Grandma Sue Chatbot */}
      <GrandmaSue />

      {/* Custom Animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-gradient {
          animation: gradient 8s ease-in-out infinite;
        }

        /* Reduced motion support for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Ensure smooth animations at 60fps */
        .will-change-transform {
          will-change: transform;
        }

        /* Hover effects only on devices that support hover */
        @media (hover: none) {
          .group:hover > * {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
