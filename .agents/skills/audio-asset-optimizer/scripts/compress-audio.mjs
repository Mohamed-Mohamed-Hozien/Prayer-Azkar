// Audio Asset Inspector & Optimization Estimator
import { readdirSync, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';

console.log('🔊 [Audio Asset Optimization & Footprint Auditor]\n');

const audioDir = resolve(process.cwd(), 'public', 'audio');

if (!existsSync(audioDir)) {
  console.error(`❌ Audio directory not found at: ${audioDir}`);
  process.exit(1);
}

const files = readdirSync(audioDir);
let totalBytes = 0;
const audioFiles = [];

for (const file of files) {
  const filePath = join(audioDir, file);
  const stats = statSync(filePath);
  if (stats.isFile()) {
    totalBytes += stats.size;
    audioFiles.push({
      name: file,
      sizeBytes: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
    });
  }
}

console.log(`Found ${audioFiles.length} audio assets in public/audio/:\n`);
console.log('| File Name | Size (MB) | Est. Optimized (96k) | Potential Savings |');
console.log('| :--- | :---: | :---: | :---: |');

let totalOptimizedBytes = 0;
for (const a of audioFiles) {
  // Estimate ~70% savings when compressed to 96kbps VBR
  const isSmallWav = a.name.endsWith('.wav') && a.sizeBytes < 100000;
  const optimizedSize = isSmallWav ? a.sizeBytes : Math.round(a.sizeBytes * 0.3);
  totalOptimizedBytes += optimizedSize;
  const optMB = (optimizedSize / (1024 * 1024)).toFixed(2);
  const savingsPct = isSmallWav ? '0%' : '-70%';
  console.log(`| \`${a.name}\` | ${a.sizeMB} MB | ${optMB} MB | **${savingsPct}** |`);
}

const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
const totalOptMB = (totalOptimizedBytes / (1024 * 1024)).toFixed(2);
const totalSavedMB = (totalMB - totalOptMB).toFixed(2);

console.log('\n========================================');
console.log(`📦 Current Audio Bundle Size: ${totalMB} MB`);
console.log(`🎯 Estimated Optimized Size : ${totalOptMB} MB`);
console.log(`🚀 Potential APK Size Savings: ~${totalSavedMB} MB (Shrinks APK from ~30MB to ~${(30 - totalSavedMB).toFixed(1)}MB)`);
console.log('========================================\n');
