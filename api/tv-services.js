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
      return res.status(500).json({
        error: 'Failed to authenticate with TextVerified',
        status: tokenRes.status,
        details: errText.substring(0, 300)
      });
    }

    const tokenData = await tokenRes.json();
    const bearerToken = tokenData.token;

    // Step 2: Fetch services
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
      return res.status(500).json({
        error: 'Failed to fetch services',
        status: servicesRes.status,
        details: errText.substring(0, 300)
      });
    }

    const servicesData = await servicesRes.json();
    const rawServices = servicesData.services || servicesData.targets || servicesData.data || servicesData || [];

    // ⭐ DEBUG: Return raw sample if requested
    if (req.query.raw === '1') {
      return res.status(200).json({
        success: true,
        rawSample: rawServices.slice(0, 5),
        rawKeys: rawServices.length > 0 ? Object.keys(rawServices[0]) : [],
        totalRaw: rawServices.length
      });
    }

    // ⭐ Try many possible field names
    const services = rawServices.map(svc => {
      const id = svc.serviceName || svc.service_name || svc.name || svc.id || 
                 svc.target || svc.service || svc.slug || null;
      const name = svc.serviceName || svc.service_name || svc.displayName || 
                   svc.display_name || svc.name || svc.target || svc.service || id;
      const price = svc.price || svc.cost || svc.minPrice || svc.min_price || 
                    svc.priceUsd || svc.price_usd || 0.25;

      return { id, name, price, available: svc.available !== false };
    }).filter(s => s.id && s.name);

    return res.status(200).json({
      success: true,
      services: services,
      totalRaw: rawServices.length,
      totalMapped: services.length
    });

  } catch (error) {
    console.error('tv-services error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
