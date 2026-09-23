// /api/tv-buy.js
// Buys a USA number for a specific service from TextVerified

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.TEXTVERIFIED_API_KEY;
  const API_USER = process.env.TEXTVERIFIED_API_USERNAME;

  if (!API_KEY || !API_USER) {
    return res.status(500).json({ error: 'TextVerified credentials not configured' });
  }

  const { service } = req.body || {};
  if (!service) {
    return res.status(400).json({ error: 'Missing "service" in request body' });
  }

  try {
    // TextVerified API v2 - create verification
    const response = await fetch('https://www.textverified.com/api/pub/v2/verify', {
      method: 'POST',
      headers: {
        'X-API-KEY': API_KEY,
        'X-API-USERNAME': API_USER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        service: service,
        country: 'US'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TextVerified buy error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'TextVerified buy failed', 
        details: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Buy error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
