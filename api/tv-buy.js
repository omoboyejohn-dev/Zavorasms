// ============================================
// POST /api/tv-buy
// Buys a USA number from TextVerified
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_USERNAME = process.env.TEXTVERIFIED_API_USERNAME;
  const API_KEY = process.env.TEXTVERIFIED_API_KEY;

  if (!API_USERNAME || !API_KEY) {
    return res.status(500).json({ error: 'TextVerified credentials not configured' });
  }

  try {
    const { service, capability } = req.body;
    if (!service) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    // ⭐ Step 1: Get bearer token
    const tokenRes = await fetch('https://www.textverified.com/api/pub/v2/auth', {
      method: 'POST',
      headers: {
        'X-API-KEY': API_KEY,
        'X-API-USERNAME': API_USERNAME,
        'Accept': 'application/json'
      }
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Token error:', tokenRes.status, errText);
      return res.status(500).json({
        error: 'Failed to authenticate',
        details: errText.substring(0, 300)
      });
    }

    const tokenData = await tokenRes.json();
    const bearerToken = tokenData.token;

    // ⭐ Step 2: Create verification
    const buyRes = await fetch('https://www.textverified.com/api/pub/v2/verifications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        service_name: service,
        capability: capability || 'sms'
      })
    });

    if (!buyRes.ok) {
      const errText = await buyRes.text();
      console.error('Buy error:', buyRes.status, errText);
      return res.status(500).json({
        error: 'Failed to buy number',
        details: errText.substring(0, 300)
      });
    }

    const buyData = await buyRes.json();

    return res.status(200).json({
      success: true,
      verificationId: buyData.id || buyData.verification_id,
      number: buyData.number || buyData.phone_number,
      expiresAt: buyData.expires_at || null,
      service: service,
      price: buyData.price || null
    });

  } catch (error) {
    console.error('tv-buy error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
