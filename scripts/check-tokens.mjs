import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const ALLOWED_FILES = [
  path.resolve(process.cwd(), 'src/styles/globals.css'),
];

const HEX_COLOR_REGEX = /#[0-9a-fA-F]{3,8}\b/g;

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
      lines.forEach((line, index) => {
        // Ignore comments with explicit allow if needed, or check all hex
        const matches = line.match(HEX_COLOR_REGEX);
        if (matches) {
          console.error(
            `[check:tokens] Hardcoded hex color found in ${path.relative(process.cwd(), fullPath)}:${index + 1}: ${matches.join(', ')}`
          );
          violationsCount++;
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

