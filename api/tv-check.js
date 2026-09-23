// ============================================
// GET /api/tv-check?verificationId=xxx
// Checks for incoming SMS on a TextVerified number
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

    // Step 2: Check SMS
    const checkRes = await fetch(
      `https://www.textverified.com/api/pub/v2/verifications/${verificationId}/sms`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!checkRes.ok) {
      const errText = await checkRes.text();
      console.error('Check error:', checkRes.status, errText);
      return res.status(500).json({ error: 'Failed to check SMS', details: errText.substring(0, 300) });
    }

    const checkData = await checkRes.json();
    const messages = checkData.messages || checkData.sms || [];

    if (messages.length > 0) {
      return res.status(200).json({
        success: true,
        received: true,
        messages: messages.map(m => ({
          content: m.sms_content || m.content || m.message,
          from: m.from_value || m.from,
          receivedAt: m.received_at || m.created_at
        }))
      });
    }

    return res.status(200).json({
      success: true,
      received: false,
      messages: []
    });

  } catch (error) {
    console.error('tv-check error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
