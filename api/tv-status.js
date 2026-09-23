// /api/tv-status.js
// Checks status of a TextVerified order (has SMS arrived?)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.TEXTVERIFIED_API_KEY;
  const API_USER = process.env.TEXTVERIFIED_API_USERNAME;

  if (!API_KEY || !API_USER) {
    return res.status(500).json({ error: 'TextVerified credentials not configured' });
  }

  const orderId = req.method === 'POST' ? req.body?.orderId : req.query?.orderId;

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  try {
    const response = await fetch(`https://www.textverified.com/api/pub/v2/verify/${orderId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': API_KEY,
        'X-API-USERNAME': API_USER,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'TextVerified status error', 
        details: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Status error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
