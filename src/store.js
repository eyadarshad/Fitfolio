// ============================================
// DripCheck — Data Store (localStorage)
// Multi-user support via client-side profiles
// ============================================

// ---------- User Profile System ----------
const PROFILES_KEY = 'dripcheck_profiles';
const ACTIVE_USER_KEY = 'dripcheck_active_user';

function getProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; } catch { return []; }
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getActiveUser() {
  return localStorage.getItem(ACTIVE_USER_KEY) || null;
}

export function setActiveUser(username) {
  localStorage.setItem(ACTIVE_USER_KEY, username);
  emit('userChanged', username);
}

export function createProfile(username, country) {
  const profiles = getProfiles();
  const clean = username.trim().toLowerCase();
  if (!clean) return { success: false, error: 'Name cannot be empty' };
  if (clean.length > 20) return { success: false, error: 'Name too long (max 20)' };
  if (profiles.some(p => p.username === clean)) return { success: false, error: 'Profile already exists' };
  profiles.push({ username: clean, displayName: username.trim(), country: country || 'global', created: Date.now() });
  saveProfiles(profiles);
  return { success: true };
}

export function deleteProfile(username) {
  let profiles = getProfiles();
  profiles = profiles.filter(p => p.username !== username);
  saveProfiles(profiles);
  // Clear all data for this user
  const prefix = `dripcheck_${username}_`;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) keysToRemove.push(key);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

export function getAllProfiles() { return getProfiles(); }

export function getProfileDisplayName(username) {
  const profiles = getProfiles();
  const p = profiles.find(pr => pr.username === username);
  return p ? p.displayName : username;
}

export function getProfileRegion(username) {
  const profiles = getProfiles();
  const p = profiles.find(pr => pr.username === (username || getActiveUser()));
  return p ? (p.country || 'global') : 'global';
}

export function setProfileRegion(username, country) {
  const profiles = getProfiles();
  const p = profiles.find(pr => pr.username === username);
  if (p) { p.country = country; saveProfiles(profiles); }
}

// ---------- Namespaced storage keys ----------
function getKey(baseKey) {
  const user = getActiveUser();
  if (!user) return baseKey; // fallback for backward compat
  return `dripcheck_${user}_${baseKey.replace('dripcheck_', '')}`;
}

const BASE_KEYS = {
  CLOTHES: 'dripcheck_clothes',
  OUTFITS: 'dripcheck_outfits',
  SCHEDULE: 'dripcheck_schedule',
  GENDER_FILTER: 'dripcheck_gender',
  WISHLIST: 'dripcheck_wishlist',
};

// ---------- Event system ----------
const listeners = {};

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
}

export function off(event, callback) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(cb => cb !== callback);
}

function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(cb => cb(data));
}

// ---------- Generic helpers ----------
function load(key) {
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(data));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Clothes CRUD ----------
export function getClothes() {
  return load(BASE_KEYS.CLOTHES) || [];
}

export function getClothById(id) {
  return getClothes().find(c => c.id === id) || null;
}

export function addCloth(item) {
  const clothes = getClothes();
  const newItem = {
    id: generateId(),
    name: item.name.trim(),
    category: item.category,
    gender: item.gender || 'unisex',
    color: item.color.trim(),
    colorHex: item.colorHex || '#888888',
    season: item.season || 'all',
    imageDataUrl: item.imageDataUrl,
    dateAdded: new Date().toISOString(),
  };
  clothes.push(newItem);
  save(BASE_KEYS.CLOTHES, clothes);
  emit('clothesChanged', clothes);
  return newItem;
}

export function updateCloth(id, updates) {
  const clothes = getClothes();
  const idx = clothes.findIndex(c => c.id === id);
  if (idx === -1) return null;
  clothes[idx] = { ...clothes[idx], ...updates };
  save(BASE_KEYS.CLOTHES, clothes);
  emit('clothesChanged', clothes);
  return clothes[idx];
}

export function deleteCloth(id) {
  let clothes = getClothes();
  clothes = clothes.filter(c => c.id !== id);
  save(BASE_KEYS.CLOTHES, clothes);

  // Also remove from any outfits and schedules
  let outfits = getOutfits();
  outfits = outfits.filter(o => !o.items.includes(id));
  save(BASE_KEYS.OUTFITS, outfits);

  const schedule = getSchedule();
  for (const date of Object.keys(schedule)) {
    const outfitExists = outfits.some(o => o.id === schedule[date]);
    if (!outfitExists) delete schedule[date];
  }
  save(BASE_KEYS.SCHEDULE, schedule);

  emit('clothesChanged', clothes);
  emit('outfitsChanged', outfits);
  emit('scheduleChanged', schedule);
}

export function getClothesByCategory(category) {
  const clothes = getClothes();
  if (!category || category === 'all') return clothes;
  return clothes.filter(c => getCategoryGroup(c.category) === category);
}

export function getClothesByGender(gender) {
  const clothes = getClothes();
  if (!gender || gender === 'all') return clothes;
  return clothes.filter(c => c.gender === gender || c.gender === 'unisex');
}

export function getFilteredClothes(filters = {}) {
  let clothes = getClothes();
  if (filters.gender && filters.gender !== 'all') {
    clothes = clothes.filter(c => c.gender === filters.gender || c.gender === 'unisex');
  }
  if (filters.category && filters.category !== 'all') {
    clothes = clothes.filter(c => getCategoryGroup(c.category) === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    clothes = clothes.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.color.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }
  if (filters.season && filters.season !== 'all') {
    clothes = clothes.filter(c => c.season === filters.season || c.season === 'all');
  }
  return clothes;
}

// ---------- Category helpers ----------
const CATEGORY_GROUPS = {
  tops: ['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie', 'jacket', 'coat', 'tank-top', 'crop-top'],
  bottoms: ['jeans', 'trousers', 'chinos', 'shorts', 'skirt', 'leggings', 'joggers'],
  fullbody: ['dress', 'jumpsuit', 'romper'],
  footwear: ['sneakers', 'boots', 'heels', 'sandals', 'loafers', 'flats'],
  accessories: ['watch', 'bag', 'hat', 'scarf', 'belt', 'jewelry', 'sunglasses', 'hijab'],
};

export function getCategoryGroup(cat) {
  for (const [group, items] of Object.entries(CATEGORY_GROUPS)) {
    if (items.includes(cat)) return group;
  }
  return 'other';
}

export function getCategoryLabel(cat) {
  const labels = {
    tops: 'Tops',
    bottoms: 'Bottoms',
    fullbody: 'Full-Body',
    footwear: 'Footwear',
    accessories: 'Accessories',
  };
  return labels[cat] || cat;
}

export function isTopOrFullbody(cat) {
  return CATEGORY_GROUPS.tops.includes(cat) || CATEGORY_GROUPS.fullbody.includes(cat);
}

export function isBottom(cat) {
  return CATEGORY_GROUPS.bottoms.includes(cat);
}

export function isFootwear(cat) {
  return CATEGORY_GROUPS.footwear.includes(cat);
}

export function isAccessory(cat) {
  return CATEGORY_GROUPS.accessories.includes(cat);
}

// ---------- Outfits CRUD ----------
export function getOutfits() {
  return load(BASE_KEYS.OUTFITS) || [];
}

export function getOutfitById(id) {
  return getOutfits().find(o => o.id === id) || null;
}

export function addOutfit(outfit) {
  const outfits = getOutfits();
  const newOutfit = {
    id: generateId(),
    name: outfit.name || 'Untitled Outfit',
    items: outfit.items, // array of clothing IDs
    score: outfit.score || 0,
    tags: outfit.tags || [],
    dateCreated: new Date().toISOString(),
    isSaved: outfit.isSaved || false,
  };
  outfits.push(newOutfit);
  save(BASE_KEYS.OUTFITS, outfits);
  emit('outfitsChanged', outfits);
  return newOutfit;
}

export function saveOutfit(id) {
  const outfits = getOutfits();
  const idx = outfits.findIndex(o => o.id === id);
  if (idx === -1) return;
  outfits[idx].isSaved = true;
  save(BASE_KEYS.OUTFITS, outfits);
  emit('outfitsChanged', outfits);
}

export function deleteOutfit(id) {
  let outfits = getOutfits();
  outfits = outfits.filter(o => o.id !== id);
  save(BASE_KEYS.OUTFITS, outfits);

  // Remove from schedule
  const schedule = getSchedule();
  for (const date of Object.keys(schedule)) {
    if (schedule[date] === id) delete schedule[date];
  }
  save(BASE_KEYS.SCHEDULE, schedule);

  emit('outfitsChanged', outfits);
  emit('scheduleChanged', schedule);
}

/**
 * Cleanup: remove all unsaved outfits from DB.
 * Call this on app init to purge stale suggestions from the old bug.
 */
export function cleanupStaleOutfits() {
  const outfits = getOutfits();
  const cleaned = outfits.filter(o => o.isSaved);
  if (cleaned.length < outfits.length) {
    console.log(`Cleaned ${outfits.length - cleaned.length} stale unsaved outfits`);
    save(BASE_KEYS.OUTFITS, cleaned);
  }
}

// ---------- Schedule CRUD ----------
export function getSchedule() {
  return load(BASE_KEYS.SCHEDULE) || {};
}

export function setScheduleDay(dateStr, outfitId) {
  const schedule = getSchedule();
  if (outfitId) {
    schedule[dateStr] = outfitId;
  } else {
    delete schedule[dateStr];
  }
  save(BASE_KEYS.SCHEDULE, schedule);
  emit('scheduleChanged', schedule);
}

export function clearScheduleMonth(year, month) {
  const schedule = getSchedule();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  for (const key of Object.keys(schedule)) {
    if (key.startsWith(prefix)) delete schedule[key];
  }
  save(BASE_KEYS.SCHEDULE, schedule);
  emit('scheduleChanged', schedule);
}

// ---------- Gender filter ----------
export function getGenderFilter() {
  return load(BASE_KEYS.GENDER_FILTER) || 'all';
}

export function setGenderFilter(gender) {
  save(BASE_KEYS.GENDER_FILTER, gender);
  emit('genderChanged', gender);
}

// ---------- Wishlist CRUD ----------
export function getWishlist() {
  return load(BASE_KEYS.WISHLIST) || [];
}

export function addToWishlist(item) {
  const wishlist = getWishlist();
  // Check for duplicates by name+category
  if (wishlist.some(w => w.name === item.name && w.category === item.category)) return null;
  const newItem = {
    id: generateId(),
    name: item.name,
    category: item.category,
    color: item.color || '',
    colorHex: item.colorHex || '#888888',
    trendId: item.trendId || null,
    trendName: item.trendName || '',
    dateAdded: new Date().toISOString(),
  };
  wishlist.push(newItem);
  save(BASE_KEYS.WISHLIST, wishlist);
  emit('wishlistChanged', wishlist);
  return newItem;
}

export function removeFromWishlist(id) {
  let wishlist = getWishlist();
  wishlist = wishlist.filter(w => w.id !== id);
  save(BASE_KEYS.WISHLIST, wishlist);
  emit('wishlistChanged', wishlist);
}

export function isInWishlist(name, category) {
  return getWishlist().some(w => w.name === name && w.category === category);
}
