/**
 * Light / Dark mode toggle.
 * Preference is persisted in localStorage.
 */
import { state } from './state.js';
import { els, showToast } from './dom.js';
import { tickSound } from './audio.js';

export function initTheme() {
  els.themeToggleBtn.addEventListener('change', () => {
    state.theme = els.themeToggleBtn.checked ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    render();
    showToast(state.theme === 'dark' ? 'Dark mode' : 'Light mode');
    tickSound('success');
  });
}

// Import render from main — set once at init
let render = () => {};
export function setRender(fn) { render = fn; }
