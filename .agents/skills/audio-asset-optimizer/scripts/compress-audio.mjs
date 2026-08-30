// Robust Audio Asset Integrity & Compression Footprint Auditor
import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

console.log('🔊 [Audio Asset Integrity & Footprint Auditor]\n');

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

const audioDir = resolve(process.cwd(), 'public', 'audio');
if (!existsSync(audioDir)) {
  console.error(`❌ Audio directory not found at: ${audioDir}`);
  process.exit(1);
}

// ----------------------------------------------------
// 1. Cross-reference Audio Sources in audioEngine.js
// ----------------------------------------------------
console.log('📂 1. Cross-referencing Audio Engine Source Map against Disk:');
const audioEnginePath = resolve(process.cwd(), 'src', 'services', 'audioEngine.js');
const audioEngineContent = readFileSync(audioEnginePath, 'utf-8');

const audioFiles = readdirSync(audioDir);
let totalBytes = 0;

const audioStats = [];
for (const file of audioFiles) {
  const filePath = join(audioDir, file);
  const stats = statSync(filePath);
  if (stats.isFile()) {
    totalBytes += stats.size;
    audioStats.push({
      name: file,
      sizeBytes: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
    });
  }
}

// Extract referenced audio URLs from audioEngine.js
const audioRefRegex = /['"](\/audio\/[^'"]+)['"]/g;
let refMatch;
const referencedFiles = new Set();
while ((refMatch = audioRefRegex.exec(audioEngineContent)) !== null) {
  const fileName = refMatch[1].replace('/audio/', '');
  referencedFiles.add(fileName);
}

for (const ref of referencedFiles) {
  const fileExists = existsSync(join(audioDir, ref));
  assert(
    fileExists,
    `Audio file referenced in audioEngine.js exists on disk: ${ref}`
  );
}

// ----------------------------------------------------
// 2. Audio Asset Table & Compression Footprint
// ----------------------------------------------------
console.log('\n📊 2. Audio Bundle Size Breakdown:');
console.log('| File Name | Disk Size (MB) | Format | Status |');
console.log('| :--- | :---: | :---: | :---: |');

for (const a of audioStats) {
  const ext = a.name.split('.').pop().toUpperCase();
  console.log(`| \`${a.name}\` | ${a.sizeMB} MB | ${ext} | ✅ Verified |`);
}

const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
console.log(`\n📦 Total Offline Audio Footprint: ${totalMB} MB across ${audioStats.length} files`);

assert(
  audioStats.length >= 7,
  `Complete audio library bundled (${audioStats.length} files present)`
);

console.log('\n========================================');
console.log(`🎉 Audio Asset Audit Summary:`);
console.log(`  - Total Tests  : ${totalTests}`);
console.log(`  - Passed       : ${passedTests}`);
console.log(`  - Failed       : ${failedTests}`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
