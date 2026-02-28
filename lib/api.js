const API_URL = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_URL || 'https://api.nookipedia.com';
const API_KEY = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ NOOKIPEDIA_API_KEY is not set. Please add it to .env.local file.');
}

const HEADERS = { 'X-API-KEY': API_KEY, 'Accept-Version': '1.0.0' };

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
  try {
    const res = await fetchWithTimeout(`${API_URL}/nh/${endpoint}?${url}`, { headers: HEADERS }, 20000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`Error fetching ${endpoint} names:`, e.name === 'AbortError' ? 'Request timed out' : e.message);
    throw e;
  }
}

async function fetchItemDetail(endpoint, name, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}/nh/${endpoint}/${encodeURIComponent(name)}`, { headers: HEADERS }, 10000);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

function fetchItemBatch(endpoint, names) {
  const tasks = names.map(name => () => fetchItemDetail(endpoint, name));
  return fetchWithConcurrency(tasks, 6).then(r => r.filter(Boolean));
}

async function fetchAll(endpoint, params = {}) {
  const url = new URLSearchParams(params);
  try {
    const res = await fetchWithTimeout(`${API_URL}/nh/${endpoint}?${url}`, { headers: HEADERS }, 20000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`Error fetching ${endpoint}:`, e.name === 'AbortError' ? 'Request timed out' : e.message);
    throw e;
  }
}

// ─── Villagers ─────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 20000;

export async function getVillagers() {
  try {
    const res = await fetchWithTimeout(`${API_URL}/villagers?nhdetails=true`, { headers: HEADERS }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to fetch villagers');
    return await res.json();
  } catch (error) {
    console.error('Error fetching villagers:', error);
    throw error;
  }
}

export async function getVillagerDetails(name) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/villagers?name=${encodeURIComponent(name)}&nhdetails=true`, { headers: HEADERS }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to fetch villager details');
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
  } catch (error) {
    console.error('Error fetching villager details:', error);
    throw error;
  }
}

// ─── Critters ──────────────────────────────────────────────────────────────

export async function getCritters(type) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/nh/${type}`, { headers: HEADERS }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error(`Failed to fetch ${type}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    throw error;
  }
}

// ─── Events ────────────────────────────────────────────────────────────────

export async function getEvents() {
  try {
    const res = await fetchWithTimeout(`${API_URL}/nh/events`, { headers: HEADERS }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// ─── Museum ────────────────────────────────────────────────────────────────

export async function getArt() {
  try {
    const res = await fetchWithTimeout(`${API_URL}/nh/art`, { headers: HEADERS }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to fetch art');
    return await res.json();
  } catch (error) {
    console.error('Error fetching art:', error);
    throw error;
  }
}

export async function getFossils() {
  try {
    const [individuals, groups] = await Promise.all([
      fetchWithTimeout(`${API_URL}/nh/fossils/individuals`, { headers: HEADERS }, DEFAULT_TIMEOUT).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); }),
      fetchWithTimeout(`${API_URL}/nh/fossils/groups`, { headers: HEADERS }, DEFAULT_TIMEOUT).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); }),
    ]);
    return { individuals, groups };
  } catch (error) {
    console.error('Error fetching fossils:', error);
    throw error;
  }
}

export async function getGyroids() {
  try {
    const res = await fetchWithTimeout(`${API_URL}/nh/gyroids`, { headers: HEADERS }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to fetch gyroids');
    return await res.json();
  } catch (error) {
    console.error('Error fetching gyroids:', error);
    throw error;
  }
}

// ─── Catalog: Furniture ────────────────────────────────────────────────────

export const FURNITURE_CATEGORIES = ['Housewares', 'Miscellaneous', 'Wall-mounted', 'Ceiling decor'];
export const FURNITURE_COLORS = ['Aqua','Beige','Black','Blue','Brown','Colorful','Gray','Green','Orange','Pink','Purple','Red','White','Yellow'];

export const getFurnitureNames = (cat) => fetchNames('furniture', cat ? { category: cat } : {});
export const getFurnitureItem = (name) => fetchItemDetail('furniture', name);
export const getFurnitureBatch = (names) => fetchItemBatch('furniture', names);

// ─── Catalog: Clothing ────────────────────────────────────────────────────

export const CLOTHING_CATEGORIES = ['Tops', 'Bottoms', 'Dress-up', 'Headwear', 'Accessories', 'Socks', 'Shoes', 'Bags', 'Umbrellas'];
export const CLOTHING_STYLES = ['Active', 'Cool', 'Cute', 'Elegant', 'Gorgeous', 'Simple'];
export const CLOTHING_LABEL_THEMES = ['Comfy', 'Everyday', 'Fairy tale', 'Formal', 'Goth', 'Outdoorsy', 'Party', 'Sporty', 'Theatrical', 'Vacation', 'Work'];

export const getClothingNames = (cat) => fetchNames('clothing', cat ? { category: cat } : {});

export const getClothingItem = (name) => fetchItemDetail('clothing', name);
export const getClothingBatch = (names) => fetchItemBatch('clothing', names);

export function getClothingFiltered(params = {}) {
  return fetchAll('clothing', { excludedetails: 'true', ...params });
}

// ─── Catalog: Interior ────────────────────────────────────────────────────

export const INTERIOR_CATEGORIES = ['Wallpaper', 'Floors', 'Rugs'];

export const getInteriorNames = (cat) => fetchNames('interior', cat ? { category: cat } : {});
export const getInteriorItem = (name) => fetchItemDetail('interior', name);
export const getInteriorBatch = (names) => fetchItemBatch('interior', names);

// ─── Catalog: Tools ───────────────────────────────────────────────────────

export const getTools = () => fetchAll('tools');
export const getToolItem = (name) => fetchItemDetail('tools', name);

// ─── Catalog: Misc Items ──────────────────────────────────────────────────

export const getItems = () => fetchAll('items');
export const getItemDetail = (name) => fetchItemDetail('items', name);

// ─── Catalog: Recipes ─────────────────────────────────────────────────────

export const getRecipeNames = () => fetchNames('recipes');
export const getRecipeItem = (name) => fetchItemDetail('recipes', name);
export const getRecipeBatch = (names) => fetchItemBatch('recipes', names);
export const getRecipesByMaterial = (material) => fetchAll('recipes', { material });

// ─── Catalog: Photos ──────────────────────────────────────────────────────

export const getPhotoNames = () => fetchNames('photos');
export const getPhotoItem = (name) => fetchItemDetail('photos', name);
export const getPhotoBatch = (names) => fetchItemBatch('photos', names);
