// ============================================
// Fitfolio — Trends Page
// ============================================

import { getFilteredClothes, getGenderFilter, getWishlist, addToWishlist, removeFromWishlist, isInWishlist, getProfileRegion, getActiveUser } from '../store.js';
import { getRelevantTrends, buildTrendOutfit, getTrendRefreshInfo } from '../utils/trends.js';
import { showToast } from '../main.js';
import { icons } from '../utils/icons.js';

export function renderTrends(container) {
  const gender = getGenderFilter();
  const userClothes = getFilteredClothes({ gender });
  const region = getProfileRegion(getActiveUser());
  const trends = getRelevantTrends(userClothes, gender, region);
  const wishlist = getWishlist();
  const refreshInfo = getTrendRefreshInfo();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span class="page-title-icon" style="width:24px;height:24px">${icons.sparkles}</span>
          Trend Radar
        </h1>
        <p class="page-subtitle">AI-curated fashion trends matched to your wardrobe</p>
        <div style="margin-top:6px;font-size:0.68rem;color:var(--accent);font-weight:600;letter-spacing:0.3px">
          ${icons.refresh ? `<span style="width:11px;height:11px;display:inline-flex;vertical-align:-2px;margin-right:3px">${icons.refresh}</span>` : ''}
          ${refreshInfo.label}
        </div>
      </div>
    </div>

    <!-- Trend Discovery Search -->
    <div class="trend-discovery">
      <div class="discovery-search">
        <input type="text" id="trendSearchInput" class="discovery-input" 
          placeholder="Search fashion... e.g. 'streetwear' or 'modest fashion'" />
        <button class="btn btn-primary discovery-go" id="discoveryGoBtn">
          <span style="width:14px;height:14px;display:flex">${icons.search || icons.sparkles}</span>
          Discover
        </button>
      </div>
      <div id="searchResultsArea"></div>
    </div>

    <!-- Wishlist Summary -->
    ${wishlist.length > 0 ? `
      <div class="trend-section wishlist-section">
        <div class="section-header">
          <h2>
            <span class="section-icon">${icons.star}</span>
            My Wishlist
          </h2>
          <span class="section-badge">${wishlist.length} item${wishlist.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="wishlist-grid">
          ${wishlist.map(w => `
            <div class="wishlist-card">
              <div class="wishlist-color" style="background:${w.colorHex}"></div>
              <div class="wishlist-info">
                <div class="wishlist-name">${w.name}</div>
                <div class="wishlist-meta">
                  <span class="wishlist-cat">${w.category}</span>
                  ${w.trendName ? `<span class="wishlist-trend">from ${w.trendName}</span>` : ''}
                </div>
              </div>
              <button class="wishlist-remove" data-remove-wish="${w.id}" title="Remove">
                <span style="width:12px;height:12px;display:flex">${icons.x}</span>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Trend Cards -->
    ${trends.length > 0 ? trends.map(trend => renderTrendCard(trend, userClothes, wishlist)).join('') : `
      <div class="empty-state">
        <div class="empty-state-icon" style="width:48px;height:48px">${icons.sparkles}</div>
        <h3>No matching trends</h3>
        <p>Add some clothes to your wardrobe to see how they match current fashion trends.</p>
      </div>
    `}
  `;

  // Wishlist remove handlers
  container.querySelectorAll('[data-remove-wish]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromWishlist(btn.dataset.removeWish);
      showToast('Removed from wishlist', 'info');
      renderTrends(container);
    });
  });

  // Add-to-wishlist handlers
  container.querySelectorAll('[data-add-wish]').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = JSON.parse(btn.dataset.addWish);
      const added = addToWishlist(data);
      if (added) {
        showToast(`${data.name} added to wishlist!`, 'success');
      } else {
        showToast('Already in wishlist', 'info');
      }
      renderTrends(container);
    });
  });

  // Section expand/collapse
  container.querySelectorAll('[data-toggle-trend]').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.trend-card');
      section.classList.toggle('expanded');
    });
  });

  // ====== Trend Discovery Search (API-powered, pagination) ======
  let currentPage = 0;
  let currentQuery = '';

  async function doTrendSearch(query, page = 0, append = false) {
    currentQuery = query;
    currentPage = page;
    const area = container.querySelector('#searchResultsArea');
    if (!area) return;

    if (!append) {
      area.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--text-muted);font-size:0.8rem">
          <div class="spinner"></div>
          Searching for "${query}"...
        </div>
      `;
    } else {
      area.querySelector('.load-more-btn')?.remove();
      const spin = document.createElement('div');
      spin.className = 'load-more-spinner';
      spin.innerHTML = '<div class="spinner"></div>';
      area.appendChild(spin);
    }

    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&region=${getProfileRegion(getActiveUser()) || 'global'}&page=${page}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!append) {
        if (!data.results || data.results.length === 0) {
          area.innerHTML = `
            <div class="search-results-header">
              <span>No results for "${query}". Try different keywords.</span>
              <button class="search-close-btn">&times;</button>
            </div>
          `;
          area.querySelector('.search-close-btn')?.addEventListener('click', () => { area.innerHTML = ''; });
          return;
        }

        area.innerHTML = `
          <div class="search-results-header">
            <span><strong>${data.results.length}</strong> trends discovered</span>
            <button class="search-close-btn">&times;</button>
          </div>
          <div class="search-cards-grid" id="searchCards">
            ${data.results.map(t => renderSearchCard(t, userClothes)).join('')}
          </div>
        `;
        area.querySelector('.search-close-btn')?.addEventListener('click', () => { area.innerHTML = ''; });
      } else {
        area.querySelector('.load-more-spinner')?.remove();
        const grid = area.querySelector('#searchCards');
        if (grid && data.results?.length) {
          grid.insertAdjacentHTML('beforeend', data.results.map(t => renderSearchCard(t, userClothes)).join(''));
        }
      }

      // Expand/collapse for cards
      area.querySelectorAll('[data-toggle-search]').forEach(h => {
        if (!h._bound) {
          h._bound = true;
          h.addEventListener('click', () => {
            h.closest('.search-result-card')?.classList.toggle('expanded');
          });
        }
      });

      // "Load More" button
      if (data.hasMore) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary load-more-btn';
        btn.style.cssText = 'width:100%;margin-top:1rem';
        btn.innerHTML = `<span style="width:14px;height:14px;display:flex">${icons.plus}</span> Load More`;
        btn.addEventListener('click', () => doTrendSearch(currentQuery, currentPage + 1, true));
        area.appendChild(btn);
      }

    } catch (err) {
      if (!append) {
        area.innerHTML = `
          <div class="search-results-header">
            <span>Search failed. Run <code>python server.py</code> and reload.</span>
            <button class="search-close-btn">&times;</button>
          </div>
        `;
        area.querySelector('.search-close-btn')?.addEventListener('click', () => { area.innerHTML = ''; });
      } else {
        area.querySelector('.load-more-spinner')?.remove();
        showToast('Failed to load more results', 'error');
      }
    }
  }

  container.querySelector('#discoveryGoBtn')?.addEventListener('click', () => {
    const q = container.querySelector('#trendSearchInput')?.value?.trim() || 'fashion trends 2026';
    doTrendSearch(q);
  });

  container.querySelector('#trendSearchInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      doTrendSearch(container.querySelector('#trendSearchInput').value.trim() || 'fashion trends 2026');
    }
  });
}

// ========== Regular Trend Card (built-in trends) ==========
function renderTrendCard(trend, userClothes, wishlist) {
  const hasClothes = userClothes.length > 0;
  const bestOutfit = hasClothes ? buildTrendOutfit(trend, userClothes) : {};
  const bestOutfitItems = Object.values(bestOutfit);

  return `
    <div class="trend-card ${hasClothes ? 'expanded' : ''}">
      <div class="trend-header" data-toggle-trend>
        <div class="trend-header-left">
          ${trend.image ? `<img class="trend-hero-img" src="${trend.image}" alt="${trend.name}" loading="lazy" />` : ''}
          <div class="trend-palette">
            ${trend.colors.slice(0, 5).map(c => `<div class="trend-swatch" style="background:${c}"></div>`).join('')}
          </div>
          <div>
            <h3 class="trend-name">${trend.name}</h3>
            <p class="trend-desc">${trend.description}</p>
          </div>
        </div>
        <div class="trend-header-right">
          ${hasClothes ? `
            <div class="trend-match-badge ${trend.ownedMatchScore >= 70 ? 'high' : trend.ownedMatchScore >= 40 ? 'mid' : 'low'}">
              ${trend.ownedMatchScore}% match
            </div>
          ` : ''}
          ${trend.trendingNow ? '<span class="trend-match-badge high" style="font-size:0.6rem">Trending Now</span>' : ''}
          <div class="trend-tags">
            ${trend.tags.map(t => `<span class="trend-tag">${t}</span>`).join('')}
          </div>
          <span class="trend-chevron">${icons.chevronDown}</span>
        </div>
      </div>

      <div class="trend-body">
        <div class="trend-section">
          <div class="section-header">
            <h4><span class="section-icon">${icons.sparkles}</span> Complete Trend Look</h4>
            <span class="section-hint">Includes items you may need to buy</span>
          </div>
          <div class="trend-items-grid">
            ${trend.suggestedItems.map(item => {
    const owned = userClothes.find(c => c.category === item.category && colorClose(c.colorHex, item.colorHex));
    const inWishlist = isInWishlist(item.name, item.category);
    return `
                <div class="trend-item-card ${owned ? 'owned' : 'missing'}">
                  <div class="trend-item-color" style="background:${item.colorHex}"></div>
                  <div class="trend-item-info">
                    <div class="trend-item-name">${item.name}</div>
                    <div class="trend-item-cat">${item.category} &middot; ${item.color}</div>
                  </div>
                  ${owned ? `
                    <div class="trend-item-status owned-status">
                      <span style="width:12px;height:12px;display:flex">${icons.check}</span> Owned
                    </div>
                  ` : `
                    <div class="trend-item-actions">
                      <span class="trend-item-status missing-status">Need</span>
                      ${!inWishlist ? `
                        <button class="btn btn-sm btn-secondary" data-add-wish='${JSON.stringify({ name: item.name, category: item.category, color: item.color, colorHex: item.colorHex, trendId: trend.id, trendName: trend.name })}'>
                          <span style="width:11px;height:11px;display:flex">${icons.plus}</span> Wishlist
                        </button>
                      ` : `
                        <span class="trend-item-status wishlisted-status">
                          <span style="width:11px;height:11px;display:flex">${icons.starFill}</span> Wishlisted
                        </span>
                      `}
                    </div>
                  `}
                </div>
              `;
  }).join('')}
          </div>
        </div>

        ${hasClothes && bestOutfitItems.length > 0 ? `
          <div class="trend-section">
            <div class="section-header">
              <h4><span class="section-icon">${icons.layers}</span> Best Match From Your Wardrobe</h4>
              <span class="section-hint">${trend.coverageScore}% coverage</span>
            </div>
            ${trend.ownedMatches.length > 0 ? `
              <div class="owned-match-grid">
                ${trend.ownedMatches.map(m => `
                  <div class="owned-match-card">
                    <img src="${m.item.imageDataUrl}" alt="${m.item.name}" class="owned-match-img" />
                    <div class="owned-match-info">
                      <div class="owned-match-name">${m.item.name}</div>
                      <div class="owned-match-fit">
                        <div class="mini-bar"><div class="mini-fill" style="width:${m.colorFit}%;background:${m.colorFit >= 70 ? 'var(--success)' : m.colorFit >= 40 ? 'var(--warning)' : 'var(--danger)'}"></div></div>
                        <span>${m.colorFit}% fit</span>
                      </div>
                      <div class="owned-match-vs">matches <strong>${m.suggested.name}</strong></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:var(--space-lg);">
                You don't have any matching items for this trend yet.
              </p>
            `}
            ${trend.missingItems.length > 0 ? `
              <div class="missing-summary">
                <span style="width:14px;height:14px;display:flex;color:var(--warning)">${icons.info}</span>
                <span>Missing ${trend.missingItems.length} item${trend.missingItems.length !== 1 ? 's' : ''}: ${trend.missingItems.map(m => m.name).join(', ')}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ========== Color utilities ==========
function colorClose(hex1, hex2) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  const d = Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
  return d < 120;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return { r: parseInt(hex.substring(0, 2), 16), g: parseInt(hex.substring(2, 4), 16), b: parseInt(hex.substring(4, 6), 16) };
}

// ========== Search Result Card (image-first grid) ==========
function renderSearchCard(trend, userClothes) {
  let matchCount = 0;
  const items = trend.suggestedItems || [];
  const total = items.length || 1;
  items.forEach(item => {
    if (userClothes.find(c => c.category === item.category && colorClose(c.colorHex || '#000', item.colorHex || '#000'))) matchCount++;
  });
  const score = Math.round((matchCount / total) * 100);

  return `
    <div class="search-result-card" data-toggle-search>
      ${trend.image ? `<img class="search-card-img" src="${trend.image}" alt="${trend.name}" loading="lazy" onerror="this.style.display='none'" />` : `
        <div class="search-card-img search-card-noimg">
          <div class="trend-palette" style="justify-content:center;padding:0.5rem 0">
            ${(trend.colors || []).slice(0, 5).map(c => `<div class="trend-swatch" style="background:${c};width:18px;height:18px"></div>`).join('')}
          </div>
        </div>
      `}
      <div class="search-card-body">
        <h4 class="search-card-title">${trend.name}</h4>
        <div class="search-card-meta">
          <span class="trend-match-badge ${score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low'}" style="font-size:0.6rem">${score}% match</span>
          ${(trend.tags || []).slice(0, 2).map(t => `<span class="trend-tag" style="font-size:0.55rem">${t}</span>`).join('')}
        </div>
        <div class="search-card-items">
          ${items.slice(0, 3).map(item => {
    const owned = userClothes.find(c => c.category === item.category && colorClose(c.colorHex || '#000', item.colorHex || '#000'));
    return `<span class="search-item-chip ${owned ? 'owned' : 'missing'}"><span class="search-item-dot" style="background:${item.colorHex || '#808080'}"></span>${item.name}</span>`;
  }).join('')}
        </div>
        ${trend.source ? `<a href="${trend.source}" target="_blank" rel="noopener" class="search-card-link">source &rarr;</a>` : ''}
      </div>
    </div>
  `;
}
