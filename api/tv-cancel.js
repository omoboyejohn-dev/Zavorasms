// ============================================
// POST /api/tv-cancel
// Cancels a TextVerified verification and refunds
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_USERNAME = process.env.TEXTVERIFIED_API_USERNAME;
  const API_KEY = process.env.TEXTVERIFIED_API_KEY;

  try {
    const { verificationId } = req.body;

    if (!verificationId) {
      return res.status(400).json({ error: 'verificationId is required' });
    }

    if (!API_USERNAME || !API_KEY) {
      return res.status(500).json({ error: 'TextVerified credentials not configured' });
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
      return res.status(500).json({ error: 'Failed to authenticate', details: errText.substring(0, 300) });
    }

    const tokenData = await tokenRes.json();
    const bearerToken = tokenData.token;

    // Step 2: Cancel verification
    const cancelRes = await fetch(
      `https://www.textverified.com/api/pub/v2/verifications/${verificationId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!cancelRes.ok) {
      const errText = await cancelRes.text();
      console.error('Cancel error:', cancelRes.status, errText);
      return res.status(500).json({ error: 'Failed to cancel', details: errText.substring(0, 300) });
    }

    return res.status(200).json({ success: true, message: 'Cancelled successfully' });

  } catch (error) {
    console.error('tv-cancel error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
