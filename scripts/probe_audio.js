import fs from 'fs';
import path from 'path';
import https from 'https';

const audioDir = path.resolve('public/audio');

const namesToProbe = [
  'a1.mp3', 'a2.mp3', 'a3.mp3', 'a4.mp3', 'a5.mp3', 'a6.mp3',
  'm1.mp3', 'm2.mp3', 'f1.mp3', 'f2.mp3',
  '1.mp3', '2.mp3', '3.mp3', '4.mp3', '5.mp3', '6.mp3', '7.mp3', '8.mp3',
  'adhan1.mp3', 'adhan2.mp3', 'makkah.mp3', 'madinah.mp3', 'mishary.mp3'
];

async function probe(name) {
  return new Promise((resolve) => {
    const url = `https://cdn.aladhan.com/audio/adhans/${name}`;
    const parsed = new URL(url);
    const options = {
      method: 'HEAD',
      hostname: parsed.hostname,
      path: parsed.pathname,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://aladhan.com/'
      }
    };
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`FOUND: ${name} (size: ${res.headers['content-length']})`);
        resolve(name);
      } else {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function main() {
  for (const n of namesToProbe) {
    await probe(n);
  }
}

main();
