// ============================================
// DripCheck — Calendar Page (Week + Month View)
// ============================================

import {
  getSchedule, setScheduleDay, clearScheduleMonth,
  getOutfits, getOutfitById, getClothById,
} from '../store.js';
import { autoSchedule, getMonthStats } from '../utils/scheduler.js';
import { showToast, showConfirm } from '../main.js';
import { icons } from '../utils/icons.js';

let currentYear, currentMonth;
let viewMode = 'month'; // 'month' or 'week'
let currentWeekStart = null; // Date object for start of the displayed week

export function renderCalendar(container) {
  const now = new Date();
  if (!currentYear) currentYear = now.getFullYear();
  if (!currentMonth && currentMonth !== 0) currentMonth = now.getMonth();
  if (!currentWeekStart) {
    // Set to Monday of current week
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart = new Date(d.setDate(diff));
    currentWeekStart.setHours(0, 0, 0, 0);
  }

  const schedule = getSchedule();
  const outfits = getOutfits();
  const monthStats = getMonthStats(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('en', { month: 'long' });

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span class="page-title-icon" style="width:24px;height:24px">${icons.calendar}</span>
          Outfit Calendar
        </h1>
        <p class="page-subtitle">Plan your daily looks ahead of time</p>
      </div>
      <div style="display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap">
        <div class="view-toggle">
          <button class="view-btn ${viewMode === 'week' ? 'active' : ''}" data-view="week">Week</button>
          <button class="view-btn ${viewMode === 'month' ? 'active' : ''}" data-view="month">Month</button>
        </div>
        <button class="btn btn-secondary" id="autoScheduleBtn">
          <span style="width:14px;height:14px;display:flex">${icons.sparkles}</span>
          Auto-Fill
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-value">${monthStats.scheduled}</div>
        <div class="stat-label">Scheduled</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${monthStats.totalDays}</div>
        <div class="stat-label">Days</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${monthStats.totalDays > 0 ? Math.round((monthStats.scheduled / monthStats.totalDays) * 100) : 0}%</div>
        <div class="stat-label">Coverage</div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="calendar-nav">
      <button class="btn btn-secondary" id="calPrev">
        <span style="width:14px;height:14px;display:flex">${icons.chevronDown}</span>
      </button>
      <h2 id="calTitle">${viewMode === 'month' ? `${monthName} ${currentYear}` : getWeekLabel()}</h2>
      <button class="btn btn-secondary" id="calNext">
        <span style="width:14px;height:14px;display:flex;transform:rotate(180deg)">${icons.chevronDown}</span>
      </button>
    </div>

    <!-- Calendar Grid -->
    <div id="calendarGrid">
      ${viewMode === 'month' ? renderMonthGrid(schedule, outfits) : renderWeekGrid(schedule, outfits)}
    </div>

    ${viewMode === 'month' ? `
      <button class="btn btn-secondary" id="clearMonthBtn" style="margin-top:var(--space-lg);width:100%">
        <span style="width:14px;height:14px;display:flex">${icons.x}</span>
        Clear ${monthName}
      </button>
    ` : ''}
  `;

  // View toggle
  container.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.view;
      renderCalendar(container);
    });
  });

  // Prev/Next
  container.querySelector('#calPrev').addEventListener('click', () => {
    if (viewMode === 'month') {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    } else {
      currentWeekStart = new Date(currentWeekStart.getTime() - 7 * 86400000);
    }
    renderCalendar(container);
  });
  container.querySelector('#calNext').addEventListener('click', () => {
    if (viewMode === 'month') {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    } else {
      currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 86400000);
    }
    renderCalendar(container);
  });

  // Auto-schedule
  container.querySelector('#autoScheduleBtn')?.addEventListener('click', () => {
    if (outfits.length === 0) { showToast('Create some outfits first!', 'error'); return; }
    autoSchedule(currentYear, currentMonth);
    showToast('Month auto-filled!', 'success');
    renderCalendar(container);
  });

  // Clear month
  container.querySelector('#clearMonthBtn')?.addEventListener('click', () => {
    showConfirm('Clear Month', `Remove all scheduled outfits for ${monthName}?`, () => {
      clearScheduleMonth(currentYear, currentMonth);
      showToast('Month cleared', 'info');
      renderCalendar(container);
    });
  });

  // Day click handlers
  attachDayHandlers(container, schedule, outfits);
}

// ========== WEEK GRID ==========
function renderWeekGrid(schedule, outfits) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let html = '<div class="week-grid">';

  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart.getTime() + i * 86400000);
    const dateStr = formatDate(d);
    const isToday = d.getTime() === today.getTime();
    const outfitId = schedule[dateStr];
    const outfit = outfitId ? getOutfitById(outfitId) : null;

    html += `
      <div class="week-day ${isToday ? 'today' : ''}" data-date="${dateStr}" data-day="${d.getDate()}">
        <div class="week-day-header">
          <span class="week-day-name">${dayNames[i]}</span>
          <span class="week-day-num">${d.getDate()}</span>
        </div>
        ${outfit ? renderWeekDayOutfit(outfit, dateStr) : `
          <div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--text-muted);font-size:0.7rem;">
            <span style="width:16px;height:16px;display:flex;margin-right:4px">${icons.plus}</span> Add
          </div>
        `}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function renderWeekDayOutfit(outfit, dateStr) {
  const items = outfit.items.map(id => getClothById(id)).filter(Boolean);
  const firstImg = items.find(i => i.imageDataUrl);
  return `
    <div class="week-day-outfit">
      ${firstImg ? `<img src="${firstImg.imageDataUrl}" alt="${outfit.name}" />` : ''}
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-heading);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${outfit.name}</div>
      <div style="font-size:0.6rem;color:var(--text-muted)">${items.length} items</div>
    </div>
    <button class="week-day-clear" data-clear-date="${dateStr}" title="Remove">&times;</button>
  `;
}

function getWeekLabel() {
  const end = new Date(currentWeekStart.getTime() + 6 * 86400000);
  const opts = { month: 'short', day: 'numeric' };
  return `${currentWeekStart.toLocaleDateString('en', opts)} — ${end.toLocaleDateString('en', { ...opts, year: 'numeric' })}`;
}

// ========== MONTH GRID ==========
function renderMonthGrid(schedule, outfits) {
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  const startIdx = firstDay === 0 ? 6 : firstDay - 1; // Monday start
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let html = '<div class="calendar-grid">';
  dayNames.forEach(d => { html += `<div class="calendar-header-cell">${d}</div>`; });

  // Empty cells
  for (let i = 0; i < startIdx; i++) {
    html += '<div class="calendar-cell empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
    const outfitId = schedule[dateStr];
    const outfit = outfitId ? getOutfitById(outfitId) : null;

    html += `
      <div class="calendar-cell ${isToday ? 'today' : ''} ${outfit ? 'has-outfit' : ''}" data-date="${dateStr}" data-day="${day}">
        <div class="calendar-day-num">${day}</div>
        ${outfit ? renderDayOutfit(outfit, dateStr) : ''}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function renderDayOutfit(outfit, dateStr) {
  const items = outfit.items.map(id => getClothById(id)).filter(Boolean);
  const firstImg = items.find(i => i.imageDataUrl);
  return `
    <div class="calendar-outfit" title="${outfit.name}">
      ${firstImg ? `<img src="${firstImg.imageDataUrl}" alt="" />` : `<div class="outfit-placeholder">${icons.layers}</div>`}
      <span class="calendar-outfit-name">${outfit.name}</span>
    </div>
  `;
}

// ========== DAY HANDLERS ==========
function attachDayHandlers(container, schedule, outfits) {
  // Month grid cells
  container.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const dateStr = cell.dataset.date;
      const dayNum = cell.dataset.day;
      showAssignPanel(container, dateStr, dayNum, outfits);
    });
  });

  // Week grid cells
  container.querySelectorAll('.week-day[data-date]').forEach(cell => {
    cell.addEventListener('click', (e) => {
      if (e.target.closest('.week-day-clear')) return;
      const dateStr = cell.dataset.date;
      const dayNum = cell.dataset.day;
      showAssignPanel(container, dateStr, dayNum, outfits);
    });
  });

  // Clear buttons in week view
  container.querySelectorAll('[data-clear-date]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setScheduleDay(btn.dataset.clearDate, null);
      showToast('Outfit removed', 'info');
      renderCalendar(container);
    });
  });
}

function showAssignPanel(container, dateStr, dayNum, outfits) {
  const existing = container.querySelector('.assign-panel');
  if (existing) existing.remove();

  const savedOutfits = outfits.filter(o => o.isSaved);
  if (savedOutfits.length === 0 && outfits.length === 0) {
    showToast('Create & save some outfits first!', 'error');
    return;
  }

  const allOutfits = outfits.length > 0 ? outfits : [];
  const panel = document.createElement('div');
  panel.className = 'assign-panel';
  panel.innerHTML = `
    <div class="assign-panel-inner">
      <div class="assign-header">
        <h3>Assign Outfit — Day ${dayNum}</h3>
        <button class="assign-close">${icons.x}</button>
      </div>
      <div class="assign-list">
        ${allOutfits.map(o => {
    const items = o.items.map(id => getClothById(id)).filter(Boolean);
    const firstImg = items.find(i => i.imageDataUrl);
    return `
            <div class="assign-option" data-assign-outfit="${o.id}">
              ${firstImg ? `<img src="${firstImg.imageDataUrl}" alt="" class="assign-thumb" />` : `<div class="assign-thumb-placeholder">${icons.layers}</div>`}
              <div>
                <div class="assign-name">${o.name}</div>
                <div class="assign-meta">${items.length} items${o.score ? ` · ${o.score}% match` : ''}</div>
              </div>
            </div>
          `;
  }).join('')}
        <div class="assign-option assign-clear" data-assign-outfit="">
          <span style="width:16px;height:16px;display:flex;color:var(--danger)">${icons.x}</span>
          <span>Clear Day</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(panel);

  panel.querySelector('.assign-close').addEventListener('click', () => panel.remove());
  panel.addEventListener('click', (e) => { if (e.target === panel) panel.remove(); });

  panel.querySelectorAll('[data-assign-outfit]').forEach(opt => {
    opt.addEventListener('click', () => {
      const id = opt.dataset.assignOutfit;
      setScheduleDay(dateStr, id || null);
      showToast(id ? 'Outfit assigned!' : 'Day cleared', id ? 'success' : 'info');
      panel.remove();
      renderCalendar(container);
    });
  });
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
