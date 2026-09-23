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
    const type = req.query.type || 'all';

    // Fetch countries, services, and prices in parallel
    const [countriesRes, productsRes, pricesRes] = await Promise.all([
      fetch('https://5sim.net/v1/guest/countries', { headers: authHeaders }),
      fetch('https://5sim.net/v1/guest/products', { headers: authHeaders }),
      fetch('https://5sim.net/v1/guest/prices', { headers: authHeaders })
    ]);

    if (!countriesRes.ok || !productsRes.ok || !pricesRes.ok) {
      const errText = await countriesRes.text();
      return res.status(500).json({
        error: 'Failed to fetch from 5SIM',
        details: errText.substring(0, 300)
      });
    }

    const countries = await countriesRes.json();
    const products = await productsRes.json();
    const prices = await pricesRes.json();

    // Format: { countries: [...], services: [...] }
    const formattedCountries = Object.entries(countries).map(([code, data]) => ({
      id: code,
      name: data.text_en || code,
      flag: codeToFlag(code)
    }));

    // Flatten services from products
    const formattedServices = Object.entries(products).map(([name, data]) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      category: data.category || 'other'
    }));

    return res.status(200).json({
      success: true,
      countries: formattedCountries,
      services: formattedServices,
      prices: prices,
      type: type
    });

  } catch (error) {
    console.error('5sim-services error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

// Convert country code (e.g. "usa") to flag emoji
function codeToFlag(code) {
  if (!code || code.length !== 3) return '🌍';
  const iso = code.toLowerCase();
  const flags = {
    usa: '🇺🇸', gbr: '🇬🇧', can: '🇨🇦', nga: '🇳🇬', ind: '🇮🇳',
    phl: '🇵🇭', pol: '🇵🇱', chn: '🇨🇳', sau: '🇸🇦', zaf: '🇿🇦',
    hkg: '🇭🇰', mex: '🇲🇽', deu: '🇩🇪', fra: '🇫🇷', bra: '🇧🇷',
    idn: '🇮🇩', bel: '🇧🇪', nld: '🇳🇱', esp: '🇪🇸', ita: '🇮🇹',
    rus: '🇷🇺', ukr: '🇺🇦', tur: '🇹🇷', egy: '🇪🇬', ken: '🇰🇪',
    gha: '🇬🇭', pak: '🇵🇰', bgd: '🇧🇩', vnm: '🇻🇳', tha: '🇹🇭',
    mys: '🇲🇾', sgp: '🇸🇬', kor: '🇰🇷', jpn: '🇯🇵', aus: '🇦🇺',
    arg: '🇦🇷', col: '🇨🇴', chl: '🇨🇱', per: '🇵🇪', uzb: '🇺🇿'
  };
  return flags[iso] || '🌍';
}
