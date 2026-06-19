/**
 * DOM element references and shared UI helpers.
 * All element lookups happen once at startup — no querySelector at runtime.
 */
export const $ = (id) => document.getElementById(id);

export const els = {
  // header
  themeToggleBtn: $('themeToggleBtn'),
  soundToggleBtn: $('soundToggleBtn'),
  previewBtn: $('previewBtn'),

  // workflow
  fileInput: $('fileInput'),
  fileMeta: $('fileMeta'),
  durationInput: $('durationInput'),
  outputWidth: $('outputWidth'),
  outputHeight: $('outputHeight'),
  gifFps: $('gifFps'),
  gifColors: $('gifColors'),
  gifDither: $('gifDither'),
  targetSizeMb: $('targetSizeMb'),
  addTextBtn: $('addTextBtn'),

  // text list
  textList: $('textList'),

  // stage / canvas
  stage: $('stage'),
  baseImage: $('baseImage'),
  overlayLayer: $('overlayLayer'),
  status: $('status'),

  // text editor popover
  textPopover: $('textPopover'),
  editor: $('editor'),
  editorEmpty: $('editorEmpty'),
  textValue: $('textValue'),
  fontSizeValue: $('fontSizeValue'),
  colorValue: $('colorValue'),
  outlineColorValue: $('outlineColorValue'),
  outlineWidthValue: $('outlineWidthValue'),
  enabledValue: $('enabledValue'),
  moveValue: $('moveValue'),
  recordOptions: $('recordOptions'),
  clearPathBtn: $('clearPathBtn'),
  recordMeta: $('recordMeta'),
  centerBtn: $('centerBtn'),
  deleteBtn: $('deleteBtn'),

  // preview modal
  exportModal: $('exportModal'),
  exportPreviewImage: $('exportPreviewImage'),
  exportPreviewMeta: $('exportPreviewMeta'),
  saveExportBtn: $('saveExportBtn'),
  redoBtn: $('redoBtn'),
  previewSpinner: $('previewSpinner'),

  // saved bar
  savedBar: $('savedBar'),
  savedList: $('savedList'),
  savedPreview: $('savedPreview'),
  pickFolderBtn: $('pickFolderBtn'),
  folderLabel: $('folderLabel'),

  // toast
  toast: $('toast'),
};

export function setStatus(message = '', isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle('error', isError);
}

export function showToast(message) {
  if (!message) return;
  clearTimeout(state.toastTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  state.toastTimer = setTimeout(() => { els.toast.hidden = true; }, 1800);
}

export function buttonHit(el) {
  if (!el || el.disabled) return;
  el.classList.add('clicked');
  setTimeout(() => el.classList.remove('clicked'), 90);
}

// Circular dependency workaround — state is imported lazily via parameter
import { state } from './state.js';
