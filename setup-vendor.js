/**
 * Copies FFmpeg WASM vendor files from node_modules into public/vendor/.
 * Runs automatically after `npm install` via the postinstall script.
 */
const fs = require('fs');
const path = require('path');

const files = [
  ['@ffmpeg/ffmpeg/dist/umd/ffmpeg.js', 'ffmpeg.js'],
  ['@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js', '814.ffmpeg.js'],
  ['@ffmpeg/core/dist/umd/ffmpeg-core.js', 'ffmpeg-core.js'],
  ['@ffmpeg/core/dist/umd/ffmpeg-core.wasm', 'ffmpeg-core.wasm'],
];

const vendorDir = path.join(__dirname, 'public', 'vendor');
fs.mkdirSync(vendorDir, { recursive: true });

let copied = 0;
for (const [src, dest] of files) {
  const srcPath = path.join(__dirname, 'node_modules', src);
  const destPath = path.join(vendorDir, dest);
  try {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ ${dest}`);
    copied++;
  } catch (err) {
    console.error(`  ✗ ${dest} — ${err.message}`);
  }
}

console.log(`\nCopied ${copied}/${files.length} vendor files to public/vendor/`);
if (copied < files.length) process.exit(1);
