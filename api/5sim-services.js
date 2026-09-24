// ============================================
// GET /api/5sim-services
// Fetches countries + services + prices from 5SIM
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.FIVESIM_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: '5SIM credentials not configured' });
  }

  const authHeaders = {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json'
  };

  try {
    // Fetch countries first (this one works)
    const countriesRes = await fetch('https://5sim.net/v1/guest/countries', { headers: authHeaders });

    if (!countriesRes.ok) {
      const errText = await countriesRes.text();
      return res.status(500).json({
        error: 'Failed to fetch countries from 5SIM',
        status: countriesRes.status,
        details: errText.substring(0, 300)
      });
    }

    const countries = await countriesRes.json();

    // Try products separately (may fail — that's OK)
    let products = {};
    try {
      const productsRes = await fetch('https://5sim.net/v1/guest/products', { headers: authHeaders });
      if (productsRes.ok) {
        products = await productsRes.json();
      }
    } catch (e) {
      console.error('Products fetch failed:', e.message);
    }

    // Try prices separately (may fail — that's OK)
    let prices = {};
    try {
      const pricesRes = await fetch('https://5sim.net/v1/guest/prices', { headers: authHeaders });
      if (pricesRes.ok) {
        prices = await pricesRes.json();
      }
    } catch (e) {
      console.error('Prices fetch failed:', e.message);
    }

    // Format countries
    const formattedCountries = Object.entries(countries)
      .filter(([code]) => code !== 'any')
      .map(([code, data]) => ({
        id: code,
        name: data.text_en || code,
        flag: codeToFlag(data.iso ? Object.keys(data.iso)[0] : '')
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Format services
    const formattedServices = Object.entries(products).map(([name, data]) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
      category: data.category || 'other'
    })).sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      success: true,
      countries: formattedCountries,
      services: formattedServices,
      prices: prices,
      totalCountries: formattedCountries.length,
      totalServices: formattedServices.length
    });

  } catch (error) {
    console.error('5sim-services error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

// Convert ISO country code to flag emoji
function codeToFlag(iso) {
  if (!iso || iso.length !== 2) return '🌍';
  const code = iso.toUpperCase();
  return String.fromCodePoint(
    ...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}
