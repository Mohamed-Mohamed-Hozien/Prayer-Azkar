// Robust Arabic RTL & Safe-Area UX Linter
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

console.log('🎨 [Arabic RTL, Typography & Safe-Area UX Linter]\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ ${testName}${details ? ` (${details})` : ''}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// 1. Root HTML RTL Configuration & Mobile Meta
// ----------------------------------------------------
console.log('🌐 1. Checking Root HTML Configuration (index.html):');
const htmlPath = resolve(process.cwd(), 'index.html');
if (existsSync(htmlPath)) {
  const html = readFileSync(htmlPath, 'utf-8');

  assert(html.includes('dir="rtl"'), 'HTML tag defines dir="rtl" for right-to-left layout');
  assert(html.includes('lang="ar"'), 'HTML tag defines lang="ar" for Arabic language');
  assert(html.includes('viewport-fit=cover'), 'Viewport meta includes viewport-fit=cover for notch support');
  assert(html.includes('/fonts/fonts.css'), 'Local offline fonts stylesheet is linked');
} else {
  assert(false, 'index.html exists at workspace root');
}

// ----------------------------------------------------
// 2. Safe-Area Insets & CSS Variable Tokens
// ----------------------------------------------------
console.log('\n📐 2. Checking CSS Tokens & Safe-Area Insets (src/index.css):');
const cssPath = resolve(process.cwd(), 'src', 'index.css');
if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, 'utf-8');

  assert(css.includes('--safe-top: env(safe-area-inset-top'), 'CSS defines --safe-top with env(safe-area-inset-top)');
  assert(css.includes('--safe-bottom: env(safe-area-inset-bottom'), 'CSS defines --safe-bottom with env(safe-area-inset-bottom)');
  assert(css.includes('--font-arabic-calligraphy'), 'CSS defines --font-arabic-calligraphy token');
  assert(css.includes('--font-arabic-ui'), 'CSS defines --font-arabic-ui token');
  assert(css.includes('touch-action: manipulation'), 'CSS includes touch-action: manipulation for lag-free mobile taps');
} else {
  assert(false, 'src/index.css exists');
}

// ----------------------------------------------------
// 3. JSX Component Scan for RTL Anti-Patterns
// ----------------------------------------------------
console.log('\n🔍 3. Scanning Components for RTL Anti-Patterns:');

function getAllFiles(dir, ext = '.jsx') {
  let files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, ext));
    } else if (entry.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

const componentsDir = resolve(process.cwd(), 'src', 'components');
const jsxFiles = getAllFiles(componentsDir);

let hardcodedLTRFound = 0;
for (const file of jsxFiles) {
  const content = readFileSync(file, 'utf-8');
  const fileName = file.split(/[\\/]/).pop();

  // Check for inline style margin-left: or padding-left: that should be inline-start / inline-end
  const hasHardcodedMarginLeft = /style=\{\{[^}]*?(?<!inline)marginLeft:[^}]*?\}\}/.test(content);
  if (hasHardcodedMarginLeft) {
    hardcodedLTRFound++;
    console.warn(`  ⚠️ ${fileName}: Potential physical marginLeft instead of marginInlineStart`);
  }
}

assert(
  hardcodedLTRFound === 0,
  `Scanned ${jsxFiles.length} JSX components: Zero physical LTR margin anti-patterns detected`
);

// ----------------------------------------------------
// 4. Offline Fonts Directory Verification
// ----------------------------------------------------
console.log('\n🔤 4. Verifying Offline Fonts Bundle:');
const fontsCssPath = resolve(process.cwd(), 'public', 'fonts', 'fonts.css');
if (existsSync(fontsCssPath)) {
  const fontsCss = readFileSync(fontsCssPath, 'utf-8');
  assert(fontsCss.includes('font-family: \'Amiri\'') || fontsCss.includes('font-family: "Amiri"'), 'Offline fonts include Amiri');
  assert(fontsCss.includes('font-family: \'Noto Naskh Arabic\'') || fontsCss.includes('font-family: "Noto Naskh Arabic"'), 'Offline fonts include Noto Naskh Arabic');
  assert(fontsCss.includes('font-family: \'Outfit\'') || fontsCss.includes('font-family: "Outfit"'), 'Offline fonts include Outfit');
  assert(fontsCss.includes('font-family: \'Scheherazade New\'') || fontsCss.includes('font-family: "Scheherazade New"'), 'Offline fonts include Scheherazade New');
} else {
  assert(false, 'public/fonts/fonts.css exists');
}

console.log('\n========================================');
console.log(`🎉 Arabic RTL & UX Lint Summary:`);
console.log(`  - Total Tests  : ${totalTests}`);
console.log(`  - Passed       : ${passedTests}`);
console.log(`  - Failed       : ${failedTests}`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
