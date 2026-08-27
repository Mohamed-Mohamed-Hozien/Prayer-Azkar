// Arabic RTL & Safe-Area Layout Linter
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('🎨 [Arabic RTL & Typography UX Linter]\n');

let issuesFound = 0;

// 1. Check index.html direction and viewport-fit
console.log('🌐 1. Checking index.html RTL and Viewport-Fit:');
const htmlPath = resolve(process.cwd(), 'index.html');
if (existsSync(htmlPath)) {
  const htmlContent = readFileSync(htmlPath, 'utf-8');
  if (htmlContent.includes('dir="rtl"') || htmlContent.includes('lang="ar"')) {
    console.log('  ✅ Root HTML defines lang="ar" or dir="rtl"');
  } else {
    console.warn('  ⚠️ index.html missing explicit dir="rtl" or lang="ar"');
    issuesFound++;
  }

  if (htmlContent.includes('viewport-fit=cover')) {
    console.log('  ✅ Viewport-fit=cover enabled for notch handling');
  } else {
    console.warn('  ⚠️ Viewport meta tag missing viewport-fit=cover');
  }
}

// 2. Check index.css Safe-Area and Font Stacks
console.log('\n📐 2. Checking index.css Safe-Area Insets & Font Declarations:');
const cssPath = resolve(process.cwd(), 'src', 'index.css');
if (existsSync(cssPath)) {
  const cssContent = readFileSync(cssPath, 'utf-8');

  if (cssContent.includes('--safe-top') && cssContent.includes('--safe-bottom')) {
    console.log('  ✅ Safe-area CSS variables declared (--safe-top, --safe-bottom)');
  } else {
    console.error('  ❌ Missing safe-area CSS variables');
    issuesFound++;
  }

  if (cssContent.includes('Amiri') || cssContent.includes('Noto Naskh Arabic')) {
    console.log('  ✅ Arabic calligraphy typography stack declared');
  } else {
    console.error('  ❌ Missing Arabic calligraphy typography stack');
    issuesFound++;
  }

  if (cssContent.includes('touch-action: manipulation')) {
    console.log('  ✅ Touch-action: manipulation enabled for lag-free mobile taps');
  } else {
    console.warn('  ⚠️ Touch-action optimization missing');
  }
}

console.log('\n========================================');
console.log(`🎉 Arabic RTL & UX Lint Complete: ${issuesFound === 0 ? 'All Checks Passed (0 Issues)!' : `${issuesFound} warnings found.`}`);
console.log('========================================\n');
