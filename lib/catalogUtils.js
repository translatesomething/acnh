const CACHE_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function loadSet(key) {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}

export function saveSet(key, set) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function loadCache(prefix, category) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`ct_${prefix}_${category}`);
    if (!raw) return {};
    const { v, ts, data } = JSON.parse(raw);
    if (v !== CACHE_VERSION || Date.now() - ts > CACHE_TTL) return {};
    return data || {};
  } catch { return {}; }
}

export function saveCache(prefix, category, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ct_${prefix}_${category}`, JSON.stringify({ v: CACHE_VERSION, ts: Date.now(), data }));
  } catch { /* quota exceeded */ }
}

export function clearCache(prefix, category) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`ct_${prefix}_${category}`);
}

export function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (currentPage <= 4) { for (let i = 2; i <= 5; i++) pages.push(i); pages.push('...'); pages.push(totalPages); }
    else if (currentPage >= totalPages - 3) { pages.push('...'); for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i); }
    else { pages.push('...'); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push('...'); pages.push(totalPages); }
  }
  return pages;
}

export function getBuyPrice(item) {
  if (!item?.buy?.length) return null;
  return item.buy.find(b => b.currency === 'Bells')?.price;
}

/** User-friendly message for API errors (timeout, network, 5xx). */
export function formatApiErrorMessage(e) {
  const msg = e?.message || String(e);
  if (msg.includes('timed out') || msg === 'Request timed out. Please try again.') return 'Request timed out. Please try again.';
  if (/HTTP 5\d{2}/.test(msg)) return 'Server error (HTTP 5xx). Please try again later.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Network error. Check your connection and try again.';
  return msg || 'Something went wrong. Please try again.';
}
