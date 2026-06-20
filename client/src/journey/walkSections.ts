import { StationConfig } from '../phaser/config/constants';
import { SectionMenuData } from './sections';

// Builds the 2D walking world's billboards from a section's sub-sections, and
// provides the injection channel the Phaser scene reads at boot. When the truck
// enters a garage we navigate to /journey/walk/:section; PhaserGame sets the
// active stations (below) before constructing the game, and HealingWorldScene
// reads them in create().

const FIRST_X = 1500;
const STEP_X = 1800;
const SIGN_Y = 750;

// Distinct sign colours cycled across billboards.
const COLORS = [0x0ea5e9, 0x06b6d4, 0x3b82f6, 0x14b8a6, 0x8b5cf6, 0xf59e0b, 0xec4899];

/** Lay a section's sub-sections out as billboard stations along the world. */
export function buildSectionStations(menu: SectionMenuData): StationConfig[] {
  return menu.items.map((item, i) => ({
    id: `${menu.id}-${i}`,
    name: item.label,
    x: FIRST_X + i * STEP_X,
    y: SIGN_Y,
    width: 280,
    height: 200,
    route: item.route,
    color: COLORS[i % COLORS.length],
    icon: item.emoji,
  }));
}

// ── Injection channel (module singleton) ────────────────────────────────────
let activeStations: StationConfig[] | null = null;

export function setActiveStations(list: StationConfig[] | null): void {
  activeStations = list;
}

export function getActiveStations(): StationConfig[] | null {
  return activeStations;
}
