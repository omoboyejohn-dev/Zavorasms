// ============================================
// GET /api/5sim-check?id=xxx
// Checks for incoming SMS on a 5SIM order
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.FIVESIM_API_KEY;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Order id is required' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: '5SIM credentials not configured' });
  }

  try {
    // Check order status
    const url = `https://5sim.net/v1/user/check/${id}`;

    const checkRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok || checkData.error) {
      return res.status(500).json({ error: checkData.error || 'Failed to check order' });
    }

    // 5SIM returns: { id, phone, operator, product, price, status, sms, expires }
    // status: PENDING, RECEIVED, CANCELED, TIMEOUT, FINISHED
    const sms = checkData.sms || [];

    return res.status(200).json({
      success: true,
      status: checkData.status,
      received: sms.length > 0,
      number: checkData.phone,
      messages: sms.map(m => ({
        content: m.text,
        code: m.code,
        from: m.sender,
        receivedAt: m.created_at || m.date
      }))
    });

  } catch (error) {
    console.error('5sim-check error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
