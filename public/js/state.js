/**
 * Application state — single source of truth.
 * Plain JS object so it can be serialised for debugging or
 * lifted into a Redux/VueX store when migrating to a framework.
 */
export const state = {
  file: null,
  originalFile: null,
  sourceFile: null,
  sourceObjectUrl: '',
  ffmpeg: null,
  ffmpegLoaded: false,
  overlays: [],
  selectedId: null,
  duration: 5,
  outputWidth: '',
  outputHeight: '',
  gifFps: 12,
  gifColors: 96,
  gifDither: 'none',
  targetSizeMb: '',
  currentPreviewUrl: null,
  savedItems: [],
  directoryHandle: null,
  directoryId: null,
  rendering: false,
  soundEnabled: true,
  theme: localStorage.getItem('theme') || 'dark',
  audioCtx: null,
  toastTimer: null,
  _recordStart: null,
  _recordLastMs: null,
};

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function selected() {
  return state.overlays.find(o => o.id === state.selectedId) || null;
}
