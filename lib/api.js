// API configuration from environment variables
const API_URL = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_URL || 'https://api.nookipedia.com';
const API_KEY = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ NOOKIPEDIA_API_KEY is not set. Please add it to .env.local file.');
}

export async function getVillagers() {
  try {
    // Add nhdetails=true to get nh_details with photo_url
    const response = await fetch(`${API_URL}/villagers?nhdetails=true`, {
      headers: {
        'X-API-KEY': API_KEY,
        'Accept-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch villagers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching villagers:', error);
    throw error;
  }
}

// type: 'fish' | 'bugs' | 'sea'
export async function getCritters(type) {
  try {
    const response = await fetch(`${API_URL}/nh/${type}`, {
      headers: {
        'X-API-KEY': API_KEY,
        'Accept-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${type}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    throw error;
  }
}

export async function getEvents() {
  try {
    const response = await fetch(`${API_URL}/nh/events`, {
      headers: {
        'X-API-KEY': API_KEY,
        'Accept-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

export async function getArt() {
  try {
    const response = await fetch(`${API_URL}/nh/art`, {
      headers: { 'X-API-KEY': API_KEY, 'Accept-Version': '1.0.0' }
    });
    if (!response.ok) throw new Error('Failed to fetch art');
    return await response.json();
  } catch (error) {
    console.error('Error fetching art:', error);
    throw error;
  }
}

export async function getFossils() {
  try {
    const [individuals, groups] = await Promise.all([
      fetch(`${API_URL}/nh/fossils/individuals`, {
        headers: { 'X-API-KEY': API_KEY, 'Accept-Version': '1.0.0' }
      }).then(r => { if (!r.ok) throw new Error('Failed to fetch fossils'); return r.json(); }),
      fetch(`${API_URL}/nh/fossils/groups`, {
        headers: { 'X-API-KEY': API_KEY, 'Accept-Version': '1.0.0' }
      }).then(r => { if (!r.ok) throw new Error('Failed to fetch fossil groups'); return r.json(); }),
    ]);
    return { individuals, groups };
  } catch (error) {
    console.error('Error fetching fossils:', error);
    throw error;
  }
}

export async function getGyroids() {
  try {
    const response = await fetch(`${API_URL}/nh/gyroids`, {
      headers: { 'X-API-KEY': API_KEY, 'Accept-Version': '1.0.0' }
    });
    if (!response.ok) throw new Error('Failed to fetch gyroids');
    return await response.json();
  } catch (error) {
    console.error('Error fetching gyroids:', error);
    throw error;
  }
}

export async function getVillagerDetails(name) {
  try {
    const response = await fetch(`${API_URL}/villagers?name=${encodeURIComponent(name)}&nhdetails=true`, {
      headers: {
        'X-API-KEY': API_KEY,
        'Accept-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch villager details');
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
  } catch (error) {
    console.error('Error fetching villager details:', error);
    throw error;
  }
}
