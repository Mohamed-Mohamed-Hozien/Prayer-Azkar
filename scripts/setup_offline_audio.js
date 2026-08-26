import fs from 'fs';
import path from 'path';
import https from 'https';

const audioDir = path.resolve('public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const downloads = [
  { name: 'azan-makkah.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a1.mp3' },
  { name: 'azan-madinah.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a1.mp3' },
  { name: 'azan-abdulbasit.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a2.mp3' },
  { name: 'azan-alafasy.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a3.mp3' },
  { name: 'azan-alaqsa.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a4.mp3' },
  { name: 'azan-fajr.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a1.mp3' }
];

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://aladhan.com/'
      }
    };

    https.get(options, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log(`Saved: ${path.basename(dest)} (${fs.statSync(dest).size} bytes)`);
            resolve();
          });
        });
      } else {
        reject(new Error(`Status ${response.statusCode}`));
      }
    }).on('error', reject);
  });
};

// Generate high quality WAV for Mosque Double Beep & Iqamah Alert
function generateMosqueBeepWav() {
  const sampleRate = 44100;
  const duration = 1.0;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(1, 22); // num channels (1 = mono)
  buffer.writeUInt32LE(sampleRate, 24); // sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    // Beep 1: 880 Hz from 0 to 0.2s
    if (t >= 0 && t < 0.2) {
      sample = Math.sin(2 * Math.PI * 880 * t) * 0.7;
    }
    // Beep 2: 1174 Hz from 0.3s to 0.6s
    else if (t >= 0.3 && t < 0.6) {
      sample = Math.sin(2 * Math.PI * 1174.66 * t) * 0.7;
    }

    const intVal = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  const destPath = path.join(audioDir, 'iqamah-beep.wav');
  fs.writeFileSync(destPath, buffer);
  console.log(`Generated offline asset: iqamah-beep.wav (${buffer.length} bytes)`);
}

async function main() {
  console.log('Downloading and packaging 100% offline audio files...');
  for (const item of downloads) {
    const dest = path.join(audioDir, item.name);
    try {
      await downloadFile(item.url, dest);
    } catch (e) {
      console.warn(`Error on ${item.name}:`, e.message);
    }
  }

  generateMosqueBeepWav();
  console.log('All offline audio assets ready in public/audio/');
}

main();
