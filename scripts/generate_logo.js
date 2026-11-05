import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

function buildLynxLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <clipPath id="squircle-clip">
      <rect x="24" y="24" width="976" height="976" rx="220" />
    </clipPath>

    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <linearGradient id="magenta-diff" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff00ff"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>

    <linearGradient id="slate-facet-light" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <linearGradient id="slate-facet-mid" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>

    <linearGradient id="slate-facet-dark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0b0f19"/>
    </linearGradient>

    <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Luxury White Squircle Container -->
  <rect x="24" y="24" width="976" height="976" rx="220" fill="#ffffff" stroke="#e2e8f0" stroke-width="6" />

  <g clip-path="url(#squircle-clip)">
    <g transform="translate(512, 512)" filter="url(#subtle-shadow)">

      <!-- Hexagonal Architectural Quality Gate Frame -->
      <polygon points="
        0,-410
        355,-205
        355,205
        0,410
        -355,205
        -355,-205
      " fill="none" stroke="#0f172a" stroke-width="36" stroke-linejoin="round" />

      <!-- Inner Precision Alignment Grid Line (Electric Cyan & Magenta Split) -->
      <polygon points="
        0,-375
        325,-187
        325,187
        0,375
        -325,187
        -325,-187
      " fill="none" stroke="url(#cyan-glow)" stroke-width="4" opacity="0.45" stroke-dasharray="20, 14" />

      <!-- Single Contiguous Base Silhouette of Lynx (Watertight Zero-Leak Anchor) -->
      <path d="
        M 0 -220
        L 75 -200 L 165 -320 L 155 -170 L 220 -110 L 255 10 L 190 120 L 235 220 L 120 250 L 0 290
        L -120 250 L -235 220 L -190 120 L -255 10 L -220 -110 L -155 -170 L -165 -320 L -75 -200
        Z
      " fill="#0b0f19" />

      <!-- Ear Tufts (Black Radar Whiskers) -->
      <polygon points="165,-320 185,-355 155,-325" fill="#020617" />
      <polygon points="-165,-320 -185,-355 -155,-325" fill="#020617" />

      <!-- Inner Ear Facets (Volumetric Lighting) -->
      <polygon points="75,-200 155,-170 120,-240" fill="#334155" />
      <polygon points="-75,-200 -155,-170 -120,-240" fill="#1e293b" />
      <polygon points="120,-240 155,-170 145,-280" fill="url(#cyan-glow)" opacity="0.8" />
      <polygon points="-120,-240 -155,-170 -145,-280" fill="#0284c7" opacity="0.7" />

      <!-- Forehead & Brow Facets -->
      <polygon points="0,-220 75,-200 65,-120 0,-140" fill="url(#slate-facet-light)" />
      <polygon points="0,-220 -75,-200 -65,-120 0,-140" fill="url(#slate-facet-dark)" />
      <polygon points="65,-120 75,-200 155,-170 130,-100" fill="#1e293b" />
      <polygon points="-65,-120 -75,-200 -155,-170 -130,-100" fill="#0f172a" />

      <!-- Crown Central Diamond (Visual Diff Core Sensor) -->
      <polygon points="0,-140 45,-90 0,-40 -45,-90" fill="#0f172a" stroke="url(#cyan-glow)" stroke-width="3" />
      <polygon points="0,-120 25,-90 0,-60 -25,-90" fill="url(#cyan-glow)" />

      <!-- Upper Temples & Cheeks -->
      <polygon points="65,-120 130,-100 160,-20 85,-40" fill="#334155" />
      <polygon points="-65,-120 -130,-100 -160,-20 -85,-40" fill="#1e293b" />
      <polygon points="130,-100 220,-110 210,-10 160,-20" fill="#1e293b" />
      <polygon points="-130,-100 -220,-110 -210,-10 -160,-20" fill="#0f172a" />

      <!-- Iconic Lynx Cheek Ruffs (Lateral Geometric Flare) -->
      <polygon points="210,-10 255,10 190,70 160,-20" fill="#334155" />
      <polygon points="-210,-10 -255,10 -190,70 -160,-20" fill="#1e293b" />
      <polygon points="190,70 255,10 235,140 165,110" fill="#1e293b" />
      <polygon points="-190,70 -255,10 -235,140 -165,110" fill="#0b0f19" />
      <polygon points="165,110 235,140 235,220 140,170" fill="#0f172a" />
      <polygon points="-165,110 -235,140 -235,220 -140,170" fill="#020617" />

      <!-- Ocular Apertures / Eyes (Almond Predatory Cant - Cyan Left, Magenta Right for Diff Metaphor) -->
      <!-- Left Eye (Baseline Cyan Focus) -->
      <polygon points="45,-50 115,-45 110,-15 48,-25" fill="#020617" stroke="#00f5ff" stroke-width="2" />
      <polygon points="58,-42 102,-38 98,-20 59,-26" fill="url(#cyan-glow)" />
      <polygon points="76,-44 84,-43 82,-18 74,-19" fill="#020617" /> <!-- Vertical Pupil -->
      <circle cx="94" cy="-34" r="3.5" fill="#ffffff" /> <!-- Specular Highlight -->

      <!-- Right Eye (Diff Shift Magenta Focus) -->
      <polygon points="-45,-50 -115,-45 -110,-15 -48,-25" fill="#020617" stroke="#ff00ff" stroke-width="2" />
      <polygon points="-58,-42 -102,-38 -98,-20 -59,-26" fill="url(#magenta-diff)" />
      <polygon points="-76,-44 -84,-43 -82,-18 -74,-19" fill="#020617" /> <!-- Vertical Pupil -->
      <circle cx="-94" cy="-34" r="3.5" fill="#ffffff" /> <!-- Specular Highlight -->

      <!-- Nose Bridge & Nasal Facets -->
      <polygon points="0,-40 45,-50 48,-25 28,60 0,70" fill="url(#slate-facet-light)" />
      <polygon points="0,-40 -45,-50 -48,-25 -28,60 0,70" fill="url(#slate-facet-dark)" />

      <!-- Sculpted Titanium Muzzle (Refined Silver-Slate Whisker Pads, Zero Buck-Teeth) -->
      <polygon points="0,70 28,60 70,80 60,130 0,140" fill="#94a3b8" />
      <polygon points="0,70 -28,60 -70,80 -60,130 0,140" fill="#64748b" />
      <polygon points="60,130 70,80 130,90 120,150 55,160" fill="#475569" />
      <polygon points="-60,130 -70,80 -130,90 -120,150 -55,160" fill="#334155" />

      <!-- Geometric Obsidian Nose Tip -->
      <polygon points="0,65 18,78 0,92 -18,78" fill="#020617" stroke="#38bdf8" stroke-width="1.5" />

      <!-- Chin & Jawline Armor -->
      <polygon points="0,140 55,160 40,210 0,225" fill="#334155" />
      <polygon points="0,140 -55,160 -40,210 0,225" fill="#1e293b" />
      <polygon points="0,225 40,210 80,240 0,290" fill="#1e293b" />
      <polygon points="0,225 -40,210 -80,240 0,290" fill="#0f172a" />
      <polygon points="40,210 140,170 120,250 80,240" fill="#0f172a" />
      <polygon points="-40,210 -140,170 -120,250 -80,240" fill="#0b0f19" />

      <!-- Subtle Split Wiper Vertical Laser Beam on Centerline -->
      <line x1="0" y1="-375" x2="0" y2="375" stroke="#ffffff" stroke-width="2" opacity="0.35" stroke-dasharray="8, 6" />
    </g>
  </g>
</svg>`;
}

async function run() {
  const outputDir = path.resolve(process.cwd(), 'docs/images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const svg = buildLynxLogoSvg();
  const svgPath = path.join(outputDir, 'logo.svg');
  const pngPath = path.join(outputDir, 'logo.png');

  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log('✓ Written SVG to ' + svgPath);

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1024 }
  });
  const pngData = resvg.render().asPng();
  fs.writeFileSync(pngPath, pngData);
  console.log('✓ Successfully rendered PNG to ' + pngPath + ' at 1024x1024');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
