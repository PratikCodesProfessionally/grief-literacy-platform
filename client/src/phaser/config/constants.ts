export const GAME_CONSTANTS = {
  // World dimensions
  WORLD_WIDTH: 14000, // Extended world
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
  INTERACTION_RANGE: 250, // Increased for better mobile usability
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

// NPC configurations
export const NPC_CONFIGS = [
  {
    id: 'grandma-sue',
    name: 'Grandma Sue',
    x: 800,
    y: 700,
    color: 0xf472b6, // pink-400
    emoji: '👵',
    dialogue: [
      'Hello dear! Remember, healing is not linear.',
      'Take your time on this journey.',
      'Every step forward is progress, no matter how small.',
      'You are stronger than you know.',
      'It\'s okay to rest when you need to.'
    ],
    moveRange: 200,
    speed: 30
  },
  {
    id: 'guide',
    name: 'Guide',
    x: 3500,
    y: 650,
    color: 0x60a5fa, // blue-400
    emoji: '🦋',
    dialogue: [
      'Welcome, traveler!',
      'Explore at your own pace.',
      'There are treasures to find along the way.',
      'Each station offers something unique.'
    ],
    moveRange: 150,
    speed: 40
  },
  {
    id: 'companion',
    name: 'Friend',
    x: 9000,
    y: 680,
    color: 0x34d399, // emerald-400
    emoji: '🐦',
    dialogue: [
      'You\'re doing great!',
      'Look how far you\'ve come.',
      'The journey continues ahead.',
      'I believe in you!'
    ],
    moveRange: 250,
    speed: 50
  }
];

// Inspirational quotes for benches
export const BENCH_QUOTES = [
  // Original quotes (indices 0–14)
  '"You are braver than you believe, stronger than you seem, and smarter than you think." - A.A. Milne',
  '"The only way out is through." - Robert Frost',
  '"You have within you right now, everything you need to deal with whatever comes." - Brian Tracy',
  '"Healing takes time, and asking for help is a courageous step." - Mariska Hargitay',
  '"Hope is being able to see that there is light despite all the darkness." - Desmond Tutu',
  '"Every day may not be good, but there is something good in every day." - Alice Morse Earle',
  '"Although the world is full of suffering, it is also full of the overcoming of it." - Helen Keller',
  '"What we once enjoyed and deeply loved we can never lose; all that we love deeply becomes a part of us." - Helen Keller',
  '"In the depth of winter, I finally learned that within me there lay an invincible summer." - Albert Camus',
  '"Tears have a wisdom all their own. They come when a person has relaxed enough to let go." - Frederick Buechner',
  '"Once the storm is over, you won\'t remember how you made it through. But one thing is certain: you came out stronger." - Haruki Murakami',
  '"They live forever in your broken heart that doesn\'t seal back up. And you come through, and you learn to dance with the limp." - Anne Lamott',
  '"Keep going. Everything you need will come to you at the perfect time." - Unknown',
  '"The wound is the place where the Light enters you." - Rumi',
  '"Hope is the thing with feathers that perches in the soul." - Emily Dickinson',

  // New quotes (indices 15–35) — hopeful & encouraging
  '"Even the darkest night will end and the sun will rise." - Victor Hugo',
  '"You are allowed to be both a masterpiece and a work in progress simultaneously." - Sophia Bush',
  '"Stars can\'t shine without darkness." - Unknown',
  '"To live in hearts we leave behind is not to die." - Thomas Campbell',
  '"When someone you love becomes a memory, the memory becomes a treasure." - Unknown',
  '"Courage doesn\'t always roar. Sometimes it\'s the quiet voice at the end of the day saying, \'I will try again tomorrow.\'" - Mary Anne Radmacher',
  '"Be gentle with yourself. You are a child of the universe, no less than the trees and the stars." - Max Ehrmann',
  '"Turn your wounds into wisdom." - Oprah Winfrey',
  '"There is a crack in everything — that\'s how the light gets in." - Leonard Cohen',
  '"You are stronger than you know, braver than you feel, and more loved than you can imagine." - Unknown',
  '"Every morning brings new potential, and every sunset is proof you survived the day." - Unknown',
  '"Though no one can go back and make a brand new start, anyone can start from now and make a brand new ending." - Carl Bard',
  '"What lies behind us and what lies before us are tiny matters compared to what lies within us." - Ralph Waldo Emerson',
  '"The human spirit is stronger than anything that can happen to it." - C.C. Scott',
  '"Out of difficulties grow miracles." - Jean de la Bruyère',
  '"You don\'t have to see the whole staircase, just take the first step." - Martin Luther King Jr.',
  '"One day you will tell your story of how you overcame what you went through, and it will be someone else\'s survival guide." - Brené Brown',
  '"You are not alone. You have always had within you everything you need to heal." - Unknown',
  '"After every storm there is a golden sky." - Unknown',
  '"Healing is not an overnight process. It is a daily cleansing of pain, it is a daily healing of your life." - León Brown',
  '"The most beautiful people we have known are those who have known defeat, known suffering — and have found their way out of the depths." - Elisabeth Kübler-Ross'
];
