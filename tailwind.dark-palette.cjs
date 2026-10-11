/**
 * Dark palette remap.
 *
 * Most screens were styled light-first (bg-white, bg-purple-50, text-gray-800, ...)
 * and only some of them carry `dark:` variants. This plugin gives every light
 * colour utility a dark counterpart that applies under `.dark`, so pages stay
 * readable in dark mode without a `dark:` class on every element.
 *
 * Rules use `:where(.dark) .class`, which has the same specificity as the
 * original utility and is emitted after it, so it wins over the light colour.
 * An explicit `dark:` class is more specific and still overrides it.
 * Tailwind only emits the rules for classes that appear in the source,
 * including variants such as `hover:` and opacity modifiers such as `/80`.
 */
const plugin = require('tailwindcss/plugin');
const colors = require('tailwindcss/colors');

const GRAYS = ['slate', 'gray', 'zinc', 'neutral', 'stone'];
const HUES = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];
const OPACITIES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

// Keep in sync with the `.dark` variables in client/src/index.css.
const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
};
const BACKGROUND = hsl(210, 25, 12);
const CARD = hsl(210, 20, 15);
const BORDER = hsl(210, 20, 22);
const FOREGROUND = hsl(32, 8, 90);

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (hex, base, weight) => rgb(hex).map((c, i) => Math.round(c * weight + base[i] * (1 - weight)));
const tint = (family, shade, weight) => mix(colors[family][shade], CARD, weight);

// Dark replacements, keyed by the light colour name they replace.
const surfaces = { white: CARD, black: null };
const texts = { black: FOREGROUND };
const borders = { white: null };

for (const g of GRAYS) {
  Object.assign(surfaces, {
    [`${g}-50`]: BACKGROUND,
    [`${g}-100`]: tint(g, 400, 0.08),
    [`${g}-200`]: tint(g, 400, 0.14),
    [`${g}-300`]: tint(g, 400, 0.22),
  });
  Object.assign(texts, {
    [`${g}-950`]: FOREGROUND,
    [`${g}-900`]: FOREGROUND,
    [`${g}-800`]: FOREGROUND,
    [`${g}-700`]: rgb(colors[g][200]),
    [`${g}-600`]: rgb(colors[g][300]),
    [`${g}-500`]: rgb(colors[g][400]),
  });
  Object.assign(borders, {
    [`${g}-50`]: BORDER,
    [`${g}-100`]: BORDER,
    [`${g}-200`]: BORDER,
    [`${g}-300`]: tint(g, 400, 0.3),
  });
}

for (const h of HUES) {
  Object.assign(surfaces, {
    [`${h}-50`]: tint(h, 500, 0.1),
    [`${h}-100`]: tint(h, 500, 0.16),
    [`${h}-200`]: tint(h, 500, 0.24),
    [`${h}-300`]: tint(h, 500, 0.34),
  });
  Object.assign(texts, {
    [`${h}-950`]: rgb(colors[h][200]),
    [`${h}-900`]: rgb(colors[h][200]),
    [`${h}-800`]: rgb(colors[h][200]),
    [`${h}-700`]: rgb(colors[h][300]),
    [`${h}-600`]: rgb(colors[h][300]),
    [`${h}-500`]: rgb(colors[h][400]),
  });
  Object.assign(borders, {
    [`${h}-50`]: tint(h, 500, 0.3),
    [`${h}-100`]: tint(h, 500, 0.3),
    [`${h}-200`]: tint(h, 500, 0.3),
    [`${h}-300`]: tint(h, 500, 0.45),
  });
}

const esc = (cls) => cls.replace(/\//g, '\\/');
const color = (c, alpha) => `rgb(${c.join(' ')} / ${alpha})`;

module.exports = plugin(({ addUtilities }) => {
  const rules = {};
  const add = (cls, decl) => { rules[`:where(.dark) .${esc(cls)}`] = decl; };

  // Each entry: utility prefix, colour map, and how to build the declaration.
  const utilities = [
    ['bg', surfaces, (c, a) => ({ 'background-color': color(c, a ?? 'var(--tw-bg-opacity, 1)') })],
    ['text', texts, (c, a) => ({ color: color(c, a ?? 'var(--tw-text-opacity, 1)') })],
    ['border', borders, (c, a) => ({ 'border-color': color(c, a ?? 'var(--tw-border-opacity, 1)') })],
    ['ring', { ...borders, white: CARD }, (c, a) => ({ '--tw-ring-color': color(c, a ?? 'var(--tw-ring-opacity, 1)') })],
    // Only the stop colour is replaced, so a following core `to-*` or `via-*` still applies.
    ['from', surfaces, (c, a) => ({ '--tw-gradient-from': `${color(c, a ?? 1)} var(--tw-gradient-from-position)` })],
    ['via', surfaces, (c, a) => ({
      '--tw-gradient-stops': `var(--tw-gradient-from), ${color(c, a ?? 1)} var(--tw-gradient-via-position), var(--tw-gradient-to)`,
    })],
    ['to', surfaces, (c, a) => ({ '--tw-gradient-to': `${color(c, a ?? 1)} var(--tw-gradient-to-position)` })],
  ];

  for (const [prefix, map, build] of utilities) {
    for (const [name, c] of Object.entries(map)) {
      if (!c) continue;
      add(`${prefix}-${name}`, build(c));
      for (const o of OPACITIES) {
        // Faint white overlays are glass effects on already-dark screens; leave them.
        if (name === 'white' && o < 40) continue;
        add(`${prefix}-${name}/${o}`, build(c, o / 100));
      }
    }
  }

  addUtilities(rules);
});
