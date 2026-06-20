// Section -> sub-section menus, shared by the 3D driving world and the 2D
// walking world. When the driver/walker enters a section's garage/station, an
// in-world pick-list of these sub-sections is shown; choosing one navigates to
// its route. Keyed by the section's main route (matches STATION_POSITIONS).

export interface SubSection {
  label: string;
  route: string;
  emoji: string;
}

export interface SectionMenuData {
  id: string; // short id used in the /journey/walk/:section route
  title: string;
  emoji: string;
  items: SubSection[];
}

export const SECTION_MENUS: Record<string, SectionMenuData> = {
  '/therapy': {
    id: 'therapy',
    title: 'Therapeutic Approaches',
    emoji: '🎨',
    items: [
      { label: 'Storalis', route: '/therapy/story', emoji: '📖' },
      { label: 'Canvessence', route: '/therapy/art', emoji: '🖌️' },
      { label: 'Therapoetic', route: '/therapy/poetry', emoji: '✒️' },
      { label: 'Euphora', route: '/therapy/music', emoji: '🎵' },
    ],
  },
  '/community': {
    id: 'community',
    title: 'Support Community',
    emoji: '👥',
    items: [
      { label: 'Sacred Circles', route: '/community/circles', emoji: '🔮' },
      { label: 'Peer Support', route: '/community/peer', emoji: '🤝' },
      { label: 'Memorial Wall', route: '/community/memorial', emoji: '🕯️' },
    ],
  },
  '/tools': {
    id: 'tools',
    title: 'Healing Tools',
    emoji: '🌸',
    items: [
      { label: 'Grief Journaling', route: '/tools/journaling', emoji: '📓' },
      { label: 'Letters to Loved Ones', route: '/tools/letters', emoji: '💌' },
      { label: 'Memory Garden', route: '/tools/memory-garden', emoji: '🌷' },
      { label: 'Guided Meditations', route: '/tools/meditation', emoji: '🧘' },
      { label: 'Emergency Toolkit', route: '/tools/emergency', emoji: '🆘' },
      { label: 'Breathing Exercises', route: '/tools/breathing', emoji: '🌬️' },
      { label: 'Plants for Healing', route: '/tools/plants-healing', emoji: '🌱' },
    ],
  },
  '/resources': {
    id: 'resources',
    title: 'Learning Resources',
    emoji: '📚',
    items: [
      { label: 'Self-Help Books', route: '/resources/books', emoji: '📚' },
      { label: 'Educational Courses', route: '/resources/courses', emoji: '🎓' },
      { label: 'Cultural Practices', route: '/resources/cultural', emoji: '🌍' },
      { label: 'Professional Help', route: '/resources/professional', emoji: '🩺' },
    ],
  },
};

/** Returns the sub-section menu for a station route, or null if it has none. */
export function getSectionMenu(route: string): SectionMenuData | null {
  return SECTION_MENUS[route] ?? null;
}

/** Returns the section by its short id (used in /journey/walk/:section), or null. */
export function getSectionById(id: string): SectionMenuData | null {
  return Object.values(SECTION_MENUS).find((s) => s.id === id) ?? null;
}
