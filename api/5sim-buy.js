// ============================================
// POST /api/5sim-buy
// Buys a virtual number from 5SIM
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const API_KEY = process.env.FIVESIM_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: 'Service is being updated. Please try again later.',
      code: 'NOT_CONFIGURED'
    });
  }

  try {
    const { country, service } = req.body;

    if (!country || !service) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_PARAMS'
      });
    }

    const url = `https://5sim.net/v1/user/buy/activation/${country}/any/${service}`;

    const buyRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // ⭐ Read raw text first (5SIM sometimes returns plain text errors like "no free phones")
    const rawText = await buyRes.text();

    // Try to parse as JSON
    let buyData;
    try {
      buyData = JSON.parse(rawText);
    } catch (e) {
      // Plain text response — treat as provider error
      console.error('5sim-buy plain text response:', rawText);
      return res.status(500).json({
        error: 'Connection pool. Please try again in a few minutes.',
        code: 'OUT_OF_STOCK',
        details: rawText.substring(0, 200)
      });
    }

    // ⭐ Handle 5SIM JSON errors
    if (!buyRes.ok || buyData.error) {
      const errMsg = (buyData.error || buyData.message || rawText || '').toLowerCase();
      let code = 'PROVIDER_ERROR';

      if (errMsg.includes('not enough money') || errMsg.includes('insufficient') || errMsg.includes('balance')) {
        code = 'PROVIDER_LOW_BALANCE';
      } else if (errMsg.includes('no free phones') || errMsg.includes('out of stock') || errMsg.includes('no numbers')) {
        code = 'OUT_OF_STOCK';
      } else if (errMsg.includes('bad country')) {
        code = 'INVALID_COUNTRY';
      } else if (errMsg.includes('bad product')) {
        code = 'INVALID_SERVICE';
      }

      console.error('5sim-buy error:', buyRes.status, buyData, '→ code:', code);

      return res.status(500).json({
        error: 'Connection pool. Please try again in a few minutes.',
        code: code,
        details: JSON.stringify(buyData).substring(0, 300)
      });
    }

    // Success
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
    console.error('5sim-buy catch error:', error);
    return res.status(500).json({
      error: 'Connection pool. Please try again in a few minutes.',
      code: 'PROVIDER_ERROR',
      message: error.message
    });
  }
}
