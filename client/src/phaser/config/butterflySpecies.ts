/**
 * Butterfly Species Configurations
 * Only beautiful, colorful butterflies - NO dark species, NO bugs
 */

export interface ButterflySpeciesConfig {
  id: string;
  name: string;
  wingSpan: number;
  baseColor: number;
  patterns: {
    forewings: {
      base: number;
      veins?: number;
      spots?: Array<{ x: number; y: number; radius: number; color: number }>;
      border?: { color: number; width: number; dotted?: boolean };
      stripes?: Array<{ angle: number; width: number; color: number }>;
    };
    hindwings: {
      base: number;
      veins?: number;
      spots?: Array<{ x: number; y: number; radius: number; color: number }>;
      border?: { color: number; width: number };
      tail?: { length: number; color: number };
    };
  };
  body: {
    color: number;
    segments: number;
    hairy: boolean;
  };
  flight: {
    flapRate: number;
    speed: number;
    wobble: number;
    glideFrequency: number;
  };
  behavior: {
    personality: 'calm' | 'active' | 'erratic';
    flowerPreference: number[];
    territoriality: number;
    wanderDistance: number;
  };
  rarity: number;
  iridescent?: boolean;
}

export const BUTTERFLY_SPECIES: Record<string, ButterflySpeciesConfig> = {
  monarch: {
    id: 'monarch',
    name: 'Monarch',
    wingSpan: 45,
    baseColor: 0xFF8C00,
    patterns: {
      forewings: {
        base: 0xFF8C00,
        veins: 0x000000,
        border: { color: 0x000000, width: 1.5, dotted: true },
        spots: [
          { x: 0.3, y: 0.3, radius: 2, color: 0xFFFFFF },
          { x: 0.4, y: 0.5, radius: 2, color: 0xFFFFFF },
          { x: 0.5, y: 0.7, radius: 2, color: 0xFFFFFF }
        ]
      },
      hindwings: {
        base: 0xFF8C00,
        veins: 0x000000,
        border: { color: 0x000000, width: 1.5 },
        spots: [
          { x: 0.4, y: 0.4, radius: 2, color: 0xFFFFFF },
          { x: 0.6, y: 0.6, radius: 2, color: 0xFFFFFF }
        ]
      }
    },
    body: { color: 0x000000, segments: 6, hairy: false },
    flight: { speed: 40, flapRate: 10, wobble: 0.3, glideFrequency: 0.4 },
    behavior: {
      personality: 'calm',
      flowerPreference: [0xFF6B9D, 0x9C27B0, 0xFF5252],
      territoriality: 0.3,
      wanderDistance: 400
    },
    rarity: 0.3
  },

  blueMorpho: {
    id: 'blueMorpho',
    name: 'Blue Morpho',
    wingSpan: 58,
    baseColor: 0x1E90FF,
    patterns: {
      forewings: {
        base: 0x1E90FF,
        border: { color: 0x000000, width: 1.5 }
      },
      hindwings: {
        base: 0x00BFFF,
        border: { color: 0x000000, width: 1.5 }
      }
    },
    body: { color: 0x4169E1, segments: 5, hairy: true },
    flight: { speed: 50, flapRate: 12, wobble: 0.2, glideFrequency: 0.5 },
    behavior: {
      personality: 'erratic',
      flowerPreference: [0x9C27B0, 0xFF4081, 0x2196F3],
      territoriality: 0.7,
      wanderDistance: 600
    },
    rarity: 0.25,
    iridescent: true
  },

  cabbageWhite: {
    id: 'cabbageWhite',
    name: 'Cabbage White',
    wingSpan: 32,
    baseColor: 0xFFFFF0,
    patterns: {
      forewings: {
        base: 0xFFFFF0,
        spots: [
          { x: 0.6, y: 0.5, radius: 2, color: 0x606060 },
          { x: 0.4, y: 0.6, radius: 1.5, color: 0x606060 }
        ],
        border: { color: 0xC0C0C0, width: 0.8 }
      },
      hindwings: {
        base: 0xFFFFF0,
        spots: [{ x: 0.5, y: 0.5, radius: 1.5, color: 0x606060 }],
        border: { color: 0xC0C0C0, width: 0.8 }
      }
    },
    body: { color: 0xF5F5DC, segments: 5, hairy: true },
    flight: { speed: 35, flapRate: 8, wobble: 0.5, glideFrequency: 0.3 },
    behavior: {
      personality: 'calm',
      flowerPreference: [0xFFFFFF, 0xFFEB3B, 0x4CAF50],
      territoriality: 0.1,
      wanderDistance: 300
    },
    rarity: 0.4
  },

  yellowSwallowtail: {
    id: 'yellowSwallowtail',
    name: 'Yellow Swallowtail',
    wingSpan: 52,
    baseColor: 0xFFD700,
    patterns: {
      forewings: {
        base: 0xFFD700,
        stripes: [
          { angle: -20, width: 1, color: 0x000000 },
          { angle: 0, width: 1, color: 0x000000 }
        ],
        border: { color: 0x000000, width: 1.5 }
      },
      hindwings: {
        base: 0xFFEB3B,
        spots: [
          { x: 0.4, y: 0.6, radius: 3, color: 0x4169E1 },
          { x: 0.5, y: 0.7, radius: 2, color: 0xFF6347 }
        ],
        border: { color: 0x000000, width: 1.5 },
        tail: { length: 6, color: 0x000000 }
      }
    },
    body: { color: 0xFFD700, segments: 6, hairy: false },
    flight: { speed: 45, flapRate: 9, wobble: 0.4, glideFrequency: 0.35 },
    behavior: {
      personality: 'active',
      flowerPreference: [0xFFEB3B, 0xFF9800, 0xFFFFFF],
      territoriality: 0.4,
      wanderDistance: 500
    },
    rarity: 0.3
  },

  paintedLady: {
    id: 'paintedLady',
    name: 'Painted Lady',
    wingSpan: 40,
    baseColor: 0xFF7F50,
    patterns: {
      forewings: {
        base: 0xFF7F50,
        spots: [
          { x: 0.3, y: 0.3, radius: 2, color: 0xFFFFFF },
          { x: 0.5, y: 0.5, radius: 3, color: 0xFFB6C1 },
          { x: 0.7, y: 0.7, radius: 2, color: 0xFFFFFF }
        ],
        border: { color: 0xD2691E, width: 1 }
      },
      hindwings: {
        base: 0xFFB6C1,
        spots: [
          { x: 0.4, y: 0.5, radius: 2.5, color: 0xFF7F50 },
          { x: 0.6, y: 0.6, radius: 2, color: 0xFFFFFF }
        ],
        border: { color: 0xD2691E, width: 1 }
      }
    },
    body: { color: 0xFF7F50, segments: 5, hairy: true },
    flight: { speed: 38, flapRate: 10, wobble: 0.35, glideFrequency: 0.3 },
    behavior: {
      personality: 'calm',
      flowerPreference: [0xFF69B4, 0xFF7F50, 0x9C27B0],
      territoriality: 0.2,
      wanderDistance: 350
    },
    rarity: 0.25
  },

  cloudlessSulphur: {
    id: 'cloudlessSulphur',
    name: 'Cloudless Sulphur',
    wingSpan: 38,
    baseColor: 0xFFF44F,
    patterns: {
      forewings: {
        base: 0xFFF44F,
        border: { color: 0xFFD700, width: 0.5 }
      },
      hindwings: {
        base: 0xFFEB3B,
        border: { color: 0xFFD700, width: 0.5 }
      }
    },
    body: { color: 0xFFD700, segments: 5, hairy: false },
    flight: { speed: 42, flapRate: 11, wobble: 0.3, glideFrequency: 0.4 },
    behavior: {
      personality: 'active',
      flowerPreference: [0xFFEB3B, 0xFFFFFF, 0xFF9800],
      territoriality: 0.3,
      wanderDistance: 450
    },
    rarity: 0.2
  },

  pinkFantasy: {
    id: 'pinkFantasy',
    name: 'Pink Fantasy',
    wingSpan: 42,
    baseColor: 0xFFB6C1,
    patterns: {
      forewings: {
        base: 0xFFB6C1,
        spots: [
          { x: 0.4, y: 0.4, radius: 3, color: 0xFFFFFF },
          { x: 0.6, y: 0.6, radius: 2.5, color: 0xFF69B4 }
        ],
        border: { color: 0xFF69B4, width: 1 }
      },
      hindwings: {
        base: 0xFFC0CB,
        spots: [{ x: 0.5, y: 0.5, radius: 2, color: 0xFFFFFF }],
        border: { color: 0xFF69B4, width: 1 }
      }
    },
    body: { color: 0xFF69B4, segments: 5, hairy: true },
    flight: { speed: 36, flapRate: 9, wobble: 0.4, glideFrequency: 0.4 },
    behavior: {
      personality: 'calm',
      flowerPreference: [0xFF69B4, 0xFFB6C1, 0x9C27B0],
      territoriality: 0.1,
      wanderDistance: 320
    },
    rarity: 0.15,
    iridescent: true
  },

  lavenderDream: {
    id: 'lavenderDream',
    name: 'Lavender Dream',
    wingSpan: 44,
    baseColor: 0xE6E6FA,
    patterns: {
      forewings: {
        base: 0xE6E6FA,
        spots: [
          { x: 0.4, y: 0.5, radius: 2.5, color: 0xDDA0DD },
          { x: 0.6, y: 0.6, radius: 2, color: 0xFFFFFF }
        ],
        border: { color: 0xDA70D6, width: 1 }
      },
      hindwings: {
        base: 0xDDA0DD,
        spots: [{ x: 0.5, y: 0.5, radius: 2, color: 0xE6E6FA }],
        border: { color: 0xDA70D6, width: 1 }
      }
    },
    body: { color: 0xDA70D6, segments: 5, hairy: true },
    flight: { speed: 37, flapRate: 8, wobble: 0.35, glideFrequency: 0.45 },
    behavior: {
      personality: 'calm',
      flowerPreference: [0x9C27B0, 0xE6E6FA, 0xFF4081],
      territoriality: 0.2,
      wanderDistance: 380
    },
    rarity: 0.12,
    iridescent: true
  },

  mintGreen: {
    id: 'mintGreen',
    name: 'Mint Breeze',
    wingSpan: 36,
    baseColor: 0x98FF98,
    patterns: {
      forewings: {
        base: 0x98FF98,
        spots: [
          { x: 0.4, y: 0.4, radius: 2, color: 0xAFEEEE },
          { x: 0.6, y: 0.6, radius: 2.5, color: 0xFFFFFF }
        ],
        border: { color: 0x90EE90, width: 0.8 }
      },
      hindwings: {
        base: 0xAFEEEE,
        spots: [{ x: 0.5, y: 0.5, radius: 2, color: 0x98FF98 }],
        border: { color: 0x90EE90, width: 0.8 }
      }
    },
    body: { color: 0x90EE90, segments: 5, hairy: false },
    flight: { speed: 34, flapRate: 9, wobble: 0.45, glideFrequency: 0.35 },
    behavior: {
      personality: 'calm',
      flowerPreference: [0x98FF98, 0xFFFFFF, 0xAFEEEE],
      territoriality: 0.15,
      wanderDistance: 340
    },
    rarity: 0.1
  }
};

export function getRandomButterflySpecies(): ButterflySpeciesConfig {
  const species = Object.values(BUTTERFLY_SPECIES);
  const totalRarity = species.reduce((sum, s) => sum + s.rarity, 0);
  const random = Math.random() * totalRarity;
  
  let cumulative = 0;
  for (const s of species) {
    cumulative += s.rarity;
    if (random <= cumulative) {
      return s;
    }
  }
  
  return species[0];
}

export function getSeasonalSpeciesMix(season: string): ButterflySpeciesConfig[] {
  const all = Object.values(BUTTERFLY_SPECIES);
  
  if (season === 'spring') {
    return all.filter(s => ['cabbageWhite', 'yellowSwallowtail', 'paintedLady', 'pinkFantasy'].includes(s.id));
  } else if (season === 'summer') {
    return all;
  } else if (season === 'autumn') {
    return all.filter(s => ['monarch', 'paintedLady', 'yellowSwallowtail'].includes(s.id));
  }
  
  return [];
}
