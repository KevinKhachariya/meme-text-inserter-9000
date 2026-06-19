# MEME Text Inserter 9000

![Demo](demo.gif)

---

## Features

- **Upload** images (PNG/JPG), GIFs, or videos (MP4/WebM) — videos are converted to GIF locally
- **Add text layers** — position by dragging, style with color, outline, and font size
- **Record movement paths** — drag text while the GIF plays to sync text with animation
- **Preview** — bottom-left popout player shows the rendered result
- **Export** — save as PNG (images) or GIF (animated), write directly to a local folder
- **Saved memes bar** — browse previously exported memes from your chosen folder, hover for enlarged preview
- **Theme** — dark/light mode toggle with persistent preference
- **Sound** — mechanical keyboard click sounds (toggle on/off)
- **Privacy-first** — no uploads to any server, everything runs in your browser

---

## Quick Start

```bash
npm install
npm start
```

`npm install` automatically copies the FFmpeg WASM files to `public/vendor/`. Open **http://localhost:9000**

---

## How It Works

```
┌──────────┐    ┌──────────┐    ┌──────────────────┐    ┌──────────┐    ┌────────┐
│ Upload   │ -> │ Add Text │ -> │ Move Text with   │ -> │ Preview  │ -> │ Save   │
│ Media    │    │ Layers   │    │ Meme Context     │    │ Result   │    │ Export │
└──────────┘    └──────────┘    └──────────────────┘    └──────────┘    └────────┘
```

1. **Upload** an image, GIF, or video (videos auto-convert to GIF via FFmpeg WASM)
2. **Add text layers** — each layer is independently styled and positioned
3. **Record movement** — enable recording, drag text while the GIF loops to set position keyframes
4. **Preview** — click the floating button, see the rendered output
5. **Save** — pick a local folder, the file is written directly to disk

---

## Project Structure

```
public/
├── index.html          # App shell
├── style.css           # All styles
├── logo.svg            # App icon / favicon
├── vendor/             # FFmpeg WASM (copied from node_modules)
│   ├── ffmpeg.js
│   ├── 814.ffmpeg.js
│   ├── ffmpeg-core.js
│   └── ffmpeg-core.wasm
└── js/                 # ES modules
    ├── main.js         # Entry point — render(), event listeners, upload logic
    ├── state.js        # Application state
    ├── dom.js          # DOM references + UI helpers
    ├── utils.js        # Pure utility functions
    ├── audio.js        # Web Audio click sounds
    ├── ffmpeg.js       # FFmpeg WASM wrapper
    ├── editor.js       # Text layer editor
    ├── preview.js      # Preview modal + save flow
    ├── saved-bar.js    # Saved memes bar + folder picker
    └── theme.js        # Dark/light toggle
server.js               # Static file server (Node.js, zero dependencies)
package.json
LICENSE                 # GPL-2.0-or-later
ATTRIBUTION.md          # Third-party license notices
```

---

## Tech Stack

- **Vanilla JS (ES modules)** — no framework, no build step
- **FFmpeg WASM** — browser-based media processing via `@ffmpeg/ffmpeg` + `@ffmpeg/core`
- **File System Access API** — write exports directly to a local folder
- **Web Audio API** — programmatic sound effects (no audio files)
- **Node.js** — minimal static file server for local development

---

## License

**GPL-2.0-or-later** — see [`LICENSE`](LICENSE) and [`ATTRIBUTION.md`](ATTRIBUTION.md).

This project uses:
- `@ffmpeg/core` (GPL-2.0-or-later) — the FFmpeg WASM binary
- `@ffmpeg/ffmpeg` (MIT) — the FFmpeg WASM JavaScript wrapper

---

## Deployment Notes

- **Browser support: File System Access API requires Chrome/Edge 86+. FFmpeg WASM works in all modern browsers.
