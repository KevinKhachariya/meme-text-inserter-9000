/**
 * Text layer management — add, edit, select, render overlays, drag, recording.
 */
import { state, uid, selected } from './state.js';
import { els } from './dom.js';
import { escapeHtml, shadowCss, imageRect } from './utils.js';
import { tickSound } from './audio.js';

/* ------------------------------------------------------------------ */
/*  Add a new text layer                                              */
/* ------------------------------------------------------------------ */
export function addText() {
  const n = state.overlays.length + 1;
  state.overlays.push({
    id: uid(),
    text: n === 1 ? 'TOP TEXT' : `TEXT ${n}`,
    x: 0.12,
    y: Math.min(0.12 + (n - 1) * 0.12, 0.75),
    move: false,
    path: [],
    start: 0,
    end: state.duration,
    fontSizePx: 48,
    color: '#ffffff',
    outlineColor: '#000000',
    outlineWidth: 3,
    enabled: true,
  });
  state.selectedId = state.overlays[state.overlays.length - 1].id;
  render(); // imported from main at runtime
}

/* ------------------------------------------------------------------ */
/*  Update selected overlay's properties                              */
/* ------------------------------------------------------------------ */
export function updateSelected(patch) {
  const overlay = selected();
  if (!overlay) return;
  Object.assign(overlay, patch);
  overlay.start = 0;
  overlay.end = state.duration;
  render();
}

/* ------------------------------------------------------------------ */
/*  Render the text layer list in the workflow panel                  */
/* ------------------------------------------------------------------ */
export function renderList() {
  els.textList.innerHTML = '';
  state.overlays.forEach((overlay, index) => {
    const item = document.createElement('div');
    item.className = 'textItem' + (overlay.id === state.selectedId ? ' selected' : '');
    item.innerHTML = `
      <div>
        <div>${escapeHtml(overlay.text || `Text ${index + 1}`)}</div>
        <small>${overlay.path?.length ? `${overlay.path.length} path points` : 'Always visible'}</small>
      </div>
      <button type="button">${overlay.enabled === false ? 'Show' : 'Hide'}</button>
    `;
    item.addEventListener('click', () => { state.selectedId = overlay.id; render(); });
    item.querySelector('button').addEventListener('click', (event) => {
      event.stopPropagation();
      overlay.enabled = overlay.enabled === false;
      render();
    });
    els.textList.appendChild(item);
  });
}

/* ------------------------------------------------------------------ */
/*  Render the text editor popover                                     */
/* ------------------------------------------------------------------ */
export function renderEditor() {
  const overlay = selected();
  els.textPopover.hidden = !overlay;
  els.editor.hidden = !overlay;
  els.editorEmpty.hidden = !!overlay;
  if (!overlay) return;

  els.textValue.value = overlay.text;
  els.fontSizeValue.value = Math.round(getFontSizePx(overlay));
  els.colorValue.value = overlay.color;
  els.outlineColorValue.value = overlay.outlineColor;
  els.outlineWidthValue.value = overlay.outlineWidth;
  els.enabledValue.checked = overlay.enabled !== false;
  els.moveValue.checked = !!overlay.move;
  els.recordOptions.hidden = !overlay.move;
  const pointCount = overlay.path?.length || 0;
  const duration = pointCount > 1 ? overlay.path[pointCount - 1].t : 0;
  els.recordMeta.textContent = pointCount
    ? `Recorded ${pointCount} points over ${duration.toFixed(2)}s. Drag again to add more.`
    : 'Position text where it should start, enable recording, then drag. The GIF restarts from frame 0 to help you sync path points.';
}

/* ------------------------------------------------------------------ */
/*  Render text overlays on the stage                                  */
/* ------------------------------------------------------------------ */
export function renderOverlays() {
  els.overlayLayer.innerHTML = '';
  if (!state.file) return;
  const rect = imageRect();
  for (const overlay of state.overlays) {
    if (overlay.enabled === false) continue;
    const div = document.createElement('div');
    div.className = 'overlayText' + (overlay.id === state.selectedId ? ' selected' : '');
    div.textContent = overlay.text;
    div.style.left = `${rect.left + overlay.x * rect.width}px`;
    div.style.top = `${rect.top + overlay.y * rect.height}px`;
    div.style.fontSize = `${previewFontSizePx(overlay, rect)}px`;
    div.style.color = overlay.color;
    div.style.textShadow = shadowCss(overlay.outlineColor, overlay.outlineWidth);
    div.dataset.id = overlay.id;
    div.addEventListener('pointerdown', startDrag);
    els.overlayLayer.appendChild(div);
  }
}

/* ------------------------------------------------------------------ */
/*  Font-size helpers                                                 */
/* ------------------------------------------------------------------ */
export function getFontSizePx(overlay) {
  if (Number.isFinite(Number(overlay.fontSizePx))) return Number(overlay.fontSizePx);
  return Math.max(8, Math.round((Number(overlay.fontSize) || 0.075) * (state.file?.width || 640)));
}

function previewFontSizePx(overlay, rect) {
  const sourceWidth = state.file?.width || rect.width || 1;
  return Math.max(8, getFontSizePx(overlay) * rect.width / sourceWidth);
}

/* ------------------------------------------------------------------ */
/*  Record path point (called during drag)                             */
/* ------------------------------------------------------------------ */
export function recordPoint(overlay, x, y, force = false) {
  if (!overlay.move) return;
  const path = overlay.path ||= [];
  const last = path[path.length - 1];
  const now = performance.now();
  if (path.length === 1) path[0].t = 0;
  const t = (now - (state._recordStart || now)) / 1000;
  const moved = !last || Math.hypot(x - last.x, y - last.y) > 0.003;
  const waited = !last || (now - (state._recordLastMs || 0)) > 80;
  if (!force && (!moved || !waited)) return;
  if (!path.length) {
    state._recordStart = now;
    path.push({ t: 0, x, y });
  } else {
    path.push({ t: Number(t.toFixed(3)), x, y });
  }
  if (path.length > 180) path.splice(1, path.length - 180);
  state._recordLastMs = now;
}

/* ------------------------------------------------------------------ */
/*  Drag a text overlay — handles repositioning and recording          */
/* ------------------------------------------------------------------ */
export function startDrag(event) {
  tickSound('click');
  const overlay = state.overlays.find(o => o.id === event.currentTarget.dataset.id);
  if (!overlay) return;
  state.selectedId = overlay.id;

  // Restart GIF loop if recording movement
  if (overlay.move && state.file?.type === 'gif' && state.file?.url) {
    els.baseImage.src = state.file.url;
  }

  const rect = imageRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const originalX = overlay.x;
  const originalY = overlay.y;
  recordPoint(overlay, overlay.x, overlay.y, true);

  event.currentTarget.setPointerCapture(event.pointerId);
  const move = (e) => {
    const nextX = Math.max(0, Math.min(0.98, originalX + (e.clientX - startX) / rect.width));
    const nextY = Math.max(0, Math.min(0.98, originalY + (e.clientY - startY) / rect.height));
    overlay.x = nextX;
    overlay.y = nextY;
    recordPoint(overlay, nextX, nextY);
    render();
  };
  const up = () => {
    recordPoint(overlay, overlay.x, overlay.y, true);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    render();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  render();
}

// Import render from main — set once at init
let render = () => {};
export function setRender(fn) { render = fn; }
