// /api/tv-services.js
// Fetches available services + prices from TextVerified

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.TEXTVERIFIED_API_KEY;
  const API_USER = process.env.TEXTVERIFIED_API_USERNAME;

  if (!API_KEY || !API_USER) {
    return res.status(500).json({ error: 'TextVerified credentials not configured' });
  }

  try {
    // TextVerified API v2 - get pricing/services list
    const response = await fetch('https://www.textverified.com/api/pub/v2/services', {
      method: 'GET',
      headers: {
        'X-API-KEY': API_KEY,
        'X-API-USERNAME': API_USER,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TextVerified error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'TextVerified API error', 
        details: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
