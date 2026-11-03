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
  // 1. Text & Links (Light & Dark)
  {
    name: 'Primary Text / Link (Light on White Surface #FFFFFF)',
    fg: '#5047E5',
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

  // 2. Primary Buttons (Strict AA >= 4.5:1 for Text)
  {
    name: 'Primary Button Text (White on Indigo #5047E5)',
    fg: '#FFFFFF',
    bg: '#5047E5',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Primary Button Boundary vs Dark Surface #111113',
    fg: '#5047E5',
    bg: '#111113',
    standard: 'UI Component / Graphical (>= 3.0:1)',
    min: 3.0,
  },

  // 3. Focus Rings (Light & Dark)
  {
    name: 'Focus Ring Boundary vs Light Surface #FFFFFF',
    fg: '#5047E5',
    bg: '#FFFFFF',
    standard: 'UI Focus State (>= 3.0:1)',
    min: 3.0,
  },
  {
    name: 'Focus Ring Boundary vs Dark Surface #111113',
    fg: '#818CF8',
    bg: '#111113',
    standard: 'UI Focus State (>= 3.0:1)',
    min: 3.0,
  },

  // 4. Secondary & Neutral Texts (Light Theme)
  {
    name: 'Text Secondary on Light Surface #FFFFFF',
    fg: '#6B6B6B',
    bg: '#FFFFFF',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Text Secondary on Light Background #FAFAFA',
    fg: '#6B6B6B',
    bg: '#FAFAFA',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Text Neutral / Placeholder on Light Surface #FFFFFF',
    fg: '#71717A',
    bg: '#FFFFFF',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Text Neutral / Placeholder on Light Background #FAFAFA',
    fg: '#71717A',
    bg: '#FAFAFA',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },

  // 5. Secondary & Neutral Texts (Dark Theme)
  {
    name: 'Text Primary on Dark Surface #111113',
    fg: '#FAFAFA',
    bg: '#111113',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Text Secondary (Metadata/Timestamp) on Dark Surface #111113',
    fg: '#A1A1AA',
    bg: '#111113',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Text Secondary (Metadata/Timestamp) on Dark Background #0A0A0B',
    fg: '#A1A1AA',
    bg: '#0A0A0B',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Text Neutral / Placeholder on Dark Surface #111113',
    fg: '#8E8E93',
    bg: '#111113',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Text Neutral / Placeholder on Dark Background #0A0A0B',
    fg: '#8E8E93',
    bg: '#0A0A0B',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },

  // 6. Status Badges Light (Tint & White Surface)
  {
    name: 'Status Success Light (#065F46 on #ECFDF5)',
    fg: '#065F46',
    bg: '#ECFDF5',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Success Light (#065F46 on White Surface #FFFFFF)',
    fg: '#065F46',
    bg: '#FFFFFF',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Warning Light (#92400E on #FFFBEB)',
    fg: '#92400E',
    bg: '#FFFBEB',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Status Warning Light (#92400E on White Surface #FFFFFF)',
    fg: '#92400E',
    bg: '#FFFFFF',
    standard: 'AA Normal Text (>= 4.5:1)',
    min: 4.5,
  },
  {
    name: 'Status Error Light (#991B1B on #FEF2F2)',
    fg: '#991B1B',
    bg: '#FEF2F2',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Error Light (#991B1B on White Surface #FFFFFF)',
    fg: '#991B1B',
    bg: '#FFFFFF',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Neutral Light (#374151 on #F3F4F6)',
    fg: '#374151',
    bg: '#F3F4F6',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },
  {
    name: 'Status Neutral Light (#374151 on White Surface #FFFFFF)',
    fg: '#374151',
    bg: '#FFFFFF',
    standard: 'AAA Normal Text (>= 7.0:1)',
    min: 7.0,
  },

  // 7. Status Badges Dark (Translucent 15% tint & #111113 Surface)
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

console.log('='.repeat(98));
console.log('SIMOP DPMPTSP - Laporan Verifikasi Kontras Aksesibilitas WCAG 2.1');
console.log('='.repeat(98));
console.log(
  'Elemen / Pasangan Warna'.padEnd(62) +
  'Rasio'.padEnd(12) +
  'Standar'.padEnd(16) +
  'Hasil'
);
console.log('-'.repeat(98));

let allPassed = true;
for (const t of tests) {
  const ratio = calculateContrast(t.fg, t.bg);
  const passed = ratio >= t.min;
  if (!passed) allPassed = false;

  const ratioStr = `${ratio.toFixed(2)} : 1`;
  const statusStr = passed ? '✅ LULUS' : '❌ GAGAL';

  console.log(
    t.name.padEnd(62) +
    ratioStr.padEnd(12) +
    t.standard.padEnd(16) +
    statusStr
  );
}
console.log('='.repeat(98));

if (allPassed) {
  console.log('✅ Semua pasangan warna memenuhi atau melampaui standar target WCAG AA / AAA.');
  process.exit(0);
} else {
  console.error('❌ Ada pasangan warna yang tidak memenuhi rasio kontras minimum.');
  process.exit(1);
}
