<div align="center">

# ⚡ PromptLab

### A personal library to store, organize, and manage your AI prompts

[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg?style=flat-square)](LICENSE)
[![No Backend](https://img.shields.io/badge/Backend-None-00e5c5?style=flat-square)]()
[![localStorage](https://img.shields.io/badge/Storage-localStorage-7c6cfc?style=flat-square)]()

</div>

---

## 📖 What Is PromptLab?

**PromptLab** is a zero-dependency, browser-based prompt management tool built for anyone who works with AI tools — ChatGPT, Claude, Midjourney, Gemini, or anything else. It gives you a clean, fast personal library where you can write, organize, search, and reuse your best prompts without ever losing them.

There is no backend, no database, no sign-up, and no internet connection required after the initial page load. Everything lives in your browser's `localStorage` and stays completely private on your device.

---

## ✨ Features

### 🗂️ Prompt Management (Full CRUD)
Create, read, update, and delete prompts with a clean modal form. Every prompt stores:
- **Title** — a short, memorable name
- **Content** — the actual prompt text
- **Category** — Coding, Writing, Brainstorming, Debugging, or Image Generation
- **Tags** — comma-separated labels with automatic color coding
- **Date Added** — automatically recorded on creation

All data persists between browser sessions using `localStorage`, so your library survives page refreshes and browser restarts.

### 🔍 Search & Filter System
Find the right prompt instantly with three layered filters that all work together in real-time:
- **Search bar** — filters by title, content, and tags as you type (no button needed)
- **Category dropdown** — shows only prompts from the selected category
- **Tag click-to-filter** — clicking any tag badge filters all prompts that share that tag
- A live **result count** updates as filters are applied

### 📋 One-Click Copy
Every prompt card has a **Copy** button. Clicking it copies the full prompt text to your clipboard and shows a brief animated toast notification confirming the action. No selecting, no right-clicking — just click and paste.

### 🎲 Random Prompt
Hit the **Random** button to discover a prompt from your library at random. It opens in a dedicated modal showing the full content, category, tags, and date. You can copy it directly from the modal or roll again for another one.

### 🏷️ Tag System with Color Badges
Tags appear as colored pills on every card. Five preset tag names have dedicated colors:

| Tag | Color |
|-----|-------|
| `beginners` | 🟢 Green |
| `advanced` | 🔴 Red |
| `creative` | 🟣 Purple |
| `technical` | 🔵 Blue |
| `fun` | 🟠 Orange |

Any custom tags you create default to grey. Clicking a tag anywhere in the app instantly filters the card grid to that tag.

### 📄 Prompt Templates
Five professionally written starter templates are available from the **Templates** dropdown in the navbar. Clicking a template auto-fills the prompt form so you can customize and save it as your own:

| Template | Category |
|----------|----------|
| Explain Like I'm 5 | Coding |
| Code Debugger | Debugging |
| Brainstorm 10 Ideas | Brainstorming |
| Write a Tweet Thread | Writing |
| Generate Image Prompt | Image Generation |

### 💾 Import & Export
- **Export** — downloads your entire prompt library as a formatted `ai-prompts-backup.json` file with one click
- **Import** — upload a JSON backup file to restore or expand your library. Before committing, a confirmation dialog asks whether to **Merge** (add imported prompts to your existing ones) or **Replace All** (overwrite the current library). Invalid files are caught and reported gracefully.

### 🌙 Dark / Light Mode
A toggle in the top-right corner switches between:
- **Dark theme** — deep dark background, neon violet and cyan accents, optimized for low-light environments
- **Light theme** — clean white background, dark text, subtle shadows

Your preference is saved to `localStorage` and remembered on your next visit.

---

## 🖥️ Screenshots

> The app opens in dark mode by default with three example prompts pre-loaded.

```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ PromptLab    [Templates ▾] [Export] [Import] [☀️] [+ New] │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search titles, content, tags…                           │
│  [All Categories ▾]                          3 prompts  🎲  │
├──────────────────┬──────────────────┬────────────────────── ┤
│ Summarize Like   │ Refactor This    │ Cinematic Fantasy     │
│ a Pro            │ Code             │ Scene                 │
│ [Writing] #begin │ [Coding] #tech   │ [Image Gen] #creative │
│ Please summarize │ Refactor the fol │ A breathtaking fanta… │
│ Mar 20, 2025  📋✏🗑│ Mar 21, 2025  📋✏🗑│ Mar 22, 2025  📋✏🗑  │
└──────────────────┴──────────────────┴──────────────────────-┘
```

---

## 🚀 Getting Started

### Option 1 — Open Directly (Simplest)
1. Download or clone this repository
2. Open `index.html` in any modern browser
3. That's it — no build step, no server, no install

```bash
git clone https://github.com/your-username/promptlab.git
cd promptlab
open index.html        # macOS
start index.html       # Windows
xdg-open index.html   # Linux
```

### Option 2 — Local Dev Server
If you prefer a live-reload workflow:

```bash
# Using Python
python -m http.server 3000

# Using Node.js / npx
npx serve .

# Using VS Code
# Install the "Live Server" extension and click "Go Live"
```

Then visit `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```
promptlab/
├── index.html      # All markup — navbar, modals, layout, semantic HTML
├── styles.css      # Full theme system, card grid, animations, responsive design
├── app.js          # All application logic — state, CRUD, search, events
└── README.md       # This file
```

The app is intentionally kept to three files with no build tooling, no framework, and no dependencies beyond two CDN links (Font Awesome icons and Google Fonts). You can read the entire codebase in under an hour.

---

## 🏗️ Technical Details

### Data Model
Each prompt is stored as a plain JavaScript object:

```json
{
  "id": "1710000000000-abc12",
  "title": "Explain Like I'm 5",
  "category": "Coding",
  "tags": ["beginners", "fun"],
  "content": "Explain the following concept as if you're talking to a 5-year-old...",
  "dateAdded": "2025-03-22T14:30:00.000Z"
}
```

The full array of prompt objects is serialized with `JSON.stringify` and written to `localStorage` under the key `promptlab_prompts` on every create, update, or delete operation.

### Architecture
The app follows a simple **state → render** pattern with no virtual DOM:

1. `state` — a single plain object holding all runtime data (prompts, filters, modal targets)
2. Every user action mutates `state` and calls `saveToStorage()` if the data changed
3. `renderCards()` reads the current state, applies `getFilteredPrompts()`, and rebuilds the card grid from scratch

This is intentionally simple. For a local tool of this size, full DOM diffing would be over-engineering.

### Search Implementation
`getFilteredPrompts()` runs a plain JavaScript `.filter()` over the prompts array every time a filter changes. It checks three conditions simultaneously:
- Text query against `title`, `content`, and each tag string
- Category equality
- Tag equality (case-insensitive)

All three must pass for a prompt to appear in the grid.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close any open modal or dropdown |
| `Ctrl + K` / `⌘ + K` | Focus the search bar |

### Browser Compatibility
Works in all modern browsers. Requires:
- `localStorage` support
- `navigator.clipboard` API (with a `document.execCommand` fallback for older browsers)
- CSS custom properties (variables)
- CSS Grid

Tested in Chrome 120+, Firefox 121+, Safari 17+, and Edge 120+.

---

## 📤 Import / Export Format

Exported files follow this JSON structure and can be hand-edited or merged from multiple exports:

```json
[
  {
    "id": "1710000000000-abc12",
    "title": "Your Prompt Title",
    "category": "Coding",
    "tags": ["technical", "beginners"],
    "content": "The full prompt text goes here.",
    "dateAdded": "2025-03-22T14:30:00.000Z"
  }
]
```

When importing, the app validates that:
- The file is a valid JSON array
- Each item has at minimum a `title` and `content` field
- Missing optional fields (`id`, `tags`, `category`, `dateAdded`) are filled with safe defaults

---

## 🗺️ Roadmap

Possible future features — contributions welcome:

- [ ] Drag-and-drop to reorder prompts
- [ ] Prompt versioning / edit history
- [ ] Favorite / pin prompts to the top
- [ ] Prompt usage counter (how many times copied)
- [ ] Folder / collection grouping beyond categories
- [ ] Share a prompt via a URL (base64 encoded)
- [ ] Markdown preview for prompt content
- [ ] Browser extension to inject prompts directly into AI tool text fields
- [ ] Optional cloud sync via a self-hosted backend

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are all welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add: your feature description"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please keep pull requests focused on a single feature or fix. Since this project has no build step, there is no CI pipeline to satisfy — just make sure the app loads and works correctly in a browser before submitting.

---

## 📜 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it for any purpose, including commercial use, as long as the original license notice is retained.

See the [LICENSE](LICENSE) file for full terms.

---

## 🙏 Credits

Built with:
- [Font Awesome 6](https://fontawesome.com/) — icons (CDN)
- [Syne](https://fonts.google.com/specimen/Syne) — display font (Google Fonts)
- [DM Mono](https://fonts.google.com/specimen/DM+Mono) — monospace font (Google Fonts)
- [Inter](https://fonts.google.com/specimen/Inter) — UI font (Google Fonts)

No other dependencies.

---

<div align="center">
  <p>Made with ☕ and way too many AI prompts.</p>
  <p>
    <a href="#-promptlab">Back to top ↑</a>
  </p>
</div>
