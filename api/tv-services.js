// ============================================
// GET /api/tv-services
// Fetches available USA services from TextVerified
// ============================================

export default async function handler(req, res) {
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
        error: 'Failed to authenticate with TextVerified',
        status: tokenRes.status,
        details: errText.substring(0, 300)
      });
    }

    const tokenData = await tokenRes.json();
    const bearerToken = tokenData.token;
    console.log('Got bearer token, expires in:', tokenData.expiresIn);

    // ⭐ Step 2: Fetch services with CORRECT camelCase params
    const servicesRes = await fetch(
      'https://www.textverified.com/api/pub/v2/services?numberType=mobile&reservationType=verification',
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!servicesRes.ok) {
      const errText = await servicesRes.text();
      console.error('Services error:', servicesRes.status, errText);
      return res.status(500).json({
        error: 'Failed to fetch services',
        status: servicesRes.status,
        details: errText.substring(0, 300)
      });
    }

    const servicesData = await servicesRes.json();
    const rawServices = servicesData.services || servicesData.targets || servicesData || [];

    const services = rawServices.map(svc => ({
      id: svc.service_name || svc.name || svc.id,
      name: svc.service_name || svc.name || svc.id,
      price: svc.price || svc.cost || 0.25,
      available: svc.available !== false
    }));

    return res.status(200).json({
      success: true,
      services: services
    });

  } catch (error) {
    console.error('tv-services error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
