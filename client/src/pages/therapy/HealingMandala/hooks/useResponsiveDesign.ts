import * as React from 'react';

interface ViewportConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  canvasSize: { width: number; height: number };
  zoomLevel: number;
  viewportSize: { width: number; height: number };
}

export const useResponsiveDesign = (containerRef?: React.RefObject<HTMLDivElement>) => {
  const [viewport, setViewport] = React.useState<ViewportConfig>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLandscape: window.innerWidth > window.innerHeight,
    canvasSize: { width: 600, height: 600 },
    zoomLevel: 1,
    viewportSize: { width: window.innerWidth, height: window.innerHeight },
  });

  const calculateViewport = React.useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    // Device type detection
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    // Canvas sizing logic
    let canvasWidth = 600;
    let canvasHeight = 600;
    let zoomLevel = 1;

    if (isMobile) {
      const containerWidth = Math.min(width - 40, 400);
      canvasWidth = containerWidth;
      canvasHeight = containerWidth;
      zoomLevel = 0.9;
    } else if (isTablet) {
      const containerWidth = Math.min(width - 60, 500);
      canvasWidth = containerWidth;
      canvasHeight = containerWidth;
      zoomLevel = 1;
    } else {
      canvasWidth = 600;
      canvasHeight = 600;
      zoomLevel = 1;
    }

    setViewport({
      isMobile,
      isTablet,
      isDesktop,
      isLandscape,
      canvasSize: { width: canvasWidth, height: canvasHeight },
      zoomLevel,
      viewportSize: { width, height },
    });
  }, []);

  // Calculate viewport on mount
  React.useEffect(() => {
    calculateViewport();
  }, [calculateViewport]);

  // Recalculate on window resize
  React.useEffect(() => {
    const handleResize = () => {
      calculateViewport();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateViewport]);

  return viewport;
};
