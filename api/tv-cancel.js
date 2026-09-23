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

    // Step 1: Generate bearer token
    const tokenRes = await fetch('https://www.textverified.com/api/v2/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: API_USERNAME,
        api_key: API_KEY
      })
    });

    const tokenData = await tokenRes.json();
    const bearerToken = tokenData.token || tokenData.access_token;

    // Step 2: Cancel verification
    const cancelRes = await fetch(
      `https://www.textverified.com/api/v2/verifications/${verificationId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!cancelRes.ok) {
      return res.status(500).json({ error: 'Failed to cancel' });
    }

    return res.status(200).json({ success: true, message: 'Cancelled successfully' });

  } catch (error) {
    console.error('tv-cancel error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
