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
      error: '5SIM credentials not configured',
      code: 'NOT_CONFIGURED'
    });
  }

  try {
    const { country, service } = req.body;

    if (!country || !service) {
      return res.status(400).json({
        error: 'country and service are required',
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

    const buyData = await buyRes.json();

    // ⭐ Handle 5SIM errors with SPECIFIC codes
    if (!buyRes.ok || buyData.error) {
      const errMsg = (buyData.error || buyData.message || '').toLowerCase();
      let code = 'UNKNOWN_ERROR';
      let userMessage = 'This service is temporarily unavailable. Please try again.';

      if (errMsg.includes('no free phones') || errMsg.includes('out of stock') || errMsg.includes('no numbers')) {
        code = 'OUT_OF_STOCK';
        userMessage = 'This service is out of stock for that country right now. Please try another country or service.';
      } else if (errMsg.includes('not enough money') || errMsg.includes('insufficient') || errMsg.includes('balance')) {
        code = 'PROVIDER_LOW_BALANCE';
        userMessage = 'This service is temporarily unavailable. Please try another option.';
      } else if (errMsg.includes('no product') || errMsg.includes('not found') || errMsg.includes('unsupported')) {
        code = 'NOT_AVAILABLE';
        userMessage = 'This service and country combination is not available right now.';
      } else if (errMsg.includes('bad country')) {
        code = 'INVALID_COUNTRY';
        userMessage = 'This country is not supported for this service.';
      }

      console.error('5sim-buy error:', buyRes.status, buyData, '→ code:', code);

      return res.status(500).json({
        error: userMessage,
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
      error: 'Could not process your order. Please try again.',
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
}
