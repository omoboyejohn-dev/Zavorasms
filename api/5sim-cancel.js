// ============================================
// POST /api/5sim-cancel
// Cancels a 5SIM order and gets a refund
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
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order id is required' });
    }

    const url = `https://5sim.net/v1/user/cancel/${id}`;

    const cancelRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const cancelData = await cancelRes.json();

    if (!cancelRes.ok || cancelData.error) {
      return res.status(500).json({ error: cancelData.error || 'Failed to cancel' });
    }

    return res.status(200).json({
      success: true,
      status: cancelData.status,
      message: 'Order cancelled and refunded'
    });

  } catch (error) {
    console.error('5sim-cancel error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
