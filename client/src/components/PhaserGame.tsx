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
    
    // Cleanup
    return () => {
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
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 
                   flex items-center gap-2 
                   px-4 py-2 
                   bg-white/90 backdrop-blur-sm
                   text-gray-800 font-medium
                   rounded-full shadow-lg
                   hover:bg-white hover:shadow-xl
                   transition-all duration-300
                   focus:outline-none focus:ring-4 focus:ring-sky-300/50"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Home</span>
      </button>
      
      {/* Phaser container */}
      <div 
        id="phaser-game-container" 
        ref={containerRef}
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />
      
      {/* Instructions overlay (hidden on mobile) */}
      <div className="absolute bottom-4 right-4 z-40 
                    hidden md:block
                    bg-white/90 backdrop-blur-sm
                    rounded-2xl p-4 shadow-lg
                    max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Welcome to Your Healing Journey
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Explore this peaceful world and discover different healing stations.
        </p>
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">←</kbd>
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">→</kbd>
            <span>Move left/right</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">SPACE</kbd>
            <span>Enter station</span>
          </div>
        </div>
      </div>
    </div>
  );
}
