#  Fitfolio — Smart Wardrobe Manager

![Fitfolio Banner](file:///C:/Users/EYAD/.gemini/antigravity/brain/bd233636-20e7-4edc-b754-700c76d62302/cabinet_final_test_1779650011686.webp)

**Fitfolio** is a premium, high-aesthetic wardrobe management platform designed to help you curate, schedule, and discover fashion with ease. Built with a focus on immersive UX and smooth interactions, Fitfolio transforms your digital closet into a dynamic fashion hub.

---

##  Key Features

###  The Wardrobe Cabinet
A beautifully designed wood-grain cabinet interface where you can manage your clothes.
- **Visual Organization:** Categorized storage for shirts, trousers, jackets, and more.
- **Image Support:** Upload and store high-quality images of your actual garments.
- **Detailed Metadata:** Track color, season, gender, and tags for every item.

###  Smart Outfit Builder
Never wonder "what should I wear?" again.
- **AI Scoring:** Outfits are automatically generated and scored based on color harmony and style compatibility.
- **Context-Aware:** Filters suggestions based on the current season and your gender preferences.
- **Saveable Looks:** Favorite your best combinations for quick access.

###  Fashion Calendar
Plan your style journey week by week.
- **Weekly & Monthly Views:** Interactive calendar to schedule your outfits.
- **Auto-Sync:** Scheduled outfits appear directly in your daily view.
- **Stats & Insights:** Track most worn items and style diversity.

### 📡 Trend Radar & Discovery
Stay ahead of the curve with real-time fashion insights.
- **Wardrobe Matching:** Curated trends are automatically compared against your own collection to show you what you're missing.
- **Live Search:** Integrated Pexels API discovery engine to find inspiration and new styles.
- **Regional Filtering:** Global and local trends based on your profile region.

---

##  Design Philosophy

Fitfolio is built to **WOW**.
- **Modern Aesthetics:** Rich dark themes, glassmorphism, and a curated HSL color palette.
- **Dynamic Interactions:** Custom tilted-string cursor with mesh hover effects and haptic-like sound design.
- **Premium Feel:** Smooth transitions and micro-animations on every interaction.

---

##  Technical Stack

- **Frontend:** Vanilla JavaScript, Vite, CSS Grid/Flexbox.
- **Icons & Assets:** Custom SVG library + Pexels API.
- **Storage:** Namespaced LocalStorage (Profiles) + IndexedDB (High-res images).
- **Backend (Optional):** Flask (Python) for localized development.
- **Production:** Netlify Serverless Functions (Search API).

---

##  Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.x (Optional, for local server)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fitfolio.git
   cd fitfolio
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
1. Start the Vite development server:
   ```bash
   npm run dev
   ```
2. (Optional) Run the Flask API server:
   ```bash
   python server.py
   ```

---

##  Deployment

### Netlify (Recommended)
This project is pre-configured for Netlify with serverless function support.
1. Push your code to GitHub.
2. Connect your repository to Netlify.
3. The `netlify.toml` will automatically configure the build and serverless functions.
4. **Important:** Add your `PEXELS_API_KEY` to the Netlify Environment Variables.

---

##  License
Fitfolio is open-source software licensed under the [MIT License](LICENSE).

---

*“Style is a way to say who you are without having to speak.”* — Fitfolio helps you say it better.
