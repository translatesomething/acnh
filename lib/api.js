// API configuration from environment variables
const API_URL = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_URL || 'https://api.nookipedia.com';
const API_KEY = process.env.NEXT_PUBLIC_NOOKIPEDIA_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ NOOKIPEDIA_API_KEY is not set. Please add it to .env.local file.');
}

export async function getVillagers() {
  try {
    const response = await fetch(`${API_URL}/villagers`, {
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

export async function getVillagerDetails(name) {
  try {
    const response = await fetch(`${API_URL}/villagers/${name}`, {
      headers: {
        'X-API-KEY': API_KEY,
        'Accept-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch villager details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching villager details:', error);
    throw error;
  }
}
