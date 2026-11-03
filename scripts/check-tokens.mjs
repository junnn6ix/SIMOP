import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const ALLOWED_FILES = [
  path.resolve(process.cwd(), 'src/styles/globals.css'),
];

const HEX_COLOR_REGEX = /#[0-9a-fA-F]{3,8}\b/g;
const TAILWIND_NON_ADAPTIVE_REGEX = /\b(bg|text|border|ring|stroke|fill)-(white|black|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/g;
const LITERAL_COLOR_FN_REGEX = /\b(rgba?|hsla?)\([^)]+\)/g;

let violationsCount = 0;

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile()) {
      if (ALLOWED_FILES.includes(fullPath)) continue;
      // only check ts, tsx, js, jsx, css, json files
      const ext = path.extname(fullPath);
      if (!['.ts', '.tsx', '.js', '.jsx', '.css', '.html'].includes(ext)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const isDotGridCanvas = fullPath.endsWith('DotGrid.tsx');

      lines.forEach((line, index) => {
          // 1. Check hardcoded hex colors
          const hexMatches = line.match(HEX_COLOR_REGEX);
          if (hexMatches) {
            console.error(
                `[check:tokens] Hardcoded hex color found in ${path.relative(process.cwd(), fullPath)}:${index + 1}: ${hexMatches.join(', ')}`
            );
            violationsCount++;
          }

          // 2. Check non-adaptive Tailwind default palette classes
          const twMatches = line.match(TAILWIND_NON_ADAPTIVE_REGEX);
          if (twMatches) {
            console.error(
              `[check:tokens] Non-adaptive Tailwind color found in ${path.relative(process.cwd(), fullPath)}:${index + 1}: ${twMatches.join(', ')}`
            );
            violationsCount++;
          }

          // 3. Check literal rgb/rgba/hsl outside canvas DotGrid
          if (!isDotGridCanvas) {
            const fnMatches = line.match(LITERAL_COLOR_FN_REGEX);
            if (fnMatches) {
              console.error(
                `[check:tokens] Literal color function found in ${path.relative(process.cwd(), fullPath)}:${index + 1}: ${fnMatches.join(', ')}`
              );
              violationsCount++;
            }
          }
        });
    }
  }
}

walkDir(SRC_DIR);

if (violationsCount > 0) {
  console.error(`\n❌ Token check failed: ${violationsCount} hardcoded hex color(s) found outside allowed files.`);
  process.exit(1);
} else {
  console.log('✅ Token check passed: No unauthorized hardcoded hex colors found.');
}

