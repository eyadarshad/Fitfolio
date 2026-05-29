// ============================================
// DripCheck — Outfits Page (SVG Icons)
// ============================================

import {
  getFilteredClothes, getOutfits, addOutfit, saveOutfit, deleteOutfit,
  getClothById, getCategoryGroup, isTopOrFullbody, isBottom, isFootwear, isAccessory,
  getGenderFilter,
} from '../store.js';
import { matchScore, getMatchType, scoreOutfit, getScoreColor, getScoreLabel } from '../utils/colorMatch.js';
import { showToast, showConfirm } from '../main.js';
import { icons } from '../utils/icons.js';

export function renderOutfits(container) {
  const gender = getGenderFilter();
  const allClothes = getFilteredClothes({ gender });
  const outfits = getOutfits();
  const savedOutfits = outfits.filter(o => o.isSaved);
  const suggestions = generateSuggestions(allClothes, outfits);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span class="page-title-icon" style="width:28px;height:28px">${icons.layers}</span>
          Outfit Lab
        </h1>
        <p class="page-subtitle">Smart matching & outfit creation</p>
      </div>
      <button class="btn btn-secondary" id="refreshSuggestions">
        <span style="width:16px;height:16px;display:flex">${icons.refresh}</span>
        New Suggestions
      </button>
    </div>

    <!-- Manual Outfit Builder -->
    <div class="outfit-builder">
      <h3>
        <span style="width:20px;height:20px;display:flex">${icons.tool}</span>
        Build Your Own Outfit
      </h3>
      <p style="color:var(--text-secondary);font-size:0.82rem;margin-top:4px;">Click each slot to pick items from your wardrobe</p>
      <div class="builder-slots">
        <div class="builder-slot">
          <div class="builder-slot-drop" id="slotTop" data-slot="top">
            <span style="width:26px;height:26px;display:flex">${icons.top}</span>
            <span>Top / Dress</span>
          </div>
          <div class="builder-slot-label">Top</div>
        </div>
        <div class="builder-slot">
          <div class="builder-slot-drop" id="slotBottom" data-slot="bottom">
            <span style="width:26px;height:26px;display:flex">${icons.bottom}</span>
            <span>Bottom</span>
          </div>
          <div class="builder-slot-label">Bottom</div>
        </div>
        <div class="builder-slot">
          <div class="builder-slot-drop" id="slotFootwear" data-slot="footwear">
            <span style="width:26px;height:26px;display:flex">${icons.shoe}</span>
            <span>Footwear</span>
          </div>
          <div class="builder-slot-label">Shoes</div>
        </div>
        <div class="builder-slot">
          <div class="builder-slot-drop" id="slotAccessory" data-slot="accessory">
            <span style="width:26px;height:26px;display:flex">${icons.accessory}</span>
            <span>Accessory</span>
          </div>
          <div class="builder-slot-label">Accessory</div>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="saveBuiltOutfit" disabled>
          <span style="width:14px;height:14px;display:flex">${icons.check}</span>
          Save Outfit
        </button>
        <button class="btn btn-secondary" id="clearBuilder">Clear</button>
      </div>
      <div id="builderScore" style="text-align:center;margin-top:var(--space-md);display:none;"></div>
    </div>

    <!-- Saved Outfits -->
    ${savedOutfits.length > 0 ? `
      <h3 style="margin-bottom:var(--space-md);display:flex;align-items:center;gap:var(--space-sm);font-family:'Playfair Display',Georgia,serif;color:var(--text-heading);">
        <span style="width:18px;height:18px;display:flex;color:var(--accent)">${icons.starFill}</span>
        Saved Outfits <span style="color:var(--text-muted);font-size:0.82rem;font-weight:400;">(${savedOutfits.length})</span>
      </h3>
      <div class="outfits-grid" style="margin-bottom:var(--space-2xl);">
        ${savedOutfits.map(o => renderOutfitCard(o, true)).join('')}
      </div>
    ` : ''}

    <!-- Smart Suggestions -->
    <h3 style="margin-bottom:var(--space-md);display:flex;align-items:center;gap:var(--space-sm);font-family:'Playfair Display',Georgia,serif;color:var(--text-heading);">
      <span style="width:18px;height:18px;display:flex;color:var(--accent)">${icons.sparkles}</span>
      Smart Suggestions <span style="color:var(--text-muted);font-size:0.82rem;font-weight:400;">AI-matched outfits</span>
    </h3>
    <div class="outfits-grid" id="suggestionsGrid">
      ${suggestions.length > 0
      ? suggestions.map(o => renderOutfitCard(o, false)).join('')
      : `<div class="empty-state">
            <div class="empty-state-icon" style="width:48px;height:48px">${icons.sparkles}</div>
            <h3>No suggestions yet</h3>
            <p>Add at least one top and one bottom to your wardrobe to get smart outfit suggestions.</p>
          </div>`
    }
    </div>
  `;

  setupBuilder(container, allClothes);
  setupOutfitCards(container, suggestions);

  container.querySelector('#refreshSuggestions').addEventListener('click', () => {
    renderOutfits(container);
    showToast('New suggestions generated!', 'info');
  });
}

function renderOutfitCard(outfit, isSaved) {
  const items = outfit.items.map(id => getClothById(id)).filter(Boolean);
  if (items.length === 0) return '';
  const score = outfit.score || 0;
  const tags = outfit.tags || [];

  return `
    <div class="outfit-card" data-outfit-id="${outfit.id}">
      <div class="outfit-preview">
        ${items.map((item, i) => `
          ${i > 0 ? '<div class="outfit-preview-divider"></div>' : ''}
          <img src="${item.imageDataUrl}" alt="${item.name}" title="${item.name}" />
        `).join('')}
      </div>
      <div class="outfit-info">
        <div class="outfit-name">${outfit.name}</div>
        <div class="outfit-match-score">
          <div class="match-bar">
            <div class="match-fill" style="width:${score}%;background:${getScoreColor(score)}"></div>
          </div>
          <span class="match-label" style="color:${getScoreColor(score)}">${score}%</span>
        </div>
        <div class="outfit-tags">
          ${tags.map(t => `<span class="outfit-tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="outfit-actions">
        ${!isSaved
      ? `<button class="btn btn-primary btn-sm save-outfit-btn" data-save="${outfit.id}">
              <span style="width:12px;height:12px;display:flex">${icons.star}</span> Save
            </button>`
      : ''
    }
        <button class="btn btn-danger btn-sm delete-outfit-btn" data-del-outfit="${outfit.id}">
          <span style="width:12px;height:12px;display:flex">${icons.trash}</span> Remove
        </button>
      </div>
    </div>
  `;
}

function setupOutfitCards(container, suggestions) {
  // Save suggestion → actually persist to DB
  container.querySelectorAll('.save-outfit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tempId = btn.dataset.save;
      // Check if it's a suggestion (temp ID) or a saved outfit
      if (tempId.startsWith('temp_')) {
        const sugg = suggestions.find(s => s.id === tempId);
        if (sugg) {
          addOutfit({ name: sugg.name, items: sugg.items, score: sugg.score, tags: sugg.tags, isSaved: true });
          showToast('Outfit saved!', 'success');
          renderOutfits(container);
        }
      } else {
        saveOutfit(tempId);
        showToast('Outfit saved!', 'success');
        renderOutfits(container);
      }
    });
  });

  container.querySelectorAll('.delete-outfit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.delOutfit;
      if (id.startsWith('temp_')) {
        // Just re-render — suggestions are ephemeral
        renderOutfits(container);
        return;
      }
      showConfirm('Remove this outfit?', 'It will be removed from saved outfits and scheduled days.', () => {
        deleteOutfit(id);
        renderOutfits(container);
        showToast('Outfit removed', 'success');
      });
    });
  });
}

// ---------- Builder ----------
const builderState = { top: null, bottom: null, footwear: null, accessory: null };

function setupBuilder(container, allClothes) {
  Object.keys(builderState).forEach(k => builderState[k] = null);
  const slots = ['top', 'bottom', 'footwear', 'accessory'];

  slots.forEach(slot => {
    const el = container.querySelector(`#slot${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    if (!el) return;

    el.addEventListener('click', () => {
      let eligible;
      switch (slot) {
        case 'top': eligible = allClothes.filter(c => isTopOrFullbody(c.category)); break;
        case 'bottom': eligible = allClothes.filter(c => isBottom(c.category)); break;
        case 'footwear': eligible = allClothes.filter(c => isFootwear(c.category)); break;
        case 'accessory': eligible = allClothes.filter(c => isAccessory(c.category)); break;
      }

      if (eligible.length === 0) { showToast(`No ${slot} items in your wardrobe yet`, 'info'); return; }

      let picker = el.querySelector('.builder-slot-select');
      if (picker) { picker.classList.toggle('open'); return; }

      picker = document.createElement('div');
      picker.className = 'builder-slot-select open';
      eligible.forEach(item => {
        const opt = document.createElement('div');
        opt.className = 'builder-select-item';
        opt.innerHTML = `<img src="${item.imageDataUrl}" alt="${item.name}"/><span>${item.name}</span>`;
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          builderState[slot] = item.id;
          el.innerHTML = `<img src="${item.imageDataUrl}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md);" />`;
          el.classList.add('filled');
          updateBuilderScore(container);
        });
        picker.appendChild(opt);
      });
      el.appendChild(picker);
    });
  });

  container.querySelector('#saveBuiltOutfit').addEventListener('click', () => {
    const itemIds = Object.values(builderState).filter(Boolean);
    if (itemIds.length < 2) { showToast('Pick at least 2 items', 'error'); return; }

    const items = itemIds.map(id => getClothById(id)).filter(Boolean);
    const hexes = items.map(i => i.colorHex);
    const score = scoreOutfit(hexes);
    const tags = items.length >= 2 ? getMatchType(items[0].colorHex, items[1].colorHex) : [];
    const name = items.map(i => i.name).slice(0, 2).join(' + ');

    addOutfit({ name, items: itemIds, score, tags, isSaved: true });
    showToast('Outfit saved!', 'success');
    renderOutfits(container);
  });

  container.querySelector('#clearBuilder').addEventListener('click', () => {
    Object.keys(builderState).forEach(k => builderState[k] = null);
    renderOutfits(container);
  });
}

function updateBuilderScore(container) {
  const itemIds = Object.values(builderState).filter(Boolean);
  const saveBtn = container.querySelector('#saveBuiltOutfit');
  const scoreDiv = container.querySelector('#builderScore');

  if (itemIds.length >= 2) {
    saveBtn.disabled = false;
    const items = itemIds.map(id => getClothById(id)).filter(Boolean);
    const hexes = items.map(i => i.colorHex);
    const score = scoreOutfit(hexes);
    scoreDiv.style.display = 'block';
    scoreDiv.innerHTML = `
      <div class="outfit-match-score" style="max-width:280px;margin:0 auto;">
        <span style="font-size:0.82rem;color:var(--text-secondary);">Match:</span>
        <div class="match-bar"><div class="match-fill" style="width:${score}%;background:${getScoreColor(score)}"></div></div>
        <span class="match-label" style="color:${getScoreColor(score)}">${score}%</span>
      </div>
    `;
  } else {
    saveBtn.disabled = true;
    scoreDiv.style.display = 'none';
  }
}

// ---------- Suggestions ----------
// IMPORTANT: Suggestions are ephemeral (in-memory only).
// They are NOT saved to localStorage until the user clicks "Save".
let tempIdCounter = 0;

function generateSuggestions(allClothes, existingOutfits) {
  const tops = allClothes.filter(c => isTopOrFullbody(c.category));
  const bottoms = allClothes.filter(c => isBottom(c.category));
  const shoes = allClothes.filter(c => isFootwear(c.category));
  const accessories = allClothes.filter(c => isAccessory(c.category));

  if (tops.length === 0 && bottoms.length === 0) return [];

  const suggestions = [];
  const existingKeys = new Set(existingOutfits.map(o => [...o.items].sort().join(',')));
  const MAX = 8;

  const combos = [];
  for (const top of tops) {
    if (getCategoryGroup(top.category) === 'fullbody') continue;
    for (const bottom of bottoms) {
      const score = matchScore(top.colorHex, bottom.colorHex);
      const tags = getMatchType(top.colorHex, bottom.colorHex);
      combos.push({ top, bottom, score, tags });
    }
  }

  // Full-body items as standalone outfits
  const fullbody = allClothes.filter(c => getCategoryGroup(c.category) === 'fullbody');
  for (const fb of fullbody) {
    combos.push({ top: fb, bottom: null, score: 85, tags: ['Full-Body'] });
  }

  combos.sort((a, b) => b.score - a.score);

  for (const combo of combos) {
    if (suggestions.length >= MAX) break;

    const items = [combo.top.id];
    if (combo.bottom) items.push(combo.bottom.id);

    // Add best-matching shoe
    if (shoes.length > 0) {
      const baseCols = [combo.top.colorHex];
      if (combo.bottom) baseCols.push(combo.bottom.colorHex);
      let bestShoe = shoes[0], bestScore = 0;
      for (const shoe of shoes) {
        const avg = baseCols.reduce((s, c) => s + matchScore(c, shoe.colorHex), 0) / baseCols.length;
        if (avg > bestScore) { bestScore = avg; bestShoe = shoe; }
      }
      items.push(bestShoe.id);
    }

    // Skip if this exact combo already exists as a saved outfit
    const key = [...items].sort().join(',');
    if (existingKeys.has(key)) continue;

    const allItems = items.map(id => getClothById(id)).filter(Boolean);
    if (allItems.length < 2) continue;
    const totalScore = scoreOutfit(allItems.map(i => i.colorHex));
    const name = combo.bottom ? `${combo.top.name} + ${combo.bottom.name}` : combo.top.name;

    // Create ephemeral suggestion object (NOT persisted)
    suggestions.push({
      id: `temp_${++tempIdCounter}`,
      name,
      items,
      score: totalScore,
      tags: combo.tags,
      isSaved: false,
    });
  }

  return suggestions;
}
