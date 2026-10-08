#!/usr/bin/env node
/**
 * Builds the print-ready INTERIOR and COVER PDFs for the "Healing Mandalas"
 * children's coloring book (Amazon KDP paperback, 8.5 x 11 in, black & white
 * interior, no bleed; full-colour wrap cover).
 *
 * Usage: node scripts/mandala-book/build-book.mjs
 *
 * Output (scripts/mandala-book/out/, git-ignored):
 *   healing-mandalas-interior.pdf   upload this as the KDP manuscript
 *   healing-mandalas-cover.pdf      upload this as the KDP cover (back + spine + front)
 *   cover-preview.png               the cover with trim/safe/spine/barcode guides drawn on
 *   contact-sheet.png               every design on one sheet, for review
 *   designs/NN-<family>.svg         each design on its own, for reuse
 *   book.html                       the page source the PDF is printed from
 *
 * Needs Google Chrome or Microsoft Edge (set CHROME_PATH if it isn't found).
 * Text is set in Fredoka (SIL Open Font License, fine for commercial print),
 * embedded from ./fonts - see OFL.txt there.
 *
 * Layout follows KDP's paperback guidelines: every design is on a right-hand
 * page with a blank back so markers don't bleed through onto the next design,
 * all artwork stays well inside the margins (>= 0.85 in from every edge), and
 * the page count is even. Edit BOOK, DESIGNS or the page text below and re-run.
 */
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { renderSvg } from './geometry.mjs';
import { coverHtml, coverSize } from './cover.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'out');
const run = promisify(execFile);

// ── Book details - edit before publishing ───────────────────────────────────
const BOOK = {
  title: 'Healing Mandalas',
  subtitle: 'A Gentle Coloring Book for Children with Big Feelings',
  // Signs the title page in place of an author name. Warm alternatives:
  //   'From Your Well-Wisher'
  //   'Made with love, by someone cheering you on'
  //   'For you, from a friend who understands'
  byline: 'With a hug, from a friend you haven’t met yet',
  // Publisher / rights holder, shown with the logo on the title and copyright pages.
  imprint: {
    short: 'GLSP',
    full: 'Grief Literacy and Support Platform',
    logo: join(__dirname, '..', '..', 'client', 'public', 'mandala.png'),
  },
  year: new Date().getFullYear(),
  website: '', // optional, e.g. 'www.example.com' - printed on the grown-ups page
  paper: 'white', // 'white' or 'cream' - must match the paper chosen in KDP (sets the spine width)
  isbn: '9798178110515', // free KDP ISBN for the paperback (each format needs its own)
};

// ── The designs, simple → detailed, each with a gentle prompt ──────────────
const DESIGNS = [
  // Simple: big shapes, thick lines
  ['simple', 'lotus', { rings: 1, petals: 8 }, 'Color this flower with your very favorite colors.'],
  ['simple', 'hearts', { n: 6 }, 'Which color feels like a warm hug? Use it here.'],
  ['simple', 'petalRings', { rings: 2, petals: 8 }, 'There is no wrong way to color. Every choice is yours.'],
  ['simple', 'sunAndStars', { rays: 6, stars: 6 }, 'Think of a sunny day you spent together. What colors do you see?'],
  ['simple', 'waterDroplets', { n: 6 }, 'Tears are a bit like rain. They help us feel lighter. It’s okay to cry.'],
  ['simple', 'dotMandala', { inner: 1, petals: 8, outer: 1, flameDots: false }, 'Breathe in slowly… and out. Color one shape with each breath.'],
  ['simple', 'geometric', { n: 6, bands: 1 }, 'Start in the middle and color outward, like ripples in a pond.'],
  ['simple', 'traditionalFloral', { petals: 8, layers: 1, scallops: 8, scallopR: 11 }, 'Color this one for someone you miss.'],
  ['simple', 'shamrocks', { n: 6 }, 'A shamrock has three leaves. Color one for someone who loves you, one for a friend, and one for you.'],
  ['simple', 'lotus', { rings: 2, petals: 6 }, 'Think of someone special, a person or a pet. What color reminds you of them?'],
  ['simple', 'paws', { n: 5 }, 'Did you love a furry, feathery or scaly friend? Color this one for them.'],
  ['simple', 'petalRings', { rings: 3, petals: 6 }, 'If your feeling today were a color, which one would it be?'],
  // Medium
  ['medium', 'traditionalFloral', { petals: 10, layers: 2, scallops: 10, scallopR: 9 }, 'It’s okay to feel many things. Try a different color for each feeling.'],
  ['medium', 'lotus', { rings: 2, petals: 10 }, 'Color a petal for every person who loves you.'],
  ['medium', 'waterDroplets', { n: 8, detail: true }, 'Rain helps flowers grow. What helps you feel better when things are hard?'],
  ['medium', 'dotMandala', { inner: 2, petals: 12, outer: 1 }, 'Some days feel stormy and some feel sunny. What does today feel like?'],
  ['medium', 'sunAndStars', { rays: 10, stars: 10 }, 'Color this sun for the warm memories you carry with you.'],
  ['medium', 'fibonacci', { seeds: 110, spirals: [8, 13], petals: 21 }, 'Sunflower seeds grow in secret spirals, 8 one way and 13 the other. Can you color one spiral?'],
  ['medium', 'hearts', { n: 8, detail: true }, 'Missing someone shows how much you love them.'],
  ['medium', 'geometric', { n: 8, bands: 2 }, 'Choose three calm colors and use only those.'],
  ['medium', 'petalRings', { rings: 4, petals: 10 }, 'Wiggly day? Color one ring, stretch like a cat, then color the next.'],
  ['medium', 'lotusBlooms', { n: 6 }, 'A lotus grows up through muddy water and still blooms. You can grow through hard days too.'],
  ['medium', 'traditionalFloral', { petals: 12, layers: 3 }, 'Think of something kind someone did for you.'],
  ['medium', 'lotus', { rings: 3, petals: 10 }, 'You can take a break anytime. Your mandala will wait for you.'],
  ['medium', 'paws', { n: 8, detail: true }, 'Remember a place you went together. Color it with those colors.'],
  // Detailed
  ['detailed', 'traditionalFloral', { petals: 16, layers: 4 }, 'Try coloring slowly, noticing each little shape.'],
  ['detailed', 'geometric', { n: 12, bands: 3 }, 'Sad and happy can live together. Use a color for each.'],
  ['detailed', 'fibonacci', { seeds: 260, spirals: [13, 21], petals: 34, detail: true }, 'Nature loves the numbers 1, 1, 2, 3, 5, 8, 13, 21… Add the last two to find the next one!'],
  ['detailed', 'lotus', { rings: 3, petals: 14, veins: true }, 'Make every petal different, just like every memory.'],
  ['detailed', 'hearts', { n: 10, detail: true }, 'What would you like to tell them? Think it while you color.'],
  ['detailed', 'lotusBlooms', { n: 8, detail: true }, 'Color each flower for something that helps you feel calm.'],
  ['detailed', 'petalRings', { rings: 6, petals: 16 }, 'Color the outside first, then move to the middle, like coming home.'],
  ['detailed', 'sunAndStars', { rays: 14, stars: 14, detail: true }, 'Color a star for a wish you have.'],
  ['detailed', 'dotMandala', { inner: 3, petals: 18, outer: 2 }, 'Color this one together with someone you trust.'],
  ['detailed', 'shamrocks', { n: 9, detail: true }, 'Can you find the one four-leaf clover hiding in this mandala?'],
  ['detailed', 'traditionalFloral', { petals: 18, layers: 6 }, 'Notice how you feel now. Is it different from when you started?'],
  ['detailed', 'geometric', { n: 16, bands: 3 }, 'Every shape you color is a small moment of calm.'],
  ['detailed', 'lotus', { rings: 4, petals: 16, veins: true }, 'Look how far you have come. This last one is all yours.'],
];

const ART_IN = 6.8; // printed width of each design, inches
const LEVEL_DOTS = { simple: 1, medium: 2, detailed: 3 };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ── Pages ───────────────────────────────────────────────────────────────────
const blank = (note = '') => `<section class="page blank">${note ? `<p class="blank-note">${note}</p>` : ''}</section>`;

function titlePage() {
  return `<section class="page title">
    <h1>${esc(BOOK.title)}</h1>
    <p class="subtitle">${esc(BOOK.subtitle)}</p>
    <div class="title-art">${renderSvg('lotus', { rings: 2, petals: 8 }, 'simple', 3.6)}</div>
    <p class="byline">${esc(BOOK.byline)}</p>
    <div class="imprint"><img src="${LOGO}" alt=""><span>${esc(BOOK.imprint.short)}</span></div>
  </section>`;
}

function copyrightPage() {
  return `<section class="page copyright"><div class="small-print">
    <p>${esc(BOOK.title)}: ${esc(BOOK.subtitle)}</p>
    <p class="publisher"><img src="${LOGO}" alt=""> Published by ${esc(BOOK.imprint.short)}, ${esc(BOOK.imprint.full)}</p>
    <p>Copyright © ${BOOK.year} ${esc(BOOK.imprint.short)} (${esc(BOOK.imprint.full)}). All rights reserved.</p>
    <p>No part of this book may be reproduced in any form without written permission from the publisher,
    except that families, teachers and counselors may copy individual pages for a child in their care.</p>
    <p>This book offers creative activities. It is not a treatment for grief, anxiety, ADHD or any
    other condition, and is not a substitute for professional medical, psychological or counseling support.</p>
    <p>ISBN: ${BOOK.isbn || '____________________'}</p>
  </div></section>`;
}

function belongsToPage() {
  return `<section class="page belongs">
    <div class="belongs-art">${renderSvg('hearts', { n: 6 }, 'simple', 3.2)}</div>
    <h2>This book belongs to</h2>
    <div class="write-line"></div>
  </section>`;
}

function grownUpsPage() {
  return `<section class="page prose">
    <h2>For grown-ups</h2>
    <p>Children carry big feelings in small bodies. This book is for any child who needs a quiet moment
    with them: a child missing a family member, a friend or a beloved pet, a child going through a big
    change, or a child whose busy mind finds it hard to settle.</p>
    <p>Coloring a mandala, a circle pattern that repeats around a center, can be a calm, hands-busy way
    to spend time with those feelings. There are no right or wrong colors, and nothing has to be finished.</p>
    <h3>Ways to use this book</h3>
    <ul>
      <li><strong>Color alongside your child.</strong> Quiet company often makes it easier to talk, or simply to be together.</li>
      <li><strong>Treat the prompts as invitations, not tasks.</strong> Skip any that don’t fit today.</li>
      <li><strong>Let your child lead.</strong> Some children talk about who they miss while they color; others just color. Both are okay.</li>
      <li><strong>Keep it short for busy minds.</strong> One ring or one page is plenty. The early designs are quick to finish, which many restless children enjoy.</li>
      <li><strong>Pick any page.</strong> The designs start simple and become more detailed, so younger children may enjoy the early pages most.</li>
      <li><strong>Protect the next page.</strong> Every design has a blank back, but slip a sheet of paper behind the page when using markers.</li>
    </ul>
    <p>Coloring is a gentle creative activity, not a treatment for grief, anxiety or ADHD. Feelings come
    and go, and it’s normal for a child to seem fine one day and upset the next. If you are worried about
    how your child is coping, please talk to your pediatrician, a school counselor or a children’s grief
    support service.</p>
    ${BOOK.website ? `<p class="web">More gentle activities: ${esc(BOOK.website)}</p>` : ''}
  </section>`;
}

function helloPage() {
  return `<section class="page prose hello">
    <h2>Hello!</h2>
    <p>This is your book of mandalas. A mandala is a circle picture with shapes that go around
    and around, like petals on a flower.</p>
    <p>You can color them any way you like. Use lots of colors or just one. Stay inside the lines
    or don’t. Start anywhere you want.</p>
    <p>Under each mandala there is a little idea to think about while you color. You can use it,
    or you can skip it.</p>
    <p>Maybe you are missing someone, a person or a pet. Maybe your body feels wiggly today. If you feel
    sad, happy, angry, or a mix of everything, that’s okay. All feelings are welcome here.</p>
    <p>You can take a break whenever you need one. Your mandalas will wait for you.</p>
    <div class="hello-art">${renderSvg('sunAndStars', { rays: 6, stars: 6 }, 'simple', 2.3)}</div>
  </section>`;
}

function designPage([level, family, params, prompt], i) {
  const dots = Array.from({ length: 3 }, (_, k) => `<span class="dot${k < LEVEL_DOTS[level] ? ' on' : ''}"></span>`).join('');
  return `<section class="page design">
    <div class="art">${renderSvg(family, params, level, ART_IN)}</div>
    <p class="prompt">${esc(prompt)}</p>
    <p class="folio"><span class="level" title="${level}">${dots}</span>${i + 1}</p>
  </section>`;
}

function certificatePage() {
  return `<section class="page certificate">
    <div class="cert-art">${renderSvg('lotus', { rings: 3, petals: 12, veins: true }, 'medium', 4.2)}</div>
    <h2>I colored my whole<br>Healing Mandala book!</h2>
    <p class="cert-line">Name</p><div class="write-line"></div>
    <p class="cert-line">Date</p><div class="write-line"></div>
    <p class="cert-note">Be proud of yourself. You took time for your feelings,<br>and that is a brave and caring thing to do.</p>
  </section>`;
}

let LOGO = '';

function buildPages() {
  const pages = [titlePage(), copyrightPage(), belongsToPage(), blank(), grownUpsPage(), blank(), helloPage(), blank()];
  DESIGNS.forEach((d, i) => {
    pages.push(designPage(d, i));
    pages.push(blank('This page is blank on purpose, so your colors won’t show through.'));
  });
  pages.push(certificatePage(), blank());
  if (pages.length % 2) pages.push(blank());
  return pages;
}

// ── Font ────────────────────────────────────────────────────────────────────
// Static (single-weight) instances of Fredoka, cut from Google's variable font
// with fontTools and kept in ./fonts with the font's OFL licence. Chrome embeds
// variable fonts in PDFs as Type 3 glyph drawings, which some printers reject;
// static TrueType fonts embed as ordinary fonts.
const FONT_FILES = { 400: 'Fredoka-Regular.ttf', 500: 'Fredoka-Medium.ttf', 600: 'Fredoka-SemiBold.ttf' };

async function loadFontCss() {
  let css = '';
  for (const [weight, file] of Object.entries(FONT_FILES)) {
    const path = join(__dirname, 'fonts', file);
    if (!existsSync(path)) {
      console.warn(`  ! ${file} missing; using a system font instead.`);
      return '';
    }
    const data = (await readFile(path)).toString('base64');
    css += `@font-face{font-family:'Fredoka';font-weight:${weight};font-style:normal;src:url(data:font/ttf;base64,${data}) format('truetype');}\n`;
  }
  return css;
}

const CSS = `
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Fredoka', 'Trebuchet MS', 'Segoe UI', sans-serif; color: #000; }
.page { width: 8.5in; height: 11in; position: relative; overflow: hidden; break-after: page; }
.page:last-child { break-after: auto; }
svg { display: block; }

.title { text-align: center; padding: 1.6in 1in 0; }
.title h1 { font-size: 46pt; font-weight: 600; margin: 0; letter-spacing: 0.5pt; }
.title .subtitle { font-size: 18pt; margin: 0.18in auto 0; max-width: 6in; line-height: 1.3; text-wrap: balance; }
.title-art { display: flex; justify-content: center; margin-top: 0.75in; }
.title .byline { position: absolute; left: 1in; right: 1in; bottom: 1.75in; font-size: 16pt; margin: 0; text-wrap: balance; }
.title .imprint { position: absolute; left: 0; right: 0; bottom: 0.8in; display: flex; justify-content: center; align-items: center; gap: 8pt; font-size: 13pt; font-weight: 600; letter-spacing: 1.5pt; }
.imprint img, .publisher img { filter: grayscale(1) contrast(1.15); }
.title .imprint img { width: 0.5in; height: 0.5in; }
.copyright .publisher { display: flex; align-items: center; gap: 7pt; font-weight: 500; }
.copyright .publisher img { width: 0.38in; height: 0.38in; }

.copyright .small-print { position: absolute; left: 1in; right: 1in; bottom: 1in; font-size: 9.5pt; line-height: 1.45; }
.copyright .small-print p { margin: 0 0 0.1in; }

.belongs { text-align: center; padding-top: 1.7in; }
.belongs-art { display: flex; justify-content: center; }
.belongs h2 { font-size: 28pt; font-weight: 500; margin: 0.55in 0 0.7in; }
.write-line { width: 5in; margin: 0 auto; border-bottom: 2pt solid #000; height: 0.45in; }

.prose { padding: 0.9in 1.05in; font-size: 13pt; line-height: 1.48; }
.prose h2 { font-size: 28pt; font-weight: 600; margin: 0 0 0.25in; }
.prose h3 { font-size: 16pt; font-weight: 600; margin: 0.25in 0 0.08in; }
.prose p { margin: 0 0 0.16in; }
.prose ul { margin: 0 0 0.2in; padding-left: 0.28in; }
.prose li { margin-bottom: 0.1in; }
.prose strong { font-weight: 600; }
.prose .web { margin-top: 0.3in; font-weight: 500; }
.hello { font-size: 16pt; line-height: 1.5; }
.hello-art { position: absolute; bottom: 1in; left: 0; right: 0; display: flex; justify-content: center; }

.design .art { position: absolute; top: 0.95in; left: ${(8.5 - ART_IN) / 2}in; }
.design .prompt { position: absolute; top: 8.12in; left: 1.1in; right: 1.1in; margin: 0; text-align: center; font-size: 17pt; line-height: 1.35; text-wrap: balance; }
.design .folio { position: absolute; left: 0; right: 0; bottom: 0.7in; margin: 0; text-align: center; font-size: 10pt; color: #555; }
.level { display: inline-flex; gap: 3pt; margin-right: 8pt; vertical-align: 1pt; }
.dot { width: 6pt; height: 6pt; border-radius: 50%; border: 0.8pt solid #555; display: inline-block; }
.dot.on { background: #555; }

.blank-note { position: absolute; left: 0; right: 0; bottom: 0.8in; margin: 0; text-align: center; font-size: 9pt; color: #777; }

.certificate { text-align: center; padding-top: 1in; }
.cert-art { display: flex; justify-content: center; }
.certificate h2 { font-size: 26pt; font-weight: 600; line-height: 1.25; margin: 0.45in 0 0.35in; }
.cert-line { font-size: 13pt; margin: 0.2in 0 0; color: #333; }
.cert-note { font-size: 13pt; line-height: 1.5; margin-top: 0.45in; }
`;

// ── Chrome ──────────────────────────────────────────────────────────────────
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome/Edge not found. Set CHROME_PATH to your browser executable.');
  return found;
}

async function chrome(args, url) {
  const profile = join(tmpdir(), `mandala-book-chrome-${process.pid}`);
  try {
    await run(findChrome(), ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`,
      '--virtual-time-budget=10000', ...args, url], { timeout: 180000 });
  } finally {
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

// ── Build ───────────────────────────────────────────────────────────────────
async function main() {
  await mkdir(join(OUT_DIR, 'designs'), { recursive: true });
  const fontCss = await loadFontCss();
  LOGO = `data:image/png;base64,${(await readFile(BOOK.imprint.logo)).toString('base64')}`;

  const pages = buildPages();
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(BOOK.title)}</title>
    <style>${fontCss}${CSS}</style></head><body>${pages.join('\n')}</body></html>`;
  const htmlPath = join(OUT_DIR, 'book.html');
  await writeFile(htmlPath, html);

  await Promise.all(DESIGNS.map(([level, family, params], i) =>
    writeFile(join(OUT_DIR, 'designs', `${String(i + 1).padStart(2, '0')}-${family}.svg`), renderSvg(family, params, level, ART_IN))));

  const pdfPath = join(OUT_DIR, 'healing-mandalas-interior.pdf');
  console.log(`Printing ${pages.length} pages to PDF…`);
  await chrome(['--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`], pathToFileURL(htmlPath).href);

  // Review sheet: every design at a glance.
  const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
    body{margin:0;padding:24px;font-family:'Fredoka',sans-serif;background:#fff}
    .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
    figure{margin:0;text-align:center;font-size:13px}svg{width:100%;height:auto}</style></head><body><div class="grid">
    ${DESIGNS.map(([level, family, params], i) => `<figure>${renderSvg(family, params, level, ART_IN)}<figcaption>${i + 1}. ${family} · ${level}</figcaption></figure>`).join('')}
    </div></body></html>`;
  const sheetPath = join(OUT_DIR, 'contact-sheet.html');
  await writeFile(sheetPath, sheet);
  await chrome(['--hide-scrollbars', `--window-size=1800,${Math.ceil(DESIGNS.length / 6) * 312 + 60}`, `--screenshot=${join(OUT_DIR, 'contact-sheet.png')}`], pathToFileURL(sheetPath).href);

  // Sanity-check the PDF against KDP basics.
  const pdf = await readFile(pdfPath, 'latin1');
  const pageCount = (pdf.match(/\/Type\s*\/Page(?!s)/g) || []).length;
  const boxes = [...new Set((pdf.match(/\/MediaBox\s*\[[^\]]+\]/g) || []).map((b) => b.replace(/\s+/g, ' ')))];
  console.log(`Done: ${pdfPath}`);
  console.log(`  pages: ${pageCount} (${pageCount % 2 ? 'ODD - KDP expects an even count' : 'even'}; KDP minimum is 24)`);
  console.log(`  page size: ${boxes.join(', ')} (8.5 x 11 in = 612 x 792 pt)`);
  console.log(`  fonts: ${fontCss ? 'Fredoka (embedded)' : 'system fallback'}`);
  console.log(`  review sheet: ${join(OUT_DIR, 'contact-sheet.png')}`);

  // ── Cover: back + spine + front, sized from the interior's page count ──
  const coverArgs = { book: BOOK, pageCount, paper: BOOK.paper, fontCss, logo: LOGO, designCount: DESIGNS.length };
  const { spine, width, height } = coverSize(pageCount, BOOK.paper);
  const coverPath = join(OUT_DIR, 'cover.html');
  await writeFile(coverPath, coverHtml(coverArgs));
  const coverPdf = join(OUT_DIR, 'healing-mandalas-cover.pdf');
  await chrome(['--no-pdf-header-footer', `--print-to-pdf=${coverPdf}`], pathToFileURL(coverPath).href);
  // Preview with trim, safe-area, spine and barcode guides drawn on (not in the PDF).
  const guidesPath = join(OUT_DIR, 'cover-guides.html');
  await writeFile(guidesPath, coverHtml({ ...coverArgs, guides: true }));
  await chrome(['--hide-scrollbars', `--window-size=${Math.ceil(width * 96)},${Math.ceil(height * 96)}`,
    `--screenshot=${join(OUT_DIR, 'cover-preview.png')}`], pathToFileURL(guidesPath).href);

  const cover = await readFile(coverPdf, 'latin1');
  const coverPages = (cover.match(/\/Type\s*\/Page(?!s)/g) || []).length;
  const coverBox = (cover.match(/\/MediaBox\s*\[[^\]]+\]/) || ['?'])[0].replace(/\s+/g, ' ');
  console.log(`Done: ${coverPdf}`);
  console.log(`  ${coverPages} page, ${width.toFixed(3)} x ${height.toFixed(3)} in (${(width * 72).toFixed(1)} x ${(height * 72).toFixed(1)} pt), got ${coverBox}`);
  console.log(`  spine: ${spine.toFixed(3)} in for ${pageCount} pages on ${BOOK.paper} paper`);
  console.log(`  preview with guides: ${join(OUT_DIR, 'cover-preview.png')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
