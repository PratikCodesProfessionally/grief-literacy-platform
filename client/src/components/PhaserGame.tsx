import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { createGameConfig } from '@/phaser/config/gameConfig';
import { HealingWorldScene } from '@/phaser/scenes/HealingWorldScene';
import { ArrowLeft } from 'lucide-react';

export function PhaserGame() {
  const navigate = useNavigate();
  const gameRef = React.useRef<Phaser.Game | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Tutorial prompt state (asks user if they want tutorial)
  const [showTutorialPrompt, setShowTutorialPrompt] = React.useState(false);
  
  // Tutorial overlay state
  const [tutorialVisible, setTutorialVisible] = React.useState(false);
  const [tutorialStep, setTutorialStep] = React.useState(0);
  const [tutorialMessage, setTutorialMessage] = React.useState('');
  const [tutorialTitle, setTutorialTitle] = React.useState('');
  
  // Add mobile meta tags
  React.useEffect(() => {
    // Prevent zooming
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no'
      );
    }
    
    // Add mobile-web-app meta tags
    const mobileCapable = document.createElement('meta');
    mobileCapable.name = 'mobile-web-app-capable';
    mobileCapable.content = 'yes';
    document.head.appendChild(mobileCapable);
    
    const appleCapable = document.createElement('meta');
    appleCapable.name = 'apple-mobile-web-app-capable';
    appleCapable.content = 'yes';
    document.head.appendChild(appleCapable);
    
    const appleStatus = document.createElement('meta');
    appleStatus.name = 'apple-mobile-web-app-status-bar-style';
    appleStatus.content = 'black-fullscreen';
    document.head.appendChild(appleStatus);
    
    // Prevent pull-to-refresh and other mobile gestures
    const preventGestures = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    };
    
    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches[0]?.clientY > 10) {
        e.preventDefault(); // Prevent pull-to-refresh
      }
    };
    
    document.addEventListener('touchstart', preventGestures, { passive: false });
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    
    // Add CSS for better mobile touch performance
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile touch optimizations for tutorial buttons */
      canvas {
        touch-action: manipulation;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      /* Prevent text selection on tutorial elements */
      .tutorial-button, .tutorial-overlay {
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      
      /* Improve touch responsiveness */
      * {
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup
    return () => {
      document.removeEventListener('touchstart', preventGestures);
      document.removeEventListener('touchmove', preventPullToRefresh);
      document.head.removeChild(mobileCapable);
      document.head.removeChild(appleCapable);
      document.head.removeChild(appleStatus);
    };
  }, []);
  
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    // Create Phaser game
    const config = createGameConfig('phaser-game-container');
    gameRef.current = new Phaser.Game(config);
    
    // Set up tutorial overlay communication
    const setupTutorialOverlay = () => {
      if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('HealingWorldScene') as any;
        if (scene) {
          console.log('[REACT] Setting up tutorial event listeners');
          
          // Listen for tutorial events
          scene.events.on('tutorial-step-changed', (data: any) => {
            console.log('[REACT] Tutorial step changed:', data);
            setTutorialStep(data.step);
            setTutorialTitle(data.title);
            setTutorialMessage(data.message);
            setTutorialVisible(true);
          });
          
          scene.events.on('tutorial-completed', () => {
            console.log('[REACT] Tutorial completed');
            setTutorialVisible(false);
            setTutorialStep(0);
            setTutorialTitle('');
            setTutorialMessage('');
          });
        }
      }
    };
    
    // Wait for scene to be ready - try multiple times
    const waitForScene = () => {
      if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('HealingWorldScene') as any;
        if (scene) {
          setupTutorialOverlay();
          
          // Show tutorial prompt if user hasn't seen tutorial yet
          const tutorialComplete = localStorage.getItem('grief_tutorial_complete') === 'true';
          if (!tutorialComplete) {
            // Show the prompt after a short delay (let scene load first)
            setTimeout(() => {
              setShowTutorialPrompt(true);
            }, 1000);
          }
        } else {
          // Try again in 100ms
          setTimeout(waitForScene, 100);
        }
      }
    };
    
    // Wait for scene to be ready
    gameRef.current.events.on('ready', waitForScene);
    
    // Handle window resize and orientation changes
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial resize
    setTimeout(handleResize, 100);
    
    // Ensure canvas gets focus for keyboard input
    const focusCanvas = () => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.setAttribute('tabindex', '1');
        canvas.focus();
      }
    };
    
    // Focus on click anywhere in container
    containerRef.current.addEventListener('click', focusCanvas);
    
    // Initial focus after game loads
    setTimeout(focusCanvas, 500);
    
    // Wait for scene to be ready
    const checkScene = setInterval(() => {
      const scene = gameRef.current?.scene.getScene('HealingWorldScene') as HealingWorldScene;
      
      if (scene && scene.scene.isActive()) {
        // Set navigation callback
        scene.onNavigate = (route: string) => {
          navigate(route);
        };
        
        clearInterval(checkScene);
      }
    }, 100);
    
    // Cleanup
    return () => {
      clearInterval(checkScene);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      // Clean up scene
      const scene = gameRef.current?.scene.getScene('HealingWorldScene') as HealingWorldScene;
      if (scene) {
        scene.cleanup();
      }
      
      // Destroy game
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [navigate]);
  
  return (
    <div 
      className="relative w-full h-screen bg-sky-100 overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}>
      {/* Back button - subtle, non-intrusive */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 
                   flex items-center gap-2 
                   px-4 py-2 
                   bg-white/80 backdrop-blur-sm
                   text-stone-600 font-medium text-sm
                   rounded-full shadow-sm
                   hover:bg-white hover:shadow-md
                   transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-stone-300/50"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>
      
      {/* Debug: Reset Tutorial Button */}
      <button
        onClick={() => {
          localStorage.removeItem('grief_tutorial_complete');
          setShowTutorialPrompt(true);
        }}
        className="absolute top-4 right-4 z-50 
                   px-3 py-2 
                   bg-amber-500 hover:bg-amber-600 
                   text-white text-xs font-medium
                   rounded-lg shadow-sm
                   transition-all duration-300"
        style={{ touchAction: 'manipulation' }}
      >
        Reset Tutorial
      </button>
      
      {/* Tutorial Prompt - Centered question asking if user wants tutorial */}
      {showTutorialPrompt && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            pointerEvents: 'none',
            touchAction: 'none'
          }}
        >
          <div 
            className="bg-amber-400 rounded-xl p-6 mx-4 max-w-sm shadow-xl border-2 border-amber-500"
            style={{
              pointerEvents: 'auto',
              touchAction: 'manipulation'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-amber-900 mb-4 text-center">
              Would you like a quick tour of this world?
            </h2>
            <p className="text-amber-800 mb-6 text-center text-sm">
              We can show you around in about 30 seconds.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowTutorialPrompt(false);
                  // Save that user declined tutorial
                  localStorage.setItem('grief_tutorial_complete', 'true');
                }}
                className="px-5 py-3 bg-amber-200 hover:bg-amber-300 text-amber-800 font-medium rounded-lg
                           active:scale-95 transition-all touch-manipulation"
                style={{
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                No thanks
              </button>
              
              <button
                onClick={() => {
                  setShowTutorialPrompt(false);
                  // Start the actual tutorial
                  if (gameRef.current) {
                    const scene = gameRef.current.scene.getScene('HealingWorldScene') as any;
                    if (scene && scene.guidedTutorial) {
                      scene.guidedTutorial.forceStart();
                    }
                  }
                }}
                className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg
                           active:scale-95 transition-all touch-manipulation shadow-sm"
                style={{
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Yes, show me
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Phaser container */}
      <div 
        id="phaser-game-container" 
        ref={containerRef}
        className="w-full h-full"
        tabIndex={0}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none',
          outline: 'none'
        }}
      />
      
      {/* HTML Tutorial Overlay - Warm, Human-Centered Design */}
      {tutorialVisible && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            pointerEvents: 'none',
            touchAction: 'none'
          }}
        >
          {/* Gentle overlay */}
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            style={{
              pointerEvents: 'none',
              touchAction: 'none'
            }}
          />
          
          {/* Dialog - warm, organic design */}
          <div 
            className="relative z-10 mx-6 max-w-md"
            style={{
              pointerEvents: 'auto',
              touchAction: 'manipulation'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card with soft, warm styling */}
            <div className="bg-stone-50 rounded-2xl p-8 shadow-xl border border-stone-200/50">
              
              {/* Progress dots - subtle, non-intrusive */}
              <div className="flex justify-center gap-2 mb-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < tutorialStep ? 'bg-sage-500' : 
                      i === tutorialStep ? 'bg-sage-600 w-4' : 
                      'bg-stone-300'
                    }`}
                  />
                ))}
              </div>
              
              {/* Title - warm serif font feel */}
              <h2 className="text-2xl font-medium text-stone-800 mb-4 text-center tracking-tight"
                  style={{ fontFamily: 'Georgia, serif' }}>
                {tutorialTitle}
              </h2>
              
              {/* Message - readable, generous spacing */}
              <p className="text-stone-600 mb-8 text-center whitespace-pre-line leading-relaxed text-base">
                {tutorialMessage}
              </p>
              
              {/* Buttons - gentle, not aggressive */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    console.log('[REACT] Skip button clicked');
                    setTutorialVisible(false);
                    setTutorialStep(0);
                    setTutorialTitle('');
                    setTutorialMessage('');
                    if (gameRef.current) {
                      const scene = gameRef.current.scene.getScene('HealingWorldScene') as any;
                      if (scene && scene.guidedTutorial) {
                        scene.guidedTutorial.skip();
                      }
                    }
                  }}
                  className="px-5 py-3 text-stone-500 hover:text-stone-700 font-medium rounded-xl text-base
                             transition-colors touch-manipulation"
                  style={{
                    minHeight: '48px',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  Not now
                </button>
                
                <button
                  onClick={() => {
                    console.log('[REACT] Next button clicked');
                    if (gameRef.current) {
                      const scene = gameRef.current.scene.getScene('HealingWorldScene') as any;
                      if (scene && scene.guidedTutorial) {
                        const isLastStep = tutorialStep >= scene.guidedTutorial.steps.length - 1;
                        if (isLastStep) {
                          console.log('[REACT] Last step - completing tutorial');
                          setTutorialVisible(false);
                          setTutorialStep(0);
                          setTutorialTitle('');
                          setTutorialMessage('');
                          scene.guidedTutorial.complete();
                        } else {
                          scene.guidedTutorial.showStep(tutorialStep + 1);
                        }
                      }
                    }
                  }}
                  className="px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-xl text-base
                             active:scale-[0.98] transition-all touch-manipulation shadow-sm"
                  style={{
                    minWidth: '100px',
                    minHeight: '48px',
                    WebkitTapHighlightColor: 'transparent',
                    backgroundColor: '#7c9a7c'
                  }}
                >
                  {tutorialStep >= 4 ? 'Begin' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
