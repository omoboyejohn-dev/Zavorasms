// ============================================
// GET /api/tv-services
// Fetches available USA services from TextVerified
// ============================================

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_USERNAME = process.env.TEXTVERIFIED_API_USERNAME;
  const API_KEY = process.env.TEXTVERIFIED_API_KEY;

  if (!API_USERNAME || !API_KEY) {
    return res.status(500).json({ error: 'TextVerified credentials not configured' });
  }

  try {
    // Step 1: Generate bearer token
    const tokenRes = await fetch('https://www.textverified.com/api/v2/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: API_USERNAME,
        api_key: API_KEY
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token error:', err);
      return res.status(500).json({ error: 'Failed to authenticate with TextVerified' });
    }

    const tokenData = await tokenRes.json();
    const bearerToken = tokenData.token || tokenData.access_token;

    // Step 2: Fetch available services
    const servicesRes = await fetch(
      'https://www.textverified.com/api/v2/services?number_type=mobile&reservation_type=verification',
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!servicesRes.ok) {
      const err = await servicesRes.text();
      console.error('Services error:', err);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }

    const servicesData = await servicesRes.json();

    // Format response for our frontend
    const services = (servicesData.services || servicesData || []).map(svc => ({
      id: svc.service_name || svc.id,
      name: svc.service_name || svc.name,
      price: svc.price || svc.cost || 0.25,
      available: svc.available !== false
    }));

    return res.status(200).json({
      success: true,
      services: services
    });

  } catch (error) {
    console.error('tv-services error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
