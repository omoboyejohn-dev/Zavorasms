// ============================================
// GET /api/tv-status?verificationId=xxx
// Gets full details of a TextVerified verification
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_USERNAME = process.env.TEXTVERIFIED_API_USERNAME;
  const API_KEY = process.env.TEXTVERIFIED_API_KEY;
  const { verificationId } = req.query;

  if (!verificationId) {
    return res.status(400).json({ error: 'verificationId is required' });
  }

  if (!API_USERNAME || !API_KEY) {
    return res.status(500).json({ error: 'TextVerified credentials not configured' });
  }

  try {
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

    // Step 2: Get verification details
    const statusRes = await fetch(
      `https://www.textverified.com/api/pub/v2/verifications/${verificationId}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      console.error('Status error:', statusRes.status, errText);
      return res.status(500).json({ error: 'Failed to get status', details: errText.substring(0, 300) });
    }

    const statusData = await statusRes.json();

    return res.status(200).json({
      success: true,
      verification: statusData
    });

  } catch (error) {
    console.error('tv-status error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
