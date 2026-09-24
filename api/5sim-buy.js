// ============================================
// POST /api/5sim-buy
// Buys a virtual number from 5SIM
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.FIVESIM_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: '5SIM credentials not configured' });
  }

  try {
    const { country, service } = req.body;

    if (!country || !service) {
      return res.status(400).json({ error: 'country and service are required' });
    }

    // 5SIM endpoint: /v1/user/buy/activation/{country}/{operator}/{product}
    // Use "any" operator to let 5SIM pick the best one
    const url = `https://5sim.net/v1/user/buy/activation/${country}/any/${service}`;

    const buyRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const buyData = await buyRes.json();

    if (!buyRes.ok || buyData.error) {
      console.error('5sim-buy error:', buyRes.status, buyData);
      return res.status(500).json({
        error: buyData.error || 'Failed to buy number',
        details: JSON.stringify(buyData).substring(0, 300)
      });
    }

    // 5SIM returns: { id, phone, operator, product, price, status, expires, sms }
    return res.status(200).json({
      success: true,
      orderId: buyData.id,
      number: buyData.phone,
      operator: buyData.operator,
      product: buyData.product,
      price: buyData.price,
      status: buyData.status,
      expiresAt: buyData.expires,
      country: country,
      service: service
    });

  } catch (error) {
    console.error('5sim-buy error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
