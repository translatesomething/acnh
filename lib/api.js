// Data layer. The site reads static JSON snapshots from /data (public/data), which
// `npm run fetch-data` (scripts/fetch-data.mjs) downloads from the Nookipedia API.
// The browser never calls the API, so there is no API key in the client, no CORS
// preflight and nothing to rate limit. Data credit: Nookipedia (https://nookipedia.com).

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const DATA_TIMEOUT = 30000;

// ─── Loading ───────────────────────────────────────────────────────────────

function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal })
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

// One request per dataset for the whole session. Callers share the parsed arrays
// and must not modify them in place.
const datasets = new Map();

function loadData(name) {
  let request = datasets.get(name);
  if (!request) {
    request = fetchWithTimeout(`${BASE_PATH}/data/${name}.json`, DATA_TIMEOUT)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .catch((error) => {
        datasets.delete(name); // allow a retry on the next call
        console.error(`Error loading ${name}:`, error);
        throw error;
      });
    datasets.set(name, request);
  }
  return request;
}

/** Items of a dataset, optionally only one category (case-insensitive). */
async function itemsOf(dataset, category) {
  const list = await loadData(dataset);
  const wanted = category?.toLowerCase();
  return wanted ? list.filter((item) => String(item?.category).toLowerCase() === wanted) : list;
}

async function findByName(dataset, name) {
  const list = await loadData(dataset);
  return list.find((item) => item?.name === name) ?? null;
}

// ─── Villagers ─────────────────────────────────────────────────────────────

export const getVillagers = () => loadData('villagers');

// ─── Critters ──────────────────────────────────────────────────────────────

/** @param {'fish' | 'bugs' | 'sea'} type */
export const getCritters = (type) => loadData(type);

// ─── Events ────────────────────────────────────────────────────────────────

export const getEvents = () => loadData('events');

// ─── Museum ────────────────────────────────────────────────────────────────

export const getArt = () => loadData('art');
export const getGyroids = () => loadData('gyroids');

export async function getFossils() {
  const [individuals, groups] = await Promise.all([loadData('fossils-individuals'), loadData('fossils-groups')]);
  return { individuals, groups };
}

// ─── Catalog: Furniture ────────────────────────────────────────────────────

export const FURNITURE_CATEGORIES = ['Housewares', 'Miscellaneous', 'Wall-mounted', 'Ceiling decor'];
export const FURNITURE_COLORS = ['Aqua','Beige','Black','Blue','Brown','Colorful','Gray','Green','Orange','Pink','Purple','Red','White','Yellow'];

export const getFurnitureByCategory = (category) => itemsOf('furniture', category);
export const getFurnitureItem = (name) => findByName('furniture', name);

// ─── Catalog: Clothing ────────────────────────────────────────────────────

export const CLOTHING_CATEGORIES = ['Tops', 'Bottoms', 'Dress-up', 'Headwear', 'Accessories', 'Socks', 'Shoes', 'Bags', 'Umbrellas'];
export const CLOTHING_STYLES = ['Active', 'Cool', 'Cute', 'Elegant', 'Gorgeous', 'Simple'];
export const CLOTHING_LABEL_THEMES = ['Comfy', 'Everyday', 'Fairy tale', 'Formal', 'Goth', 'Outdoorsy', 'Party', 'Sporty', 'Theatrical', 'Vacation', 'Work'];

export const getClothingByCategory = (category) => itemsOf('clothing', category);
export const getClothingItem = (name) => findByName('clothing', name);

// ─── Catalog: Interior ────────────────────────────────────────────────────

export const INTERIOR_CATEGORIES = ['Wallpaper', 'Floors', 'Rugs'];

export const getInteriorByCategory = (category) => itemsOf('interior', category);
export const getInteriorItem = (name) => findByName('interior', name);

// ─── Catalog: Tools ───────────────────────────────────────────────────────

export const getTools = () => loadData('tools');
export const getToolItem = (name) => findByName('tools', name);

// ─── Catalog: Misc Items ──────────────────────────────────────────────────

export const getItems = () => loadData('items');
export const getItemDetail = (name) => findByName('items', name);

// ─── Catalog: Recipes ─────────────────────────────────────────────────────

export const getRecipes = () => loadData('recipes');
export const getRecipeItem = (name) => findByName('recipes', name);

/** Recipes that use `material` (exact material name, case-insensitive). */
export async function getRecipesByMaterial(material) {
  const recipes = await loadData('recipes');
  const wanted = material.toLowerCase();
  return recipes.filter((recipe) => recipe.materials?.some((m) => m.name.toLowerCase() === wanted));
}

// ─── Catalog: Photos ──────────────────────────────────────────────────────

export const getPhotos = () => loadData('photos');
export const getPhotoItem = (name) => findByName('photos', name);
