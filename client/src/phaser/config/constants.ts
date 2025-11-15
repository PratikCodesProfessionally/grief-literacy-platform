export const GAME_CONSTANTS = {
  // World dimensions
  WORLD_WIDTH: 8000,
  WORLD_HEIGHT: 1080,
  GROUND_Y: 900,
  
  // Player configuration
  PLAYER_SPEED: 200,
  PLAYER_SCALE: 1,
  PLAYER_START_X: 400,
  PLAYER_START_Y: 800,
  PLAYER_WIDTH: 50,
  PLAYER_HEIGHT: 80,
  
  // Camera settings
  CAMERA_LERP: 0.1,
  CAMERA_DEADZONE_WIDTH: 200,
  CAMERA_DEADZONE_HEIGHT: 100,
  
  // Interaction
  INTERACTION_RANGE: 180,
  PROMPT_Y_OFFSET: -140,
  
  // Parallax speeds (0 = fixed, 1 = moves with camera)
  PARALLAX_SKY: 0,
  PARALLAX_MOUNTAINS: 0.15,
  PARALLAX_MIDGROUND: 0.4,
  PARALLAX_FOREGROUND: 0.7,
  
  // Animation speeds
  WALK_ANIM_FPS: 8,
  IDLE_ANIM_FPS: 4,
  GLOW_PULSE_DURATION: 2000,
  
  // UI
  PROMPT_FADE_DURATION: 300,
  SCENE_TRANSITION_DURATION: 800,
  
  // Mobile controls
  JOYSTICK_RADIUS: 60,
  JOYSTICK_BASE_ALPHA: 0.4,
  BUTTON_SIZE: 80
};

export interface StationConfig {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  route: string;
  color: number;
  icon: string;
}

export const STATION_POSITIONS: StationConfig[] = [
  {
    id: 'therapy',
    name: 'Therapeutic\nApproaches',
    x: 1400,
    y: 750,
    width: 280,
    height: 200,
    route: '/therapy',
    color: 0x0ea5e9, // sky-500
    icon: '🎨'
  },
  {
    id: 'community',
    name: 'Support\nCommunity',
    x: 2800,
    y: 750,
    width: 280,
    height: 200,
    route: '/community',
    color: 0x06b6d4, // cyan-500
    icon: '👥'
  },
  {
    id: 'tools',
    name: 'Healing\nTools',
    x: 4200,
    y: 750,
    width: 280,
    height: 200,
    route: '/tools',
    color: 0x3b82f6, // blue-500
    icon: '🌸'
  },
  {
    id: 'resources',
    name: 'Learning\nResources',
    x: 5600,
    y: 750,
    width: 280,
    height: 200,
    route: '/resources',
    color: 0x14b8a6, // teal-500
    icon: '📚'
  },
  {
    id: 'meditation',
    name: 'Meditation\nGarden',
    x: 7000,
    y: 700,
    width: 320,
    height: 250,
    route: '/tools/meditation',
    color: 0x8b5cf6, // violet-500
    icon: '🧘'
  }
];
