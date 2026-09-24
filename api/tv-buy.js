// ============================================
// POST /api/tv-buy
// Buys a USA number from TextVerified
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const API_USERNAME = process.env.TEXTVERIFIED_API_USERNAME;
  const API_KEY = process.env.TEXTVERIFIED_API_KEY;

  if (!API_USERNAME || !API_KEY) {
    return res.status(500).json({
      error: 'TextVerified credentials not configured',
      code: 'NOT_CONFIGURED'
    });
  }

  try {
    const { service, capability } = req.body;

    if (!service) {
      return res.status(400).json({
        error: 'Service name is required',
        code: 'MISSING_PARAMS'
      });
    }

    // Step 1: Get bearer token
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
      console.error('TV token error:', tokenRes.status, errText);
      return res.status(500).json({
        error: 'Failed to authenticate with TextVerified',
        code: 'AUTH_FAILED',
        details: errText.substring(0, 300)
      });
    }

    const tokenData = await tokenRes.json();
    const bearerToken = tokenData.token;

    // Step 2: Create verification
    const buyRes = await fetch('https://www.textverified.com/api/pub/v2/verifications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        serviceName: service,
        capability: capability || 'sms'
      })
    });

    const buyData = await buyRes.json();

    if (!buyRes.ok) {
      const errCode = buyData.errorCode || buyData.error || '';
      let code = 'UNKNOWN_ERROR';
      let userMessage = 'Could not get a USA number right now. Please try again.';

      const errLower = (typeof errCode === 'string' ? errCode : '').toLowerCase();

      if (errLower.includes('insufficientbalance') || errLower.includes('insufficient')) {
        code = 'PROVIDER_LOW_BALANCE';
        userMessage = 'This service is temporarily unavailable. Please try another option.';
      } else if (errLower.includes('unavailable') || errLower.includes('no_numbers')) {
        code = 'OUT_OF_STOCK';
        userMessage = 'This service is out of stock right now. Please try another service.';
      } else if (errLower.includes('toolmanyunfinished') || errLower.includes('too many')) {
        code = 'TOO_MANY_PENDING';
        userMessage = 'Please complete your pending verifications before buying a new one.';
      } else if (errLower.includes('pricingfailure')) {
        code = 'PRICE_TOO_LOW';
        userMessage = 'This service is temporarily unavailable. Please try another option.';
      }

      console.error('TV buy error:', buyRes.status, buyData, '→ code:', code);

      return res.status(500).json({
        error: userMessage,
        code: code,
        details: JSON.stringify(buyData).substring(0, 300)
      });
    }

    // Success — extract number + verification ID
    return res.status(200).json({
      success: true,
      orderId: buyData.id || buyData.verificationId || buyData.verification_id,
      number: buyData.number || buyData.phoneNumber || buyData.phone_number,
      service: service,
      status: buyData.status || 'pending',
      expiresAt: buyData.expiresAt || buyData.expires_at || null
    });

  } catch (error) {
    console.error('tv-buy catch error:', error);
    return res.status(500).json({
      error: 'Could not process your order. Please try again.',
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
}
