// Generates the desktop (1920x1080) and mobile (1080x1920) Sarani films from one
// timeline. Timing is shared; only layout and type scale differ per device.
//
//   node build/make-compositions.mjs
//
// Writes composition-desktop/index.html and composition-mobile/index.html.
// composition-mobile/ gets the desktop project's assets and config copied in.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ layouts */

// Device: the bezel-only shell from the current film, scaled by k. Everything
// drawn on the screen is authored in the 420x865 screen space and scaled by k.
function device(shellLeft, shellTop, k) {
  return {
    k,
    shell: { l: shellLeft, t: shellTop, w: 448 * k, h: 893 * k, rad: 46 * k },
    inset: 14 * k,
    screen: { l: shellLeft + 14 * k, t: shellTop + 14 * k, w: 420 * k, h: 865 * k, rad: 34 * k },
    // every device layer scales about the same canvas point: the screen's
    // upper third, where its list is, so the zoom reads as moving into it
    shellOrigin: `${r(224 * k)}px ${r(230 * k)}px`,
    screenOrigin: `${r(210 * k)}px ${r(216 * k)}px`,
  };
}

// Recreated Today/Tomorrow cards (TaskRow.tsx dp values scaled by u).
function cards({ left, width, todayTop, gap, u }) {
  const rowH = Math.round(44 * u); // leading 24 + py 10*2
  const head = Math.round(55 * u); // title band before the first row
  const pad = Math.round(18 * u);
  const todayH = head + rowH * 4 + pad;
  const tomorrowTop = todayTop + todayH + gap;
  const tomorrowH = head + rowH * 2 + pad;
  const rowLeft = left + Math.round(28 * u);
  const rowW = width - Math.round(28 * u) - Math.round(17 * u);
  const today = (i) => todayTop + head + rowH * i;
  const tomorrow = (i) => tomorrowTop + head + rowH * i;
  return {
    left, width, todayTop, todayH, tomorrowTop, tomorrowH, rowH, rowLeft, rowW,
    rows: { garden: today(0), callmom: today(1), watch: today(2), fix: today(3), cardad: tomorrow(0) },
    travel: tomorrow(1) - today(1),
    titleSize: Math.round(24 * u), titleTop: Math.round(16 * u), titleLeft: Math.round(17 * u),
    radius: Math.round(21 * u),
    labelSize: Math.round(17 * u), lineH: Math.round(24 * u),
    check: Math.round(20 * u), checkGap: Math.round(16 * u), checkIcon: Math.round(12.5 * u),
    pillSize: Math.max(24, Math.round(12.6 * u)), pillPadY: Math.round(4.2 * u), pillPadX: Math.round(10 * u), pillGap: Math.round(12 * u),
    // centre of Call mom's Undone tag (row right edge minus half a pill)
    // size is the ring's RADIUS (19 dp -> 36px desktop, 42px mobile)
    tap: { x: rowLeft + rowW - Math.round(33 * u), y: today(1) + rowH / 2, size: Math.round(19 * u) },
  };
}

const FORMATS = {
  desktop: {
    dir: "composition-desktop",
    id: "sarani-intention",
    W: 1920,
    H: 1080,
    dev: device(1240, 94, 1),
    entrance: { x: 150, y: 0 },
    type: { hook: 96, mark: 50, head: 104, s3head: 92, s4head: 104, body: 54, morning: 44, closeMark: 200, closeName: 84, closeTag: 50 },
    // copy panel: left column, vertically centred
    panelCss: `display:flex;flex-direction:column;justify-content:center;padding-left:150px;padding-right:900px;`,
    s3PanelCss: `display:flex;flex-direction:column;justify-content:center;padding-left:150px;padding-right:900px;`,
    s4PanelCss: `display:flex;flex-direction:column;justify-content:center;padding-left:150px;padding-right:900px;`,
    bodyMax: 820,
    bodySlotH: 160,
    hookCss: `max-width:1700px;text-align:center;`,
    cards: cards({ left: 1100, width: 700, todayTop: 172, gap: 36, u: 1.9 }),
    morning: { left: 1100, top: 108 },
    glow: "ellipse 820px 760px at 76% 52%",
  },
  mobile: {
    dir: "composition-mobile",
    id: "sarani-intention-mobile",
    W: 1080,
    H: 1920,
    dev: device(273, 740, 1.19),
    entrance: { x: 0, y: 140 },
    type: { hook: 104, mark: 58, head: 116, s3head: 100, s4head: 128, body: 60, morning: 52, closeMark: 260, closeName: 112, closeTag: 60 },
    // copy panel: top block with generous side margins (safe for phone players)
    panelCss: `display:flex;flex-direction:column;justify-content:flex-start;padding:150px 90px 0 90px;`,
    s3PanelCss: `display:flex;flex-direction:column;justify-content:flex-start;padding:150px 90px 0 90px;`,
    s4PanelCss: `display:flex;flex-direction:column;justify-content:flex-start;padding:300px 90px 0 90px;`,
    bodyMax: 900,
    bodySlotH: 90,
    hookCss: `max-width:900px;text-align:center;line-height:1.22;`,
    cards: cards({ left: 90, width: 900, todayTop: 610, gap: 40, u: 2.2 }),
    morning: { left: 90, top: 530 },
    glow: "ellipse 900px 1050px at 50% 64%",
  },
};

/* ------------------------------------------------------------------ template */

function html(F) {
  const { dev, type: ty, cards: c } = F;
  const k = dev.k;
  const s = (n) => r(n * k); // screen-space px
  const px = (n) => `${r(n)}px`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${F.W}, height=${F.H}" />
    <title>Sarani — From Attention to Intention (${F.W}x${F.H})</title>
    <!-- GENERATED by build/make-compositions.mjs — edit the generator, not this file -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/music/audio-energy.js"></script>
    <style>
      :root {
        --sage: #7a9b76;
        --sage-deep: #5f7a5c;
        --ink: #3a4a44;
        --ink-soft: rgba(58, 74, 68, 0.72);
        --studio-cool-1: #f4f4f2;
        --studio-cool-2: #e8e8e4;
        --studio-warm-1: #fbfaf8;
        --studio-warm-2: #f1eee3;
        --paper-base: #efe7d4;
        --paper-base-2: #e4d9be;
        --app-page: #fbf9f7;
        --app-card: #fdfcfa;
        --app-ink: rgba(0, 0, 0, 0.6);
        --app-ring: rgba(0, 0, 0, 0.25);
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #000; }
      body { font-family: "Cormorant Garamond", Georgia, "Times New Roman", serif; }
      #root { position: relative; width: ${F.W}px; height: ${F.H}px; overflow: hidden; }

      /* ---------- shared background layers ---------- */
      .full-bleed { position: absolute; inset: 0; }
      #bg-cool {
        background:
          radial-gradient(ellipse 1100px 780px at 26% 14%, rgba(255, 255, 255, 0.95), rgba(244, 244, 242, 0) 62%),
          radial-gradient(ellipse 1200px 900px at 80% 88%, rgba(255, 255, 255, 0.5), rgba(232, 232, 228, 0) 66%),
          linear-gradient(165deg, var(--studio-cool-1) 0%, var(--studio-cool-2) 100%);
      }
      #bg-warm {
        opacity: 0;
        background:
          radial-gradient(ellipse 1100px 780px at 26% 14%, rgba(255, 255, 253, 0.95), rgba(251, 250, 248, 0) 62%),
          radial-gradient(ellipse 1200px 900px at 80% 88%, rgba(255, 252, 244, 0.5), rgba(241, 238, 227, 0) 66%),
          linear-gradient(165deg, var(--studio-warm-1) 0%, var(--studio-warm-2) 100%);
      }
      /* sage glow behind the device / cards — breathes with the music */
      #key-light {
        opacity: 0;
        background: radial-gradient(${F.glow}, rgba(122, 155, 118, 0.26), rgba(122, 155, 118, 0.1) 48%, rgba(122, 155, 118, 0) 74%);
      }
      #bg-paper {
        opacity: 0;
        background:
          radial-gradient(ellipse 1400px 900px at 30% 6%, rgba(255, 253, 245, 0.6), rgba(239, 231, 212, 0) 62%),
          linear-gradient(150deg, var(--paper-base) 0%, var(--paper-base-2) 100%);
      }
      .grain-svg { position: absolute; inset: -2%; width: 104%; height: 104%; }
      #grain-studio, #grain-paper { opacity: 0; mix-blend-mode: multiply; }

      .clip { position: absolute; inset: 0; }

      /* ---------- scene 1 ---------- */
      #s1 { display: flex; align-items: center; justify-content: center; }
      #s1-line {
        margin: 0; font-weight: 400; font-style: italic; font-size: ${ty.hook}px;
        letter-spacing: 0.5px; color: var(--ink); opacity: 0; ${F.hookCss}
      }

      /* ---------- copy panels ---------- */
      #s2 { ${F.panelCss} }
      .s3-panel { position: absolute; inset: 0; ${F.s3PanelCss} }
      #s4 { ${F.s4PanelCss} }
      .wordmark { margin: 0 0 18px 0; font-weight: 500; font-style: italic; font-size: ${ty.mark}px; letter-spacing: 1px; color: var(--sage-deep); opacity: 0; }
      .headline { margin: 0 0 32px 0; font-weight: 500; font-size: ${ty.head}px; line-height: 1.04; letter-spacing: 0.3px; color: var(--ink); opacity: 0; }
      .headline .line { display: block; }
      #s3-head { font-size: ${ty.s3head}px; }
      #s4-head { font-size: ${ty.s4head}px; }
      .body { margin: 0; max-width: ${F.bodyMax}px; font-weight: 400; font-size: ${ty.body}px; line-height: 1.4; letter-spacing: 0.3px; color: var(--ink-soft); opacity: 0; }
      .body-slot { position: relative; height: ${F.bodySlotH}px; }
      .body-slot .body { position: absolute; left: 0; top: 0; }

      /* ---------- device ---------- */
      #device-shell {
        transform-origin: ${dev.shellOrigin};
        left: ${px(dev.shell.l)}; top: ${px(dev.shell.t)}; width: ${px(dev.shell.w)}; height: ${px(dev.shell.h)};
        border-radius: ${px(dev.shell.rad)}; background: #17181a;
        box-shadow: 0 48px 80px -26px rgba(20, 20, 18, 0.34), 0 14px 26px -8px rgba(20, 20, 18, 0.2);
        opacity: 0; z-index: 2;
      }
      #device-shell .screen-base {
        position: absolute; left: ${px(dev.inset)}; top: ${px(dev.inset)}; width: ${px(dev.screen.w)}; height: ${px(dev.screen.h)};
        border-radius: ${px(dev.screen.rad)}; background: var(--app-page); overflow: hidden;
      }
      .device-media {
        transform-origin: ${dev.screenOrigin};
        position: absolute; left: ${px(dev.screen.l)}; top: ${px(dev.screen.t)}; width: ${px(dev.screen.w)}; height: ${px(dev.screen.h)};
        border-radius: ${px(dev.screen.rad)}; object-fit: cover; object-position: top center; z-index: 3; opacity: 0;
      }
      #screen-ov {
        transform-origin: ${dev.screenOrigin};
        position: absolute; left: ${px(dev.screen.l)}; top: ${px(dev.screen.t)}; width: ${px(dev.screen.w)}; height: ${px(dev.screen.h)};
        z-index: 5; pointer-events: none; opacity: 0;
      }
      .tab-tap { position: absolute; width: ${s(34)}px; height: ${s(34)}px; border-radius: 50%; border: ${s(2)}px solid rgba(95, 122, 92, 0.9); opacity: 0; }
      #tap-nextday { left: ${s(116)}px; top: ${s(775)}px; }
      #tap-someday { left: ${s(270)}px; top: ${s(775)}px; }
      /* flame centroid (capture 295, 1112.5 of 590x1216) -> (210, 791) screen space */
      #flame-glow {
        position: absolute; left: ${s(187)}px; top: ${s(768)}px; width: ${s(46)}px; height: ${s(46)}px; border-radius: 50%;
        background: radial-gradient(circle, rgba(122, 155, 118, 0.55) 0%, rgba(122, 155, 118, 0.25) 55%, rgba(122, 155, 118, 0) 100%);
        opacity: 0;
      }
      #hold-ring { position: absolute; left: ${s(191)}px; top: ${s(772)}px; width: ${s(38)}px; height: ${s(38)}px; opacity: 0; overflow: visible; }
      #type-mask { position: absolute; left: ${s(30)}px; top: ${s(289)}px; width: ${s(360)}px; height: ${s(82)}px; border-radius: ${s(15)}px; overflow: hidden; opacity: 0; }
      #type-cover { position: absolute; left: ${s(26)}px; top: 0; width: ${s(334)}px; height: ${s(82)}px; background: #ffffff; }
      #type-caret { position: absolute; left: 0; top: ${s(33)}px; width: ${Math.max(2, s(2))}px; height: ${s(18)}px; background: rgba(40, 40, 40, 0.85); }
      #band { position: absolute; left: ${s(53.4)}px; top: ${s(319.4)}px; width: ${s(159.5)}px; height: ${s(23.5)}px; transform-origin: 0 0; opacity: 0; }
      #band img { position: absolute; inset: 0; width: 100%; height: 100%; }
      #band-widget { opacity: 0; }

      /* ---------- scene 3 — recreated from TaskRow.tsx ---------- */
      #stage { position: absolute; left: 0; top: 0; width: ${F.W}px; height: ${F.H}px; }
      #morning { position: absolute; left: ${F.morning.left}px; top: ${F.morning.top}px; margin: 0; font-weight: 500; font-style: italic; font-size: ${ty.morning}px; color: var(--sage-deep); opacity: 0; }
      .card {
        position: absolute; left: ${c.left}px; width: ${c.width}px; border-radius: ${c.radius}px; background: var(--app-card);
        border: 2px solid rgba(58, 74, 68, 0.1);
        box-shadow: 0 40px 70px -40px rgba(60, 56, 40, 0.28), 0 10px 22px -14px rgba(60, 56, 40, 0.16);
        opacity: 0;
      }
      #card-today { top: ${c.todayTop}px; height: ${c.todayH}px; }
      #card-tomorrow { top: ${c.tomorrowTop}px; height: ${c.tomorrowH}px; }
      .card-title { position: absolute; left: ${c.titleLeft}px; top: ${c.titleTop}px; margin: 0; font-family: "DM Sans", "Helvetica Neue", Arial, sans-serif; font-weight: 400; font-size: ${c.titleSize}px; letter-spacing: -0.3px; color: var(--app-ink); }
      .row { position: absolute; left: ${c.rowLeft}px; width: ${c.rowW}px; height: ${c.rowH}px; display: flex; align-items: center; font-family: "DM Sans", "Helvetica Neue", Arial, sans-serif; opacity: 0; z-index: 1; }
      .row .check { flex: 0 0 ${c.check}px; width: ${c.check}px; height: ${c.check}px; margin-right: ${c.checkGap}px; border-radius: 50%; border: 2px solid var(--app-ring); }
      .row .label { flex: 1 1 auto; font-weight: 500; font-size: ${c.labelSize}px; line-height: ${c.lineH}px; color: var(--app-ink); white-space: nowrap; }
      .row .pill { flex: 0 0 auto; margin-left: ${c.pillGap}px; padding: ${c.pillPadY}px ${c.pillPadX}px; border-radius: 999px; background: rgba(122, 155, 118, 0.15); font-weight: 500; font-size: ${c.pillSize}px; line-height: 1.25; color: var(--sage-deep); opacity: 0; }
      .row.done .check { border-color: var(--sage); background: var(--sage); display: flex; align-items: center; justify-content: center; }
      .row.done .label { text-decoration: line-through; color: rgba(0, 0, 0, 0.46); }
      #row-callmom { border-radius: 22px; z-index: 2; }
      #row-callmom .lift { position: absolute; inset: -6px -14px; border-radius: 22px; background: var(--app-card); box-shadow: 0 22px 40px -22px rgba(60, 56, 40, 0.4); opacity: 0; z-index: -1; }
      #pill-tap { position: absolute; left: ${r(c.tap.x - c.tap.size)}px; top: ${r(c.tap.y - c.tap.size)}px; width: ${c.tap.size * 2}px; height: ${c.tap.size * 2}px; border-radius: 50%; border: 3px solid rgba(95, 122, 92, 0.85); opacity: 0; }

      /* ---------- scene 5 — embossed close ---------- */
      #s5 { display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .emboss-mark { opacity: 0; }
      .emboss-mark svg { display: block; width: ${ty.closeMark}px; height: ${ty.closeMark}px; filter: drop-shadow(2px 3px 2px rgba(70, 60, 30, 0.3)) drop-shadow(-1.5px -2px 1.5px rgba(255, 253, 245, 0.88)); }
      .emboss-name { margin: 4px 0 0 0; font-weight: 500; font-size: ${ty.closeName}px; letter-spacing: 2px; color: rgb(110, 96, 62); opacity: 0; filter: drop-shadow(1.5px 2px 1.5px rgba(70, 60, 30, 0.28)) drop-shadow(-1px -1.5px 1.5px rgba(255, 253, 245, 0.85)); }
      .emboss-tagline { margin: 26px 0 0 0; font-weight: 500; font-style: italic; font-size: ${ty.closeTag}px; letter-spacing: 1px; color: rgba(80, 68, 42, 0.9); opacity: 0; text-align: center; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${F.id}" data-start="0" data-width="${F.W}" data-height="${F.H}" data-duration="25">
      <div id="bg-cool" class="full-bleed"></div>
      <div id="bg-warm" class="full-bleed"></div>
      <div id="key-light" class="full-bleed"></div>
      <div id="bg-paper" class="full-bleed"></div>

      <svg id="grain-studio" class="grain-svg" xmlns="http://www.w3.org/2000/svg">
        <filter id="grainStudioF">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="mono" />
          <feComponentTransfer in="mono"><feFuncA type="linear" slope="2.6" intercept="-0.7" /></feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#grainStudioF)" />
      </svg>
      <svg id="grain-paper" class="grain-svg" xmlns="http://www.w3.org/2000/svg">
        <filter id="grainPaperF">
          <feTurbulence type="fractalNoise" baseFrequency="0.5 0.55" numOctaves="3" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.22  0 0 0 1 0" result="tinted" />
          <feComponentTransfer in="tinted"><feFuncA type="linear" slope="2.2" intercept="-0.55" /></feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#grainPaperF)" />
      </svg>

      <!-- ===== scene 1 — the hook (0.0–2.6) ===== -->
      <section id="s1" class="clip" data-start="0" data-duration="2.6" data-track-index="1">
        <p id="s1-line">Not everything needs your attention.</p>
      </section>

      <!-- ===== scene 2 — the product (2.6–9.5) ===== -->
      <section id="s2" class="clip" data-start="2.6" data-duration="6.9" data-track-index="1">
        <p class="wordmark" id="s2-mark">Sarani</p>
        <h2 class="headline" id="s2-head"><span class="line">Today.</span><span class="line">Next Day.</span><span class="line">Someday.</span></h2>
        <p class="body" id="s2-body">Capture it. Choose when it matters.</p>
      </section>

      <!-- ===== scene 3 — the next morning (9.3–15.5) ===== -->
      <section id="s3" class="clip" data-start="9.3" data-duration="6.2" data-track-index="6">
        <div class="s3-panel">
          <h2 class="headline" id="s3-head"><span class="line">Nothing moves</span><span class="line">forward on its own.</span></h2>
          <div class="body-slot"><p class="body" id="s3-body">You choose what still matters.</p></div>
        </div>
        <div id="stage">
          <p id="morning">The next morning.</p>
          <div class="card" id="card-today"><p class="card-title">Today&rsquo;s Focus</p></div>
          <div class="card" id="card-tomorrow"><p class="card-title">Tomorrow</p></div>
          <div class="row" id="row-garden" style="top: ${c.rows.garden}px"><span class="check"></span><span class="label">Help with garden</span><span class="pill">Undone</span></div>
          <div class="row" id="row-callmom" style="top: ${c.rows.callmom}px"><span class="lift"></span><span class="check"></span><span class="label">Call mom</span><span class="pill" id="pill-callmom">Undone</span></div>
          <div class="row" id="row-watch" style="top: ${c.rows.watch}px"><span class="check"></span><span class="label">Watch the materialists</span><span class="pill">Undone</span></div>
          <div class="row done" id="row-fix" style="top: ${c.rows.fix}px"><span class="check"><svg width="${c.checkIcon}" height="${c.checkIcon}" viewBox="0 0 24 24" fill="none" stroke="#F6F2EC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span><span class="label">Fix your product</span></div>
          <div class="row" id="row-cardad" style="top: ${c.rows.cardad}px"><span class="check"></span><span class="label">Help dad with car wash</span></div>
          <div id="pill-tap"></div>
        </div>
      </section>

      <!-- ===== scene 4 — One Thing (15.2–21.75) ===== -->
      <section id="s4" class="clip" data-start="15.2" data-duration="6.55" data-track-index="1">
        <h2 class="headline" id="s4-head">One Thing.</h2>
        <div class="body-slot">
          <p class="body" id="s4-body-a">Press and hold the flame.</p>
          <p class="body" id="s4-body-b">Kept where you&rsquo;ll see it.</p>
        </div>
      </section>

      <!-- ===== scene 5 — close (21.35–25.0) ===== -->
      <section id="s5" class="clip" data-start="21.35" data-duration="3.65" data-track-index="7" style="z-index: 1">
        <div class="emboss-mark" id="s5-mark">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M660 320 C600 260 460 270 430 350 C400 430 540 460 610 495 C690 535 715 610 670 675 C625 740 485 755 380 700"
              fill="none" stroke="#c9bc94" stroke-width="64" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="emboss-name" id="s5-name">Sarani</p>
        <p class="emboss-tagline" id="s5-tag">From Attention to Intention.</p>
      </section>

      <!-- ===== device shell ===== -->
      <div id="device-shell" class="clip" data-start="2.6" data-duration="19.15" data-track-index="2" data-layout-allow-overflow="true">
        <div class="screen-base"></div>
      </div>

      <!-- ===== real app media — direct root children ===== -->
      <!-- recording 34.2–35.9s at 1.1x: typing ends, commit (0.95s in), the new task lands above the ticked one -->
      <video id="m-capture" class="device-media" src="assets/img/clips/capture-slow.mp4" data-start="3.3" data-duration="1.6" data-media-start="0" data-track-index="3" muted playsinline></video>
      <!-- recording 36.7–41.55s at real speed: tap Next Day (0.35s in), tick, tap Someday (3.58s in) -->
      <video id="m-lists" class="device-media" src="assets/img/clips/lists-slow.mp4" data-start="4.9" data-duration="4.83" data-media-start="0" data-track-index="4" muted playsinline></video>
      <img id="m-today" class="clip device-media" src="assets/img/shots/today.jpg" data-start="15.3" data-duration="1.12" data-track-index="3" />
      <img id="m-sheet" class="clip device-media" src="assets/img/shots/onething-sheet.jpg" data-start="16.38" data-duration="1.78" data-track-index="4" />
      <!-- blank twins (typed line's box filled with its flat surface colour) swap in on the frame the line takes over -->
      <img id="m-sheet-blank" class="clip device-media" src="assets/img/shots/onething-sheet-blank.png" data-start="18.15" data-duration="0.55" data-track-index="5" />
      <img id="m-widget-blank" class="clip device-media" src="assets/img/shots/widget-blank.png" data-start="18.25" data-duration="0.79" data-track-index="3" />
      <img id="m-widget" class="clip device-media" src="assets/img/shots/widget-after.jpg" data-start="19.02" data-duration="2.73" data-track-index="4" />

      <div id="screen-ov">
        <div class="tab-tap" id="tap-nextday"></div>
        <div class="tab-tap" id="tap-someday"></div>
        <div id="flame-glow"></div>
        <svg id="hold-ring" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
          <circle id="hold-ring-track" cx="26" cy="26" r="24.5" fill="none" stroke="#7A9B76" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="153.938 153.938" stroke-dashoffset="153.938" transform="rotate(-90 26 26)" />
        </svg>
        <div id="type-mask"><div id="type-cover"><div id="type-caret"></div></div></div>
        <div id="band">
          <img id="band-sheet" src="assets/img/bands/line-sheet.png" alt="" />
          <img id="band-widget" src="assets/img/bands/line-widget.png" alt="" />
        </div>
      </div>

      <!-- ===== audio ===== -->
      <audio id="bed" src="assets/music/sarani-bed.mp3" data-start="0" data-duration="25" data-track-index="10" data-volume="0.5"></audio>
      <audio id="sfx-commit" src="assets/sfx/interface/drop_001.ogg" data-start="4.25" data-track-index="11" data-volume="0.3"></audio>
      <audio id="sfx-tap" src="assets/sfx/ui/click2.ogg" data-start="12.44" data-track-index="12" data-volume="0.3"></audio>
      <audio id="sfx-land" src="assets/sfx/interface/drop_002.ogg" data-start="13.28" data-track-index="13" data-volume="0.26"></audio>
      <audio id="sfx-sheet" src="assets/sfx/ui/click2.ogg" data-start="16.38" data-track-index="14" data-volume="0.24"></audio>
      <audio id="sfx-widget" src="assets/sfx/impact/impactSoft_medium_002.ogg" data-start="19.02" data-track-index="15" data-volume="0.3"></audio>
      <audio id="sfx-close" src="assets/sfx/impact/impactSoft_medium_002.ogg" data-start="21.84" data-track-index="16" data-volume="0.28"></audio>
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      const DEVICE = ["#device-shell", "#m-capture", "#m-lists", "#m-today", "#m-sheet", "#m-sheet-blank", "#m-widget-blank", "#m-widget", "#screen-ov"];

      /* ===== scene 1 — the hook ===== */
      tl.fromTo("#s1-line", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 0.25);
      tl.to("#s1-line", { opacity: 0, y: -10, duration: 0.3, ease: "power1.in" }, 2.3);
      tl.set("#s1-line", { opacity: 0 }, 2.6);
      tl.fromTo("#grain-studio", { opacity: 0 }, { opacity: 0.2, duration: 0.9, ease: "power1.inOut" }, 0.2);
      tl.to("#grain-studio", { opacity: 0.06, duration: 0.8, ease: "power1.in" }, 2.2);
      /* the film's one colour turn: attention (cool) -> intention (warm) */
      tl.fromTo("#bg-warm", { opacity: 0 }, { opacity: 1, duration: 1.1, ease: "sine.inOut" }, 2.3);

      /* ===== scene 2 — the product (real footage near real speed) ===== */
      /* casing arrives EMPTY and lands before any screen content exists */
      tl.fromTo("#device-shell", { opacity: 0, x: ${F.entrance.x}, y: ${F.entrance.y} }, { opacity: 1, x: 0, y: 0, duration: 0.65, ease: "power3.out" }, 2.6);
      tl.set("#screen-ov", { opacity: 1 }, 3.25);
      tl.fromTo("#m-capture", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, 3.3);
      tl.set("#m-lists", { opacity: 1 }, 4.9);
      /* one gentle push-in across the footage; ends exactly where the zoom begins */
      tl.fromTo(DEVICE, { scale: 1 }, { scale: 1.05, duration: 5.8, ease: "sine.inOut" }, 3.25);

      tl.fromTo("#s2-mark", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 2.85);
      tl.fromTo("#s2-head", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 3.0);
      tl.fromTo("#s2-body", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 3.3);
      tl.to(["#s2-mark", "#s2-head", "#s2-body"], { opacity: 0, y: -8, duration: 0.4, ease: "power1.in" }, 9.05);
      tl.set(["#s2-mark", "#s2-head", "#s2-body"], { opacity: 0 }, 9.5);

      /* the real tab taps in the lists clip (0.35s and 3.58s in) */
      [["#tap-nextday", 5.25], ["#tap-someday", 8.48]].forEach(([sel, t]) => {
        tl.fromTo(sel, { opacity: 0, scale: 0.4 }, { opacity: 0.9, scale: 1, duration: 0.3, ease: "power2.out" }, t);
        tl.to(sel, { opacity: 0, duration: 0.35, ease: "power1.in" }, t + 0.32);
      });

      /* ===== scene 3 — the next morning ===== */
      /* match-move: the phone moves toward its own list and dissolves into the cards */
      tl.to(DEVICE, { scale: 1.42, duration: 0.7, ease: "power2.in" }, 9.05);
      tl.to(["#device-shell", "#m-lists", "#screen-ov"], { opacity: 0, duration: 0.4, ease: "power1.in" }, 9.3);
      tl.set(["#device-shell", "#m-lists", "#screen-ov"], { opacity: 0 }, 9.73);
      tl.set(DEVICE, { scale: 1 }, 9.8);

      tl.fromTo(["#card-today", "#card-tomorrow"], { opacity: 0, scale: 0.94, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08 }, 9.55);
      tl.fromTo(["#row-garden", "#row-callmom", "#row-watch", "#row-fix", "#row-cardad"], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.04 }, 9.7);
      tl.fromTo("#morning", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 9.85);

      /* day change: the ticked task leaves for History; nothing else moves */
      tl.to("#row-fix", { opacity: 0, x: 36, duration: 0.45, ease: "power2.in" }, 10.2);
      tl.set("#row-fix", { opacity: 0 }, 10.7);
      /* the unfinished three stay — each marked Undone */
      tl.fromTo("#s3 .row .pill", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out", stagger: 0.12 }, 10.65);
      tl.fromTo("#s3-head", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 10.5);

      /* the choice: a tap on Call mom's Undone tag */
      tl.fromTo("#pill-tap", { opacity: 0, scale: 0.4 }, { opacity: 0.9, scale: 1, duration: 0.3, ease: "power2.out" }, 12.44);
      tl.to("#pill-tap", { opacity: 0, scale: 1.25, duration: 0.4, ease: "power1.in" }, 12.74);
      tl.set("#pill-tap", { opacity: 0 }, 13.2);
      /* the same row travels from Today into Tomorrow */
      tl.to("#row-callmom .lift", { opacity: 1, duration: 0.2, ease: "power1.out" }, 12.5);
      tl.to("#row-callmom", { scale: 1.02, duration: 0.2, ease: "power1.out" }, 12.5);
      tl.to("#row-callmom", { y: ${c.travel}, duration: 0.62, ease: "power3.inOut" }, 12.66);
      tl.to("#pill-callmom", { opacity: 0, duration: 0.3, ease: "power1.out" }, 12.8);
      tl.to("#row-callmom", { scale: 1, duration: 0.2, ease: "power1.inOut" }, 13.16);
      tl.to("#row-callmom .lift", { opacity: 0, duration: 0.25, ease: "power1.in" }, 13.2);
      /* the Today list closes the gap once the row has cleared */
      tl.to("#row-watch", { y: -${c.rowH}, duration: 0.45, ease: "power2.inOut" }, 13.05);
      tl.fromTo("#s3-body", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 12.85);

      tl.to(["#s3-head", "#s3-body", "#morning", ".card", "#s3 .row"], { opacity: 0, duration: 0.4, ease: "power1.in" }, 14.95);
      tl.set(["#s3-head", "#s3-body", "#morning", ".card", "#s3 .row"], { opacity: 0 }, 15.4);

      /* ===== scene 4 — One Thing ===== */
      tl.set("#device-shell", { x: 0, y: 0 }, 15.2);
      tl.fromTo(["#device-shell", "#m-today"], { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out", immediateRender: false }, 15.3);
      tl.set("#screen-ov", { opacity: 1 }, 15.3);
      tl.fromTo(DEVICE, { scale: 1.04 }, { scale: 1, duration: 0.6, ease: "power2.out", immediateRender: false }, 15.3);
      tl.fromTo("#s4-head", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 15.5);
      tl.fromTo("#s4-body-a", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 15.7);

      /* the long press — the app's own values (HOLD_MS 650ms, linear); the
         sheet opens at 16.38, on the bed's onset peak (16.32, beat-grid) */
      const RING = 153.938;
      tl.fromTo("#flame-glow", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 15.69);
      tl.fromTo("#hold-ring", { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power2.out" }, 15.69);
      tl.fromTo("#hold-ring-track", { strokeDashoffset: RING }, { strokeDashoffset: 0, duration: 0.65, ease: "none" }, 15.73);
      tl.to(["#hold-ring", "#flame-glow"], { opacity: 0, duration: 0.22, ease: "power2.in" }, 16.38);
      tl.set(["#hold-ring", "#flame-glow"], { opacity: 0 }, 16.65);
      tl.fromTo("#m-sheet", { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power1.out" }, 16.38);

      /* typing: the app's own glyphs uncovered one by one (16 characters) */
      tl.set("#type-mask", { opacity: 1 }, 16.38);
      tl.set("#type-cover", { x: 0 }, 16.38);
      tl.set("#type-caret", { opacity: 1 }, 16.38);
      tl.to("#type-cover", { x: ${s(157)}, duration: 1.05, ease: "steps(16)" }, 16.7);
      tl.to("#type-caret", { opacity: 0, duration: 0.26, repeat: 5, yoyo: true, ease: "steps(1)" }, 16.7);
      tl.set("#type-caret", { opacity: 0 }, 18.12);
      tl.set("#type-caret", { opacity: 0 }, 18.25);

      /* the One Thing leaves the app and settles into the widget */
      tl.set("#m-sheet-blank", { opacity: 1 }, 18.15);
      tl.set("#type-mask", { opacity: 0 }, 18.15);
      tl.set("#band", { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 }, 18.15);
      tl.fromTo("#m-widget-blank", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "sine.inOut", immediateRender: false }, 18.25);
      tl.to("#m-sheet-blank", { opacity: 0, duration: 0.35, ease: "sine.in" }, 18.3);
      tl.set("#m-sheet-blank", { opacity: 0 }, 18.7);
      tl.to("#band", { x: ${s(30.6)}, y: ${s(-252.5)}, scaleX: 1.209, scaleY: 1.149, duration: 0.85, ease: "power3.inOut" }, 18.18);
      tl.to("#band-widget", { opacity: 1, duration: 0.3, ease: "none" }, 18.6);
      tl.set("#m-widget", { opacity: 1 }, 19.02);
      tl.set("#band", { opacity: 0 }, 19.06);

      tl.to("#s4-body-a", { opacity: 0, y: -8, duration: 0.35, ease: "power1.in" }, 18.0);
      tl.set("#s4-body-a", { opacity: 0 }, 18.4);
      tl.fromTo("#s4-body-b", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 19.1);
      tl.fromTo(DEVICE, { scale: 1 }, { scale: 1.035, duration: 2.55, ease: "sine.inOut", immediateRender: false }, 18.7);

      tl.to(["#s4-head", "#s4-body-b"], { opacity: 0, y: -8, duration: 0.45, ease: "sine.in" }, 21.2);
      tl.set(["#s4-head", "#s4-body-b"], { opacity: 0 }, 21.75);
      tl.to(["#device-shell", "#m-widget", "#screen-ov"], { opacity: 0, duration: 0.5, ease: "sine.in" }, 21.25);
      tl.set(["#device-shell", "#m-widget", "#screen-ov"], { opacity: 0 }, 21.75);

      /* ===== scene 5 — close ===== */
      tl.fromTo("#bg-paper", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "sine.inOut" }, 21.35);
      tl.fromTo("#grain-paper", { opacity: 0 }, { opacity: 0.5, duration: 0.9, ease: "sine.inOut" }, 21.45);
      tl.to("#grain-studio", { opacity: 0.02, duration: 0.6, ease: "power1.in" }, 21.35);
      tl.fromTo("#s5-mark", { opacity: 0, scale: 0.94, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "power2.out" }, 21.84);
      tl.fromTo("#s5-name", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 22.25);
      tl.fromTo("#s5-tag", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 22.7);
      /* music recedes under the close, then holds — arrival, not fade-to-nothing */
      tl.to("#bed", { volume: 0.36, duration: 0.9, ease: "sine.inOut" }, 21.45);
      tl.to("#bed", { volume: 0.26, duration: 1.4, ease: "sine.inOut" }, 23.5);

      /* ===== audio-reactive sage glow (seek-safe keyframes, one stop per 0.1s) ===== */
      const E = window.AUDIO_ENERGY;
      const GLOW_FROM = 2.6;
      const GLOW_TO = 21.75;
      const STEP = 0.1;
      const glowAt = (t) => {
        const v = E.values[Math.min(E.values.length - 1, Math.round(t * E.fps))];
        const n = Math.min(1, Math.max(0, (v - 0.15) / 0.45));
        return 0.4 + 0.6 * n;
      };
      const glowStops = [];
      for (let t = GLOW_FROM + STEP; t <= GLOW_TO + 1e-6; t += STEP) glowStops.push({ opacity: glowAt(t), duration: STEP, ease: "none" });
      tl.fromTo("#key-light", { opacity: 0 }, { opacity: glowAt(GLOW_FROM), duration: 0.6, ease: "sine.inOut" }, GLOW_FROM - 0.6);
      tl.to("#key-light", { keyframes: glowStops, ease: "none" }, GLOW_FROM);
      tl.set("#key-light", { opacity: 0 }, 21.77);

      window.__timelines["${F.id}"] = tl;
    </script>
  </body>
</html>
`;
}

/* ------------------------------------------------------------------ write */

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === ".hyperframes" || e.name === "index.html" || e.name === "renders") continue;
    const a = path.join(src, e.name);
    const b = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

const desk = path.join(ROOT, FORMATS.desktop.dir);
const mob = path.join(ROOT, FORMATS.mobile.dir);
copyDir(desk, mob);
fs.writeFileSync(
  path.join(mob, "meta.json"),
  JSON.stringify({ id: FORMATS.mobile.id, name: "Sarani — From Attention to Intention (mobile 1080x1920)" }, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(desk, "meta.json"),
  JSON.stringify({ id: FORMATS.desktop.id, name: "Sarani — From Attention to Intention (desktop 1920x1080)" }, null, 2) + "\n",
);

for (const F of Object.values(FORMATS)) {
  fs.writeFileSync(path.join(ROOT, F.dir, "index.html"), html(F));
  const c = F.cards;
  console.log(`${F.dir}: ${F.W}x${F.H}  device k=${F.dev.k}  cards today ${c.todayTop}-${c.todayTop + c.todayH}, tomorrow ${c.tomorrowTop}-${c.tomorrowTop + c.tomorrowH}, travel ${c.travel}px, row ${c.rowH}px`);
}
