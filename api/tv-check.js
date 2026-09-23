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

  try {
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

    // Step 2: Check for incoming SMS
    const checkRes = await fetch(
      `https://www.textverified.com/api/v2/verifications/${verificationId}/sms`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!checkRes.ok) {
      return res.status(500).json({ error: 'Failed to check SMS' });
    }

    const checkData = await checkRes.json();
    const messages = checkData.messages || [];

    if (messages.length > 0) {
      // SMS arrived!
      return res.status(200).json({
        success: true,
        received: true,
        messages: messages.map(m => ({
          content: m.sms_content || m.content,
          from: m.from_value || m.from,
          receivedAt: m.received_at
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
