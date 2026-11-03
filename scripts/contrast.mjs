/**
 * scripts/contrast.mjs
 * Script kalkulator kontras WCAG 2.1 (Relative Luminance & Contrast Ratio)
 * Memverifikasi kepatuhan rasio kontras untuk SIMOP DPMPTSP (Genesis Design System).
 */

function sRgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function blendAlpha(fgHex, bgHex, alpha) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
  };
}

function getRelativeLuminance({ r, g, b }) {
  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function calculateContrast(fgColor, bgColor) {
  const l1 = getRelativeLuminance(typeof fgColor === 'string' ? hexToRgb(fgColor) : fgColor);
  const l2 = getRelativeLuminance(typeof bgColor === 'string' ? hexToRgb(bgColor) : bgColor);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const tests = [
  // 1. Text & Links
  {
    name: 'Primary Text / Link (Light on White Surface)',
    fg: '#4F46E5',
    bg: '#FFFFFF',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Primary Text / Link (Dark on Surface #111113)',
    fg: '#818CF8',
    bg: '#111113',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Primary Text / Link (Dark on Background #0A0A0B)',
    fg: '#818CF8',
    bg: '#0A0A0B',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Primary Button Text (White on Indigo #6366F1)',
    fg: '#FFFFFF',
    bg: '#6366F1',
    standard: 'AA UI Control / Bold (>= 3.0:1)',
    min: 3.0,
  },
  {
    name: 'Primary Button Boundary vs Dark Surface #111113',
    fg: '#6366F1',
    bg: '#111113',
    standard: 'UI Component / Graphical (>= 3.0:1)',
    min: 3.0,
  },
  // 2. Secondary & Neutral Texts
  {
    name: 'Text Primary on Dark Surface',
    fg: '#FAFAFA',
    bg: '#111113',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Text Secondary (Metadata/Timestamp) on Dark Surface',
    fg: '#A1A1AA',
    bg: '#111113',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Text Neutral (Placeholder/Disabled) on Dark Surface',
    fg: '#71717A',
    bg: '#111113',
    standard: 'Placeholder / Disabled (>= 3.0:1)',
    min: 3.0,
  },
  {
    name: 'Focus Ring Boundary vs Dark Surface #111113',
    fg: '#818CF8',
    bg: '#111113',
    standard: 'UI Focus State (>= 3.0:1)',
    min: 3.0,
  },
  // 3. Status Badges Dark (Tint with 15% alpha over #111113)
  {
    name: 'Status Success Dark (#6EE7B7 on #10B981@15% + #111113)',
    fg: '#6EE7B7',
    bg: blendAlpha('#10B981', '#111113', 0.15),
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Warning Dark (#FDE68A on #F59E0B@15% + #111113)',
    fg: '#FDE68A',
    bg: blendAlpha('#F59E0B', '#111113', 0.15),
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Error Dark (#FECACA on #EF4444@15% + #111113)',
    fg: '#FECACA',
    bg: blendAlpha('#EF4444', '#111113', 0.15),
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Neutral Dark (#E4E4E7 on #A1A1AA@15% + #111113)',
    fg: '#E4E4E7',
    bg: blendAlpha('#A1A1AA', '#111113', 0.15),
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
];

console.log('='.repeat(90));
console.log('SIMOP DPMPTSP - Laporan Verifikasi Kontras Aksesibilitas WCAG 2.1');
console.log('='.repeat(90));
console.log(
  'Elemen / Pasangan Warna'.padEnd(52) +
  'Rasio'.padEnd(12) +
  'Standar'.padEnd(20) +
  'Hasil'
);
console.log('-'.repeat(90));

let allPassed = true;
for (const t of tests) {
  const ratio = calculateContrast(t.fg, t.bg);
  const passed = ratio >= t.min;
  if (!passed) allPassed = false;

  const ratioStr = `${ratio.toFixed(2)} : 1`;
  const statusStr = passed ? '✅ LULUS' : '❌ GAGAL';

  console.log(
    t.name.padEnd(52) +
    ratioStr.padEnd(12) +
    t.standard.padEnd(20) +
    statusStr
  );
}
console.log('='.repeat(90));

if (allPassed) {
  console.log('✅ Semua pasangan warna memenuhi atau melampaui standar target WCAG AA / AAA.');
  process.exit(0);
} else {
  console.error('❌ Ada pasangan warna yang tidak memenuhi rasio kontras minimum.');
  process.exit(1);
}
