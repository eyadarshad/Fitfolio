// ============================================
// DripCheck — Wardrobe Page (Drawer UX)
// ============================================

import {
  getFilteredClothes, addCloth, deleteCloth,
  getCategoryGroup, getGenderFilter,
} from '../store.js';
import { showToast, showConfirm } from '../main.js';
import { icons } from '../utils/icons.js';

let currentFilters = { category: 'all', search: '' };

// Category SVG icons (no emojis)
const categoryIcons = {
  tops: icons.top,
  bottoms: icons.bottom,
  fullbody: icons.dress,
  footwear: icons.shoe,
  accessories: icons.accessory,
};

const categoryLabels = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  fullbody: 'Full-Body',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

// Track which drawers are open
let openDrawers = { tops: true, bottoms: true, fullbody: false, footwear: false, accessories: false };

export function renderWardrobe(container) {
  const gender = getGenderFilter();
  currentFilters.gender = gender;

  const allClothes = getFilteredClothes({ gender });
  const searchFiltered = currentFilters.search
    ? allClothes.filter(c =>
      c.name.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
      c.color.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
      c.category.toLowerCase().includes(currentFilters.search.toLowerCase())
    )
    : allClothes;

  // Group by category
  const groups = {};
  for (const cat of ['tops', 'bottoms', 'fullbody', 'footwear', 'accessories']) {
    groups[cat] = searchFiltered.filter(c => getCategoryGroup(c.category) === cat);
  }

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span class="page-title-icon" style="width:28px;height:28px">${icons.wardrobe}</span>
          My Wardrobe
        </h1>
        <p class="page-subtitle">Manage your clothing collection</p>
      </div>
      <button class="btn btn-primary" id="addItemBtn">
        <span style="width:16px;height:16px;display:flex">${icons.plus}</span>
        Add Item
      </button>
    </div>

    <div class="stats-bar">
      <div class="stat-card">
        <span class="stat-value">${allClothes.length}</span>
        <span class="stat-label">Total Items</span>
      </div>
      ${Object.entries(groups).map(([cat, items]) => `
        <div class="stat-card">
          <span class="stat-value">${items.length}</span>
          <span class="stat-label">${categoryLabels[cat]}</span>
        </div>
      `).join('')}
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        ${icons.search}
        <input type="text" class="search-input" placeholder="Search clothes..." value="${currentFilters.search || ''}" id="clothesSearch" />
      </div>
    </div>

    <!-- Wardrobe Cabinet with Drawers -->
    <div class="wardrobe-cabinet" id="wardrobeCabinet">
      ${Object.entries(groups).map(([cat, items]) => `
        <div class="drawer ${openDrawers[cat] ? 'open' : ''}" data-drawer="${cat}">
          <div class="drawer-header" data-toggle="${cat}">
            <div class="drawer-header-left">
              <span class="drawer-icon">${categoryIcons[cat]}</span>
              <span class="drawer-title">${categoryLabels[cat]}</span>
              <span class="drawer-count">${items.length}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="drawer-handle"></div>
              <span class="drawer-chevron">${icons.chevronDown}</span>
            </div>
          </div>
          <div class="drawer-content">
            ${items.length > 0
      ? `<div class="clothes-grid">${items.map(item => renderClothingCard(item)).join('')}</div>`
      : `<div class="empty-state">
                  <div class="empty-state-icon" style="width:40px;height:40px">${categoryIcons[cat]}</div>
                  <h3>No ${categoryLabels[cat].toLowerCase()} yet</h3>
                  <p>Add ${categoryLabels[cat].toLowerCase()} to fill this drawer</p>
                </div>`
    }
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Events
  container.querySelector('#addItemBtn').addEventListener('click', openAddModal);

  container.querySelector('#clothesSearch').addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    renderWardrobe(container);
  });

  // Drawer toggles
  container.querySelectorAll('[data-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const cat = header.dataset.toggle;
      openDrawers[cat] = !openDrawers[cat];
      const drawer = header.closest('.drawer');
      drawer.classList.toggle('open', openDrawers[cat]);
    });
  });

  attachCardHandlers(container);
}

function renderClothingCard(item) {
  return `
    <div class="clothing-card" data-id="${item.id}">
      <div class="clothing-card-img-wrap">
        <img class="clothing-card-img" src="${item.imageDataUrl}" alt="${item.name}" loading="lazy" />
        <div class="clothing-card-actions">
          <button class="card-action-btn delete" data-delete="${item.id}" title="Delete">
            <span style="width:13px;height:13px;display:flex">${icons.trash}</span>
          </button>
        </div>
      </div>
      <div class="clothing-card-info">
        <div class="clothing-card-name">${item.name}</div>
        <div class="clothing-card-meta">
          <span class="color-dot" style="background:${item.colorHex}"></span>
          <span class="clothing-card-category">${item.category.replace('-', ' ')}</span>
          <span class="gender-badge ${item.gender}">${item.gender}</span>
        </div>
      </div>
    </div>
  `;
}

function attachCardHandlers(container) {
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.delete;
      showConfirm('Delete this item?', 'This will also remove it from any outfits and schedules.', () => {
        deleteCloth(id);
        renderWardrobe(container);
        showToast('Item deleted', 'success');
      });
    });
  });
}

// ---------- Add Item Modal ----------
function openAddModal() {
  const modal = document.getElementById('addItemModal');
  const form = document.getElementById('addItemForm');
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const placeholder = document.getElementById('uploadPlaceholder');

  form.reset();
  imagePreview.classList.remove('visible');
  imagePreview.src = '';
  placeholder.style.display = '';
  modal.classList.add('open');

  const close = () => modal.classList.remove('open');
  document.getElementById('closeAddModal').onclick = close;
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  uploadArea.onclick = () => imageInput.click();
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });
  imageInput.onchange = () => handleFile(imageInput.files[0]);

  let currentImageData = null;

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        currentImageData = canvas.toDataURL('image/jpeg', 0.8);
        imagePreview.src = currentImageData;
        imagePreview.classList.add('visible');
        placeholder.style.display = 'none';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    if (!currentImageData) { showToast('Please upload an image', 'error'); return; }

    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const gender = document.getElementById('itemGender').value;
    const color = document.getElementById('itemColor').value.trim();
    const colorHex = document.getElementById('itemColorPicker').value;
    const season = document.getElementById('itemSeason').value;

    if (!name) { showToast('Please enter a name', 'error'); return; }
    if (!color) { showToast('Please enter a color', 'error'); return; }

    addCloth({ name, category, gender, color, colorHex, season, imageDataUrl: currentImageData });
    showToast(`${name} added to wardrobe!`, 'success');
    close();
    renderWardrobe(document.getElementById('wardrobeContent'));
  };
}
