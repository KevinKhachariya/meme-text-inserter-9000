/**
 * Pure utility functions — no side effects, no DOM access.
 */
import { state } from './state.js';

export function formatBytes(bytes) {
  bytes = Number(bytes) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatTime(n) {
  return `${Number(n || 0).toFixed(2)}s`;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[ch]));
}

export function shadowCss(color, width) {
  const w = Number(width || 0);
  if (w <= 0) return 'none';
  return [
    `${w}px ${w}px 0 ${color}`,
    `${-w}px ${w}px 0 ${color}`,
    `${w}px ${-w}px 0 ${color}`,
    `${-w}px ${-w}px 0 ${color}`,
    `0 ${w}px 0 ${color}`,
    `${w}px 0 0 ${color}`,
    `0 ${-w}px 0 ${color}`,
    `${-w}px 0 0 ${color}`,
  ].join(',');
}

export function imageRect() {
  const stageRect = els.stage.getBoundingClientRect();
  const imgRect = els.baseImage.getBoundingClientRect();
  return {
    left: imgRect.left - stageRect.left,
    top: imgRect.top - stageRect.top,
    width: imgRect.width,
    height: imgRect.height,
  };
}

export function outputSize() {
  const sourceW = state.file?.width || 640;
  const sourceH = state.file?.height || 360;
  let width = Number(state.outputWidth || sourceW);
  let height = Number(state.outputHeight || sourceH);
  if (state.outputWidth && !state.outputHeight) height = Math.round(sourceH * width / sourceW);
  if (state.outputHeight && !state.outputWidth) width = Math.round(sourceW * height / sourceH);
  return { width: Math.max(16, Math.round(width)), height: Math.max(16, Math.round(height)) };
}

import { els } from './dom.js';
