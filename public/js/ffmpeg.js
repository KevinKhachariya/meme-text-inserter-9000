/**
 * FFmpeg WASM wrapper — load, render GIF, render still image, convert video.
 * All file-system operations are scoped to individual renders to avoid residue.
 */
import { state } from './state.js';
import { els, setStatus } from './dom.js';
import { outputSize } from './utils.js';

/* ------------------------------------------------------------------ */
/*  Ensure FFmpeg is loaded (lazy — first export triggers the 31 MB   */
/*  download).                                                         */
/* ------------------------------------------------------------------ */
export async function ensureFFmpeg() {
  if (state.ffmpegLoaded) return state.ffmpeg;
  if (!window.FFmpegWASM?.FFmpeg) throw new Error('FFmpeg WASM script did not load');
  const ffmpeg = state.ffmpeg || new window.FFmpegWASM.FFmpeg();
  state.ffmpeg = ffmpeg;
  ffmpeg.on('log', ({ message }) => { if (message) console.debug('[ffmpeg.wasm]', message); });
  ffmpeg.on('progress', ({ progress }) => {
    if (Number.isFinite(progress)) setStatus(`FFmpeg WASM working... ${Math.round(progress * 100)}%`);
  });
  setStatus('Loading FFmpeg WASM exporter (~31 MB first load)...');
  await ffmpeg.load({ coreURL: '/vendor/ffmpeg-core.js', wasmURL: '/vendor/ffmpeg-core.wasm' });
  state.ffmpegLoaded = true;
  return ffmpeg;
}

/* ------------------------------------------------------------------ */
/*  Convert an uploaded video to a GIF (called during file import).    */
/*  Cleans old working files before writing.                           */
/* ------------------------------------------------------------------ */
export async function convertVideoToGif(file) {
  const ffmpeg = await ensureFFmpeg();
  try { await ffmpeg.deleteFile('video-input'); } catch {}
  try { await ffmpeg.deleteFile('converted.gif'); } catch {}
  await ffmpeg.writeFile('video-input', new Uint8Array(await file.arrayBuffer()));
  await ffmpeg.exec([
    '-i', 'video-input', '-an', '-t', String(Math.min(20, Number(state.duration || 5))),
    '-vf', "fps=12,scale='min(640,iw)':-2:flags=lanczos",
    '-loop', '0', 'converted.gif',
  ]);
  const data = await ffmpeg.readFile('converted.gif');
  return new File([new Blob([data], { type: 'image/gif' })],
    `${(file.name || 'video').replace(/\.[^.]+$/, '')}-converted.gif`,
    { type: 'image/gif' });
}

/* ------------------------------------------------------------------ */
/*  Still-image render — pure canvas, no FFmpeg needed.               */
/* ------------------------------------------------------------------ */
export async function renderStillImage() {
  const { width, height } = outputSize();
  const bitmap = await createImageBitmap(state.sourceFile);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  drawOverlays(ctx, width, height, 0, false);
  const blob = await canvasToBlob(canvas, 'image/png');
  return { blob, name: `${(state.file.name || 'meme').replace(/\.[^.]+$/, '')}-meme.png` };
}

/* ------------------------------------------------------------------ */
/*  Animated GIF render — uses FFmpeg WASM for frame extraction,      */
/*  canvas for text overlay, FFmpeg for palette + final GIF.           */
/*  Working files are cleaned before each render — no residue.         */
/* ------------------------------------------------------------------ */
export async function renderAnimatedGif() {
  const ffmpeg = await ensureFFmpeg();
  const { width, height } = outputSize();
  const fps = Math.max(1, Math.min(60, Number(state.gifFps || 12)));
  const colors = Math.max(2, Math.min(256, Number(state.gifColors || 96)));
  const dither = state.gifDither || 'none';

  // Clean working files from previous renders
  try { await ffmpeg.createDir('/frames'); } catch {}
  try { await ffmpeg.createDir('/out'); } catch {}
  try { await ffmpeg.deleteFile('/input.gif'); } catch {}
  try { await ffmpeg.deleteFile('/output.gif'); } catch {}

  await ffmpeg.writeFile('/input.gif', new Uint8Array(await state.sourceFile.arrayBuffer()));
  await ffmpeg.exec(['-i', '/input.gif', '-t', String(state.duration),
    '-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos`, '/frames/frame_%05d.png']);

  const frames = (await ffmpeg.listDir('/frames'))
    .filter(f => f.name.endsWith('.png'))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!frames.length) throw new Error('No frames were extracted from the GIF/video');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  let index = 1;
  for (const frame of frames) {
    const data = await ffmpeg.readFile(`/frames/${frame.name}`);
    const bitmap = await createImageBitmap(new Blob([data], { type: 'image/png' }));
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    drawOverlays(ctx, width, height, (index - 1) / fps, true);
    const blob = await canvasToBlob(canvas, 'image/png');
    await ffmpeg.writeFile(`/out/frame_${String(index).padStart(5, '0')}.png`, new Uint8Array(await blob.arrayBuffer()));
    index++;
  }

  const paletteUse = dither === 'bayer'
    ? 'paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle'
    : `paletteuse=dither=${dither}:diff_mode=rectangle`;
  await ffmpeg.exec(['-framerate', String(fps), '-i', '/out/frame_%05d.png',
    '-filter_complex', `split[s0][s1];[s0]palettegen=max_colors=${colors}:stats_mode=diff[p];[s1][p]${paletteUse}`,
    '-loop', '0', '/output.gif']);

  const out = await ffmpeg.readFile('/output.gif');
  const blob = new Blob([out], { type: 'image/gif' });
  return {
    blob,
    name: `${(state.file.name || 'meme').replace(/\.[^.]+$/, '')}-meme.gif`,
    settingText: ` Used ${width}x${height}, ${fps} FPS, ${colors} colors.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Canvas helpers                                                    */
/* ------------------------------------------------------------------ */
export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise(resolve => canvas.toBlob(resolve, type));
}

function drawOverlays(ctx, width, height, time, animated) {
  for (const overlay of state.overlays) {
    if (overlay.enabled === false || !String(overlay.text || '').trim()) continue;
    const pos = overlayPosition(overlay, animated ? time : 0);
    const fontPx = Math.max(8, getFontSizePx(overlay) * width / (state.file?.width || width));
    ctx.font = `${fontPx}px Impact, Arial Black, sans-serif`;
    ctx.fillStyle = overlay.color || '#ffffff';
    ctx.strokeStyle = overlay.outlineColor || '#000000';
    ctx.lineWidth = Number(overlay.outlineWidth || 0) * Math.max(1, width / (state.file?.width || width));
    ctx.lineJoin = 'round';
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, overlay.text, pos.x * width, pos.y * height, width * 0.9, fontPx * 1.1, ctx.lineWidth);
  }
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, strokeWidth) {
  const lines = String(text || '').split('\n').flatMap(line => {
    const words = line.split(/\s+/);
    const out = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        out.push(current);
        current = word;
      } else current = test;
    }
    out.push(current);
    return out;
  });
  lines.forEach((line, i) => {
    const yy = y + i * lineHeight;
    if (strokeWidth > 0) ctx.strokeText(line, x, yy);
    ctx.fillText(line, x, yy);
  });
}

function overlayPosition(overlay, time) {
  if (!overlay.move || !Array.isArray(overlay.path) || overlay.path.length < 2) {
    return { x: overlay.x, y: overlay.y };
  }
  const path = overlay.path;
  const pathEnd = Math.max(0.001, path[path.length - 1].t || 0.001);
  const pathTime = Math.max(0, Math.min(pathEnd, time));
  let prev = path[0];
  for (let i = 1; i < path.length; i++) {
    const next = path[i];
    if (pathTime <= next.t) {
      const span = Math.max(0.001, next.t - prev.t);
      const p = (pathTime - prev.t) / span;
      return { x: prev.x + (next.x - prev.x) * p, y: prev.y + (next.y - prev.y) * p };
    }
    prev = next;
  }
  return { x: prev.x, y: prev.y };
}

function getFontSizePx(overlay) {
  if (Number.isFinite(Number(overlay.fontSizePx))) return Number(overlay.fontSizePx);
  return Math.max(8, Math.round((Number(overlay.fontSize) || 0.075) * (state.file?.width || 640)));
}
