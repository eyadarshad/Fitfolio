// ============================================
// Fitfolio — Main Entry (Cabinet UX)
// ============================================

import './style.css';
import { icons } from './utils/icons.js';
import { renderWardrobe } from './pages/wardrobe.js';
import { renderOutfits } from './pages/outfits.js';
import { renderCalendar } from './pages/calendar.js';
import { renderTrends } from './pages/trends.js';
import {
  on, getGenderFilter, setGenderFilter,
  getActiveUser, setActiveUser, getAllProfiles, createProfile,
  getProfileDisplayName, getProfileRegion, cleanupStaleOutfits,
} from './store.js';
import { migrateFromLocalStorage } from './utils/imageStore.js';

// Re-export for page modules
export { icons };

// ---------- Page Renderers Map ----------
const pages = {
  wardrobe: { render: renderWardrobe, containerId: 'wardrobeContent' },
  outfits: { render: renderOutfits, containerId: 'outfitsContent' },
  calendar: { render: renderCalendar, containerId: 'calendarContent' },
  trends: { render: renderTrends, containerId: 'trendsContent' },
};

let currentOpen = null;

// ---------- Click Sound (refined wood knock) ----------
let audioCtx = null;
function playClickSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;

    // Layer 1: Low thump
    const osc1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(120, t);
    osc1.frequency.exponentialRampToValueAtTime(50, t + 0.06);
    g1.gain.setValueAtTime(0.12, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(g1); g1.connect(audioCtx.destination);
    osc1.start(t); osc1.stop(t + 0.08);

    // Layer 2: High click
    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    const f2 = audioCtx.createBiquadFilter();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2000, t);
    osc2.frequency.exponentialRampToValueAtTime(400, t + 0.03);
    f2.type = 'bandpass'; f2.frequency.value = 1200; f2.Q.value = 5;
    g2.gain.setValueAtTime(0.04, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc2.connect(f2); f2.connect(g2); g2.connect(audioCtx.destination);
    osc2.start(t); osc2.stop(t + 0.04);
  } catch (e) { /* silent fail */ }
}

// ---------- Countries as SVG labels (no emojis) ----------
const COUNTRIES = [
  { code: 'global', name: 'Global', label: 'GLB' },
  { code: 'pk', name: 'Pakistan', label: 'PK' },
  { code: 'in', name: 'India', label: 'IN' },
  { code: 'sa', name: 'Saudi Arabia', label: 'SA' },
  { code: 'ae', name: 'UAE', label: 'AE' },
  { code: 'tr', name: 'Turkey', label: 'TR' },
  { code: 'us', name: 'USA', label: 'US' },
  { code: 'uk', name: 'UK', label: 'UK' },
  { code: 'fr', name: 'France', label: 'FR' },
  { code: 'kr', name: 'South Korea', label: 'KR' },
  { code: 'jp', name: 'Japan', label: 'JP' },
];

function getCountryBadge(code) {
  const c = COUNTRIES.find(x => x.code === code) || COUNTRIES[0];
  // SVG text badge — no emojis
  return `<svg viewBox="0 0 28 16" width="28" height="16" style="vertical-align:-2px">
    <rect x="0" y="0" width="28" height="16" rx="3" fill="var(--accent)" opacity="0.2"/>
    <text x="14" y="12" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent)" font-family="Inter,sans-serif">${c.label}</text>
  </svg>`;
}

// ---------- Profile Login Screen ----------
function showProfilePicker() {
  return new Promise((resolve) => {
    const existing = getActiveUser();
    if (existing) { resolve(); return; }

    const profiles = getAllProfiles();

    const overlay = document.createElement('div');
    overlay.className = 'profile-overlay';
    overlay.innerHTML = `
      <div class="profile-picker">
        <div class="profile-picker-header">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
            <rect x="4" y="3" width="24" height="26" rx="2"/>
            <line x1="16" y1="3" x2="16" y2="29"/>
            <circle cx="13" cy="16" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="19" cy="16" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
          <h2>Fitfolio</h2>
          <p>Who's getting dressed today?</p>
        </div>
        <div class="profile-list" id="profileList">
          ${profiles.map(p => `
            <button class="profile-item" data-user="${p.username}">
              <span class="profile-avatar">${p.displayName.charAt(0).toUpperCase()}</span>
              <span class="profile-name">${p.displayName}</span>
              <span class="profile-region">${getCountryBadge(p.country || 'global')}</span>
            </button>
          `).join('')}
        </div>
        <div class="profile-create">
          <input type="text" id="newProfileName" placeholder="Your name..." maxlength="20" />
          <select id="newProfileCountry" class="profile-country-select">
            ${COUNTRIES.map(c => `<option value="${c.code}">${c.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary" id="createProfileBtn">
            <span style="width:14px;height:14px;display:flex">${icons.plus}</span>
            Go
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    overlay.querySelectorAll('.profile-item').forEach(btn => {
      btn.addEventListener('click', () => {
        playClickSound();
        setActiveUser(btn.dataset.user);
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
        resolve();
      });
    });

    const input = overlay.querySelector('#newProfileName');
    const countrySelect = overlay.querySelector('#newProfileCountry');
    const createBtn = overlay.querySelector('#createProfileBtn');

    function doCreate() {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      const country = countrySelect.value;
      const result = createProfile(name, country);
      if (!result.success) {
        input.style.borderColor = 'var(--danger)';
        input.placeholder = result.error;
        input.value = '';
        return;
      }
      playClickSound();
      setActiveUser(name.trim().toLowerCase());
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      resolve();
    }

    createBtn.addEventListener('click', doCreate);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doCreate(); });
  });
}

// ---------- Splash Animation ----------
function runSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const particlesEl = document.getElementById('splashParticles');
  if (particlesEl) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDelay = `${1.4 + Math.random() * 0.8}s`;
      p.style.animationDuration = `${0.6 + Math.random() * 1.2}s`;
      p.style.width = p.style.height = `${2 + Math.random() * 4}px`;
      particlesEl.appendChild(p);
    }
  }

  setTimeout(() => { splash.classList.add('phase-keyhole'); }, 900);
  setTimeout(() => { splash.classList.add('phase-open'); }, 1500);
  setTimeout(() => {
    splash.classList.add('phase-done');
    const app = document.getElementById('app');
    app.classList.remove('app-hidden');
    app.classList.add('app-visible');
  }, 2700);
  setTimeout(() => { splash.remove(); }, 3300);
}

// ---------- Cabinet Logic ----------
function setupCabinets() {
  const cabinetRow = document.getElementById('cabinetRow');
  const backBtn = document.getElementById('backBtn');

  document.querySelectorAll('.cabinet-door').forEach(door => {
    door.addEventListener('click', () => {
      playClickSound();
      const cabinet = door.closest('.cabinet');
      const name = cabinet.dataset.cabinet;
      if (currentOpen === name) return;
      closeCabinet();

      currentOpen = name;
      cabinet.classList.add('open');
      cabinetRow.classList.add('has-open');
      backBtn.classList.add('visible');

      const page = pages[name];
      if (page) {
        const container = document.getElementById(page.containerId);
        setTimeout(() => { page.render(container); }, 300);
      }
    });
  });

  backBtn.addEventListener('click', () => { playClickSound(); closeCabinet(); });
}

function closeCabinet() {
  if (!currentOpen) return;
  const cabinet = document.querySelector(`.cabinet[data-cabinet="${currentOpen}"]`);
  const cabinetRow = document.getElementById('cabinetRow');
  const backBtn = document.getElementById('backBtn');

  if (cabinet) {
    cabinet.classList.remove('open');
    const page = pages[currentOpen];
    if (page) {
      setTimeout(() => {
        const container = document.getElementById(page.containerId);
        if (!cabinet.classList.contains('open')) container.innerHTML = '';
      }, 600);
    }
  }

  cabinetRow.classList.remove('has-open');
  backBtn.classList.remove('visible');
  currentOpen = null;
}

export function getOpenCabinet() { return currentOpen; }

export function rerenderCurrent() {
  if (!currentOpen) return;
  const page = pages[currentOpen];
  if (page) {
    const container = document.getElementById(page.containerId);
    page.render(container);
  }
}

// ---------- Theme System ----------
function applyTheme(theme) {
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  document.documentElement.setAttribute('data-theme', resolved);
  localStorage.setItem('dripcheck_theme_pref', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeSet === theme);
  });
}

function setupThemeToggle() {
  applyTheme(localStorage.getItem('dripcheck_theme_pref') || 'dark');
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeSet));
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('dripcheck_theme_pref') === 'system') applyTheme('system');
  });
}

// ---------- Gender Toggle ----------
function setupGenderToggle() {
  const toggle = document.getElementById('genderToggle');
  if (!toggle) return;
  const currentGender = getGenderFilter();
  toggle.querySelectorAll('.gender-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.gender === currentGender);
    btn.addEventListener('click', () => {
      toggle.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setGenderFilter(btn.dataset.gender);
      rerenderCurrent();
    });
  });
}

// ---------- User badge in top bar ----------
function showUserBadge() {
  const user = getActiveUser();
  if (!user) return;
  const topbar = document.querySelector('.topbar-controls');
  if (!topbar) return;
  const displayName = getProfileDisplayName(user);
  const region = getProfileRegion(user);
  const badge = document.createElement('button');
  badge.className = 'user-badge';
  badge.title = `${displayName} · Click to switch profile`;
  badge.innerHTML = `<span class="user-badge-avatar">${displayName.charAt(0).toUpperCase()}</span>${getCountryBadge(region)}`;
  badge.addEventListener('click', () => {
    playClickSound();
    localStorage.removeItem('dripcheck_active_user');
    location.reload();
  });
  topbar.insertBefore(badge, topbar.firstChild);
}

// ---------- Global click sound on interactive elements ----------
function setupGlobalClickSound() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .cabinet-door, .drawer-header, .profile-item, .btn, [data-toggle]');
    if (target) playClickSound();
  });
}

// ---------- Toast ----------
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconMap = { success: icons.check, error: icons.x, info: icons.info };
  toast.innerHTML = `<span style="width:14px;height:14px;display:flex;flex-shrink:0">${iconMap[type] || iconMap.info}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}

// ---------- Confirm ----------
export function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary confirm-cancel">Cancel</button>
        <button class="btn btn-danger confirm-ok">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm-ok').addEventListener('click', () => { overlay.remove(); onConfirm(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ---------- Debounced auto-rerender ----------
let rerenderTimer = null;
function debouncedRerender() {
  clearTimeout(rerenderTimer);
  rerenderTimer = setTimeout(() => rerenderCurrent(), 50);
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  await showProfilePicker();
  cleanupStaleOutfits();
  runSplash();
  setupThemeToggle();
  setupGenderToggle();
  setupCabinets();
  showUserBadge();
  setupGlobalClickSound();

  try { await migrateFromLocalStorage(); } catch (e) { console.warn('Migration skip:', e); }

  on('clothesChanged', debouncedRerender);
  on('outfitsChanged', debouncedRerender);
  on('scheduleChanged', debouncedRerender);
  on('wishlistChanged', debouncedRerender);
  on('genderChanged', debouncedRerender);
});
