# Fitfolio — Smart Wardrobe Manager

A premium wardrobe management system with outfit suggestions, trend matching, calendar scheduling, and fashion discovery.

## Features

- **Wardrobe Cabinet** — Add, organize, and browse your clothing items with images
- **Outfit Builder** — AI-powered outfit suggestions with compatibility scoring
- **Calendar Planner** — Schedule outfits for any day with month/week views
- **Trend Radar** — Curated fashion trends matched against your wardrobe
- **Trend Discovery** — Live fashion image search powered by Pexels API
- **Multi-Profile** — Multiple user profiles with regional trend filtering
- **Themed UX** — Dark/light modes, wood-grain cabinet design, custom string cursor

## Tech Stack

- **Frontend:** Vanilla JS + Vite + CSS
- **Backend:** Flask (Python) — for trend search API
- **Storage:** localStorage + IndexedDB (images)
- **Fonts:** Playfair Display + Inter (Google Fonts)

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Serve production build (with search API)
python server.py
```

## Deploy on Netlify

1. Push to GitHub
2. Connect repo on [app.netlify.com](https://app.netlify.com)
3. Build settings are auto-detected from `netlify.toml`
4. Deploy — the core app works fully on Netlify

> **Note:** The trend discovery search requires the Flask backend (`python server.py`). On Netlify, the core app (wardrobe, outfits, calendar, built-in trends) works perfectly — only the live search feature needs the backend running separately.

## License

MIT
