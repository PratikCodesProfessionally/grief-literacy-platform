/**
 * Full-wrap paperback cover (back + spine + front) for Amazon KDP.
 *
 * Geometry follows KDP's cover rules: 0.125 in bleed on every outside edge,
 * spine width derived from the interior page count and paper, text kept at
 * least 0.25 in inside the trim, and the bottom-right of the back cover left
 * clear for the barcode KDP prints there. The spine carries no text or
 * separate colour: at ~0.2 in it is too thin, and the background simply runs
 * across it so small binding shifts don't show.
 *
 * The front mandala is coloured in the browser just before printing, only on
 * its left half, so the cover shows at a glance that this is a coloring book.
 */
import { renderSvg } from './geometry.mjs';

export const TRIM = { w: 8.5, h: 11 };
export const BLEED = 0.125;
/** KDP spine width per page, inches. */
const PAGE_THICKNESS = { white: 0.002252, cream: 0.0025 };
const SAFE = 0.25; // text inset from the trim edge
const BARCODE = { w: 2, h: 1.2, inset: 0.25 };

export function coverSize(pageCount, paper = 'white') {
  const spine = pageCount * PAGE_THICKNESS[paper];
  return { spine, width: 2 * BLEED + 2 * TRIM.w + spine, height: 2 * BLEED + TRIM.h };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inch = (n) => `${Math.round(n * 10000) / 10000}in`;

/** Softly coloured palette, by ring from the centre outward. */
const RING_COLORS = ['#FDE68A', '#F9A8D4', '#C4B5FD', '#93C5FD', '#6EE7B7', '#FDBA74', '#F0ABFC', '#A5B4FC', '#FCA5A5', '#99F6E4'];

// Runs in the browser before printing: colours shapes on the left half of the
// front mandala by their distance from the centre, so matching rings match.
const COLORIZE = `
(() => {
  const colors = ${JSON.stringify(RING_COLORS)};
  for (const svg of document.querySelectorAll('.colorize svg')) {
    const box = svg.getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2, R = box.width / 2;
    for (const el of svg.querySelectorAll('path:not(.n), circle:not(.n), ellipse, polygon:not(.n)')) {
      if (el.closest('clipPath')) continue;
      const b = el.getBoundingClientRect();
      const x = b.left + b.width / 2, y = b.top + b.height / 2;
      const d = Math.hypot(x - cx, y - cy) / R;
      const size = b.width / 2 / R;
      if (d < 0.02) {
        // Centred shapes: colour the small middle, keep the big background discs white.
        if (size < 0.2) el.style.fill = colors[0];
        continue;
      }
      if (x < cx - 1) el.style.fill = colors[Math.min(colors.length - 1, Math.floor(d * 10))];
    }
  }
})();`;

export function coverHtml({ book, pageCount, paper = 'white', fontCss, logo, designCount, guides = false }) {
  const { spine, width, height } = coverSize(pageCount, paper);
  const backLeft = BLEED;
  const frontLeft = BLEED + TRIM.w + spine;
  const thumbs = [
    ['paws', { n: 8, detail: true }, 'medium'],
    ['fibonacci', { seeds: 110, spirals: [8, 13], petals: 21 }, 'medium'],
    ['lotusBlooms', { n: 6 }, 'medium'],
  ];

  const guideLayer = !guides ? '' : `
    <div class="g trim" style="left:${inch(BLEED)};top:${inch(BLEED)};width:${inch(width - 2 * BLEED)};height:${inch(TRIM.h)}"></div>
    <div class="g safe" style="left:${inch(BLEED + SAFE)};top:${inch(BLEED + SAFE)};width:${inch(TRIM.w - 2 * SAFE)};height:${inch(TRIM.h - 2 * SAFE)}"></div>
    <div class="g safe" style="left:${inch(frontLeft + SAFE)};top:${inch(BLEED + SAFE)};width:${inch(TRIM.w - 2 * SAFE)};height:${inch(TRIM.h - 2 * SAFE)}"></div>
    <div class="g spine" style="left:${inch(BLEED + TRIM.w)};top:0;width:${inch(spine)};height:${inch(height)}"></div>
    <div class="g barcode" style="left:${inch(backLeft + TRIM.w - BARCODE.inset - BARCODE.w)};top:${inch(BLEED + TRIM.h - BARCODE.inset - BARCODE.h)};width:${inch(BARCODE.w)};height:${inch(BARCODE.h)}"><span>KDP barcode area</span></div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(book.title)} cover</title><style>
${fontCss}
@page { size: ${inch(width)} ${inch(height)}; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Fredoka', 'Trebuchet MS', 'Segoe UI', sans-serif; color: #1F2937; }
svg { display: block; }
.cover { position: relative; width: ${inch(width)}; height: ${inch(height)}; overflow: hidden;
  background:
    radial-gradient(circle at 78% 18%, rgba(244, 114, 182, 0.22), transparent 38%),
    radial-gradient(circle at 20% 85%, rgba(167, 139, 250, 0.25), transparent 40%),
    radial-gradient(circle at 70% 80%, rgba(45, 212, 191, 0.16), transparent 35%),
    linear-gradient(135deg, #FDF2F8 0%, #F5F3FF 50%, #ECFEFF 100%); }
.panel { position: absolute; top: ${inch(BLEED)}; width: ${inch(TRIM.w)}; height: ${inch(TRIM.h)}; }
.watermark { position: absolute; opacity: 0.12; }

/* Front */
.front { left: ${inch(frontLeft)}; text-align: center; }
.front h1 { margin: 0 auto; max-width: 6.8in; text-wrap: balance; padding-top: 0.62in; font-size: 70pt; line-height: 0.98; font-weight: 600; color: #4C1D95; letter-spacing: 0.5pt; }
.front .subtitle { margin: 0.18in auto 0; max-width: 6.6in; font-size: 20pt; line-height: 1.25; color: #6B21A8; text-wrap: balance; }
.front .art { position: absolute; left: 50%; top: 3.62in; transform: translateX(-50%); width: 4.98in; height: 4.98in;
  border-radius: 50%; background: #fff; box-shadow: 0 0.06in 0.35in rgba(76, 29, 149, 0.18); padding: 0.12in; }
.front .badge { position: absolute; left: 0; right: 0; top: 8.85in; }
.front .badge span { display: inline-block; padding: 0.07in 0.22in; border-radius: 999px; background: #fff;
  border: 1.5pt solid #C4B5FD; color: #5B21B6; font-size: 14pt; font-weight: 500; }
.front .byline { position: absolute; left: 0.6in; right: 0.6in; top: 9.5in; margin: 0; font-size: 15pt; color: #4B5563; text-wrap: balance; }
.front .imprint { position: absolute; left: 0; right: 0; top: 10.1in; display: flex; justify-content: center; align-items: center;
  gap: 7pt; font-size: 13pt; font-weight: 600; letter-spacing: 1.5pt; color: #4C1D95; }
.front .imprint img { width: 0.44in; height: 0.44in; }

/* Back */
.back { left: ${inch(backLeft)}; padding: 0.8in 0.75in 0; }
.back h2 { margin: 0 0 0.24in; font-size: 31pt; font-weight: 600; color: #4C1D95; line-height: 1.1; }
.back p { margin: 0 0 0.17in; font-size: 14.5pt; line-height: 1.45; text-wrap: pretty; }
.back h3 { margin: 0.26in 0 0.12in; font-size: 17pt; font-weight: 600; color: #6B21A8; }
.back ul { list-style: none; margin: 0; padding: 0; font-size: 14pt; line-height: 1.4; }
.back li { position: relative; padding-left: 0.28in; margin-bottom: 0.1in; }
.back li::before { content: ''; position: absolute; left: 0.02in; top: 0.08in; width: 0.12in; height: 0.12in; border-radius: 50%; }
.back li:nth-child(5n+1)::before { background: #F472B6; }
.back li:nth-child(5n+2)::before { background: #A78BFA; }
.back li:nth-child(5n+3)::before { background: #60A5FA; }
.back li:nth-child(5n+4)::before { background: #34D399; }
.back li:nth-child(5n+5)::before { background: #FBBF24; }
.back .thumbs { display: flex; justify-content: space-between; margin: 0.42in 0 0.32in; }
.back .thumbs div { width: 2.22in; height: 2.22in; border-radius: 0.18in; background: #fff; padding: 0.14in;
  box-shadow: 0 0.03in 0.16in rgba(76, 29, 149, 0.14); }
.back .closing { font-style: italic; color: #5B21B6; text-align: center; font-size: 15pt; }
.back .imprint { position: absolute; left: 0.75in; bottom: 0.45in; width: 4.9in; display: flex; gap: 0.12in; align-items: center; }
.back .imprint img { width: 0.62in; height: 0.62in; flex: none; }
.back .imprint div { font-size: 10pt; line-height: 1.35; color: #4B5563; }
.back .imprint strong { font-size: 12.5pt; color: #4C1D95; font-weight: 600; letter-spacing: 1pt; }
.back .ages { position: absolute; left: 0.75in; bottom: 1.3in; font-size: 11pt; font-weight: 600; color: #fff;
  background: #7C3AED; border-radius: 999px; padding: 0.04in 0.16in; }

/* Review guides (preview only, never in the PDF) */
.g { position: absolute; pointer-events: none; }
.g.trim { outline: 1px dashed #DC2626; }
.g.safe { outline: 1px dotted #2563EB; }
.g.spine { background: rgba(220, 38, 38, 0.12); outline: 1px solid rgba(220, 38, 38, 0.6); }
.g.barcode { background: rgba(255, 255, 255, 0.7); outline: 1px dashed #111; display: flex; align-items: center; justify-content: center; font: 11px sans-serif; }
</style></head><body>
<div class="cover">
  <!-- Faint line-art corners; each stays on its own panel, clear of the spine and barcode. -->
  <div class="watermark" style="left:${inch(-1.9)};top:${inch(-1.9)}">${renderSvg('lotus', { rings: 3, petals: 12 }, 'medium', 4.6, { stroke: '#6D28D9' })}</div>
  <div class="watermark" style="left:${inch(frontLeft + TRIM.w - 2.3)};top:${inch(height - 2.3)}">${renderSvg('geometric', { n: 12, bands: 3 }, 'medium', 4.4, { stroke: '#6D28D9' })}</div>

  <section class="panel back">
    <h2>A quiet moment for big feelings</h2>
    <p>Missing someone you love, whether a grandparent, a friend or a beloved pet, can make a child’s
    world feel very big. So can a busy mind that finds it hard to settle.</p>
    <p><em>${esc(book.title)}</em> offers a gentle place to start: ${designCount} circle patterns to color slowly,
    one shape at a time, with no right or wrong way to do it.</p>
    <h3>Inside you’ll find</h3>
    <ul>
      <li>${designCount} mandalas that grow from simple to detailed</li>
      <li>Flowers, hearts, paw prints, raindrops, shamrocks and a Fibonacci sunflower</li>
      <li>A gentle idea to think about on every page</li>
      <li>One design per page, with blank backs so markers won’t spoil the next design</li>
      <li>A note for grown-ups and a certificate to celebrate finishing</li>
    </ul>
    <div class="thumbs">${thumbs.map(([f, p, l]) => `<div>${renderSvg(f, p, l, 1.94)}</div>`).join('')}</div>
    <p class="closing">Color alone or together. Take breaks. Every feeling is welcome here.</p>
    <span class="ages">Ages 4+</span>
    <div class="imprint"><img src="${logo}" alt=""><div><strong>${esc(book.imprint.short)}</strong><br>${esc(book.imprint.full)}<br>
      A creative activity book, not a substitute for professional support.</div></div>
  </section>

  <section class="panel front">
    <h1>${esc(book.title)}</h1>
    <p class="subtitle">${esc(book.subtitle)}</p>
    <div class="art colorize">${renderSvg('lotus', { rings: 3, petals: 12, veins: true }, 'medium', 4.74, { stroke: '#3B2F4A' })}</div>
    <p class="badge"><span>${designCount} calming designs · simple to detailed</span></p>
    <p class="byline">${esc(book.byline)}</p>
    <div class="imprint"><img src="${logo}" alt=""><span>${esc(book.imprint.short)}</span></div>
  </section>
  ${guideLayer}
</div>
<script>${COLORIZE}</script>
</body></html>`;
}
