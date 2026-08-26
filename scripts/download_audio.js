import fs from 'fs';
import path from 'path';
import https from 'https';

const audioDir = path.resolve('public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const downloads = [
  { name: 'azan-makkah.mp3', url: 'https://cdn.aladhan.com/audio/adhans/c2.mp3' },
  { name: 'azan-madinah.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a1.mp3' },
  { name: 'azan-alafasy.mp3', url: 'https://cdn.aladhan.com/audio/adhans/e1.mp3' },
  { name: 'azan-abdulbasit.mp3', url: 'https://cdn.aladhan.com/audio/adhans/a2.mp3' },
  { name: 'azan-alaqsa.mp3', url: 'https://cdn.aladhan.com/audio/adhans/c1.mp3' },
  { name: 'azan-fajr.mp3', url: 'https://cdn.aladhan.com/audio/adhans/f1.mp3' },
  { name: 'takbeer.mp3', url: 'https://cdn.aladhan.com/audio/adhans/t1.mp3' }
];

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://aladhan.com/'
      }
    };

    https.get(options, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed with status code: ${response.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Successfully saved: ${path.basename(dest)} (${fs.statSync(dest).size} bytes)`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  console.log('Downloading local offline audio files to public/audio/...');
  for (const item of downloads) {
    const dest = path.join(audioDir, item.name);
    try {
      await downloadFile(item.url, dest);
    } catch (e) {
      console.warn(`Could not download ${item.name} from primary:`, e.message);
    }
  }
}

main();
