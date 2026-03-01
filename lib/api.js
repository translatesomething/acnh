const API_URL = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_URL || 'https://api.nookipedia.com';
const API_KEY = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ NOOKIPEDIA_API_KEY is not set. Please add it to .env.local file.');
}

const HEADERS = { 'X-API-KEY': API_KEY, 'Accept-Version': '1.0.0' };

/** Timeout for /nh/* and /villagers (API often slow). */
const NH_TIMEOUT = 45000;
const NH_RETRY_ON_TIMEOUT = 1;

// Security note: API key is in the client bundle (NEXT_PUBLIC_*). To keep it secret,
// deploy to a Node host (e.g. Vercel without static export) and add a proxy route
// that forwards requests with a server-side key; or use an external proxy (e.g. serverless).

// ─── Generic helpers ───────────────────────────────────────────────────────

function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .then((res) => {
      clearTimeout(timer);
      return res;
    })
    .catch((e) => {
      clearTimeout(timer);
      if (e.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw e;
    });
}

async function fetchWithConcurrency(tasks, limit = 6) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

async function fetchNames(endpoint, params = {}) {
  const url = new URLSearchParams({ excludedetails: 'true', ...params });
  for (let attempt = 0; attempt <= NH_RETRY_ON_TIMEOUT; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/nh/${endpoint}?${url}`, { headers: HEADERS }, NH_TIMEOUT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      const isTimeout = e?.message === 'Request timed out. Please try again.';
      if (isTimeout && attempt < NH_RETRY_ON_TIMEOUT) continue;
      console.error(`Error fetching ${endpoint} names:`, e.name === 'AbortError' ? 'Request timed out' : e.message);
      throw e;
    }
  }
  return [];
}

/** Like fetchNames but on 5xx or timeout falls back to full list and extracts names. */
async function fetchNamesWithFallback(endpoint, params = {}) {
  const urlParams = new URLSearchParams({ excludedetails: 'true', ...params });
  let res;
  for (let attempt = 0; attempt <= NH_RETRY_ON_TIMEOUT; attempt++) {
    try {
      res = await fetchWithTimeout(`${API_URL}/nh/${endpoint}?${urlParams}`, { headers: HEADERS }, NH_TIMEOUT);
      break;
    } catch (e) {
      if (e?.message === 'Request timed out. Please try again.' && attempt < NH_RETRY_ON_TIMEOUT) continue;
      try {
        const full = await fetchAll(endpoint, params);
        return (full || []).map((x) => x?.name).filter(Boolean);
      } catch {
        console.error(`Error fetching ${endpoint} names:`, e.name === 'AbortError' ? 'Request timed out' : e.message);
        throw e;
      }
    }
  }
  if (res.ok) {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  if (res.status >= 500 && res.status < 600) {
    const full = await fetchAll(endpoint, params);
    return (full || []).map((x) => x?.name).filter(Boolean);
  }
  const err = new Error(`HTTP ${res.status}`);
  console.error(`Error fetching ${endpoint} names:`, err.message);
  throw err;
}

const ITEM_DETAIL_TIMEOUT = 20000;

async function fetchItemDetail(endpoint, name, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/nh/${endpoint}/${encodeURIComponent(name)}`, { headers: HEADERS }, ITEM_DETAIL_TIMEOUT);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (attempt < retries) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  return null;
}

function fetchItemBatch(endpoint, names) {
  const tasks = names.map(name => () => fetchItemDetail(endpoint, name));
  return fetchWithConcurrency(tasks, 4).then(r => r.filter(Boolean));
}

async function fetchAll(endpoint, params = {}, timeoutMs = NH_TIMEOUT) {
  const url = new URLSearchParams(params);
  for (let attempt = 0; attempt <= NH_RETRY_ON_TIMEOUT; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/nh/${endpoint}?${url}`, { headers: HEADERS }, timeoutMs);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      const isTimeout = e?.message === 'Request timed out. Please try again.';
      if (isTimeout && attempt < NH_RETRY_ON_TIMEOUT) continue;
      console.error(`Error fetching ${endpoint}:`, e.name === 'AbortError' ? 'Request timed out' : e.message);
      throw e;
    }
  }
  return [];
}

// ─── Villagers ─────────────────────────────────────────────────────────────

const VILLAGER_TIMEOUT = 45000;

export async function getVillagers() {
  for (let attempt = 0; attempt <= NH_RETRY_ON_TIMEOUT; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/villagers?nhdetails=true`, { headers: HEADERS }, VILLAGER_TIMEOUT);
      if (!res.ok) throw new Error('Failed to fetch villagers');
      return await res.json();
    } catch (error) {
      const isTimeout = error?.message === 'Request timed out. Please try again.';
      if (isTimeout && attempt < NH_RETRY_ON_TIMEOUT) continue;
      console.error('Error fetching villagers:', error);
      throw error;
    }
  }
  throw new Error('Failed to fetch villagers');
}

export async function getVillagerDetails(name) {
  for (let attempt = 0; attempt <= NH_RETRY_ON_TIMEOUT; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/villagers?name=${encodeURIComponent(name)}&nhdetails=true`, { headers: HEADERS }, VILLAGER_TIMEOUT);
      if (!res.ok) throw new Error('Failed to fetch villager details');
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : data;
    } catch (error) {
      const isTimeout = error?.message === 'Request timed out. Please try again.';
      if (isTimeout && attempt < NH_RETRY_ON_TIMEOUT) continue;
      console.error('Error fetching villager details:', error);
      throw error;
    }
  }
  throw new Error('Failed to fetch villager details');
}

// ─── NH helpers: retry once on timeout ─────────────────────────────────────

async function fetchNhWithRetry(urlPath, errorLabel = 'data') {
  for (let attempt = 0; attempt <= NH_RETRY_ON_TIMEOUT; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/nh/${urlPath}`, { headers: HEADERS }, NH_TIMEOUT);
      if (!res.ok) throw new Error(`Failed to fetch ${errorLabel}`);
      return await res.json();
    } catch (error) {
      const isTimeout = error?.message === 'Request timed out. Please try again.';
      if (isTimeout && attempt < NH_RETRY_ON_TIMEOUT) continue;
      console.error(`Error fetching ${errorLabel}:`, error);
      throw error;
    }
  }
  throw new Error(`Failed to fetch ${errorLabel}`);
}

// ─── Critters ──────────────────────────────────────────────────────────────

export async function getCritters(type) {
  return fetchNhWithRetry(type, type);
}

// ─── Events ────────────────────────────────────────────────────────────────

export async function getEvents() {
  return fetchNhWithRetry('events', 'events');
}

// ─── Museum ────────────────────────────────────────────────────────────────

export async function getArt() {
  return fetchNhWithRetry('art', 'art');
}

export async function getFossils() {
  for (let attempt = 0; attempt <= NH_RETRY_ON_TIMEOUT; attempt++) {
    try {
      const [individuals, groups] = await Promise.all([
        fetchWithTimeout(`${API_URL}/nh/fossils/individuals`, { headers: HEADERS }, NH_TIMEOUT).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); }),
        fetchWithTimeout(`${API_URL}/nh/fossils/groups`, { headers: HEADERS }, NH_TIMEOUT).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); }),
      ]);
      return { individuals, groups };
    } catch (error) {
      const isTimeout = error?.message === 'Request timed out. Please try again.';
      if (isTimeout && attempt < NH_RETRY_ON_TIMEOUT) continue;
      console.error('Error fetching fossils:', error);
      throw error;
    }
  }
  throw new Error('Failed to fetch fossils');
}

export async function getGyroids() {
  return fetchNhWithRetry('gyroids', 'gyroids');
}

// ─── Catalog: Furniture ────────────────────────────────────────────────────

export const FURNITURE_CATEGORIES = ['Housewares', 'Miscellaneous', 'Wall-mounted', 'Ceiling decor'];
export const FURNITURE_COLORS = ['Aqua','Beige','Black','Blue','Brown','Colorful','Gray','Green','Orange','Pink','Purple','Red','White','Yellow'];

export const getFurnitureNames = (cat) => fetchNamesWithFallback('furniture', cat ? { category: cat } : {});
export const getFurnitureItem = (name) => fetchItemDetail('furniture', name);
export const getFurnitureBatch = (names) => fetchItemBatch('furniture', names);

// ─── Catalog: Clothing ────────────────────────────────────────────────────

export const CLOTHING_CATEGORIES = ['Tops', 'Bottoms', 'Dress-up', 'Headwear', 'Accessories', 'Socks', 'Shoes', 'Bags', 'Umbrellas'];
export const CLOTHING_STYLES = ['Active', 'Cool', 'Cute', 'Elegant', 'Gorgeous', 'Simple'];
export const CLOTHING_LABEL_THEMES = ['Comfy', 'Everyday', 'Fairy tale', 'Formal', 'Goth', 'Outdoorsy', 'Party', 'Sporty', 'Theatrical', 'Vacation', 'Work'];

export const getClothingNames = (cat) => fetchNamesWithFallback('clothing', cat ? { category: cat } : {});

export const getClothingItem = (name) => fetchItemDetail('clothing', name);
export const getClothingBatch = (names) => fetchItemBatch('clothing', names);

export function getClothingFiltered(params = {}) {
  return fetchAll('clothing', { excludedetails: 'true', ...params });
}

// ─── Catalog: Interior ────────────────────────────────────────────────────

export const INTERIOR_CATEGORIES = ['Wallpaper', 'Floors', 'Rugs'];

export const getInteriorNames = (cat) => fetchNamesWithFallback('interior', cat ? { category: cat } : {});
export const getInteriorItem = (name) => fetchItemDetail('interior', name);
export const getInteriorBatch = (names) => fetchItemBatch('interior', names);

// ─── Catalog: Tools ───────────────────────────────────────────────────────

export const getTools = () => fetchAll('tools');

/** Tool names via full list (nh/tools?excludedetails=true often returns 500). */
export async function getToolNames() {
  const full = await fetchAll('tools');
  return (full || []).map(t => t?.name).filter(Boolean);
}

export const getToolItem = (name) => fetchItemDetail('tools', name);
export const getToolBatch = (names) => fetchItemBatch('tools', names);

// ─── Catalog: Misc Items ──────────────────────────────────────────────────

export const getItems = () => fetchAll('items');
export const getItemNames = () => fetchNamesWithFallback('items');
export const getItemDetail = (name) => fetchItemDetail('items', name);
export const getItemBatch = (names) => fetchItemBatch('items', names);

// ─── Catalog: Recipes ─────────────────────────────────────────────────────

export const getRecipeNames = () => fetchNamesWithFallback('recipes');
export const getRecipeItem = (name) => fetchItemDetail('recipes', name);
export const getRecipeBatch = (names) => fetchItemBatch('recipes', names);

export const getRecipesByMaterial = (material) => fetchAll('recipes', { material });

// ─── Catalog: Photos ──────────────────────────────────────────────────────

export const getPhotoNames = () => fetchNamesWithFallback('photos');
export const getPhotoItem = (name) => fetchItemDetail('photos', name);
export const getPhotoBatch = (names) => fetchItemBatch('photos', names);
